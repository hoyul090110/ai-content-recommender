"""하이브리드 추천 엔진"""
from sqlalchemy.orm import Session
from app.models import Content, Interaction, Rating
from .collaborative_filtering import CollaborativeFiltering
from .content_based import ContentBasedFiltering
from typing import List, Dict, Any
import numpy as np


class HybridRecommender:
    """협업 필터링과 콘텐츠 기반 필터링의 앙상블"""

    def __init__(self, cf_weight: float = 0.6, cb_weight: float = 0.4):
        """
        Args:
            cf_weight: 협업 필터링 가중치
            cb_weight: 콘텐츠 기반 필터링 가중치
        """
        self.cf = CollaborativeFiltering()
        self.cb = ContentBasedFiltering()
        self.cf_weight = cf_weight
        self.cb_weight = cb_weight
        self.is_trained = False

    def train_model(self, session: Session):
        """
        모델 학습
        
        Args:
            session: DB 세션
        """
        try:
            print("[Hybrid] Building collaborative filtering model...")
            self.cf.build_user_item_matrix(session)
            self.cf.compute_similarity()
            print("[Hybrid] CF model built successfully")

            print("[Hybrid] Building content-based model...")
            self.cb.build_content_vectors(session)
            print("[Hybrid] CB model built successfully")

            self.is_trained = True
            print("[Hybrid] Model training complete!")

        except Exception as e:
            print(f"[Hybrid] Error in train_model: {e}")
            self.is_trained = False

    def get_recommendations(
        self,
        user_id: int,
        session: Session,
        n_recommendations: int = 10
    ) -> List[Dict[str, Any]]:
        """
        협업 필터링과 콘텐츠 기반 필터링의 앙상블 추천
        
        Args:
            user_id: 사용자 ID
            session: DB 세션
            n_recommendations: 추천 개수
            
        Returns:
            List: [{'content_id': int, 'score': float}, ...]
        """
        if not self.is_trained:
            self.train_model(session)

        try:
            # 협업 필터링 추천
            cf_recommendations = self.cf.get_recommendations(
                user_id,
                n_recommendations=n_recommendations*2
            )

            # 콘텐츠 기반 추천
            cb_recommendations = self.cb.get_recommendations_for_user(
                user_id,
                session,
                n_recommendations=n_recommendations*2
            )

            # 추천 결합 및 스코링
            recommendations_score = {}

            # CF 추천 스코어 합산
            for i, (content_id, cf_score) in enumerate(cf_recommendations):
                score = self.cf_weight * (1 - i / max(len(cf_recommendations), 1))
                recommendations_score[content_id] = recommendations_score.get(content_id, 0) + score

            # CB 추천 스코어 합산
            for i, (content_id, cb_score) in enumerate(cb_recommendations):
                score = self.cb_weight * (1 - i / max(len(cb_recommendations), 1))
                recommendations_score[content_id] = recommendations_score.get(content_id, 0) + score

            # 상위 N개 정렬
            top_recommendations = sorted(
                recommendations_score.items(),
                key=lambda x: x[1],
                reverse=True
            )[:n_recommendations]

            # 콘텐츠 정보 포함
            results = []
            for content_id, score in top_recommendations:
                content = session.query(Content).filter(Content.id == content_id).first()
                if content:
                    results.append({
                        "content_id": content_id,
                        "score": float(score)
                    })

            return results

        except Exception as e:
            print(f"[Hybrid] Error in get_recommendations: {e}")
            return []

    def get_similar_contents(
        self,
        content_id: int,
        session: Session,
        n_similar: int = 5
    ) -> List[Dict[str, Any]]:
        """
        유사 콘텐츠 반환
        
        Args:
            content_id: 기준 콘텐츠 ID
            session: DB 세션
            n_similar: 유사 콘텐츠 개수
            
        Returns:
            List: [{'content_id': int, 'similarity_score': float}, ...]
        """
        similar = self.cb.get_similar_contents(content_id, n_similar)
        results = []
        for cid, score in similar:
            content = session.query(Content).filter(Content.id == cid).first()
            if content:
                results.append({
                    "content_id": cid,
                    "similarity_score": float(score)
                })
        return results

    def get_trending_contents(
        self,
        session: Session,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        인기 있는 콘텐츠 반환
        
        Args:
            session: DB 세션
            limit: 반환 개수
            
        Returns:
            List: [{'content_id': int, 'trending_score': float}, ...]
        """
        contents = session.query(Content)\
            .filter(Content.is_active == True)\
            .order_by(Content.popularity_score.desc())\
            .limit(limit)\
            .all()

        results = []
        for content in contents:
            results.append({
                "content_id": content.id,
                "trending_score": float(content.popularity_score)
            })
        return results
