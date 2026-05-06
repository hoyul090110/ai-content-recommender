"""Pydantic 스키마 정의"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


# ===== User Schemas =====
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Content Schemas =====
class ContentBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    tags: Optional[List[str]] = None
    author: Optional[str] = None
    thumbnail_url: Optional[str] = None
    content_url: Optional[str] = None
    duration: Optional[int] = 0


class ContentCreate(ContentBase):
    pass


class ContentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None


class Content(ContentBase):
    id: int
    view_count: int
    popularity_score: float
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Interaction Schemas =====
class InteractionBase(BaseModel):
    user_id: int
    content_id: int
    interaction_type: str  # "view", "like", "share", "bookmark"
    duration: Optional[int] = 0


class InteractionCreate(InteractionBase):
    pass


class Interaction(InteractionBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True


# ===== Rating Schemas =====
class RatingBase(BaseModel):
    user_id: int
    content_id: int
    rating: float
    comment: Optional[str] = None


class RatingCreate(RatingBase):
    pass


class Rating(RatingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Authentication Schemas =====
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User


class TokenData(BaseModel):
    username: Optional[str] = None


# ===== Recommendation Schemas =====
class RecommendationItem(BaseModel):
    content_id: int
    content: Content
    score: float
    reason: Optional[str] = None


class RecommendationResponse(BaseModel):
    user_id: int
    recommendations: List[RecommendationItem]
    count: int
    generated_at: datetime


class TrendingContent(BaseModel):
    content_id: int
    content: Content
    trending_score: float


class SimilarContent(BaseModel):
    content_id: int
    similar_content_id: int
    similar_content: Content
    similarity_score: float
