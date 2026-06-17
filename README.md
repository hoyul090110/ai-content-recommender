# AI Content Recommender

사용자가 웹사이트에 들어와 자유 키워드를 입력하면 AI가 관련 콘텐츠를 추천하고, 사용자의 반응을 바탕으로 개인화 추천을 제공하는 과제용 웹 프로젝트입니다.

## 핵심 기능

- 메모장/채팅방 형태의 키워드 입력 UI
- AI 기반 키워드 관련 콘텐츠 추천
- 좋아요 / 북마크 / 공유 / 관심없음 반응
- 반응이 생기면 `나의 활동 바탕 콘텐츠 추천` 영역 자동 표시
- 관심없음을 누른 주제는 이후 추천에서 비중 감소
- 더 추천받기 버튼으로 콘텐츠를 계속 생성
- 브라우저 localStorage에 사용자 활동 저장
- Netlify Functions로 OpenAI API 키를 안전하게 서버 측에서 사용

## 배포 방법

GitHub 저장소 최상위에 아래 파일과 폴더가 있어야 합니다.

```text
index.html
styles.css
app.js
netlify.toml
package.json
netlify/functions/recommend.js
README.md
```

Netlify 설정:

```text
Build command: 비워두기
Publish directory: .
Functions directory: netlify/functions
```

## 실제 AI 사용 설정

Netlify 사이트 설정에서 환경변수를 추가합니다.

```text
OPENAI_API_KEY=본인의 OpenAI API 키
OPENAI_MODEL=gpt-4.1-mini
```

환경변수를 넣지 않아도 기본 추천 로직으로 작동하지만, 실제 AI 추천은 `OPENAI_API_KEY`가 있을 때 작동합니다.

## 과제 설명 문구

이 프로젝트는 사용자가 입력한 키워드를 AI가 분석하여 관련 콘텐츠를 생성하고, 사용자의 좋아요·북마크·공유·관심없음 반응을 바탕으로 추천 결과를 개인화하는 웹 기반 콘텐츠 추천 시스템입니다.
