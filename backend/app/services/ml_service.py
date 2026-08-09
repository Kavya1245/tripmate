import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import MinMaxScaler
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.destination import Destination

class MLRecommenderService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.model = None
        self.df = None
        self.scaler = MinMaxScaler()
        self.feature_columns = []

    async def _load_and_train(self):
        result = await self.db.execute(select(Destination))
        destinations = result.scalars().all()
        if not destinations:
            return False

        data = [{
            "id": str(d.id),
            "name": d.name,
            "country": d.country,
            "budget": float(d.avg_budget or 1000.0),
            "tags": d.tags or "",
            "image_url": d.image_url or ""
        } for d in destinations]
        self.df = pd.DataFrame(data)

        # One-Hot Encode the tags
        tags_split = self.df["tags"].str.get_dummies(sep=",")
        
        # Scale the budget and rename to 'budget_feature' to avoid column name collisions
        budget_scaled = self.scaler.fit_transform(self.df[["budget"]])
        budget_df = pd.DataFrame(budget_scaled, columns=["budget_feature"])
        
        features = pd.concat([budget_df, tags_split], axis=1)
        self.feature_columns = features.columns

        n_neighbors = min(15, len(features))
        self.model = NearestNeighbors(n_neighbors=n_neighbors, algorithm='auto')
        self.model.fit(features)
        return True

    async def recommend(self, user_budget: float, user_tags: str, duration: int, travel_style: str) -> list[dict]:
        trained = await self._load_and_train()
        if not trained:
            return []

        combined_tags = f"{user_tags},{travel_style}".lower()
        user_tags_split = pd.Series([combined_tags]).str.get_dummies(sep=",")
        
        # Ensure user tags have the same columns as the training data
        for col in self.feature_columns:
            if col not in user_tags_split.columns:
                user_tags_split[col] = 0
        user_tags_split = user_tags_split[self.feature_columns]

        # Scale user budget
        user_budget_scaled = self.scaler.transform([[user_budget]])
        user_budget_df = pd.DataFrame(user_budget_scaled, columns=["budget_feature"])
        
        # Safely drop 'budget_feature' from tags if it was accidentally added
        if "budget_feature" in user_tags_split.columns:
            user_tags_split = user_tags_split.drop(columns=["budget_feature"])

        user_features = pd.concat([user_budget_df, user_tags_split], axis=1)
        user_features = user_features[self.feature_columns]

        # Find distances and indices
        distances, indices = self.model.kneighbors(user_features)
        
        # Format results with Match Score
        recommended = self.df.iloc[indices[0]].copy()
        recommended["distance"] = distances[0]
        
        max_dist = max(recommended["distance"]) if max(recommended["distance"]) > 0 else 1
        recommended["match_score"] = ((1 - (recommended["distance"] / max_dist)) * 100).round(0).astype(int)
        
        return recommended[["name", "country", "budget", "tags", "image_url", "match_score"]].to_dict(orient="records")
