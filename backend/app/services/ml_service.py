import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.destination import Destination

class MLRecommenderService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.model = None
        self.df = None

    async def _load_and_train(self):
        """Fetches destinations and trains the KNN model."""
        result = await self.db.execute(select(Destination))
        destinations = result.scalars().all()
        
        if not destinations:
            return False

        # Convert to DataFrame
        data = [{
            "id": str(d.id),
            "name": d.name,
            "country": d.country,
            "budget": d.avg_budget or 1000.0,
            "tags": d.tags or ""
        } for d in destinations]
        self.df = pd.DataFrame(data)

        # One-Hot Encode the tags (e.g., "beach,mountain" -> columns: beach=1, mountain=1)
        tags_split = self.df["tags"].str.get_dummies(sep=",")
        features = pd.concat([self.df[["budget"]], tags_split], axis=1)

        # Train KNN model
        self.model = NearestNeighbors(n_neighbors=min(3, len(features)), algorithm='auto')
        self.model.fit(features)
        return True

    async def recommend(self, user_budget: float, user_tags: str) -> list[dict]:
        """Recommends destinations based on budget and tags."""
        trained = await self._load_and_train()
        if not trained:
            return []

        # Process user input
        user_tags_split = pd.Series([user_tags]).str.get_dummies(sep=",")
        
        # Ensure user tags have the same columns as the training data
        for col in self.df["tags"].str.get_dummies(sep=",").columns:
            if col not in user_tags_split.columns:
                user_tags_split[col] = 0
        user_tags_split = user_tags_split[self.df["tags"].str.get_dummies(sep=",").columns]

        user_features = pd.DataFrame([[user_budget] + user_tags_split.iloc[0].tolist()], columns=self.model.feature_names_in_)

        # Find nearest neighbors
        distances, indices = self.model.kneighbors(user_features)
        
        # Return recommended destinations
        recommended = self.df.iloc[indices[0]]
        return recommended[["name", "country", "budget", "tags"]].to_dict(orient="records")
