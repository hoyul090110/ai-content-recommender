const STORAGE_KEY = "ai-content-recommender-state";

const state = loadState();

const usernameInput = document.querySelector("#usernameInput");
const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const interestButtons = document.querySelector("#interestButtons");
const contentList = document.querySelector("#contentList");
const recommendationList = document.querySelector("#recommendationList");
const trendingList = document.querySelector("#trendingList");
const resetButton = document.querySelector("#resetButton");

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

function interactionScore(interaction) {
  const weights = { view: 1, like: 3, bookmark: 4, share: 5 };
  return weights[interaction] || 0;
}

function getContentScore(content) {
  let score = content.popularity * 0.25;
  const reasons = [];

  if (state.interests.includes(content.category)) {
    score += 35;
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
      score += activityScore * 2.2;
      reasons.push(`활동한 콘텐츠와 같은 ${content.category} 카테고리`);
    }
    if (sharedTags.length > 0) {
      score += activityScore * sharedTags.length * 1.7;
      reasons.push(`유사 태그: ${sharedTags.slice(0, 2).join(", ")}`);
    }
  });

  const ownInteractions = state.interactions[content.id] || [];
  if (ownInteractions.length > 0) score -= 40;

  return {
    score: Math.max(0, Math.round(score)),
    reason: [...new Set(reasons)].slice(0, 2).join(" · ") || "최근 인기 콘텐츠"
  };
}

function getRecommendations() {
  return CONTENTS
    .map((content) => ({ ...content, recommendation: getContentScore(content) }))
    .sort((a, b) => b.recommendation.score - a.recommendation.score)
    .slice(0, 6);
}

function getFilteredContents() {
  const keyword = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  return CONTENTS.filter((content) => {
    const matchesCategory = category === "전체" || content.category === category;
    const matchesKeyword =
      !keyword ||
      content.title.toLowerCase().includes(keyword) ||
      content.description.toLowerCase().includes(keyword) ||
      content.tags.join(" ").toLowerCase().includes(keyword);
    return matchesCategory && matchesKeyword;
  });
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
  container.innerHTML = contents.map((content) => {
    const interactions = state.interactions[content.id] || [];
    const scoreBox = mode === "recommendation"
      ? `<div class="score">추천 점수 <strong>${content.recommendation.score}</strong></div>
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

function render() {
  usernameInput.value = state.username;
  renderInterestButtons();
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
