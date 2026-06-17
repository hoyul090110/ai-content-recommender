# AI Content Recommender - Vercel Version

사용자가 입력한 키워드와 활동 기록을 바탕으로 콘텐츠를 추천하는 과제용 웹사이트입니다.

## 주요 기능

- 키워드 입력 기반 콘텐츠 추천
- 좋아요 / 북마크 / 공유 / 관심없음 기능
- 좋아요, 북마크, 공유 후 "나의 활동 바탕 콘텐츠 추천" 자동 표시
- 관심없음 선택 시 관련 주제 추천 비중 감소
- OpenAI API 키가 있으면 실제 AI 추천 사용
- API 키가 없으면 브라우저 기본 추천 로직으로 작동

## Vercel 배포 설정

Vercel에서 GitHub 저장소를 Import한 뒤 아래처럼 설정합니다.

- Framework Preset: Other
- Build Command: 비워두기
- Output Directory: 비워두기 또는 `.`
- Install Command: 기본값 그대로

## AI 연결용 환경변수

Vercel 프로젝트 설정에서 Environment Variables에 아래 값을 추가합니다.

```text
OPENAI_API_KEY=본인의 OpenAI API 키
OPENAI_MODEL=gpt-4.1-mini
```

환경변수를 추가한 뒤에는 다시 Deploy 해야 적용됩니다.

## 파일 구조

```text
index.html
styles.css
app.js
package.json
README.md
api/recommend.js
```

## 사용 방법

1. 웹사이트에 접속합니다.
2. 키워드를 입력합니다. 예: `AI 진로`, `시험기간 집중`, `축구 전술 분석`
3. 추천 콘텐츠가 표시됩니다.
4. 좋아요, 북마크, 공유, 관심없음을 눌러 활동을 기록합니다.
5. 활동이 생기면 개인화 추천 영역이 표시됩니다.
