from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.destination import Destination

class MLRecommenderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def recommend(self, user_budget: float, user_tags: str, duration: int, travel_style: str) -> list[dict]:
        try:
            # Attempt to import heavy libraries
            import pandas as pd
            from sklearn.neighbors import NearestNeighbors
            from sklearn.preprocessing import MinMaxScaler
            
            result = await self.db.execute(select(Destination))
            destinations = result.scalars().all()
            if not destinations: return []

            data = [{
                "id": str(d.id), "name": d.name, "country": d.country,
                "budget": float(d.avg_budget or 1000.0), "tags": d.tags or "",
                "image_url": d.image_url or ""
            } for d in destinations]
            df = pd.DataFrame(data)

            tags_split = df["tags"].str.get_dummies(sep=",")
            scaler = MinMaxScaler()
            budget_scaled = scaler.fit_transform(df[["budget"]])
            budget_df = pd.DataFrame(budget_scaled, columns=["budget_feature"])
            
            features = pd.concat([budget_df, tags_split], axis=1)
            feature_columns = features.columns

            n_neighbors = min(15, len(features))
            model = NearestNeighbors(n_neighbors=n_neighbors, algorithm='auto')
            model.fit(features)

            combined_tags = f"{user_tags},{travel_style}".lower()
            user_tags_split = pd.Series([combined_tags]).str.get_dummies(sep=",")
            
            for col in feature_columns:
                if col not in user_tags_split.columns: user_tags_split[col] = 0
            user_tags_split = user_tags_split[feature_columns]

            user_budget_scaled = scaler.transform([[user_budget]])
            user_budget_df = pd.DataFrame(user_budget_scaled, columns=["budget_feature"])
            
            if "budget_feature" in user_tags_split.columns:
                user_tags_split = user_tags_split.drop(columns=["budget_feature"])

            user_features = pd.concat([user_budget_df, user_tags_split], axis=1)
            user_features = user_features[feature_columns]

            distances, indices = model.kneighbors(user_features)
            
            recommended = df.iloc[indices[0]].copy()
            recommended["distance"] = distances[0]
            max_dist = max(recommended["distance"]) if max(recommended["distance"]) > 0 else 1
            recommended["match_score"] = ((1 - (recommended["distance"] / max_dist)) * 100).round(0).astype(int)
            
            return recommended[["name", "country", "budget", "tags", "image_url", "match_score"]].to_dict(orient="records")

        except ImportError:
            # Graceful fallback if pandas/sklearn are not installed on the server
            return [{
                "name": "Feature Unavailable on Live Demo",
                "country": "N/A",
                "budget": 0,
                "tags": "The ML model requires more RAM than the free hosting tier provides.",
                "image_url": "",
                "match_score": 0
            }]
