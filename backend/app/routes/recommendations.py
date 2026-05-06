"""추천 관련 라우터"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Content, Interaction
from app.ml.hybrid_recommender import HybridRecommender
from app.schemas import RecommendationResponse, RecommendationItem, TrendingContent, SimilarContent
from typing import List
from datetime import datetime
import asyncio

router = APIRouter()

# 글로벌 추천 엔진 인스턴스
recommender = HybridRecommender(cf_weight=0.6, cb_weight=0.4)


@router.post("/train")
async def train_model(db: Session = Depends(get_db)):
    """
    추천 모델 학습 (관리자용)
    """
    try:
        recommender.train_model(db)
        return {"status": "success", "message": "Model training started"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/recommended-contents/{user_id}")
async def get_recommendations(
    user_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
) -> List[dict]:
    """
    사용자를 위한 개인화된 추천 콘텐츠 반환
    
    Parameters:
    - user_id: 사용자 ID
    - limit: 반환할 추천 개수
    
    Returns:
    - 추천 콘텐츠 리스트
    """
    try:
        # 사용자 확인
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # 추천 생성
        recommendations = recommender.get_recommendations(
            user_id=user_id,
            session=db,
            n_recommendations=limit
        )
        
        # 콘텐츠 정보 포함
        items = []
        for rec in recommendations:
            content = db.query(Content).filter(Content.id == rec["content_id"]).first()
            if content:
                items.append({
                    "content_id": rec["content_id"],
                    "content": {
                        "id": content.id,
                        "title": content.title,
                        "description": content.description,
                        "category": content.category,
                        "author": content.author,
                        "thumbnail_url": content.thumbnail_url,
                        "view_count": content.view_count,
                        "popularity_score": content.popularity_score
                    },
                    "score": rec["score"]
                })
        
        return {
            "user_id": user_id,
            "recommendations": items,
            "count": len(items),
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/trending")
async def get_trending_contents(
    limit: int = 10,
    db: Session = Depends(get_db)
) -> List[TrendingContent]:
    """
    인기 있는 콘텐츠 반환
    """
    try:
        trending = recommender.get_trending_contents(db, limit)
        
        items = []
        for item in trending:
            content = db.query(Content).filter(Content.id == item["content_id"]).first()
            if content:
                items.append({
                    "content_id": item["content_id"],
                    "content": {
                        "id": content.id,
                        "title": content.title,
                        "description": content.description,
                        "category": content.category,
                        "author": content.author,
                        "thumbnail_url": content.thumbnail_url,
                        "view_count": content.view_count,
                        "popularity_score": content.popularity_score
                    },
                    "trending_score": item["trending_score"]
                })
        
        return items
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/similar/{content_id}")
async def get_similar_contents(
    content_id: int,
    limit: int = 5,
    db: Session = Depends(get_db)
) -> List[SimilarContent]:
    """
    유사한 콘텐츠 반환
    """
    try:
        # 콘텐츠 확인
        content = db.query(Content).filter(Content.id == content_id).first()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content not found"
            )
        
        similar = recommender.get_similar_contents(content_id, db, limit)
        
        items = []
        for item in similar:
            similar_content = db.query(Content).filter(Content.id == item["content_id"]).first()
            if similar_content:
                items.append({
                    "content_id": content_id,
                    "similar_content_id": item["content_id"],
                    "similar_content": {
                        "id": similar_content.id,
                        "title": similar_content.title,
                        "description": similar_content.description,
                        "category": similar_content.category,
                        "author": similar_content.author,
                        "thumbnail_url": similar_content.thumbnail_url,
                        "view_count": similar_content.view_count,
                        "popularity_score": similar_content.popularity_score
                    },
                    "similarity_score": item["similarity_score"]
                })
        
        return items
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
