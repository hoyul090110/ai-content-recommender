const STORAGE_KEY = "ai-content-recommender-state-v2";

const state = loadState();

const usernameInput = document.querySelector("#usernameInput");
const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const interestButtons = document.querySelector("#interestButtons");
const contentList = document.querySelector("#contentList");
const recommendationList = document.querySelector("#recommendationList");
const trendingList = document.querySelector("#trendingList");
const resetButton = document.querySelector("#resetButton");

const SEMANTIC_KEYWORDS = {
  "AI": ["인공지능", "머신러닝", "딥러닝", "추천", "알고리즘", "데이터", "기술", "미래", "자동화", "코딩", "chatgpt", "gpt"],
  "공부": ["학습", "시험", "집중", "강의", "기초", "입문", "교육", "파이썬", "웹", "데이터", "진로"],
  "진로": ["직업", "미래", "기술", "AI", "뉴스", "경제", "교육", "데이터", "분석"],
  "힐링": ["감동", "성장", "음악", "lofi", "잔잔한", "영화", "OST", "감상", "집중"],
  "재미": ["게임", "영화", "KPOP", "댄스", "인디", "스토리", "창의성", "스포츠"],
  "뉴스": ["IT", "경제", "금융", "시장", "기술", "스타트업", "미래", "직업"],
  "스포츠": ["축구", "농구", "전술", "훈련", "자세", "기록", "분석"],
  "음악": ["KPOP", "OST", "lofi", "집중", "댄스", "플레이리스트", "감상"],
  "게임": ["인디", "전략", "공략", "초보", "스토리", "OST", "창의성"],
  "영화": ["SF", "드라마", "감동", "성장", "미래", "연출", "OST", "감상"],
  "초보": ["기초", "입문", "쉽게", "가이드", "처음", "설명", "강의"],
  "분석": ["데이터", "기록", "전술", "경제", "시장", "알고리즘", "추천시스템"]
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  return {
    username: "demo",
    interests: ["교육", "뉴스"],
    interactions: {}
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalize(text) {
  return String(text || "").toLowerCase().replace(/[^0-9a-zA-Z가-힣+#.\s]/g, " ");
}

function tokenize(text) {
  return normalize(text)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 1);
}

function expandQuery(query) {
  const tokens = tokenize(query);
  const expanded = new Set(tokens);

  tokens.forEach((token) => {
    Object.entries(SEMANTIC_KEYWORDS).forEach(([main, related]) => {
      const group = [main, ...related].map((word) => normalize(word));
      if (group.some((word) => word.includes(token) || token.includes(word))) {
        expanded.add(normalize(main));
        related.forEach((word) => expanded.add(normalize(word)));
      }
    });
  });

  return [...expanded].filter(Boolean);
}

function contentText(content) {
  return normalize([
    content.title,
    content.category,
    content.description,
    ...content.tags
  ].join(" "));
}

function keywordRelevance(content, query) {
  const expanded = expandQuery(query);
  if (expanded.length === 0) return { score: 0, matched: [] };

  const text = contentText(content);
  const matched = [];
  let score = 0;

  expanded.forEach((word) => {
    if (!word) return;
    if (text.includes(word)) {
      matched.push(word);
      score += 13;
    }
  });

  const exactTokens = tokenize(query);
  exactTokens.forEach((word) => {
    if (text.includes(word)) score += 10;
  });

  return {
    score,
    matched: [...new Set(matched)].slice(0, 4)
  };
}

function interactionScore(interaction) {
  const weights = { view: 1, like: 3, bookmark: 4, share: 5 };
  return weights[interaction] || 0;
}

function getContentScore(content) {
  let score = content.popularity * 0.2;
  const reasons = [];
  const query = searchInput.value.trim();

  const keyword = keywordRelevance(content, query);
  if (keyword.score > 0) {
    score += keyword.score;
    reasons.push(`입력 키워드와 의미적으로 연관: ${keyword.matched.join(", ")}`);
  }

  if (state.interests.includes(content.category)) {
    score += 25;
    reasons.push(`${content.category} 관심사와 일치`);
  }

  const interactedItems = Object.entries(state.interactions)
    .map(([id, interactions]) => ({ content: CONTENTS.find((item) => item.id === Number(id)), interactions }))
    .filter((item) => item.content);

  interactedItems.forEach(({ content: interactedContent, interactions }) => {
    const activityScore = interactions.reduce((sum, type) => sum + interactionScore(type), 0);
    const sameCategory = interactedContent.category === content.category;
    const sharedTags = content.tags.filter((tag) => interactedContent.tags.includes(tag));

    if (sameCategory) {
      score += activityScore * 1.8;
      reasons.push(`활동한 콘텐츠와 같은 ${content.category} 카테고리`);
    }
    if (sharedTags.length > 0) {
      score += activityScore * sharedTags.length * 1.5;
      reasons.push(`유사 태그: ${sharedTags.slice(0, 2).join(", ")}`);
    }
  });

  const ownInteractions = state.interactions[content.id] || [];
  if (ownInteractions.length > 0) score -= 35;

  return {
    score: Math.max(0, Math.round(score)),
    reason: [...new Set(reasons)].slice(0, 3).join(" · ") || "최근 인기 콘텐츠"
  };
}

function getRecommendations() {
  return CONTENTS
    .map((content) => ({ ...content, recommendation: getContentScore(content) }))
    .sort((a, b) => b.recommendation.score - a.recommendation.score)
    .slice(0, 6);
}

function getFilteredContents() {
  const keyword = searchInput.value.trim();
  const category = categoryFilter.value;

  return CONTENTS
    .map((content) => ({ ...content, keyword: keywordRelevance(content, keyword) }))
    .filter((content) => {
      const matchesCategory = category === "전체" || content.category === category;
      const matchesKeyword = !keyword || content.keyword.score > 0 || contentText(content).includes(normalize(keyword));
      return matchesCategory && matchesKeyword;
    })
    .sort((a, b) => b.keyword.score - a.keyword.score);
}

function renderInterestButtons() {
  interestButtons.innerHTML = CATEGORIES.map((category) => {
    const active = state.interests.includes(category) ? "active" : "";
    return `<button class="chip ${active}" data-interest="${category}">${category}</button>`;
  }).join("");
}

function renderCategoryFilter() {
  categoryFilter.innerHTML = ["전체", ...CATEGORIES]
    .map((category) => `<option value="${category}">${category}</option>`)
    .join("");
}

function renderCards(container, contents, mode = "content") {
  if (contents.length === 0) {
    container.innerHTML = `<div class="empty-card">조건에 맞는 콘텐츠가 없습니다. 다른 키워드를 입력해보세요.</div>`;
    return;
  }

  container.innerHTML = contents.map((content) => {
    const interactions = state.interactions[content.id] || [];
    const scoreBox = mode === "recommendation"
      ? `<div class="score">AI 추천 점수 <strong>${content.recommendation.score}</strong></div>
         <p class="reason">${content.recommendation.reason}</p>`
      : `<div class="score">인기도 <strong>${content.popularity}</strong></div>`;

    return `
      <article class="content-card">
        <div class="card-top">
          <span class="category">${content.category}</span>
          ${scoreBox}
        </div>
        <h3>${content.title}</h3>
        <p>${content.description}</p>
        <div class="tag-row">${content.tags.map((tag) => `<span>#${tag}</span>`).join("")}</div>
        <div class="actions">
          ${["view", "like", "bookmark", "share"].map((type) => `
            <button class="action ${interactions.includes(type) ? "active" : ""}" data-id="${content.id}" data-action="${type}">
              ${labelFor(type)}
            </button>
          `).join("")}
        </div>
      </article>
    `;
  }).join("");
}

function labelFor(type) {
  return { view: "보기", like: "좋아요", bookmark: "북마크", share: "공유" }[type];
}

function renderStats() {
  const flat = Object.values(state.interactions).flat();
  document.querySelector("#viewCount").textContent = flat.filter((type) => type === "view").length;
  document.querySelector("#likeCount").textContent = flat.filter((type) => type === "like").length;
  document.querySelector("#bookmarkCount").textContent = flat.filter((type) => type === "bookmark").length;
  document.querySelector("#shareCount").textContent = flat.filter((type) => type === "share").length;
}

function renderKeywordHint() {
  const hint = document.querySelector("#keywordHint");
  const query = searchInput.value.trim();
  if (!hint) return;

  if (!query) {
    hint.textContent = "예: AI 진로, 시험기간 집중, 힐링 영화, 초보자 코딩, 축구 분석";
    return;
  }

  const expanded = expandQuery(query).slice(0, 10);
  hint.textContent = `AI가 확장한 관련 키워드: ${expanded.join(", ")}`;
}

function render() {
  usernameInput.value = state.username;
  renderInterestButtons();
  renderKeywordHint();
  renderCards(recommendationList, getRecommendations(), "recommendation");
  renderCards(contentList, getFilteredContents());
  renderCards(trendingList, [...CONTENTS].sort((a, b) => b.popularity - a.popularity).slice(0, 3));
  renderStats();
}

document.body.addEventListener("click", (event) => {
  const interest = event.target.dataset.interest;
  const action = event.target.dataset.action;
  const id = Number(event.target.dataset.id);

  if (interest) {
    state.interests = state.interests.includes(interest)
      ? state.interests.filter((item) => item !== interest)
      : [...state.interests, interest];
    saveState();
    render();
  }

  if (action && id) {
    const current = state.interactions[id] || [];
    state.interactions[id] = current.includes(action)
      ? current.filter((item) => item !== action)
      : [...current, action];
    saveState();
    render();
  }
});

usernameInput.addEventListener("input", () => {
  state.username = usernameInput.value;
  saveState();
});
searchInput.addEventListener("input", render);
categoryFilter.addEventListener("change", render);
resetButton.addEventListener("click", () => {
  state.interactions = {};
  saveState();
  render();
});

renderCategoryFilter();
render();
