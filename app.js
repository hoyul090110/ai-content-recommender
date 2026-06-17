const state = {
  currentKeyword: "",
  currentResults: [],
  personalResults: [],
  interactions: loadInteractions(),
  page: 1,
  isLoading: false,
};

const els = {
  keywordInput: document.getElementById("keywordInput"),
  searchBtn: document.getElementById("searchBtn"),
  loadMoreBtn: document.getElementById("loadMoreBtn"),
  refreshPersonalBtn: document.getElementById("refreshPersonalBtn"),
  statusBox: document.getElementById("statusBox"),
  resultGrid: document.getElementById("resultGrid"),
  personalGrid: document.getElementById("personalGrid"),
  personalSection: document.getElementById("personalSection"),
  interestSection: document.getElementById("interestSection"),
  interestChips: document.getElementById("interestChips"),
  positiveCount: document.getElementById("positiveCount"),
  negativeCount: document.getElementById("negativeCount"),
  keywordCount: document.getElementById("keywordCount"),
};

function loadInteractions() {
  try {
    return JSON.parse(localStorage.getItem("ai-recommender-interactions") || "{}");
  } catch (error) {
    return {};
  }
}

function saveInteractions() {
  localStorage.setItem("ai-recommender-interactions", JSON.stringify(state.interactions));
}

function normalizeText(value) {
  return String(value || "").trim();
}

function makeItemId(item) {
  return btoa(unescape(encodeURIComponent(`${item.url || ""}|${item.title || ""}`))).replace(/=+$/, "");
}

function getInteraction(item) {
  return state.interactions[makeItemId(item)] || {};
}

function setStatus(message, type = "success") {
  if (!message) {
    els.statusBox.className = "status hidden";
    els.statusBox.textContent = "";
    return;
  }
  els.statusBox.className = `status ${type}`;
  els.statusBox.textContent = message;
}

function setLoading(isLoading) {
  state.isLoading = isLoading;
  els.searchBtn.disabled = isLoading;
  els.searchBtn.textContent = isLoading ? "AI가 찾는 중..." : "AI 검색 추천";
}

function extractInterestProfile() {
  const positiveTypes = ["like", "bookmark", "share"];
  const positive = [];
  const negative = [];
  const seenUrls = new Set();

  Object.values(state.interactions).forEach((record) => {
    const item = record.item || {};
    const keywords = [
      item.keyword,
      item.category,
      item.type,
      ...(Array.isArray(item.tags) ? item.tags : []),
    ].filter(Boolean);

    if (item.url) seenUrls.add(item.url);

    const hasPositive = positiveTypes.some((type) => record[type]);
    if (hasPositive) positive.push(...keywords);
    if (record.dislike) negative.push(...keywords);
  });

  const positiveKeywords = countKeywords(positive).slice(0, 12);
  const negativeKeywords = countKeywords(negative).slice(0, 10);

  return { positiveKeywords, negativeKeywords, seenUrls: [...seenUrls] };
}

function countKeywords(values) {
  const counts = new Map();
  values
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([keyword]) => keyword);
}

async function requestRecommendations({ keyword, mode = "search", append = false }) {
  const profile = extractInterestProfile();
  const payload = {
    keyword,
    mode,
    page: state.page,
    positiveKeywords: profile.positiveKeywords,
    negativeKeywords: profile.negativeKeywords,
    seenUrls: profile.seenUrls,
  };

  const response = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`추천 API 오류: ${response.status}`);
  }

  const data = await response.json();
  if (!data.items || !Array.isArray(data.items)) {
    throw new Error("추천 결과 형식이 올바르지 않습니다.");
  }

  const fallback = Boolean(data.fallback);
  const items = data.items.map((item, index) => ({
    title: item.title || `${keyword} 추천 콘텐츠 ${index + 1}`,
    description: item.description || "AI가 추천한 관련 콘텐츠입니다.",
    reason: item.reason || "입력한 키워드와 관련성이 높아 추천합니다.",
    url: item.url || "#",
    source: item.source || "AI 추천",
    type: item.type || "article",
    category: item.category || keyword,
    keyword,
    tags: Array.isArray(item.tags) ? item.tags : [],
    score: Number(item.score || 80),
    imageUrl: item.imageUrl || "",
  }));

  if (mode === "personal") {
    state.personalResults = items;
    renderCards(els.personalGrid, state.personalResults, "personal");
  } else {
    state.currentResults = append ? [...state.currentResults, ...items] : items;
    renderCards(els.resultGrid, state.currentResults, "search");
    els.loadMoreBtn.classList.remove("hidden");
  }

  if (fallback) {
    setStatus("AI 연결이 실패해서 브라우저 기본 추천으로 표시했어요. API 키, 크레딧, 모델명, Vercel 재배포를 확인하세요.", "warning");
  } else {
    setStatus("실제 웹 검색 기반 추천 결과를 불러왔어요.", "success");
  }
}

