"""데이터베이스 모델 정의"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import json


class User(Base):
    """사용자 모델"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    preferences = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    interactions = relationship("Interaction", back_populates="user", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_user_username', 'username'),
        Index('idx_user_email', 'email'),
    )


class Content(Base):
    """콘텐츠 모델"""
    __tablename__ = "contents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), index=True, nullable=False)
    tags = Column(Text, default="[]")  # JSON 형식
    author = Column(String(255), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    content_url = Column(String(500), nullable=True)
    duration = Column(Integer, default=0)  # 초 단위
    view_count = Column(Integer, default=0)
    popularity_score = Column(Float, default=0.0, index=True)
    embedding = Column(Text, nullable=True)  # JSON 형식 벡터
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    interactions = relationship("Interaction", back_populates="content", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="content", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_content_category', 'category'),
        Index('idx_content_popularity', 'popularity_score'),
    )


class Interaction(Base):
    """사용자-콘텐츠 상호작용 모델"""
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content_id = Column(Integer, ForeignKey("contents.id"), nullable=False, index=True)
    interaction_type = Column(String(50), nullable=False)  # "view", "like", "share", "bookmark"
    duration = Column(Integer, default=0)  # 초 단위
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # 관계
    user = relationship("User", back_populates="interactions")
    content = relationship("Content", back_populates="interactions")

    __table_args__ = (
        Index('idx_interaction_user', 'user_id'),
        Index('idx_interaction_content', 'content_id'),
        Index('idx_interaction_user_content', 'user_id', 'content_id'),
    )


class Rating(Base):
    """사용자 평점 모델"""
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content_id = Column(Integer, ForeignKey("contents.id"), nullable=False, index=True)
    rating = Column(Float, nullable=False)  # 1-5 스케일
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    user = relationship("User", back_populates="ratings")
    content = relationship("Content", back_populates="ratings")

    __table_args__ = (
        Index('idx_rating_user', 'user_id'),
        Index('idx_rating_content', 'content_id'),
        Index('idx_rating_user_content', 'user_id', 'content_id'),
    )
