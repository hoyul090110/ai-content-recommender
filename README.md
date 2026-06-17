# AI Content Recommender - Search + Personalized Version

사용자가 입력한 키워드를 바탕으로 실제 웹 콘텐츠를 검색 추천하고, 좋아요/북마크/공유/관심없음 활동을 종합해 개인화 추천을 만드는 과제용 웹사이트입니다.

## 주요 기능

- 키워드 입력 기반 실제 웹 콘텐츠 추천
- 좋아요 / 북마크 / 공유 / 관심없음 기능
- 긍정 표시한 콘텐츠를 그대로 다시 띄우지 않고, 긍정 키워드를 종합해 새로운 콘텐츠 추천
- 관심없음 키워드는 추천 비중 감소
- OpenAI API `web_search` 도구 사용
- API 연결 실패 시 데모 추천으로 작동

## 파일 구조

```text
index.html
styles.css
app.js
package.json
README.md
api/recommend.js
```

## Vercel 환경변수

Vercel Project Settings → Environment Variables에 아래 값을 추가합니다.

```text
OPENAI_API_KEY=본인의 OpenAI API 키
OPENAI_MODEL=gpt-4.1-mini
```

환경변수를 추가하거나 수정한 뒤에는 반드시 다시 Redeploy 해야 합니다.

## 사용 방법

1. 웹사이트에 접속합니다.
2. 키워드를 입력합니다. 예: `AI 진로`, `시험기간 집중`, `축구 전술 분석`
3. AI가 웹 검색을 활용해 실제 콘텐츠를 추천합니다.
4. 좋아요, 북마크, 공유, 관심없음을 누릅니다.
5. 긍정 활동이 생기면 “나의 활동 바탕 콘텐츠 추천” 영역에서 종합 추천을 보여줍니다.
