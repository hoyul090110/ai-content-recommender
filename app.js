const STORAGE_KEY = "ai-content-recommender-activity-v1";

const $ = (id) => document.getElementById(id);

const state = {
  currentKeyword: "",
  currentResults: [],
  personalResults: [],
  page: 1,
  activities: loadActivities()
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  updateDashboard();
  setStatus("키워드를 입력하면 추천 결과가 표시됩니다.", "ok");
});

function bindEvents() {
  const searchBtn = $("searchBtn");
  const moreBtn = $("moreBtn");
  const personalBtn = $("personalBtn");
  const resetBtn = $("resetBtn");
  const keywordInput = $("keywordInput");

  if (searchBtn) {
    searchBtn.addEventListener("click", () => runSearch(false));
  }

  if (moreBtn) {
    moreBtn.addEventListener("click", () => runSearch(true));
  }

  if (personalBtn) {
    personalBtn.addEventListener("click", () => runPersonalRecommendation());
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", resetActivities);
  }

  if (keywordInput) {
    keywordInput.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        runSearch(false);
      }
    });
  }

  document.querySelectorAll(".quick-chip").forEach((button) => {
    button.addEventListener("click", () => {
      const keyword = button.dataset.keyword || button.textContent.trim();
      $("keywordInput").value = keyword;
      runSearch(false);
    });
  });
}

async function runSearch(loadMore = false) {
  const input = $("keywordInput");
  const keyword = input.value.trim();

  if (!keyword) {
    setStatus("추천받고 싶은 키워드를 먼저 입력해 주세요.", "error");
    input.focus();
    return;
  }

  if (!loadMore) {
    state.page = 1;
    state.currentResults = [];
    state.currentKeyword = keyword;
    $("resultsGrid").innerHTML = "";
  } else {
    state.page += 1;
  }

  setLoading(true);
  setStatus("AI가 키워드와 관련된 콘텐츠를 분석하는 중입니다.", "loading");

  try {
    const data = await requestRecommendations({
      mode: "keyword",
      keyword,
      page: state.page,
      positiveKeywords: getPositiveKeywords(),
      negativeKeywords: getNegativeKeywords(),
      excludeUrls: getSeenUrls()
    });

    const items = normalizeItems(data.items || data.recommendations || [], keyword);

    if (!items.length) {
      throw new Error("추천 결과가 비어 있습니다.");
    }

    if (loadMore) {
      state.currentResults = [...state.currentResults, ...items];
    } else {
      state.currentResults = items;
    }

    renderCards("resultsGrid", state.currentResults, "keyword");
    $("moreBtn").disabled = false;

    setStatus(`"${keyword}" 키워드 기반 콘텐츠를 추천했습니다.`, "success");
  } catch (error) {
    console.warn(error);

    const fallbackItems = createFallbackItems(keyword, state.page);

    if (loadMore) {
      state.currentResults = [...state.currentResults, ...fallbackItems];
    } else {
      state.currentResults = fallbackItems;
    }

    renderCards("resultsGrid", state.currentResults, "keyword");
    $("moreBtn").disabled = false;

    setStatus("AI 연결이 불안정하여 기본 추천 모드로 콘텐츠를 표시했습니다.", "error");
  } finally {
    setLoading(false);
  }
}

async function runPersonalRecommendation() {
  const positiveKeywords = getPositiveKeywords();
  const negativeKeywords = getNegativeKeywords();

  if (!positiveKeywords.length) {
    setStatus("좋아요, 북마크, 공유 활동이 쌓이면 개인화 추천을 만들 수 있습니다.", "error");
    return;
  }

  setLoading(true);
  setStatus("사용자 활동을 분석해 개인화 콘텐츠를 추천하는 중입니다.", "loading");

  try {
    const data = await requestRecommendations({
      mode: "personal",
      keyword: positiveKeywords.join(", "),
      page: 1,
      positiveKeywords,
      negativeKeywords,
      excludeUrls: getSeenUrls()
    });

    const items = normalizeItems(data.items || data.recommendations || [], positiveKeywords.join(", "));

    if (!items.length) {
      throw new Error("개인화 추천 결과가 비어 있습니다.");
    }

    state.personalResults = items;
    renderCards("personalGrid", state.personalResults, "personal");
    setStatus("사용자 활동을 바탕으로 새로운 콘텐츠를 추천했습니다.", "success");
  } catch (error) {
    console.warn(error);

    state.personalResults = createPersonalFallbackItems(positiveKeywords, negativeKeywords);
    renderCards("personalGrid", state.personalResults, "personal");

    setStatus("AI 연결이 불안정하여 활동 기반 기본 추천을 표시했습니다.", "error");
  } finally {
    setLoading(false);
  }
}

