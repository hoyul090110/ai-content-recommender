"""협업 필터링 알고리즘"""

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from app.models import Interaction
from typing import List, Tuple


class CollaborativeFiltering:
    """사용자 기반 협업 필터링"""

    def __init__(self):
        self.user_item_matrix = None
        self.user_similarity = None
        self.user_ids = []
        self.content_ids = []

    def build_user_item_matrix(self, session: Session) -> pd.DataFrame:
        interactions = session.query(Interaction).all()

        interaction_scores = {
            "view": 1.0,
            "like": 3.0,
            "bookmark": 4.0,
            "share": 5.0,
        }

        data = []
        for item in interactions:
            data.append({
                "user_id": item.user_id,
                "content_id": item.content_id,
                "score": interaction_scores.get(item.interaction_type, 1.0)
            })

        if not data:
            self.user_item_matrix = pd.DataFrame()
            return self.user_item_matrix

        df = pd.DataFrame(data)
        df = df.groupby(["user_id", "content_id"])["score"].max().reset_index()

        self.user_item_matrix = df.pivot_table(
            index="user_id",
            columns="content_id",
            values="score",
            fill_value=0,
        )

        self.user_ids = list(self.user_item_matrix.index)
        self.content_ids = list(self.user_item_matrix.columns)

        return self.user_item_matrix

    def compute_similarity(self):
        if self.user_item_matrix is None or self.user_item_matrix.empty:
            self.user_similarity = np.array([])
            return self.user_similarity

        self.user_similarity = cosine_similarity(self.user_item_matrix)
        return self.user_similarity

    def get_recommendations(
        self,
        user_id: int,
        n_recommendations: int = 10
    ) -> List[Tuple[int, float]]:

        if (
            self.user_item_matrix is None
            or self.user_item_matrix.empty
            or self.user_similarity is None
            or user_id not in self.user_ids
        ):
            return []

        user_idx = self.user_ids.index(user_id)
        similarities = self.user_similarity[user_idx]

        current_user_ratings = self.user_item_matrix.loc[user_id]
        recommendations = {}

        similar_user_indices = np.argsort(similarities)[::-1]

        for similar_idx in similar_user_indices:
            if similar_idx == user_idx:
                continue

            similarity = similarities[similar_idx]
            if similarity <= 0:
                continue

            similar_user_id = self.user_ids[similar_idx]
            similar_user_ratings = self.user_item_matrix.loc[similar_user_id]

            unseen_items = similar_user_ratings[current_user_ratings == 0]

            for content_id, score in unseen_items.items():
                if score <= 0:
                    continue
                recommendations[content_id] = recommendations.get(content_id, 0) + score * similarity

        return sorted(
            recommendations.items(),
            key=lambda x: x[1],
            reverse=True
        )[:n_recommendations]
