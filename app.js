const STORAGE_KEY = "ai-content-recommender-demo-basic";

const contentPool = [
  {
    id: "ai-career-1",
    title: "고등학생을 위한 AI 진로 탐색 가이드",
    type: "article",
    category: "진로",
    tags: ["AI", "인공지능", "진로", "학과", "미래직업"],
    description: "AI 분야에 관심 있는 학생이 알아야 할 관련 학과, 직업, 준비 활동을 정리한 콘텐츠입니다."
  },
  {
    id: "ai-project-1",
    title: "학생 포트폴리오에 넣기 좋은 머신러닝 프로젝트 아이디어",
    type: "project",
    category: "프로젝트",
    tags: ["AI", "코딩", "프로젝트", "머신러닝", "포트폴리오"],
    description: "추천 시스템, 이미지 분류, 데이터 분석 등 학생 수준에서 구현 가능한 프로젝트를 소개합니다."
  },
  {
    id: "data-career-1",
    title: "데이터 분석으로 진로 탐구 보고서 만들기",
    type: "article",
    category: "학습",
    tags: ["데이터", "분석", "진로", "보고서", "탐구"],
    description: "공공데이터를 활용해 진로와 연결된 탐구 보고서를 구성하는 방법을 설명합니다."
  },
  {
    id: "study-focus-1",
    title: "시험기간 집중력을 높이는 공부 루틴",
    type: "video",
    category: "학습",
    tags: ["시험", "공부", "집중", "루틴", "시간관리"],
    description: "짧은 시간에 집중도를 높이기 위한 공부 환경, 휴식 주기, 계획법을 다룹니다."
  },
  {
    id: "study-lofi-1",
    title: "집중할 때 듣기 좋은 Lofi 플레이리스트",
    type: "music",
    category: "음악",
    tags: ["집중", "음악", "lofi", "공부", "휴식"],
    description: "공부나 코딩할 때 배경음으로 활용하기 좋은 잔잔한 음악 콘텐츠입니다."
  },
  {
    id: "football-tactics-1",
    title: "축구 전술 분석 입문: 포메이션과 압박 이해하기",
    type: "video",
    category: "스포츠",
    tags: ["축구", "전술", "분석", "스포츠", "포메이션"],
    description: "축구 경기를 더 깊게 이해하기 위한 전술 용어와 기본 분석 방법을 소개합니다."
  },
  {
    id: "football-data-1",
    title: "축구 데이터를 활용한 경기 분석 프로젝트",
    type: "project",
    category: "스포츠",
    tags: ["축구", "데이터", "분석", "프로젝트", "스포츠"],
    description: "패스, 슈팅, 점유율 데이터를 활용해 팀의 경기력을 분석하는 프로젝트 아이디어입니다."
  },
  {
    id: "healing-movie-1",
    title: "지친 날 보기 좋은 힐링 영화 추천",
    type: "movie",
    category: "영화",
    tags: ["힐링", "영화", "감동", "휴식", "성장"],
    description: "감동적이고 편안한 분위기의 영화들을 통해 휴식과 위로를 얻을 수 있는 콘텐츠입니다."
  },
  {
    id: "music-ost-1",
    title: "영화 OST로 감정과 장면 분석하기",
    type: "article",
    category: "음악",
    tags: ["영화", "음악", "OST", "분석", "감정"],
    description: "영화 속 음악이 장면의 분위기와 감정 전달에 어떤 역할을 하는지 살펴봅니다."
  },
  {
    id: "coding-basic-1",
    title: "초보자를 위한 웹 개발 프로젝트 시작하기",
    type: "project",
    category: "코딩",
    tags: ["코딩", "웹개발", "프로젝트", "HTML", "JavaScript"],
    description: "HTML, CSS, JavaScript를 활용해 간단한 웹앱을 만드는 과정을 안내합니다."
  },
  {
    id: "recommend-system-1",
    title: "추천 시스템의 원리: 콘텐츠 기반 추천과 개인화",
    type: "article",
    category: "AI",
    tags: ["추천시스템", "AI", "개인화", "알고리즘", "콘텐츠"],
    description: "사용자의 활동 데이터와 콘텐츠 키워드를 활용해 추천 결과가 만들어지는 과정을 설명합니다."
  },
  {
    id: "portfolio-1",
    title: "고등학생 프로젝트 포트폴리오 구성법",
    type: "article",
    category: "진로",
    tags: ["포트폴리오", "프로젝트", "진로", "발표", "보고서"],
    description: "과제나 진로 활동에서 만든 프로젝트를 보기 좋게 정리하는 방법을 소개합니다."
  }
];