async function requestRecommendations(payload) {
  const response = await fetch("/api/recommend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`);
  }

  return response.json();
}

function normalizeItems(items, keyword) {
  return items.map((item, index) => {
    const title = item.title || item.name || `${keyword} 추천 콘텐츠 ${index + 1}`;
    const summary =
      item.summary ||
      item.description ||
      item.snippet ||
      `${keyword}와 관련된 핵심 정보를 정리한 콘텐츠입니다.`;

    const tags = Array.isArray(item.tags)
      ? item.tags
      : extractKeywords(`${title} ${summary} ${keyword}`).slice(0, 5);

    return {
      id: item.id || createId(title + index),
      title,
      summary,
      reason:
        item.reason ||
        item.recommendationReason ||
        `"${keyword}" 키워드와 관련성이 높아 추천되었습니다.`,
      url: item.url || item.link || "#",
      imageUrl: item.imageUrl || item.thumbnail || item.image || "",
      source: item.source || item.site || "AI 추천",
      type: item.type || item.contentType || guessType(title, summary),
      score: Number(item.score || item.relevanceScore || 80 + Math.floor(Math.random() * 15)),
      tags,
      keyword
    };
  });
}

function renderCards(containerId, items, sectionType) {
  const container = $(containerId);
  const template = $("cardTemplate");

  if (!container || !template) return;

  container.classList.remove("empty-state");
  container.innerHTML = "";

  if (!items.length) {
    container.classList.add("empty-state");
    container.innerHTML = `
      <div class="empty-card">
        <strong>추천 결과가 없습니다.</strong>
        <p>다른 키워드를 입력해보세요.</p>
      </div>
    `;
    return;
  }

  items.forEach((item) => {
    const card = template.content.cloneNode(true);
    const article = card.querySelector(".content-card");

    const thumb = card.querySelector(".thumb");
    const typeBadge = card.querySelector(".type-badge");
    const source = card.querySelector(".source");
    const score = card.querySelector(".score");
    const title = card.querySelector("h3");
    const summary = card.querySelector(".summary");
    const reason = card.querySelector(".reason");
    const tags = card.querySelector(".tags");
    const openLink = card.querySelector(".open-link");

    const likeBtn = card.querySelector(".like-btn");
    const bookmarkBtn = card.querySelector(".bookmark-btn");
    const shareBtn = card.querySelector(".share-btn");
    const hideBtn = card.querySelector(".hide-btn");

    article.dataset.id = item.id;

    if (item.imageUrl) {
      thumb.src = item.imageUrl;
      thumb.alt = item.title;
      thumb.onerror = () => {
        thumb.removeAttribute("src");
        thumb.style.display = "none";
      };
    } else {
      thumb.style.display = "none";
    }

    typeBadge.textContent = item.type || "콘텐츠";
    source.textContent = item.source || "추천 콘텐츠";
    score.textContent = `${Math.round(item.score || 80)}점`;
    title.textContent = item.title;
    summary.textContent = item.summary;
    reason.textContent = item.reason;

    tags.innerHTML = "";
    item.tags.slice(0, 6).forEach((tag) => {
      const span = document.createElement("span");
      span.textContent = tag;
      tags.appendChild(span);
    });

    if (item.url && item.url !== "#") {
      openLink.href = item.url;
      openLink.style.display = "block";
    } else {
      openLink.href = "#";
      openLink.style.display = "none";
    }

    setButtonActiveStates(item, {
      likeBtn,
      bookmarkBtn,
      shareBtn,
      hideBtn
    });

    likeBtn.addEventListener("click", () => handleActivity("like", item, likeBtn));
    bookmarkBtn.addEventListener("click", () => handleActivity("bookmark", item, bookmarkBtn));
    shareBtn.addEventListener("click", () => handleActivity("share", item, shareBtn));
    hideBtn.addEventListener("click", () => handleActivity("hide", item, hideBtn));

    container.appendChild(card);
  });

  if (sectionType === "personal") {
    $("personalBtn").disabled = false;
  }
}