function buildFallbackItems(keyword, mode = "search") {
  const base = normalizeText(keyword) || "AI 콘텐츠";
  const templates = mode === "personal"
    ? [
        `${base}를 융합한 심화 탐구 콘텐츠`,
        `${base} 관심사를 바탕으로 한 프로젝트 사례`,
        `${base}와 연결되는 최신 트렌드 분석`,
        `${base} 기반 진로·학습 자료 모음`,
      ]
    : [
        `${base} 핵심 개념 정리`,
        `${base} 관련 최신 기사 모음`,
        `${base} 입문자를 위한 영상 자료`,
        `${base} 사례와 이미지 자료`,
      ];

  return templates.map((title, index) => ({
    title,
    description: `“${base}” 키워드와 관련된 콘텐츠를 과제용 데모 로직으로 추천했습니다.`,
    reason: mode === "personal"
      ? "긍정 표시한 키워드들을 종합해 새롭게 추천했습니다."
      : "입력한 키워드와 의미적으로 가까운 콘텐츠입니다.",
    url: `https://www.google.com/search?q=${encodeURIComponent(title)}`,
    source: "Google Search",
    type: index % 2 === 0 ? "article" : "video",
    category: base,
    keyword: base,
    tags: [base, "추천", "AI"],
    score: 92 - index * 3,
    imageUrl: "",
  }));
}

function renderCards(container, items, section) {
  if (!items.length) {
    container.className = "card-grid empty-state";
    container.innerHTML = `<p>${section === "personal" ? "긍정 반응을 남기면 맞춤 추천이 표시됩니다." : "키워드를 입력하면 관련 콘텐츠가 표시됩니다."}</p>`;
    return;
  }

  container.className = "card-grid";
  container.innerHTML = items.map((item) => createCardHTML(item)).join("");

  container.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      const action = button.dataset.action;
      const item = items.find((candidate) => makeItemId(candidate) === id);
      if (item) handleInteraction(item, action);
    });
  });
}

function createCardHTML(item) {
  const id = makeItemId(item);
  const record = getInteraction(item);
  const tags = (item.tags || []).slice(0, 4).map((tag) => `<span class="tag">#${escapeHTML(tag)}</span>`).join("");
  const imageHTML = item.imageUrl
    ? `<img src="${escapeAttribute(item.imageUrl)}" alt="${escapeAttribute(item.title)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=&quot;thumbnail-fallback&quot;>AI 추천 콘텐츠</div>'" />`
    : `<div class="thumbnail-fallback">${escapeHTML(item.category || "AI 추천 콘텐츠")}</div>`;

  return `
    <article class="content-card">
      <div class="thumbnail">${imageHTML}</div>
      <div class="card-body">
        <div class="card-meta">
          <span class="type-pill">${escapeHTML(item.type || "content")}</span>
          <span class="score-pill">${Math.round(item.score || 80)}점</span>
          <span>${escapeHTML(item.source || "AI")}</span>
        </div>
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.description)}</p>
        <p class="reason">추천 이유: ${escapeHTML(item.reason)}</p>
        <div class="tag-row">${tags}</div>
        <a class="open-link" href="${escapeAttribute(item.url || "#")}" target="_blank" rel="noopener noreferrer">콘텐츠 열기 ↗</a>
        <div class="card-actions">
          <button class="action-btn ${record.like ? "active" : ""}" data-id="${id}" data-action="like">👍 좋아요</button>
          <button class="action-btn ${record.bookmark ? "active" : ""}" data-id="${id}" data-action="bookmark">🔖 북마크</button>
          <button class="action-btn ${record.share ? "active" : ""}" data-id="${id}" data-action="share">📤 공유</button>
          <button class="action-btn negative ${record.dislike ? "active" : ""}" data-id="${id}" data-action="dislike">🚫 관심없음</button>
        </div>
      </div>
    </article>
  `;
}

