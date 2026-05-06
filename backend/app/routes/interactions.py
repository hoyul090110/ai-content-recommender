"""사용자 상호작용 관련 라우터"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Interaction, Content, User
from app.schemas import Interaction as InteractionSchema, InteractionCreate
from typing import List
from datetime import datetime, timedelta

router = APIRouter()


@router.post("/", response_model=InteractionSchema)
async def log_interaction(
    interaction: InteractionCreate,
    db: Session = Depends(get_db)
):
    """
    사용자 상호작용 기록
    """
    # 사용자 확인
    user = db.query(User).filter(User.id == interaction.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 콘텐츠 확인
    content = db.query(Content).filter(Content.id == interaction.content_id).first()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    # 상호작용 생성
    db_interaction = Interaction(
        user_id=interaction.user_id,
        content_id=interaction.content_id,
        interaction_type=interaction.interaction_type,
        duration=interaction.duration
    )
    
    db.add(db_interaction)
    
    # 콘텐츠 조회수 및 인기도 업데이트
    if interaction.interaction_type == "view":
        content.view_count += 1
    
    # 인기도 점수 계산
    interaction_scores = {"view": 1, "like": 3, "share": 5, "bookmark": 4}
    content.popularity_score += interaction_scores.get(interaction.interaction_type, 1)
    
    db.commit()
    db.refresh(db_interaction)
    return db_interaction


@router.get("/user/{user_id}", response_model=List[InteractionSchema])
async def get_user_interactions(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    사용자의 상호작용 히스토리 조회
    """
    interactions = db.query(Interaction)\
        .filter(Interaction.user_id == user_id)\
        .order_by(Interaction.timestamp.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    return interactions


@router.get("/content/{content_id}", response_model=List[InteractionSchema])
async def get_content_interactions(
    content_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    콘텐츠의 상호작용 조회
    """
    interactions = db.query(Interaction)\
        .filter(Interaction.content_id == content_id)\
        .order_by(Interaction.timestamp.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    return interactions


@router.get("/stats/user/{user_id}")
async def get_user_interaction_stats(user_id: int, db: Session = Depends(get_db)):
    """
    사용자 상호작용 통계
    """
    total_interactions = db.query(Interaction)\
        .filter(Interaction.user_id == user_id)\
        .count()
    
    view_count = db.query(Interaction)\
        .filter(Interaction.user_id == user_id)\
        .filter(Interaction.interaction_type == "view")\
        .count()
    
    like_count = db.query(Interaction)\
        .filter(Interaction.user_id == user_id)\
        .filter(Interaction.interaction_type == "like")\
        .count()
    
    bookmark_count = db.query(Interaction)\
        .filter(Interaction.user_id == user_id)\
        .filter(Interaction.interaction_type == "bookmark")\
        .count()
    
    # 7일간의 상호작용
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_interactions = db.query(Interaction)\
        .filter(Interaction.user_id == user_id)\
        .filter(Interaction.timestamp >= seven_days_ago)\
        .count()
    
    return {
        "user_id": user_id,
        "total_interactions": total_interactions,
        "view_count": view_count,
        "like_count": like_count,
        "bookmark_count": bookmark_count,
        "recent_interactions_7days": recent_interactions
    }