function handleActivity(type, item, button) {
  const existingIndex = state.activities.findIndex(
    (activity) => activity.itemId === item.id && activity.type === type
  );

  if (existingIndex >= 0) {
    state.activities.splice(existingIndex, 1);
    button.classList.remove("active");
  } else {
    if (type === "hide") {
      state.activities = state.activities.filter(
        (activity) => !(activity.itemId === item.id && ["like", "bookmark", "share"].includes(activity.type))
      );
    }

    if (["like", "bookmark", "share"].includes(type)) {
      state.activities = state.activities.filter(
        (activity) => !(activity.itemId === item.id && activity.type === "hide")
      );
    }

    state.activities.push({
      type,
      itemId: item.id,
      title: item.title,
      summary: item.summary,
      keyword: item.keyword || state.currentKeyword,
      tags: item.tags || [],
      category: item.type || "콘텐츠",
      url: item.url || "",
      createdAt: new Date().toISOString()
    });

    button.classList.add("active");
  }

  saveActivities();
  updateDashboard();

  if (getPositiveKeywords().length > 0) {
    $("personalBtn").disabled = false;
    runPersonalRecommendation();
  }
}

function setButtonActiveStates(item, buttons) {
  const activityTypes = state.activities
    .filter((activity) => activity.itemId === item.id)
    .map((activity) => activity.type);

  if (activityTypes.includes("like")) buttons.likeBtn.classList.add("active");
  if (activityTypes.includes("bookmark")) buttons.bookmarkBtn.classList.add("active");
  if (activityTypes.includes("share")) buttons.shareBtn.classList.add("active");
  if (activityTypes.includes("hide")) buttons.hideBtn.classList.add("active");
}

function updateDashboard() {
  const positiveActivities = state.activities.filter((activity) =>
    ["like", "bookmark", "share"].includes(activity.type)
  );

  const negativeActivities = state.activities.filter((activity) => activity.type === "hide");

  $("positiveCount").textContent = positiveActivities.length;
  $("negativeCount").textContent = negativeActivities.length;

  const keywordCloud = $("interestKeywords");
  const keywords = getPositiveKeywords().slice(0, 12);

  keywordCloud.innerHTML = "";

  if (!keywords.length) {
    keywordCloud.classList.add("empty");
    keywordCloud.textContent = "아직 활동 기록이 없습니다.";
  } else {
    keywordCloud.classList.remove("empty");
    keywords.forEach((keyword) => {
      const span = document.createElement("span");
      span.textContent = keyword;
      keywordCloud.appendChild(span);
    });
  }

  $("personalBtn").disabled = positiveActivities.length === 0;
}

function getPositiveKeywords() {
  const positiveActivities = state.activities.filter((activity) =>
    ["like", "bookmark", "share"].includes(activity.type)
  );

  return rankKeywords(positiveActivities);
}

function getNegativeKeywords() {
  const negativeActivities = state.activities.filter((activity) => activity.type === "hide");
  return rankKeywords(negativeActivities);
}

function rankKeywords(activities) {
  const scores = new Map();

  activities.forEach((activity) => {
    const weight = activity.type === "share" ? 3 : activity.type === "bookmark" ? 2 : 1;

    const text = [
      activity.keyword,
      activity.title,
      activity.summary,
      activity.category,
      ...(activity.tags || [])
    ].join(" ");

    extractKeywords(text).forEach((keyword) => {
      scores.set(keyword, (scores.get(keyword) || 0) + weight);
    });
  });

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([keyword]) => keyword);
}

