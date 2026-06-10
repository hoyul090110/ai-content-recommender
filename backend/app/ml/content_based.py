"""콘텐츠 기반 필터링 알고리즘"""

import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from app.models import Content, Interaction
from typing import List, Tuple


class ContentBasedFiltering:
    """TF-IDF 기반 콘텐츠 추천"""

    def __init__(self):
        self.tfidf_vectorizer = None
        self.content_vectors = None
        self.content_ids = []

    def _tags_to_text(self, tags: str) -> str:
        try:
            parsed = json.loads(tags) if tags else []
            if isinstance(parsed, list):
                return " ".join(map(str, parsed))
            return str(parsed)
        except Exception:
            return tags or ""

    def build_content_vectors(self, session: Session):
        contents = session.query(Content).filter(Content.is_active == True).all()

        if not contents:
            self.content_vectors = None
            self.content_ids = []
            return None

        texts = []
        self.content_ids = []

        for content in contents:
            tag_text = self._tags_to_text(content.tags)
            text = f"""
            {content.title}
            {content.description or ""}
            {content.category}
            {tag_text}
            """
            texts.append(text)
            self.content_ids.append(content.id)

        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 2),
            min_df=1
        )

        self.content_vectors = self.tfidf_vectorizer.fit_transform(texts)
        return self.content_vectors

    def get_similar_contents(
        self,
        content_id: int,
        n_similar: int = 5
    ) -> List[Tuple[int, float]]:

        if self.content_vectors is None or content_id not in self.content_ids:
            return []

        content_idx = self.content_ids.index(content_id)

        similarities = cosine_similarity(
            self.content_vectors[content_idx],
            self.content_vectors
        ).flatten()

        similarities[content_idx] = -1

        top_indices = np.argsort(similarities)[::-1][:n_similar]

        return [
            (self.content_ids[idx], float(similarities[idx]))
            for idx in top_indices
            if similarities[idx] >= 0
        ]

    def get_recommendations_for_user(
        self,
        user_id: int,
        session: Session,
        n_recommendations: int = 10
    ) -> List[Tuple[int, float]]:

        if self.content_vectors is None:
            return []

        interactions = session.query(Interaction).filter(
            Interaction.user_id == user_id
        ).all()

        seen_content_ids = list({i.content_id for i in interactions})

        if not seen_content_ids:
            return []

        seen_indices = [
            self.content_ids.index(content_id)
            for content_id in seen_content_ids
            if content_id in self.content_ids
        ]

        if not seen_indices:
            return []

        user_profile = self.content_vectors[seen_indices].mean(axis=0)

        similarities = cosine_similarity(
            user_profile,
            self.content_vectors
        ).flatten()

        for idx in seen_indices:
            similarities[idx] = -1

        top_indices = np.argsort(similarities)[::-1][:n_recommendations]

        return [
            (self.content_ids[idx], float(similarities[idx]))
            for idx in top_indices
            if similarities[idx] >= 0
        ]
