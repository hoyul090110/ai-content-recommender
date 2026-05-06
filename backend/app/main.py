"""FastAPI 메인 애플리케이션"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database import engine, Base
from app.routes import auth, users, contents, interactions, recommendations
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 테이블 생성
Base.metadata.create_all(bind=engine)

# FastAPI 앱 생성
app = FastAPI(
    title="AI 기반 콘텐츠 추천 시스템 API",
    description="협업 필터링과 콘텐츠 기반 필터링을 결합한 하이브리드 추천 엔진",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "*"  # 개발용 - 프로덕션에서는 구체적으로 지정
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 라우터 등록
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(contents.router, prefix="/api/contents", tags=["Contents"])
app.include_router(interactions.router, prefix="/api/interactions", tags=["Interactions"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])


# 헬스 체크
@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "message": "API is running"
        }
    )


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "AI 기반 콘텐츠 추천 시스템",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
