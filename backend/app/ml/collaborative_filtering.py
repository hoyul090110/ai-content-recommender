"""협업 필터링 알고리즘"""
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from app.models import User, Content, Rating, Interaction
from typing import List, Dict, Tuple
import warnings
warnings.filterwarnings('ignore')


class CollaborativeFiltering:
    """사용자 기반 협업 필터링"""

    def __init__(self):
        self.user_item_matrix = None
        self.user_similarity = None
        self.user_ids = []
        self.content_ids = []

    def build_user_item_matrix(self, session: Session) -> pd.DataFrame:
        """
        사용자-콘텐츠 상호작용 매트릭스 구축
        
        Returns:
            DataFrame: 사용자 x 콘텐츠 행렬
        """
        ratings = session.query(Rating).all()
        interactions = session.query(Interaction).all()

        # 상호작용에 스코어 할당
        interaction_scores = {
            "view": 1,
            "like": 3,
            "share": 5,
            "bookmark": 4
        }

        data = []

        # 평점 데이터
        for rating in ratings:
            data.append({
                "user_id": rating.user_id,
                "content_id": rating.content_id,
                "score": rating.rating
            })

        # 상호작용 데이터
        for interaction in interactions:
            score = interaction_scores.get(interaction.interaction_type, 1)
            data.append({
                "user_id": interaction.user_id,
                "content_id": interaction.content_id,
                "score": score
            })

        if not data:
            return pd.DataFrame()

        # 데이터프레임 생성
        df = pd.DataFrame(data)

        # 중복 제거 (동일 사용자-콘텐츠 조합의 최대값)
        df = df.groupby(['user_id', 'content_id'])['score'].max().reset_index()

        # 피벗 테이블 생성
        self.user_item_matrix = df.pivot_table(
            index='user_id',
            columns='content_id',
            values='score',
            fill_value=0
        )

        self.user_ids = list(self.user_item_matrix.index)
        self.content_ids = list(self.user_item_matrix.columns)

        return self.user_item_matrix

    def compute_similarity(self) -> np.ndarray:
        """
        사용자 간 유사도 계산 (코사인 유사도)
        
        Returns:
            ndarray: 사용자 유사도 행렬
        """
        if self.user_item_matrix is None or self.user_item_matrix.empty:
            return np.array([])

        self.user_similarity = cosine_similarity(self.user_item_matrix)
        return self.user_similarity

    def get_recommendations(
        self,
        user_id: int,
        n_recommendations: int = 10
    ) -> List[Tuple[int, float]]:
        """
        사용자 기반 협업 필터링으로 추천 생성
        
        Args:
            user_id: 추천받을 사용자 ID
            n_recommendations: 추천 개수
            
        Returns:
            List: [(content_id, score), ...]
        """
        if self.user_item_matrix is None or self.user_item_matrix.empty:
            return []

        if user_id not in self.user_ids:
            return []

        try:
            # 사용자 인덱스 찾기
            user_idx = self.user_ids.index(user_id)

            # 유사한 사용자 찾기 (자신 제외)
            similarities = self.user_similarity[user_idx]
            similar_users_idx = np.argsort(similarities)[::-1][1:11]  # 상위 10명

            # 유사한 사용자가 본 콘텐츠 수집
            recommendations = {}

            for similar_user_idx in similar_users_idx:
                similar_user_id = self.user_ids[similar_user_idx]
                user_ratings = self.user_item_matrix.loc[similar_user_id]
                current_user_ratings = self.user_item_matrix.loc[user_id]

                # 현재 사용자가 아직 보지 않은 콘텐츠
                new_items = user_ratings[current_user_ratings == 0]

                for content_id, rating in new_items.items():
                    if content_id not in recommendations:
                        recommendations[content_id] = 0
                    recommendations[content_id] += rating * similarities[similar_user_idx]

            # 상위 N개 정렬
            top_recommendations = sorted(
                recommendations.items(),
                key=lambda x: x[1],
                reverse=True
            )[:n_recommendations]

            return top_recommendations

        except Exception as e:
            print(f"Error in CF get_recommendations: {e}")
            return []
