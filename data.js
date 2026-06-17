const CATEGORIES = ["교육", "영화", "음악", "게임", "뉴스", "스포츠"];

const CONTENTS = [
  { id: 1, title: "머신러닝 입문 강의", category: "교육", tags: ["AI", "머신러닝", "파이썬"], description: "추천 시스템과 머신러닝의 기본 개념을 쉽게 배우는 강의입니다.", popularity: 95 },
  { id: 2, title: "파이썬 데이터 분석", category: "교육", tags: ["파이썬", "데이터", "pandas"], description: "데이터를 수집하고 분석하는 기초 프로젝트형 콘텐츠입니다.", popularity: 88 },
  { id: 3, title: "웹 개발 기초", category: "교육", tags: ["HTML", "CSS", "JavaScript"], description: "Netlify에 배포 가능한 정적 웹사이트 제작 방법을 다룹니다.", popularity: 82 },
  { id: 4, title: "감동적인 성장 영화 추천", category: "영화", tags: ["드라마", "성장", "감동"], description: "주인공의 성장을 따라가며 몰입할 수 있는 영화 모음입니다.", popularity: 79 },
  { id: 5, title: "SF 영화 속 인공지능", category: "영화", tags: ["SF", "AI", "미래"], description: "인공지능과 미래 사회를 다룬 SF 영화들을 소개합니다.", popularity: 92 },
  { id: 6, title: "시험기간 집중 음악", category: "음악", tags: ["집중", "공부", "lofi"], description: "공부할 때 듣기 좋은 잔잔한 집중 음악 플레이리스트입니다.", popularity: 90 },
  { id: 7, title: "K-POP 최신 플레이리스트", category: "음악", tags: ["KPOP", "댄스", "트렌드"], description: "최근 인기 있는 K-POP 곡들을 한 번에 정리했습니다.", popularity: 86 },
  { id: 8, title: "인디 게임 추천", category: "게임", tags: ["인디", "스토리", "창의성"], description: "짧지만 완성도 높은 인디 게임들을 추천합니다.", popularity: 73 },
  { id: 9, title: "전략 게임 초보 가이드", category: "게임", tags: ["전략", "초보", "공략"], description: "전략 게임을 처음 시작하는 사용자를 위한 가이드입니다.", popularity: 77 },
  { id: 10, title: "오늘의 IT 뉴스 요약", category: "뉴스", tags: ["IT", "AI", "기술"], description: "인공지능, 소프트웨어, 스타트업 뉴스를 짧게 요약합니다.", popularity: 85 },
  { id: 11, title: "경제 뉴스 쉽게 보기", category: "뉴스", tags: ["경제", "금융", "시장"], description: "어려운 경제 뉴스를 학생 눈높이에 맞춰 설명합니다.", popularity: 74 },
  { id: 12, title: "축구 전술 분석", category: "스포츠", tags: ["축구", "전술", "분석"], description: "경기 장면을 바탕으로 축구 전술을 분석합니다.", popularity: 81 },
  { id: 13, title: "농구 슈팅 자세", category: "스포츠", tags: ["농구", "훈련", "자세"], description: "정확한 슈팅을 위한 기본 자세와 연습 방법입니다.", popularity: 68 },
  { id: 14, title: "추천 알고리즘의 원리", category: "교육", tags: ["추천시스템", "AI", "알고리즘"], description: "콘텐츠 기반 필터링과 협업 필터링 개념을 설명합니다.", popularity: 97 },
  { id: 15, title: "게임 음악 OST 모음", category: "음악", tags: ["게임", "OST", "집중"], description: "게임 속 명곡과 집중하기 좋은 OST를 모았습니다.", popularity: 80 },
  { id: 16, title: "AI 시대의 직업 변화", category: "뉴스", tags: ["AI", "진로", "기술"], description: "AI 기술 발전이 미래 직업에 미치는 영향을 설명합니다.", popularity: 91 },
  { id: 17, title: "스포츠 데이터 분석", category: "스포츠", tags: ["데이터", "분석", "기록"], description: "선수 기록과 경기 데이터를 활용한 스포츠 분석 콘텐츠입니다.", popularity: 83 },
  { id: 18, title: "영화 음악으로 보는 장면 연출", category: "영화", tags: ["음악", "연출", "감상"], description: "영화 OST가 장면 분위기에 미치는 영향을 분석합니다.", popularity: 71 }
];
