# 🎬 AI 기반 콘텐츠 추천 시스템

## 📋 프로젝트 개요

**AI 기반 콘텐츠 추천 시스템**은 협업 필터링과 콘텐츠 기반 필터링을 결합한 하이브리드 추천 엔진입니다.

- 🤖 **AI 알고리즘**: 협업 필터링 60% + 콘텐츠 기반 40%
- 👥 **협업 필터링**: 유사한 사용자의 선호도 기반 추천
- 📝 **콘텐츠 기반**: 사용자가 본 콘텐츠와 유사한 콘텐츠 추천
- 🎯 **정확한 추천**: 두 방식을 결합하여 높은 정확도 달성

---

## 🏗️ 프로젝트 구조

```
ai-content-recommender/
├── backend/                          # FastAPI 백엔드
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI 메인 애플리케이션
│   │   ├── models.py                 # SQLAlchemy 데이터베이스 모델
│   │   ├── schemas.py                # Pydantic 데이터 검증 스키마
│   │   ├── database.py               # 데이터베이스 연결 설정
│   │   ├── ml/                       # 머신러닝 모델
│   │   │   ├── __init__.py
│   │   │   ├── collaborative_filtering.py
│   │   │   ├── content_based.py
│   │   │   └── hybrid_recommender.py
│   │   └── routes/                   # API 라우터
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── contents.py
│   │       ├── interactions.py
│   │       └── recommendations.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                          # Streamlit 프론트엔드
│   ├── app.py
│   ├── lib/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── api.py
│   │   └── ui.py
│   ├── pages/
│   │   ├── __init__.py
│   │   ├── recommendations.py
│   │   ├── trending.py
│   │   └── profile.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml
├── .devcontainer/devcontainer.json
└── README.md
```

---

## 🛠️ 기술 스택

### **백엔드**
- **FastAPI**: 웹 API 프레임워크
- **SQLAlchemy**: ORM (데이터베이스 관리)
- **PostgreSQL**: 관계형 데이터베이스
- **Redis**: 캐시 및 세션 관리
- **Scikit-learn**: 머신러닝 알고리즘
- **Pandas, NumPy**: 데이터 처리

### **프론트엔드**
- **Streamlit**: 웹 UI 프레임워크 (Python 기반)
- **Requests**: HTTP 클라이언트
- **Pandas**: 데이터 시각화

### **DevOps**
- **Docker & Docker Compose**: 컨테이너화
- **GitHub Codespaces**: 클라우드 개발 환경

---

## 📊 주요 기능

### 1️⃣ 사용자 인증
- JWT 기반 토큰 인증
- 회원가입, 로그인 기능
- 비밀번호 해싱 (bcrypt)

### 2️⃣ 콘텐츠 관리
- 콘텐츠 생성/조회
- 카테고리별 필터링
- 콘텐츠 통계 (조회수, 좋아요 등)

### 3️⃣ AI 추천 기능
- 개인화 추천 (하이브리드)
- 인기 콘텐츠 추천
- 유사 콘텐츠 추천

### 4️⃣ 상호작용 추적
- 조회, 좋아요, 북마크, 공유 기록
- 사용자 활동 통계
- 시간 기반 분석

---

## 🤖 AI 추천 알고리즘

### **협업 필터링 (Collaborative Filtering)**
- 유사한 사용자의 선호도 기반 추천
- 코사인 유사도 계산: cos(θ) = (A·B) / (|A||B|)
- Cold Start 문제: 신규 사용자/콘텐츠 추천 어려움

### **콘텐츠 기반 필터링 (Content-Based)**
- 사용자가 본 콘텐츠와 유사한 콘텐츠 추천
- TF-IDF 벡터화 및 코사인 유사도 사용
- Cold Start 문제 해결

### **하이브리드 추천 (Hybrid)**
- 협업 필터링 60% + 콘텐츠 기반 40%
- 두 방식의 장점 결합
- 더 정확하고 다양한 추천

---

## 🚀 설치 및 실행

### **Option 1: Docker Compose (권장)**

```bash
# 저장소 클론
git clone https://github.com/hoyul090110/ai-content-recommender.git
cd ai-content-recommender

# Docker Compose 실행
docker-compose up
```

**접속:**
- 프론트엔드: http://localhost:8501
- 백엔드 API: http://localhost:8000
- API 문서: http://localhost:8000/docs

---

### **Option 2: 로컬 개발 환경**

**터미널 1 - 백엔드:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

**터미널 2 - 프론트엔드:**
```bash
cd frontend
pip install -r requirements.txt
streamlit run app.py
```

---

### **Option 3: GitHub Codespaces**

1. https://github.com/hoyul090110/ai-content-recommender
2. `Code` → `Codespaces` → `Create codespace on main`
3. 터미널에서 위와 동일한 명령어 실행

---

## 📖 API 주요 엔드포인트

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/contents/` | 콘텐츠 목록 |
| POST | `/api/contents/` | 콘텐츠 생성 |
| GET | `/api/recommendations/recommended-contents/{user_id}` | 개인화 추천 |
| GET | `/api/recommendations/trending` | 인기 콘텐츠 |
| POST | `/api/interactions/` | 상호작용 기록 |

**자동 생성 Swagger 문서**: http://localhost:8000/docs

---

## 💾 데이터베이스 스키마

### **Users (사용자)**
- id, username, email, password_hash, full_name, created_at

### **Contents (콘텐츠)**
- id, title, description, category, author, duration, tags, view_count, created_at

### **Interactions (상호작용)**
- id, user_id, content_id, interaction_type (view/like/bookmark/share), duration, timestamp

---

## 🎓 학습 포인트

- ✅ FastAPI로 REST API 개발
- ✅ SQLAlchemy ORM 사용
- ✅ JWT 토큰 인증
- ✅ 협업 필터링 알고리즘
- ✅ TF-IDF 기반 콘텐츠 필터링
- ✅ Streamlit 웹 UI 개발
- ✅ Docker & Docker Compose
- ✅ GitHub Codespaces

---

## 🧪 테스트

### **API 테스트 (curl)**

```bash
# 회원가입
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "user1", "email": "user@example.com", "password": "pass123"}'

# 콘텐츠 생성
curl -X POST http://localhost:8000/api/contents/ \
  -H "Content-Type: application/json" \
  -d '{"title": "테스트", "category": "영화", "description": "설명"}'
```

---

## 📝 환경 변수 (.env)

```
# 데이터베이스
DATABASE_URL=postgresql://admin:password@localhost:5432/recommendations

# Redis
REDIS_URL=redis://localhost:6379

# JWT
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
```

---

## 📈 향후 개선 사항

- [ ] 딥러닝 모델 적용
- [ ] 실시간 추천 (WebSocket)
- [ ] 사용자 평점 기반 추천
- [ ] 성능 평가 지표 (NDCG, MAP)
- [ ] 배치 처리 (Celery)
- [ ] 프론트엔드 Next.js 업그레이드
- [ ] 모바일 앱 개발

---

## 🔗 유용한 링크

- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [Streamlit 공식 문서](https://docs.streamlit.io/)
- [Docker 공식 문서](https://www.docker.com/)
- [Scikit-learn 공식 문서](https://scikit-learn.org/)

---

## 👨‍💻 개발자

**hoyul090110** - AI 콘텐츠 추천 시스템 개발

---

## 📄 라이센스

MIT License

---

⭐ **이 프로젝트가 도움이 되었다면 Star를 눌러주세요!**
