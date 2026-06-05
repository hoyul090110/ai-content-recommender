# 🎬 AI 콘텐츠 추천 시스템

AI 기반 하이브리드 추천 엔진 (협업 필터링 60% + 콘텐츠 기반 40%)

---

## 📋 주요 기능

- 🔐 **사용자 인증** - 회원가입, 로그인 (JWT)
- 📝 **콘텐츠 관리** - 콘텐츠 생성, 조회, 통계
- 🤖 **AI 추천** - 개인화 추천, 인기 콘텐츠, 유사 콘텐츠
- 📊 **활동 추적** - 조회, 좋아요, 북마크, 공유 기록

---

## 🛠️ 기술 스택

| 항목 | 기술 |
|------|------|
| **백엔드** | FastAPI, SQLAlchemy, PostgreSQL |
| **프론트엔드** | Streamlit, Pandas, Numpy |
| **ML** | Scikit-learn, 협업필터링, TF-IDF |
| **DevOps** | Docker, Docker Compose |

---

## 📁 프로젝트 구조

```
ai-content-recommender/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py         # FastAPI 앱
│   │   ├── models.py       # DB 모델
│   │   ├── schemas.py      # 데이터 검증
│   │   ├── database.py     # DB 연결
│   │   ├── ml/             # 추천 엔진
│   │   └── routes/         # API 라우터
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                # Streamlit 프론트엔드
│   ├── app.py              # 메인 UI
│   ├── lib/                # 라이브러리
│   ├── pages/              # 페이지
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml       # Docker 실행 설정
└── README.md
```

---

## 🚀 빠른 시작

### **Option 1: Docker (가장 쉬움)**

```bash
# 저장소 클론
git clone https://github.com/hoyul090110/ai-content-recommender.git
cd ai-content-recommender

# 실행
docker-compose up
```

**접속:**
- UI: http://localhost:8501
- API: http://localhost:8000
- 문서: http://localhost:8000/docs

---

### **Option 2: 로컬 실행**

**백엔드 (터미널 1):**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

**프론트엔드 (터미널 2):**
```bash
cd frontend
pip install -r requirements.txt
streamlit run app.py
```

---

### **Option 3: GitHub Codespaces (클라우드)**

```
1. https://github.com/hoyul090110/ai-content-recommender
2. Code → Codespaces → Create codespace on main
3. 터미널에서 위와 같이 실행
```

---

## 📖 API 엔드포인트

### **인증**
```
POST /api/auth/register     # 회원가입
POST /api/auth/login        # 로그인
```

### **콘텐츠**
```
GET  /api/contents/         # 목록
POST /api/contents/         # 생성
GET  /api/contents/{id}     # 상세
```

### **추천**
```
GET /api/recommendations/recommended-contents/{user_id}  # 개인화 추천
GET /api/recommendations/trending                        # 인기 콘텐츠
GET /api/recommendations/similar/{content_id}            # 유사 콘텐츠
```

### **상호작용**
```
POST /api/interactions/                    # 기록
GET  /api/interactions/user/{user_id}      # 이력
```

**자동 문서:** http://localhost:8000/docs

---

## 💾 데이터베이스

### **Users (사용자)**
```
id, username, email, password, full_name, created_at
```

### **Contents (콘텐츠)**
```
id, title, description, category, author, duration, tags, view_count
```

### **Interactions (활동)**
```
id, user_id, content_id, type(view/like/bookmark/share), timestamp
```

---

## 🤖 추천 알고리즘

### **협업 필터링 (60%)**
- 유사한 사용자의 선호도 기반
- 코사인 유사도: cos(θ) = (A·B) / (|A||B|)

### **콘텐츠 기반 (40%)**
- TF-IDF 벡터화
- 제목, 카테고리, 태그 기반

### **하이브리드**
- 두 방식의 가중치 결합
- 더 정확하고 다양한 추천

---

## 🎯 사용 방법

### **1. 회원가입**
- 사이드바에서 회원가입 버튼 클릭
- 사용자명, 이메일, 비밀번호 입력

### **2. 로그인**
- 사이드바에서 로그인 버튼 클릭
- 사용자명과 비밀번호 입력

### **3. 추천받기**
- "🎯 추천" 메뉴에서 개인화 추천 확인
- "🔥 인기" 메뉴에서 인기 콘텐츠 확인
- "👤 프로필"에서 활동 통계 확인

---

## 📊 시스템 구조

```
사용자 (Streamlit UI)
    ↓ HTTP 요청
FastAPI 서버
    ├── 인증 (JWT)
    ├── 데이터 (SQLAlchemy)
    ├── AI 모듈 (Scikit-learn)
    └── API 라우터
    ↓
PostgreSQL / Redis / SQLite
```

---

## 🧪 테스트

**API 테스트 (curl):**
```bash
# 회원가입
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","email":"user@example.com","password":"pass123"}'

# 콘텐츠 생성
curl -X POST http://localhost:8000/api/contents/ \
  -H "Content-Type: application/json" \
  -d '{"title":"테스트","category":"영화"}'
```

---

## 📝 환경 변수 (.env)

```
DATABASE_URL=postgresql://admin:password@localhost:5432/recommendations
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
```

---

## 📈 완성도

```
✅ 백엔드 기본 구조
✅ 데이터베이스 모델
✅ Streamlit UI
✅ Docker 설정
✅ README 작성

⏳ 추가 구현 가능:
- ML 알고리즘 상세 구현
- API 라우터 완성
- 테스트 코드
- 배포 설정
```

---

## 🎓 배울 수 있는 것

- ✅ FastAPI REST API 개발
- ✅ SQLAlchemy ORM 사용
- ✅ JWT 인증
- ✅ 협업 필터링 알고리즘
- ✅ Streamlit 웹 앱
- ✅ Docker 컨테이너화

---

## 🔗 참고 자료

- [FastAPI 문서](https://fastapi.tiangolo.com/)
- [Streamlit 문서](https://docs.streamlit.io/)
- [Docker 문서](https://www.docker.com/)

---

**⭐ 도움이 되었다면 Star를 눌러주세요!**

👨‍💻 **개발자**: hoyul090110
📄 **라이센스**: MIT
