"""하이브리드 추천 엔진"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Content, Interaction
from app.ml.collaborative_filtering import CollaborativeFiltering
from app.ml.content_based import ContentBasedFiltering
from typing import List, Dict, Any


class HybridRecommender:
    """협업 필터링 + 콘텐츠 기반 추천"""

    def __init__(self, cf_weight: float = 0.6, cb_weight: float = 0.4):
        self.cf_weight = cf_weight
        self.cb_weight = cb_weight
        self.cf = CollaborativeFiltering()
        self.cb = ContentBasedFiltering()
        self.is_trained = False

    def train_model(self, session: Session):
        self.cf.build_user_item_matrix(session)
        self.cf.compute_similarity()
        self.cb.build_content_vectors(session)
        self.is_trained = True

    def get_recommendations(
        self,
        user_id: int,
        session: Session,
        n_recommendations: int = 10
    ) -> List[Dict[str, Any]]:

        if not self.is_trained:
            self.train_model(session)

        cf_items = self.cf.get_recommendations(
            user_id,
            n_recommendations * 2
        )

        cb_items = self.cb.get_recommendations_for_user(
            user_id,
            session,
            n_recommendations * 2
        )

        scores = {}

        for content_id, score in cf_items:
            scores[content_id] = scores.get(content_id, 0) + score * self.cf_weight

        for content_id, score in cb_items:
            scores[content_id] = scores.get(content_id, 0) + score * self.cb_weight

        if not scores:
            return self.get_trending_contents(session, n_recommendations)

        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)

        return [
            {
                "content_id": int(content_id),
                "score": float(score)
            }
            for content_id, score in ranked[:n_recommendations]
        ]

    def get_similar_contents(
        self,
        content_id: int,
        session: Session,
        n_similar: int = 5
    ) -> List[Dict[str, Any]]:

        if not self.is_trained:
            self.train_model(session)

        similar_items = self.cb.get_similar_contents(content_id, n_similar)

        return [
            {
                "content_id": int(cid),
                "similarity_score": float(score)
            }
            for cid, score in similar_items
        ]

    def get_trending_contents(
        self,
        session: Session,
        limit: int = 10
    ) -> List[Dict[str, Any]]:

        interaction_counts = (
            session.query(
                Interaction.content_id,
                func.count(Interaction.id).label("count")
            )
            .group_by(Interaction.content_id)
            .subquery()
        )

        contents = (
            session.query(
                Content,
                func.coalesce(interaction_counts.c.count, 0).label("interaction_count")
            )
            .outerjoin(interaction_counts, Content.id == interaction_counts.c.content_id)
            .filter(Content.is_active == True)
            .order_by(
                func.coalesce(interaction_counts.c.count, 0).desc(),
                Content.view_count.desc(),
                Content.created_at.desc()
            )
            .limit(limit)
            .all()
        )

        return [
            {
                "content_id": content.id,
                "trending_score": float(interaction_count + content.view_count)
            }
            for content, interaction_count in contents
        ]
