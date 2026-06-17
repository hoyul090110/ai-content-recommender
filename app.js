const STORAGE_KEY = "ai-content-recommender-v4-search-personalized";

const state = {
  keyword: "",
  page: 0,
  items: [],
  personalItems: [],
  activity: loadActivity(),
  personalTimer: null,
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
  schedulePersonalRecommendations();
}

function itemKey(item) {
  return item.url || item.sourceUrl || `${item.title}|${item.category}`;
}

function hasAction(action, item) {
  return state.activity[action].some((x) => x.key === itemKey(item));
}

function removeFromAction(action, key) {
  const list = state.activity[action];
  const index = list.findIndex((x) => x.key === key);
  if (index >= 0) list.splice(index, 1);
}

function toggleAction(action, item) {
  const key = itemKey(item);
  const list = state.activity[action];
  const index = list.findIndex((x) => x.key === key);

  if (index >= 0) {
    list.splice(index, 1);
  } else {
    const record = {
      key,
      title: item.title,
      category: item.category,
      type: item.type,
      tags: item.tags || [],
      keyword: state.keyword,
      url: item.url || item.sourceUrl || "",
      reason: item.reason || "",
      createdAt: Date.now(),
    };

    if (action === "disliked") {
      removeFromAction("liked", key);
      removeFromAction("bookmarked", key);
      removeFromAction("shared", key);
    } else {
      removeFromAction("disliked", key);
    }

    list.push(record);
  }

  saveActivity();
  renderContents();
  renderPersonalCards();
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

function getPositiveItems() {
  return [
    ...state.activity.liked.map((x) => ({ ...x, action: "liked", weight: 3 })),
    ...state.activity.bookmarked.map((x) => ({ ...x, action: "bookmarked", weight: 4 })),
    ...state.activity.shared.map((x) => ({ ...x, action: "shared", weight: 5 })),
  ];
}

function buildWeightedKeywords(items) {
  const weights = new Map();
  for (const item of items) {
    const words = [item.keyword, item.category, item.type, ...(item.tags || [])]
      .filter(Boolean)
      .map((x) => String(x).trim())
      .filter(Boolean);
    for (const word of words) {
      weights.set(word, (weights.get(word) || 0) + (item.weight || 1));
    }
  }
  return [...weights.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([keyword, weight]) => ({ keyword, weight }))
    .slice(0, 30);
}

function getProfile() {
  const positiveItems = getPositiveItems();
  const negativeItems = state.activity.disliked.map((x) => ({ ...x, weight: 5 }));

  return {
    positiveKeywords: buildWeightedKeywords(positiveItems),
    negativeKeywords: buildWeightedKeywords(negativeItems),
    positiveTitles: positiveItems.map((x) => x.title).slice(-20),
    negativeTitles: negativeItems.map((x) => x.title).slice(-20),
    positiveUrls: positiveItems.map((x) => x.url).filter(Boolean).slice(-20),
    negativeUrls: negativeItems.map((x) => x.url).filter(Boolean).slice(-20),
    likedTitles: state.activity.liked.map((x) => x.title).slice(-10),
    bookmarkedTitles: state.activity.bookmarked.map((x) => x.title).slice(-10),
    sharedTitles: state.activity.shared.map((x) => x.title).slice(-10),
  };
}

async function requestRecommendations({ keyword, page = 0, mode = "keyword" }) {
  const response = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, page, mode, profile: getProfile() }),
  });
  if (!response.ok) throw new Error("추천 요청 실패");
  return response.json();
}

