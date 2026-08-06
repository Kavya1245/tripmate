from PIL import Image
import io

class CVService:
    def analyze_image(self, image_bytes: bytes) -> list[dict]:
        """Analyzes an image and returns a list of detected objects/labels."""
        try:
            # LAZY LOADING: Only import heavy libraries when this function is actually called.
            # This prevents the server from crashing on startup due to memory limits.
            from transformers import pipeline
            
            img = Image.open(io.BytesIO(image_bytes))
            classifier = pipeline("image-classification", model="google/vit-base-patch16-224")
            results = classifier(img, top_k=5)
            
            formatted = [
                {"label": res["label"], "score": float(res["score"])} 
                for res in results
            ]
            return formatted
        except Exception as e:
            raise ValueError(f"Image analysis failed: {str(e)}")
