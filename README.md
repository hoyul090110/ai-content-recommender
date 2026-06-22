# AI Content Recommender

키워드를 입력하면 AI가 실제 웹 검색 기반으로 관련 콘텐츠를 추천하고, 사용자의 좋아요·북마크·공유·관심없음 활동을 반영해 개인화 추천을 제공하는 과제용 웹사이트입니다.

## 주요 기능

- 키워드 기반 콘텐츠 추천
- OpenAI 웹 검색 기반 추천 API
- 기사 / 영상 / 이미지 / 자료 유형 표시
- 썸네일 카드 UI
- 좋아요 / 북마크 / 공유 / 관심없음
- 긍정 활동 키워드 융합 개인화 추천
- 관심없음 키워드 추천 감소
- AI 연결 실패 시 기본 추천 모드 자동 전환
- 브라우저 localStorage 활동 기록 저장

## 파일 구조

```text
ai-content-recommender/
├── index.html
├── styles.css
├── app.js
├── package.json
├── README.md
└── api/
    └── recommend.js
```

## Vercel 환경변수

Vercel 프로젝트 설정에서 아래 환경변수를 추가합니다.

```text
OPENAI_API_KEY=본인의 OpenAI API 키
OPENAI_MODEL=gpt-4.1-mini
```

환경변수를 추가하거나 수정한 뒤에는 Vercel에서 Redeploy를 해야 적용됩니다.

## 실행 흐름

1. 사용자가 키워드를 입력합니다.
2. `app.js`가 `/api/recommend`로 추천 요청을 보냅니다.
3. `api/recommend.js`가 OpenAI API와 web search 도구를 사용해 관련 콘텐츠를 찾습니다.
4. 결과를 카드 UI로 표시합니다.
5. 사용자가 좋아요·북마크·공유를 누르면 긍정 키워드가 저장됩니다.
6. 긍정 키워드를 융합해 개인화 추천을 새로 생성합니다.
7. 관심없음 키워드는 추천에서 비중이 낮아집니다.

## 과제 설명 예시

이 프로젝트는 사용자가 입력한 키워드를 바탕으로 AI가 관련 웹 콘텐츠를 추천하고, 사용자의 상호작용을 분석해 개인화 추천 결과를 제공하는 웹 기반 콘텐츠 추천 시스템입니다.
