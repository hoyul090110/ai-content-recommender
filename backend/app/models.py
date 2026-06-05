"""
데이터베이스 모델 정의
- User: 사용자 정보
- Content: 콘텐츠 정보
- Interaction: 사용자 활동 기록
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

# 사용자 모델
class User(Base):
    """사용자 정보"""
    __tablename__ = "users"

    # 기본 정보
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    
    # 상태
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계 설정
    interactions = relationship("Interaction", back_populates="user", cascade="all, delete-orphan")

    # 인덱스
    __table_args__ = (
        Index('idx_user_username', 'username'),
        Index('idx_user_email', 'email'),
    )


# 콘텐츠 모델
class Content(Base):
    """콘텐츠 정보"""
    __tablename__ = "contents"

    # 기본 정보
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), index=True, nullable=False)
    tags = Column(Text, default="[]")
    author = Column(String(255), nullable=True)
    
    # 추가 정보
    thumbnail_url = Column(String(500), nullable=True)
    duration = Column(Integer, default=0)  # 초 단위
    view_count = Column(Integer, default=0)
    
    # 상태
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계 설정
    interactions = relationship("Interaction", back_populates="content", cascade="all, delete-orphan")

    # 인덱스
    __table_args__ = (
        Index('idx_content_category', 'category'),
    )


# 상호작용 모델
class Interaction(Base):
    """사용자 활동 기록 (조회, 좋아요, 북마크 등)"""
    __tablename__ = "interactions"

    # 기본 정보
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content_id = Column(Integer, ForeignKey("contents.id"), nullable=False, index=True)
    
    # 활동 정보
    interaction_type = Column(String(50), nullable=False)  # "view", "like", "bookmark", "share"
    duration = Column(Integer, default=0)  # 초 단위 (시청 시간)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # 관계 설정
    user = relationship("User", back_populates="interactions")
    content = relationship("Content", back_populates="interactions")

    # 인덱스
    __table_args__ = (
        Index('idx_interaction_user', 'user_id'),
        Index('idx_interaction_content', 'content_id'),
    )
