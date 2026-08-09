import base64
import json
import re
import io
from openai import AsyncOpenAI
from app.core.config import settings

class CVService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        
    async def analyze_image(self, image_bytes: bytes) -> dict:
        """Analyzes an image using Hugging Face ViT-Large and Groq LLM for insights."""
        try:
            # LAZY LOAD: Only import these heavy libraries when this function is actually called
            from PIL import Image
            from transformers import pipeline
            
            img = Image.open(io.BytesIO(image_bytes))
            
            if not hasattr(self, 'classifier'):
                self.classifier = pipeline("image-classification", model="google/vit-large-patch16-224")
            
            results = self.classifier(img, top_k=3)
            top_label = results[0]['label']
            confidence = results[0]['score']
            
            fallback_insights = {
                "landmark_name": top_label,
                "category": "Detected Location",
                "location": "Unknown",
                "visual_features": f"The AI detected '{top_label}' with {confidence*100:.1f}% confidence.",
                "historical_significance": "Details unavailable.",
                "travel_tips": "Enjoy exploring!",
                "confidence": confidence
            }
            
            try:
                prompt = f"""The AI detected: '{top_label}'. Provide a JSON response with keys: landmark_name, category, location, visual_features, historical_significance, travel_tips. 
                IMPORTANT: All values must be plain strings, DO NOT use arrays or lists. Return ONLY valid JSON."""
                
                response = await self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=800,
                    response_format={"type": "json_object"}
                )
                
                ai_text = response.choices[0].message.content
                ai_text = re.sub(r"```json\n", "", ai_text).strip()
                ai_text = re.sub(r"\n```", "", ai_text).strip()
                
                if ai_text:
                    parsed = json.loads(ai_text)
                    parsed['landmark_name'] = top_label
                    parsed['confidence'] = confidence
                    
                    for key in parsed:
                        if isinstance(parsed[key], list):
                            parsed[key] = ", ".join(str(item) for item in parsed[key])
                        elif not isinstance(parsed[key], str):
                            parsed[key] = str(parsed[key])
                            
                    return parsed
                    
            except Exception:
                return fallback_insights
                
        except Exception as e:
            raise ValueError(f"Advanced Image analysis failed: {str(e)}")
