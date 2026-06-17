# AI Content Recommender - Netlify 과제용

사용자의 관심 카테고리와 콘텐츠 반응을 바탕으로 추천 결과를 보여주는 정적 웹 프로젝트입니다.

## 핵심 기능

- 사용자 이름 입력
- 관심 카테고리 선택
- 콘텐츠 검색 및 카테고리 필터
- 보기 / 좋아요 / 북마크 / 공유 반응 기록
- 개인화 추천 결과 출력
- 추천 점수와 추천 이유 표시
- 인기 콘텐츠 출력
- 브라우저 localStorage를 활용한 활동 저장

## 기술 스택

- HTML
- CSS
- JavaScript
- Netlify

## 실행 방법

로컬에서는 `index.html` 파일을 브라우저로 열면 바로 실행됩니다.

또는 간단한 정적 서버를 사용하려면:

```bash
npx serve .
```

## Netlify 배포 방법

1. 이 프로젝트를 GitHub 저장소에 업로드합니다.
2. Netlify에서 `Add new site`를 선택합니다.
3. `Import an existing project`를 선택합니다.
4. GitHub 저장소 `ai-content-recommender`를 연결합니다.
5. Build command는 비워둡니다.
6. Publish directory는 `.` 으로 설정합니다.
7. Deploy를 누릅니다.

## 프로젝트 구조

```text
ai-content-recommender/
├─ index.html
├─ styles.css
├─ app.js
├─ data.js
├─ netlify.toml
├─ package.json
└─ README.md
```

## 추천 알고리즘

추천 점수는 다음 요소를 합산합니다.

1. 콘텐츠 기본 인기도
2. 사용자가 선택한 관심 카테고리
3. 사용자가 반응한 콘텐츠와 같은 카테고리인지 여부
4. 사용자가 반응한 콘텐츠와 태그가 겹치는 정도
5. 사용자 활동 가중치
   - 보기: 1점
   - 좋아요: 3점
   - 북마크: 4점
   - 공유: 5점

## Input / Output

### Input

- 사용자 이름
- 관심 카테고리
- 검색어
- 콘텐츠 반응: 보기, 좋아요, 북마크, 공유

### Output

- 개인화 추천 콘텐츠
- 추천 점수
- 추천 이유
- 인기 콘텐츠
- 사용자 활동 통계

## 과제 설명 예시

이 프로젝트는 사용자의 관심사와 활동 데이터를 기반으로 콘텐츠를 추천하는 웹 서비스입니다. 별도의 서버 없이 브라우저에서 추천 로직이 실행되며, Netlify를 통해 쉽게 배포할 수 있습니다. 사용자는 콘텐츠에 반응할 수 있고, 시스템은 해당 활동을 분석하여 추천 점수와 추천 이유를 함께 제공합니다.
