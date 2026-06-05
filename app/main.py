"""
FastAPI 메인 애플리케이션
- 라우터 설정
- 미들웨어 설정
- CORS 설정
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="AI 콘텐츠 추천 시스템",
    description="협업 필터링 + 콘텐츠 기반 필터링 하이브리드 추천 엔진",
    version="1.0.0"
)

# CORS 설정 - 프론트엔드 접근 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """서버 상태 확인"""
    return {
        "status": "ok",
        "service": "AI Content Recommender",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """헬스체크 엔드포인트"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