function extractKeywords(text) {
  const stopwords = new Set([
    "그리고",
    "하지만",
    "대한",
    "관련",
    "콘텐츠",
    "추천",
    "정보",
    "자료",
    "있는",
    "하는",
    "위한",
    "기반",
    "분석",
    "소개",
    "정리",
    "방법",
    "the",
    "and",
    "for",
    "with",
    "from",
    "this",
    "that"
  ]);

  return String(text || "")
    .replace(/[^\w가-힣\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2)
    .filter((word) => !stopwords.has(word))
    .slice(0, 40);
}

function getSeenUrls() {
  const urls = new Set();

  [...state.currentResults, ...state.personalResults].forEach((item) => {
    if (item.url && item.url !== "#") urls.add(item.url);
  });

  state.activities.forEach((activity) => {
    if (activity.url) urls.add(activity.url);
  });

  return [...urls];
}

function createFallbackItems(keyword, page = 1) {
  const baseKeywords = extractKeywords(keyword);
  const main = baseKeywords[0] || keyword || "콘텐츠";
  const offset = (page - 1) * 6;

  const templates = [
    {
      title: `${main} 핵심 개념과 최신 흐름`,
      type: "기사",
      source: "Insight Lab",
      reason: `"${keyword}"의 기본 개념과 최근 흐름을 파악하는 데 도움이 됩니다.`
    },
    {
      title: `${main} 입문자를 위한 영상 가이드`,
      type: "영상",
      source: "Video Guide",
      reason: `처음 접하는 사용자가 이해하기 쉽게 영상형 콘텐츠로 추천했습니다.`
    },
    {
      title: `${main} 관련 사례 모음`,
      type: "자료",
      source: "Case Archive",
      reason: `실제 사례를 통해 키워드의 활용 방향을 이해할 수 있습니다.`
    },
    {
      title: `${main} 심화 탐구 주제`,
      type: "기사",
      source: "Research Note",
      reason: `관심 키워드를 더 깊게 탐구할 수 있는 주제로 연결됩니다.`
    },
    {
      title: `${main} 프로젝트 아이디어`,
      type: "자료",
      source: "Project Hub",
      reason: `키워드를 실제 프로젝트나 발표 주제로 확장할 수 있습니다.`
    },
    {
      title: `${main} 관련 이미지 자료`,
      type: "이미지",
      source: "Visual Board",
      reason: `키워드 이해를 돕는 시각 자료 중심 콘텐츠입니다.`
    }
  ];

  return templates.map((item, index) => ({
    id: createId(`${keyword}-${page}-${index}`),
    title: item.title,
    summary: `${keyword}와 관련된 내용을 사용자의 관심사에 맞춰 정리한 추천 콘텐츠입니다.`,
    reason: item.reason,
    url: "#",
    imageUrl: "",
    source: item.source,
    type: item.type,
    score: Math.max(65, 92 - index * 3 - offset),
    tags: [...new Set([main, ...baseKeywords, item.type])].slice(0, 5),
    keyword
  }));
}

function createPersonalFallbackItems(positiveKeywords, negativeKeywords) {
  const cleanKeywords = positiveKeywords
    .filter((keyword) => !negativeKeywords.includes(keyword))
    .slice(0, 5);

  const theme = cleanKeywords.join(" + ") || "개인화 추천";

  return [
    {
      title: `${theme}를 융합한 맞춤형 콘텐츠`,
      type: "개인화",
      source: "Personal AI",
      reason: `좋아요, 북마크, 공유 활동에서 자주 나타난 키워드를 종합했습니다.`
    },
    {
      title: `${cleanKeywords[0] || "관심사"} 기반 확장 추천`,
      type: "기사",
      source: "Interest Map",
      reason: `긍정 활동이 많은 주제를 중심으로 새로운 콘텐츠를 추천했습니다.`
    },
    {
      title: `${theme} 관련 탐구 아이디어`,
      type: "자료",
      source: "Project Note",
      reason: `여러 관심 키워드를 하나의 탐구 방향으로 연결했습니다.`
    }
  ].map((item, index) => ({
    id: createId(`personal-${theme}-${index}`),
    title: item.title,
    summary: `사용자의 활동 데이터를 바탕으로 ${theme}와 관련된 새로운 콘텐츠를 추천합니다.`,
    reason: item.reason,
    url: "#",
    imageUrl: "",
    source: item.source,
    type: item.type,
    score: 90 - index * 4,
    tags: cleanKeywords.slice(0, 5),
    keyword: theme
  }));
}

function guessType(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();

  if (text.includes("영상") || text.includes("video") || text.includes("youtube")) return "영상";
  if (text.includes("이미지") || text.includes("사진") || text.includes("image")) return "이미지";
  if (text.includes("보고서") || text.includes("자료") || text.includes("pdf")) return "자료";
  return "기사";
}

function createId(text) {
  let hash = 0;
  const source = String(text);

  for (let i = 0; i < source.length; i += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }

  return `item-${Math.abs(hash)}`;
}

function loadActivities() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveActivities() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.activities));
}

function resetActivities() {
  if (!confirm("활동 기록을 모두 초기화할까요?")) return;

  state.activities = [];
  state.personalResults = [];

  saveActivities();
  updateDashboard();

  $("personalGrid").classList.add("empty-state");
  $("personalGrid").innerHTML = `
    <div class="empty-card">
      <strong>활동이 쌓이면 개인화 추천이 표시됩니다.</strong>
      <p>좋아요, 북마크, 공유를 눌러 관심사를 알려주세요.</p>
    </div>
  `;

  setStatus("활동 기록이 초기화되었습니다.", "success");
}

function setLoading(isLoading) {
  $("searchBtn").disabled = isLoading;
  $("moreBtn").disabled = isLoading || !state.currentResults.length;
  $("personalBtn").disabled = isLoading || getPositiveKeywords().length === 0;
}

function setStatus(message, mode = "ok") {
  const panel = $("statusPanel");

  panel.classList.remove("loading", "success", "error");

  if (mode === "loading") panel.classList.add("loading");
  if (mode === "success") panel.classList.add("success");
  if (mode === "error") panel.classList.add("error");

  $("statusText").textContent = message;
}
