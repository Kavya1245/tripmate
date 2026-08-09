import json
import re
import io
from PIL import Image
from openai import AsyncOpenAI
from transformers import pipeline
from app.core.config import settings

class CVService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        self.classifier = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")
        
    async def analyze_image(self, image_bytes: bytes) -> dict:
        """Analyzes an image using CLIP Zero-Shot and Groq LLM for insights."""
        try:
            img = Image.open(io.BytesIO(image_bytes))
            
            # 1. Expanded candidate labels (Famous Landmarks + General Categories)
            candidate_labels = [
                "Taj Mahal", "Eiffel Tower", "Statue of Liberty", "Great Wall of China",
                "Colosseum", "Big Ben", "Sydney Opera House", "Mount Fuji", 
                "Christ the Redeemer", "Machu Picchu", "Pyramids of Giza", 
                "Burj Khalifa", "Santorini", "Goa Beaches", "Ladakh", "Marina Beach",
                "a railway station", "a train station", "an airport", 
                "a beach", "a mountain", "a temple", "a church", "a mosque", 
                "a monument", "a city skyline", "nature landscape", "a palace", 
                "a fort", "a museum", "a modern building", "a park", "a bridge"
            ]
            
            # 2. Run CLIP model
            results = self.classifier(img, candidate_labels=candidate_labels)
            top_label = results[0]['label']
            confidence = results[0]['score']
            
            # 3. Prepare fallback
            fallback_insights = {
                "landmark_name": top_label,
                "category": "Detected Location",
                "location": "Unknown",
                "visual_features": f"The AI detected '{top_label}' with {confidence*100:.1f}% confidence.",
                "historical_significance": "Details unavailable.",
                "travel_tips": "Enjoy exploring!",
                "confidence": confidence
            }
            
            # 4. Enhance with Groq LLM
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
                    
                    # Ensure all values are strings (in case LLM ignores the prompt and uses lists)
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
