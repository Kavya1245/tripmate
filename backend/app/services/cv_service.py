from transformers import pipeline
from PIL import Image
import io

class CVService:
    def __init__(self):
        # Use a pre-trained image classification model from Hugging Face
        # ViT (Vision Transformer) is excellent for general image classification
        self.classifier = pipeline("image-classification", model="google/vit-base-patch16-224")

    def analyze_image(self, image_bytes: bytes) -> list[dict]:
        """Analyzes an image and returns a list of detected objects/labels."""
        try:
            img = Image.open(io.BytesIO(image_bytes))
            # Get top 5 predictions
            results = self.classifier(img, top_k=5)
            
            # Format the results
            formatted = [
                {"label": res["label"], "score": float(res["score"])} 
                for res in results
            ]
            return formatted
        except Exception as e:
            raise ValueError(f"Image analysis failed: {str(e)}")
