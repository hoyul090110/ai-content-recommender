const STORAGE_KEY = "ai-content-recommender-v2";

const state = {
  keyword: "",
  page: 0,
  items: [],
  activity: loadActivity()
};

const $ = (id) => document.getElementById(id);

function loadActivity() {
  const fallback = { liked: [], bookmarked: [], shared: [], disliked: [] };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return fallback;
  }
}

function saveActivity() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.activity));
  renderStats();
  renderPersonalSection();
}

function itemKey(item) {
  return `${item.title}|${item.category}`;
}

function hasAction(action, item) {
  return state.activity[action].some((x) => x.key === itemKey(item));
}

function toggleAction(action, item) {
  const key = itemKey(item);
  const list = state.activity[action];
  const index = list.findIndex((x) => x.key === key);
  if (index >= 0) list.splice(index, 1);
  else list.push({ key, title: item.title, category: item.category, tags: item.tags || [], keyword: state.keyword });
  saveActivity();
  renderContents();
}

function renderStats() {
  $("likeCount").textContent = state.activity.liked.length;
  $("bookmarkCount").textContent = state.activity.bookmarked.length;
  $("shareCount").textContent = state.activity.shared.length;
  $("dislikeCount").textContent = state.activity.disliked.length;
}

function addChat(message, type = "bot") {
  const div = document.createElement("div");
  div.className = `bubble ${type}`;
  div.textContent = message;
  $("chatBox").appendChild(div);
  $("chatBox").scrollTop = $("chatBox").scrollHeight;
}

function getProfile() {
  const positive = [...state.activity.liked, ...state.activity.bookmarked, ...state.activity.shared];
  const negative = state.activity.disliked;
  return {
    positiveKeywords: [...new Set(positive.flatMap((x) => [x.keyword, x.category, ...(x.tags || [])]).filter(Boolean))].slice(0, 30),
    negativeKeywords: [...new Set(negative.flatMap((x) => [x.keyword, x.category, ...(x.tags || [])]).filter(Boolean))].slice(0, 30),
    likedTitles: state.activity.liked.map((x) => x.title).slice(-10),
    bookmarkedTitles: state.activity.bookmarked.map((x) => x.title).slice(-10),
    sharedTitles: state.activity.shared.map((x) => x.title).slice(-10)
  };
}

async function requestRecommendations(keyword, page = 0) {
  const response = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, page, profile: getProfile() })
  });
  if (!response.ok) throw new Error("AI 추천 요청 실패");
  return response.json();
}

async function searchKeyword(keyword, append = false) {
  state.keyword = keyword.trim();
  if (!state.keyword) return;

  addChat(state.keyword, "user");
  $("loading").classList.remove("hidden");
  $("keywordResultText").textContent = `“${state.keyword}”와 관련된 콘텐츠를 추천하는 중입니다.`;

  try {
    const data = await requestRecommendations(state.keyword, state.page);
    const items = Array.isArray(data.items) ? data.items : [];
    state.items = append ? [...state.items, ...items] : items;
    addChat(data.message || `“${state.keyword}” 관련 콘텐츠를 추천했어요.`, "bot");
    renderContents();
    $("moreBtn").classList.remove("hidden");
  } catch (error) {
    const fallback = localFallback(state.keyword, state.page, getProfile());
    state.items = append ? [...state.items, ...fallback.items] : fallback.items;
    addChat("AI 연결이 없어서 브라우저 기본 추천으로 표시했어요. Netlify 환경변수 OPENAI_API_KEY를 설정하면 실제 AI 추천이 작동합니다.", "bot");
    renderContents();
    $("moreBtn").classList.remove("hidden");
  } finally {
    $("loading").classList.add("hidden");
  }
}

function renderContents() {
  const grid = $("contentGrid");
  grid.innerHTML = "";
  if (!state.items.length) {
    grid.innerHTML = `<div class="empty">아직 추천 결과가 없습니다. 키워드를 입력해 주세요.</div>`;
    return;
  }
  state.items.forEach((item) => grid.appendChild(createCard(item)));
}

function createCard(item) {
  const card = document.createElement("article");
  card.className = "card";
  const tags = (item.tags || []).slice(0, 5);
  const score = Math.round(Number(item.score || 80));
  card.innerHTML = `
    <div class="card__top">
      <span class="badge">${escapeHtml(item.type || item.category || "콘텐츠")}</span>
      <span class="score">${score}점</span>
    </div>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.description || "키워드와 관련된 추천 콘텐츠입니다.")}</p>
    <p class="reason">추천 이유: ${escapeHtml(item.reason || "입력한 키워드와 연관성이 높습니다.")}</p>
    <div class="tags">${tags.map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join("")}</div>
    <div class="actions">
      <button data-action="liked">좋아요</button>
      <button data-action="bookmarked">북마크</button>
      <button data-action="shared">공유</button>
      <button class="dislike" data-action="disliked">관심없음</button>
    </div>
  `;

  card.querySelectorAll("button[data-action]").forEach((btn) => {
    const action = btn.dataset.action;
    if (hasAction(action, item)) btn.classList.add("active");
    btn.addEventListener("click", () => toggleAction(action, item));
  });

  return card;
}

