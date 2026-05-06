"""콘텐츠 기반 필터링 알고리즘"""
import numpy as np
import pandas as pd
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from app.models import Content, Interaction, Rating
from typing import List, Tuple
import warnings
warnings.filterwarnings('ignore')


class ContentBasedFiltering:
    """콘텐츠 기반 필터링"""

    def __init__(self):
        self.tfidf_vectorizer = None
        self.content_vectors = None
        self.content_ids = None
        self.content_map = {}

    def build_content_vectors(self, session: Session) -> np.ndarray:
        """
        콘텐츠 벡터 생성 (TF-IDF 기반)
        
        Returns:
            sparse matrix: 콘텐츠 벡터
        """
        contents = session.query(Content).filter(Content.is_active == True).all()

        if not contents:
            return None

        # 콘텐츠 텍스트 (제목 + 설명 + 태그)
        texts = []
        for c in contents:
            tags = ""
            try:
                tags_list = json.loads(c.tags) if c.tags else []
                tags = " ".join(tags_list)
            except:
                pass

            text = f"{c.title} {c.description or ''} {tags} {c.category}"
            texts.append(text)

        self.content_ids = [c.id for c in contents]
        self.content_map = {c.id: c for c in contents}

        # TF-IDF 벡터화
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=100,
            stop_words='english',
            min_df=1
        )
        self.content_vectors = self.tfidf_vectorizer.fit_transform(texts)

        return self.content_vectors

    def get_similar_contents(
        self,
        content_id: int,
        n_similar: int = 5
    ) -> List[Tuple[int, float]]:
        """
        유사한 콘텐츠 찾기
        
        Args:
            content_id: 기준 콘텐츠 ID
            n_similar: 유사 콘텐츠 개수
            
        Returns:
            List: [(content_id, similarity_score), ...]
        """
        if self.content_vectors is None or content_id not in self.content_ids:
            return []

        try:
            content_idx = self.content_ids.index(content_id)

            # 유사도 계산
            similarities = cosine_similarity(
                self.content_vectors[content_idx],
                self.content_vectors
            ).flatten()

            # 상위 N개 (자신 제외)
            top_indices = np.argsort(similarities)[::-1][1:n_similar+1]

            return [(self.content_ids[idx], similarities[idx]) for idx in top_indices]

        except Exception as e:
            print(f"Error in CB get_similar_contents: {e}")
            return []

    def get_recommendations_for_user(
        self,
        user_id: int,
        session: Session,
        n_recommendations: int = 10
    ) -> List[Tuple[int, float]]:
        """
        사용자가 상호작용한 콘텐츠를 기반으로 추천
        
        Args:
            user_id: 사용자 ID
            session: DB 세션
            n_recommendations: 추천 개수
            
        Returns:
            List: [(content_id, score), ...]
        """
        if self.content_vectors is None:
            return []

        try:
            # 사용자가 본 콘텐츠
            user_interactions = session.query(Interaction)\
                .filter(Interaction.user_id == user_id)\
                .all()

            seen_content_ids = [i.content_id for i in user_interactions]

            if not seen_content_ids:
                return []

            # 본 콘텐츠의 유효한 인덱스 찾기
            seen_indices = []
            for cid in seen_content_ids:
                if cid in self.content_ids:
                    seen_indices.append(self.content_ids.index(cid))

            if not seen_indices:
                return []

            # 본 콘텐츠의 벡터 평균
            user_profile = self.content_vectors[seen_indices].mean(axis=0)

            # 유사도 계산
            similarities = cosine_similarity(
                user_profile,
                self.content_vectors
            ).flatten()

            # 본 콘텐츠 제외
            for idx in seen_indices:
                similarities[idx] = -1

            # 상위 N개
            top_indices = np.argsort(similarities)[::-1][:n_recommendations]

            return [(self.content_ids[idx], similarities[idx]) for idx in top_indices if similarities[idx] >= 0]

        except Exception as e:
            print(f"Error in CB get_recommendations_for_user: {e}")
            return []
