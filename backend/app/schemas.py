"""
Pydantic 스키마 정의
- 요청/응답 데이터의 타입 검증
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# ===== User 스키마 =====
class UserBase(BaseModel):
    """사용자 기본 정보"""
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    """사용자 생성 요청"""
    password: str

class UserUpdate(BaseModel):
    """사용자 정보 업데이트"""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

class User(UserBase):
    """사용자 응답"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ===== Content 스키마 =====
class ContentBase(BaseModel):
    """콘텐츠 기본 정보"""
    title: str
    description: Optional[str] = None
    category: str
    tags: Optional[List[str]] = None
    author: Optional[str] = None
    duration: Optional[int] = 0

class ContentCreate(ContentBase):
    """콘텐츠 생성 요청"""
    pass

class ContentUpdate(BaseModel):
    """콘텐츠 업데이트"""
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None

class Content(ContentBase):
    """콘텐츠 응답"""
    id: int
    view_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ===== Interaction 스키마 =====
class InteractionBase(BaseModel):
    """활동 기본 정보"""
    user_id: int
    content_id: int
    interaction_type: str  # "view", "like", "bookmark", "share"
    duration: Optional[int] = 0

class InteractionCreate(InteractionBase):
    """활동 생성 요청"""
    pass

class Interaction(InteractionBase):
    """활동 응답"""
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True