function renderPersonalSection() {
  const positiveCount = state.activity.liked.length + state.activity.bookmarked.length + state.activity.shared.length;
  const section = $("personalSection");
  const grid = $("personalGrid");
  if (positiveCount === 0) {
    section.classList.add("hidden");
    return;
  }
  section.classList.remove("hidden");

  const positives = [...state.activity.liked, ...state.activity.bookmarked, ...state.activity.shared];
  const negatives = state.activity.disliked.flatMap((x) => x.tags || []);
  const sourceTags = positives.flatMap((x) => x.tags || []).filter((tag) => !negatives.includes(tag));
  const uniqueTags = [...new Set(sourceTags)].slice(0, 9);

  const personalItems = uniqueTags.map((tag, index) => ({
    title: `${tag} 맞춤 추천 콘텐츠 ${index + 1}`,
    category: "개인화 추천",
    type: "맞춤 추천",
    description: `내가 반응한 콘텐츠를 바탕으로 ${tag} 주제를 더 깊게 탐색할 수 있는 콘텐츠입니다.`,
    reason: `좋아요/북마크/공유한 콘텐츠에서 '${tag}' 관심사가 반복적으로 나타났습니다.`,
    tags: [tag, "개인화", "활동기반"],
    score: 95 - index * 3
  }));

  grid.innerHTML = "";
  personalItems.forEach((item) => grid.appendChild(createCard(item)));
}

function localFallback(keyword, page, profile) {
  const base = keyword.split(/\s+/).filter(Boolean);
  const expanded = expandKeyword(keyword);
  const negative = new Set(profile.negativeKeywords || []);
  const clean = expanded.filter((x) => !negative.has(x));
  const types = ["영상", "블로그", "강의", "뉴스", "팟캐스트", "튜토리얼", "리뷰", "가이드"];
  const items = Array.from({ length: 12 }, (_, i) => {
    const topic = clean[(i + page) % clean.length] || base[0] || "추천";
    const type = types[(i + page) % types.length];
    return {
      title: `${keyword} ${topic} ${type} 추천 ${page * 12 + i + 1}`,
      category: topic,
      type,
      description: `${keyword}에 관심 있는 사용자를 위해 ${topic} 관점에서 볼 만한 ${type} 콘텐츠입니다.`,
      reason: `입력 키워드 '${keyword}'와 '${topic}'의 의미가 연결되어 추천되었습니다.`,
      tags: [topic, keyword, type, ...clean.slice(0, 2)],
      score: 92 - (i % 6) * 4
    };
  });
  return { items, message: "브라우저 기본 AI형 추천을 표시했어요." };
}

function expandKeyword(keyword) {
  const dict = {
    "AI": ["인공지능", "머신러닝", "데이터", "미래기술", "자동화", "진로"],
    "진로": ["직업", "대학", "학과", "포트폴리오", "면접", "미래"],
    "공부": ["집중", "학습법", "시험", "시간관리", "노트정리", "동기부여"],
    "영화": ["리뷰", "스토리", "감동", "힐링", "연출", "OST"],
    "코딩": ["파이썬", "웹개발", "자바스크립트", "프로젝트", "GitHub", "알고리즘"],
    "축구": ["전술", "선수", "분석", "하이라이트", "리그", "훈련"]
  };
  const result = new Set(keyword.split(/\s+/).filter(Boolean));
  Object.entries(dict).forEach(([key, values]) => {
    if (keyword.toLowerCase().includes(key.toLowerCase())) values.forEach((v) => result.add(v));
  });
  if (result.size < 4) ["입문", "추천", "분석", "트렌드", "실전", "가이드"].forEach((v) => result.add(v));
  return [...result];
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
}

$("keywordForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.page = 0;
  state.items = [];
  searchKeyword($("keywordInput").value, false);
});

$("moreBtn").addEventListener("click", () => {
  state.page += 1;
  searchKeyword(state.keyword, true);
});

$("resetBtn").addEventListener("click", () => {
  state.activity = { liked: [], bookmarked: [], shared: [], disliked: [] };
  saveActivity();
  renderContents();
});

document.querySelectorAll(".quick-keywords button").forEach((button) => {
  button.addEventListener("click", () => {
    $("keywordInput").value = button.dataset.keyword;
    state.page = 0;
    state.items = [];
    searchKeyword(button.dataset.keyword, false);
  });
});

renderStats();
renderPersonalSection();