const synonyms = {
  "ai": ["ai", "인공지능", "머신러닝", "추천시스템", "알고리즘", "미래직업"],
  "인공지능": ["ai", "인공지능", "머신러닝", "추천시스템", "알고리즘"],
  "진로": ["진로", "학과", "미래직업", "포트폴리오", "탐구"],
  "코딩": ["코딩", "웹개발", "javascript", "html", "프로젝트"],
  "축구": ["축구", "전술", "스포츠", "분석", "포메이션"],
  "공부": ["공부", "시험", "집중", "루틴", "시간관리"],
  "시험": ["공부", "시험", "집중", "루틴", "시간관리"],
  "힐링": ["힐링", "영화", "감동", "휴식", "음악"],
  "영화": ["영화", "힐링", "감동", "ost", "분석"],
  "데이터": ["데이터", "분석", "탐구", "프로젝트", "보고서"]
};

const state = loadState();

const els = {
  keywordInput: document.getElementById("keywordInput"),
  searchBtn: document.getElementById("searchBtn"),
  resetBtn: document.getElementById("resetBtn"),
  resultsGrid: document.getElementById("resultsGrid"),
  personalGrid: document.getElementById("personalGrid"),
  personalSection: document.getElementById("personalSection"),
  resultLabel: document.getElementById("resultLabel"),
  introCard: document.getElementById("introCard"),
  interestChips: document.getElementById("interestChips"),
  likeCount: document.getElementById("likeCount"),
  bookmarkCount: document.getElementById("bookmarkCount"),
  shareCount: document.getElementById("shareCount"),
  dislikeCount: document.getElementById("dislikeCount")
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) return saved;
  } catch (error) {}
  return {
    keyword: "",
    actions: {},
    recentKeywords: []
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

function tokenize(text) {
  const normalized = normalize(text);
  const words = normalized.split(/\s+|,|\.|\/|-/).filter(Boolean);
  const expanded = new Set(words);
  Object.keys(synonyms).forEach((key) => {
    if (normalized.includes(key)) {
      synonyms[key].forEach((word) => expanded.add(normalize(word)));
    }
  });
  return [...expanded];
}

function getAction(id, type) {
  return Boolean(state.actions[id]?.[type]);
}

function setAction(item, type) {
  if (!state.actions[item.id]) state.actions[item.id] = {};
  state.actions[item.id][type] = !state.actions[item.id][type];
  saveState();
  renderAll();
}

function itemText(item) {
  return [item.title, item.description, item.category, ...item.tags].join(" ").toLowerCase();
}

function scoreItem(item, keywords, personal = false) {
  const text = itemText(item);
  let score = 0;

  keywords.forEach((keyword) => {
    if (!keyword) return;
    if (text.includes(keyword)) score += 18;
    item.tags.forEach((tag) => {
      if (normalize(tag).includes(keyword) || keyword.includes(normalize(tag))) score += 10;
    });
  });

  const action = state.actions[item.id] || {};
  if (action.like) score += personal ? -18 : 12;
  if (action.bookmark) score += personal ? -22 : 16;
  if (action.share) score += personal ? -14 : 10;
  if (action.dislike) score -= 45;

  if (personal && (action.like || action.bookmark || action.share)) {
    score -= 35;
  }

  return score;
}

function searchContents(keyword) {
  const keywords = tokenize(keyword);
  const results = contentPool
    .map((item) => ({ ...item, score: scoreItem(item, keywords) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (results.length) return results;
  return contentPool.slice(0, 6).map((item, index) => ({ ...item, score: 40 - index * 3 }));
}

function getPositiveKeywords() {
  const bag = [];
  Object.entries(state.actions).forEach(([id, action]) => {
    if (action.like || action.bookmark || action.share) {
      const item = contentPool.find((content) => content.id === id);
      if (item) bag.push(item.category, ...item.tags);
    }
  });
  return [...new Set(bag.map(normalize).filter(Boolean))];
}

function getPersonalRecommendations() {
  const keywords = getPositiveKeywords();
  if (!keywords.length) return [];

  return contentPool
    .map((item) => ({ ...item, score: scoreItem(item, keywords, true) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function typeLabel(type) {
  const map = {
    article: "기사",
    video: "영상",
    project: "프로젝트",
    movie: "영화",
    music: "음악"
  };
  return map[type] || "콘텐츠";
}

function makeReason(item, personal = false) {
  if (personal) {
    return `긍정 표시한 관심사와 ${item.tags.slice(0, 3).join(", ")} 키워드가 연결되어 추천됩니다.`;
  }
  return `입력한 키워드와 ${item.tags.slice(0, 3).join(", ")} 주제가 관련 있어 추천됩니다.`;
}

function renderCard(item, personal = false) {
  const card = document.createElement("article");
  card.className = "content-card";
  card.innerHTML = `
    <div class="thumb">${escapeHtml(item.category)}<br />${escapeHtml(typeLabel(item.type))}</div>
    <div class="card-body">
      <div class="card-meta">
        <span class="type-pill">${escapeHtml(typeLabel(item.type))}</span>
        <span class="score-pill">추천점수 ${Math.max(1, Math.round(item.score))}</span>
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>
      <div class="reason">${escapeHtml(makeReason(item, personal))}</div>
      <div class="tag-row">${item.tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}</div>
      <div class="card-actions">
        <button type="button" class="${getAction(item.id, "like") ? "active" : ""}" data-action="like">좋아요</button>
        <button type="button" class="${getAction(item.id, "bookmark") ? "active" : ""}" data-action="bookmark">북마크</button>
        <button type="button" class="${getAction(item.id, "share") ? "active" : ""}" data-action="share">공유</button>
        <button type="button" class="dislike ${getAction(item.id, "dislike") ? "active" : ""}" data-action="dislike">관심없음</button>
      </div>
    </div>
  `;

  card.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", () => setAction(item, button.dataset.action));
  });

  return card;
}

function renderGrid(container, items, personal = false) {
  container.innerHTML = "";
  if (!items.length) {
    container.innerHTML = `<div class="empty-state">표시할 추천 콘텐츠가 없습니다. 좋아요나 북마크를 눌러 관심사를 만들어보세요.</div>`;
    return;
  }
  items.forEach((item) => container.appendChild(renderCard(item, personal)));
}

function renderStats() {
  const counts = { like: 0, bookmark: 0, share: 0, dislike: 0 };
  Object.values(state.actions).forEach((action) => {
    Object.keys(counts).forEach((key) => {
      if (action[key]) counts[key] += 1;
    });
  });

  els.likeCount.textContent = counts.like;
  els.bookmarkCount.textContent = counts.bookmark;
  els.shareCount.textContent = counts.share;
  els.dislikeCount.textContent = counts.dislike;
}

function renderInterests() {
  const keywords = getPositiveKeywords().slice(0, 12);
  els.interestChips.className = keywords.length ? "chip-box" : "chip-box empty";
  els.interestChips.innerHTML = keywords.length
    ? keywords.map((keyword) => `<span class="chip">#${escapeHtml(keyword)}</span>`).join("")
    : "아직 활동이 없습니다.";
}

function renderAll() {
  renderStats();
  renderInterests();

  if (state.keyword) {
    const results = searchContents(state.keyword);
    renderGrid(els.resultsGrid, results);
    els.resultLabel.textContent = `"${state.keyword}" 추천 결과`;
    els.introCard.classList.add("hidden");
  } else {
    els.resultsGrid.innerHTML = `<div class="empty-state">키워드를 입력하면 관련 콘텐츠가 여기에 표시됩니다.</div>`;
    els.resultLabel.textContent = "대기 중";
    els.introCard.classList.remove("hidden");
  }

  const personal = getPersonalRecommendations();
  if (getPositiveKeywords().length) {
    els.personalSection.classList.remove("hidden");
    renderGrid(els.personalGrid, personal, true);
  } else {
    els.personalSection.classList.add("hidden");
  }
}

function runSearch(keyword) {
  const value = keyword || els.keywordInput.value.trim();
  if (!value) {
    els.keywordInput.focus();
    return;
  }
  state.keyword = value;
  state.recentKeywords = [value, ...state.recentKeywords.filter((item) => item !== value)].slice(0, 5);
  els.keywordInput.value = value;
  saveState();
  renderAll();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.searchBtn.addEventListener("click", () => runSearch());
els.keywordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") runSearch();
});

document.querySelectorAll("[data-keyword]").forEach((button) => {
  button.addEventListener("click", () => runSearch(button.dataset.keyword));
});

els.resetBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  state.keyword = "";
  state.actions = {};
  state.recentKeywords = [];
  els.keywordInput.value = "";
  renderAll();
});

if (state.keyword) els.keywordInput.value = state.keyword;
renderAll();