function handleInteraction(item, action) {
  const id = makeItemId(item);
  const current = state.interactions[id] || { item, like: false, bookmark: false, share: false, dislike: false };
  current.item = item;

  if (action === "dislike") {
    current.dislike = !current.dislike;
    if (current.dislike) {
      current.like = false;
      current.bookmark = false;
      current.share = false;
    }
  } else {
    current[action] = !current[action];
    if (current[action]) current.dislike = false;
  }

  state.interactions[id] = current;
  saveInteractions();
  renderCards(els.resultGrid, state.currentResults, "search");
  renderCards(els.personalGrid, state.personalResults, "personal");
  updateDashboard();
  maybeLoadPersonalRecommendations();
}

function updateDashboard() {
  const records = Object.values(state.interactions);
  const positive = records.filter((record) => record.like || record.bookmark || record.share).length;
  const negative = records.filter((record) => record.dislike).length;
  const profile = extractInterestProfile();

  els.positiveCount.textContent = String(positive);
  els.negativeCount.textContent = String(negative);
  els.keywordCount.textContent = String(profile.positiveKeywords.length);

  if (profile.positiveKeywords.length || profile.negativeKeywords.length) {
    els.interestSection.classList.remove("hidden");
    const positiveChips = profile.positiveKeywords.map((keyword) => `<span class="chip positive">${escapeHTML(keyword)}</span>`).join("");
    const negativeChips = profile.negativeKeywords.map((keyword) => `<span class="chip negative">관심없음: ${escapeHTML(keyword)}</span>`).join("");
    els.interestChips.innerHTML = positiveChips + negativeChips;
  } else {
    els.interestSection.classList.add("hidden");
  }

  if (positive > 0) {
    els.personalSection.classList.remove("hidden");
  }
}

let personalTimer = null;
function maybeLoadPersonalRecommendations() {
  const profile = extractInterestProfile();
  if (!profile.positiveKeywords.length) return;
  clearTimeout(personalTimer);
  personalTimer = setTimeout(() => loadPersonalRecommendations(), 500);
}

async function loadPersonalRecommendations() {
  const profile = extractInterestProfile();
  if (!profile.positiveKeywords.length) return;

  const keyword = profile.positiveKeywords.slice(0, 6).join(" + ");
  try {
    setStatus("활동 기록을 종합해 새로운 콘텐츠를 찾는 중입니다...", "success");
    await requestRecommendations({ keyword, mode: "personal", append: false });
  } catch (error) {
    console.error(error);
    state.personalResults = buildFallbackItems(keyword, "personal");
    renderCards(els.personalGrid, state.personalResults, "personal");
    setStatus("AI 맞춤 추천에 실패해 기본 맞춤 추천을 표시했어요.", "warning");
  }
}

async function searchKeyword({ append = false } = {}) {
  const keyword = normalizeText(els.keywordInput.value);
  if (!keyword) {
    setStatus("먼저 추천받고 싶은 키워드를 입력하세요.", "warning");
    els.keywordInput.focus();
    return;
  }

  if (!append) {
    state.currentKeyword = keyword;
    state.page = 1;
  } else {
    state.page += 1;
  }

  try {
    setLoading(true);
    setStatus("AI가 실제 웹에서 관련 콘텐츠를 검색하고 있습니다...", "success");
    await requestRecommendations({ keyword: state.currentKeyword, mode: "search", append });
  } catch (error) {
    console.error(error);
    const items = buildFallbackItems(state.currentKeyword, "search");
    state.currentResults = append ? [...state.currentResults, ...items] : items;
    renderCards(els.resultGrid, state.currentResults, "search");
    els.loadMoreBtn.classList.remove("hidden");
    setStatus("AI 연결이 실패해서 브라우저 기본 추천으로 표시했어요. Vercel 환경변수 OPENAI_API_KEY와 재배포를 확인하세요.", "warning");
  } finally {
    setLoading(false);
  }
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value).replaceAll("`", "&#096;");
}

els.searchBtn.addEventListener("click", () => searchKeyword({ append: false }));
els.loadMoreBtn.addEventListener("click", () => searchKeyword({ append: true }));
els.refreshPersonalBtn.addEventListener("click", () => loadPersonalRecommendations());

els.keywordInput.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    searchKeyword({ append: false });
  }
});

document.querySelectorAll(".quick-keywords button").forEach((button) => {
  button.addEventListener("click", () => {
    els.keywordInput.value = button.dataset.keyword;
    searchKeyword({ append: false });
  });
});

updateDashboard();