async function searchKeyword(keyword, append = false) {
  state.keyword = keyword.trim();
  if (!state.keyword) return;

  if (!append) addChat(state.keyword, "user");
  $("loading").classList.remove("hidden");
  $("keywordResultText").textContent = `“${state.keyword}”와 관련된 실제 콘텐츠를 검색하고 있습니다.`;

  try {
    const data = await requestRecommendations({ keyword: state.keyword, page: state.page, mode: "keyword" });
    const items = Array.isArray(data.items) ? data.items : [];
    state.items = append ? dedupeItems([...state.items, ...items]) : items;
    addChat(data.message || `“${state.keyword}” 관련 콘텐츠를 추천했어요.`, "bot");
    if (data.usedAi === false) {
      addChat("실제 AI 검색 연결에 실패해서 데모 추천으로 표시했습니다. API 키/크레딧/모델명을 확인해 주세요.", "bot");
    }
    renderContents();
    $("moreBtn").classList.remove("hidden");
  } catch (error) {
    const fallback = localFallback(state.keyword, state.page, getProfile(), "keyword");
    state.items = append ? dedupeItems([...state.items, ...fallback.items]) : fallback.items;
    addChat("추천 API 연결에 실패해서 브라우저 기본 추천으로 표시했어요.", "bot");
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
  const url = item.url || item.sourceUrl || "";
  const sourceName = item.sourceName || item.siteName || getHostName(url) || "출처";

  card.innerHTML = `
    <div class="meta">
      <span class="badge">${escapeHtml(item.type || item.category || "콘텐츠")}</span>
      <span class="score">${score}점</span>
    </div>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.description || "키워드와 관련된 추천 콘텐츠입니다.")}</p>
    <div class="reason">추천 이유: ${escapeHtml(item.reason || "입력한 키워드와 연관성이 높습니다.")}</div>
    ${url ? `<a class="source-link" href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">출처 보기: ${escapeHtml(sourceName)}</a>` : ""}
    <div class="tags">${tags.map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join("")}</div>
    <div class="actions">
      <button data-action="liked">좋아요</button>
      <button data-action="bookmarked">북마크</button>
      <button data-action="shared">공유</button>
      <button data-action="disliked">관심없음</button>
    </div>
  `;

  card.querySelectorAll("button[data-action]").forEach((btn) => {
    const action = btn.dataset.action;
    if (hasAction(action, item)) btn.classList.add("active");
    btn.addEventListener("click", () => toggleAction(action, item));
  });

  return card;
}

function schedulePersonalRecommendations() {
  renderStats();
  const positiveCount = state.activity.liked.length + state.activity.bookmarked.length + state.activity.shared.length;
  const section = $("personalSection");

  if (positiveCount === 0) {
    section.classList.add("hidden");
    state.personalItems = [];
    $("personalGrid").innerHTML = "";
    return;
  }

  section.classList.remove("hidden");
  $("personalText").textContent = "좋아요, 북마크, 공유한 키워드를 종합해 새로운 실제 콘텐츠를 추천합니다.";

  clearTimeout(state.personalTimer);
  state.personalTimer = setTimeout(loadPersonalRecommendations, 500);
}

async function loadPersonalRecommendations() {
  const positiveCount = state.activity.liked.length + state.activity.bookmarked.length + state.activity.shared.length;
  if (positiveCount === 0) return;

  $("personalLoading").classList.remove("hidden");
  const profile = getProfile();
  const profileKeyword = profile.positiveKeywords.map((x) => x.keyword).slice(0, 8).join(" ") || state.keyword || "추천";

  try {
    const data = await requestRecommendations({ keyword: profileKeyword, page: 0, mode: "personal" });
    const rawItems = Array.isArray(data.items) ? data.items : [];
    state.personalItems = dedupeItems(rawItems).filter((item) => !isAlreadyPositive(item)).slice(0, 9);
    if (!state.personalItems.length) {
      state.personalItems = localFallback(profileKeyword, 0, profile, "personal").items;
    }
    renderPersonalCards();
  } catch (error) {
    state.personalItems = localFallback(profileKeyword, 0, profile, "personal").items;
    renderPersonalCards();
  } finally {
    $("personalLoading").classList.add("hidden");
  }
}

function renderPersonalCards() {
  const positiveCount = state.activity.liked.length + state.activity.bookmarked.length + state.activity.shared.length;
  const section = $("personalSection");
  const grid = $("personalGrid");

  if (positiveCount === 0) {
    section.classList.add("hidden");
    return;
  }

  section.classList.remove("hidden");
  grid.innerHTML = "";

  if (!state.personalItems.length) {
    grid.innerHTML = `<div class="empty">활동을 분석하는 중입니다. 잠시만 기다려 주세요.</div>`;
    return;
  }

  state.personalItems.forEach((item) => grid.appendChild(createCard(item)));
}

function isAlreadyPositive(item) {
  const key = itemKey(item);
  return getPositiveItems().some((x) => x.key === key || x.title === item.title || (x.url && x.url === (item.url || item.sourceUrl)));
}

function dedupeItems(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = itemKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function localFallback(keyword, page, profile, mode = "keyword") {
  const positive = (profile.positiveKeywords || []).map((x) => typeof x === "string" ? x : x.keyword);
  const negative = new Set((profile.negativeKeywords || []).map((x) => typeof x === "string" ? x : x.keyword));
  const expanded = expandKeyword(`${keyword} ${positive.slice(0, 5).join(" ")}`);
  const clean = expanded.filter((x) => !negative.has(x));
  const types = ["영상", "블로그", "강의", "뉴스", "팟캐스트", "튜토리얼", "리뷰", "가이드"];

  const items = Array.from({ length: 10 }, (_, i) => {
    const topic = clean[(i + page) % Math.max(1, clean.length)] || keyword || "추천";
    const type = types[(i + page) % types.length];
    const prefix = mode === "personal" ? "활동 기반" : "검색 기반";
    return {
      title: `${prefix} ${topic} ${type} 추천 ${page * 10 + i + 1}`,
      category: topic,
      type,
      description: `${keyword}와 사용자의 관심 신호를 바탕으로 ${topic} 관점에서 볼 만한 ${type} 콘텐츠입니다.`,
      reason: mode === "personal"
        ? `좋아요/북마크/공유에서 반복된 관심사와 '${topic}' 주제가 연결되어 추천했습니다.`
        : `입력 키워드 '${keyword}'와 '${topic}'의 의미가 연결되어 추천했습니다.`,
      tags: [topic, keyword, type].filter(Boolean),
      score: 94 - (i % 6) * 4,
    };
  });

  return { items, message: "브라우저 기본 추천을 표시했어요.", usedAi: false };
}

function expandKeyword(keyword) {
  const dict = {
    AI: ["인공지능", "머신러닝", "데이터", "미래기술", "자동화", "진로"],
    진로: ["직업", "대학", "학과", "포트폴리오", "면접", "미래"],
    공부: ["집중", "학습법", "시험", "시간관리", "노트정리", "동기부여"],
    영화: ["리뷰", "스토리", "감동", "힐링", "연출", "OST"],
    코딩: ["파이썬", "웹개발", "자바스크립트", "프로젝트", "GitHub", "알고리즘"],
    축구: ["전술", "선수", "분석", "하이라이트", "리그", "훈련"],
  };

  const result = new Set(String(keyword).split(/\s+/).filter(Boolean));
  Object.entries(dict).forEach(([key, values]) => {
    if (String(keyword).toLowerCase().includes(key.toLowerCase())) values.forEach((v) => result.add(v));
  });
  if (result.size < 4) ["입문", "추천", "분석", "트렌드", "실전", "가이드"].forEach((v) => result.add(v));
  return [...result];
}

function getHostName(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"]/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  }[m]));
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replace(/'/g, "&#039;");
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
  state.personalItems = [];
  saveActivity();
  renderContents();
  renderPersonalCards();
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
renderContents();
schedulePersonalRecommendations();
