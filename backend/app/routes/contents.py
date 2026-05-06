"""콘텐츠 관련 라우터"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Content, Interaction
from app.schemas import Content as ContentSchema, ContentCreate
from typing import List
import json

router = APIRouter()


@router.post("/", response_model=ContentSchema)
async def create_content(content: ContentCreate, db: Session = Depends(get_db)):
    """
    새로운 콘텐츠 생성
    """
    db_content = Content(
        title=content.title,
        description=content.description,
        category=content.category,
        tags=json.dumps(content.tags) if content.tags else "[]",
        author=content.author,
        thumbnail_url=content.thumbnail_url,
        content_url=content.content_url,
        duration=content.duration
    )
    db.add(db_content)
    db.commit()
    db.refresh(db_content)
    return db_content


@router.get("/{content_id}", response_model=ContentSchema)
async def get_content(content_id: int, db: Session = Depends(get_db)):
    """
    콘텐츠 상세 정보 조회
    """
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    return content


@router.get("/", response_model=List[ContentSchema])
async def list_contents(
    category: str = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    콘텐츠 목록 조회
    """
    query = db.query(Content).filter(Content.is_active == True)
    
    if category:
        query = query.filter(Content.category == category)
    
    contents = query.offset(skip).limit(limit).all()
    return contents


@router.put("/{content_id}", response_model=ContentSchema)
async def update_content(
    content_id: int,
    content_update: ContentCreate,
    db: Session = Depends(get_db)
):
    """
    콘텐츠 정보 수정
    """
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    content.title = content_update.title
    content.description = content_update.description
    content.category = content_update.category
    content.tags = json.dumps(content_update.tags) if content_update.tags else "[]"
    content.author = content_update.author
    content.thumbnail_url = content_update.thumbnail_url
    content.content_url = content_update.content_url
    content.duration = content_update.duration
    
    db.commit()
    db.refresh(content)
    return content


@router.delete("/{content_id}")
async def delete_content(content_id: int, db: Session = Depends(get_db)):
    """
    콘텐츠 삭제
    """
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    content.is_active = False
    db.commit()
    return {"message": "Content deleted"}


@router.get("/stats/{content_id}")
async def get_content_stats(content_id: int, db: Session = Depends(get_db)):
    """
    콘텐츠 통계 조회
    """
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    view_count = db.query(Interaction)\
        .filter(Interaction.content_id == content_id)\
        .filter(Interaction.interaction_type == "view")\
        .count()
    
    like_count = db.query(Interaction)\
        .filter(Interaction.content_id == content_id)\
        .filter(Interaction.interaction_type == "like")\
        .count()
    
    return {
        "content_id": content_id,
        "view_count": view_count,
        "like_count": like_count,
        "popularity_score": content.popularity_score
    }
