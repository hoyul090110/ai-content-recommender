const state = {
  currentKeyword: "",
  currentResults: [],
  personalResults: [],
  activities: JSON.parse(localStorage.getItem("acr_activities_v1") || "[]"),
  page: 1
};

const fallbackImages = [
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"
];

const demoPool = [
  {
    title: "고등학생을 위한 AI 진로 탐색 가이드",
    summary: "인공지능 관련 학과, 직업, 학생 프로젝트 방향을 정리한 입문형 콘텐츠입니다.",
    type: "article",
    source: "Demo Insight",
    url: "https://www.google.com/search?q=%EA%B3%A0%EB%93%B1%ED%95%99%EC%83%9D+AI+%EC%A7%84%EB%A1%9C",
    tags: ["AI", "진로", "고등학생", "프로젝트"],
    imageUrl: fallbackImages[0]
  },
  {
    title: "데이터 분석으로 만드는 탐구 보고서 아이디어",
    summary: "공공데이터와 시각화를 활용해 과제·탐구 보고서를 구성하는 방법을 소개합니다.",
    type: "article",
    source: "Demo Lab",
    url: "https://www.google.com/search?q=%EA%B3%A0%EB%93%B1%ED%95%99%EC%83%9D+%EB%8D%B0%EC%9D%B4%ED%84%B0+%EB%B6%84%EC%84%9D+%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8",
    tags: ["데이터", "분석", "탐구", "포트폴리오"],
    imageUrl: fallbackImages[2]
  },
  {
    title: "시험기간 집중력을 높이는 디지털 루틴",
    summary: "공부 시간 관리, 휴식 주기, 집중 음악 활용법을 결합한 학습 전략 콘텐츠입니다.",
    type: "video",
    source: "Study Channel",
    url: "https://www.google.com/search?q=%EC%8B%9C%ED%97%98%EA%B8%B0%EA%B0%84+%EC%A7%91%EC%A4%91%EB%B2%95",
    tags: ["공부", "집중", "루틴", "학습"],
    imageUrl: fallbackImages[3]
  },
  {
    title: "축구 전술 분석 입문: 포메이션과 빌드업",
    summary: "경기 장면을 전술적으로 해석하는 기본 개념과 분석 포인트를 정리합니다.",
    type: "article",
    source: "Sports Analytics",
    url: "https://www.google.com/search?q=%EC%B6%95%EA%B5%AC+%EC%A0%84%EC%88%A0+%EB%B6%84%EC%84%9D",
    tags: ["축구", "전술", "분석", "스포츠"],
    imageUrl: fallbackImages[4]
  },
  {
    title: "AI와 콘텐츠 추천 알고리즘의 원리",
    summary: "키워드 분석, 사용자 활동, 유사도 계산을 활용한 추천 시스템의 기본 원리를 설명합니다.",
    type: "article",
    source: "Tech Brief",
    url: "https://www.google.com/search?q=%EC%BD%98%ED%85%90%EC%B8%A0+%EC%B6%94%EC%B2%9C+%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98",
    tags: ["추천시스템", "AI", "알고리즘", "개인화"],
    imageUrl: fallbackImages[1]
  },
  {
    title: "포트폴리오에 넣기 좋은 웹 프로젝트 주제",
    summary: "학생 프로젝트로 보여주기 좋은 웹 서비스 아이디어와 구현 방향을 정리합니다.",
    type: "article",
    source: "Project Note",
    url: "https://www.google.com/search?q=%ED%95%99%EC%83%9D+%EC%9B%B9+%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8+%EC%A3%BC%EC%A0%9C",
    tags: ["웹개발", "프로젝트", "포트폴리오", "과제"],
    imageUrl: fallbackImages[2]
  }
];

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  $("searchBtn").addEventListener("click", () => runSearch(false));
  $("moreBtn").addEventListener("click", () => runSearch(true));
  $("personalBtn").addEventListener("click", refreshPersonalRecommendations);
  $("resetBtn").addEventListener("click", resetActivities);

  document.querySelectorAll(".quick-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      $("keywordInput").value = btn.dataset.keyword;
      runSearch(false);
    });
  });

  $("keywordInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      runSearch(false);
    }
  });

  updateDashboard();
});

async function runSearch(append) {
  const keyword = $("keywordInput").value.trim();
  if (!keyword) {
    setStatus("키워드를 먼저 입력해 주세요.", "error");
    return;
  }

  state.currentKeyword = keyword;
  state.page = append ? state.page + 1 : 1;
  setStatus("AI가 키워드와 관련 콘텐츠를 분석하고 있습니다...", "loading");

  try {
    const payload = {
      mode: "search",
      keyword,
      page: state.page,
      positiveKeywords: getPositiveKeywords(),
      negativeKeywords: getNegativeKeywords(),
      seenUrls: getSeenUrls()
    };
    const items = await requestRecommendations(payload);
    const normalized = normalizeItems(items, keyword);
    state.currentResults = append ? [...state.currentResults, ...normalized] : normalized;
    renderGrid("resultsGrid", state.currentResults, "search");
    $("moreBtn").disabled = false;
    setStatus("추천 결과를 불러왔습니다.", "ok");
  } catch (error) {
    console.warn(error);
    const fallback = buildFallback(keyword, state.page);
    state.currentResults = append ? [...state.currentResults, ...fallback] : fallback;
    renderGrid("resultsGrid", state.currentResults, "search");
    $("moreBtn").disabled = false;
    setStatus("AI 연결에 실패해 기본 추천 모드로 표시했습니다.", "error");
  }
}

async function refreshPersonalRecommendations() {
  const positiveKeywords = getPositiveKeywords();

  if (positiveKeywords.length === 0) {
    setStatus("개인화 추천을 만들려면 좋아요, 북마크, 공유 활동이 필요합니다.", "error");
    return;
  }

  setStatus("사용자 활동을 종합해 새로운 콘텐츠를 추천하고 있습니다...", "loading");

  try {
    const payload = {
      mode: "personal",
      keyword: positiveKeywords.slice(0, 8).join(", "),
      positiveKeywords,
      negativeKeywords: getNegativeKeywords(),
      seenUrls: getSeenUrls()
    };
    const items = await requestRecommendations(payload);
    state.personalResults = normalizeItems(items, "개인화 추천");
    renderGrid("personalGrid", state.personalResults, "personal");
    setStatus("활동 기반 추천을 업데이트했습니다.", "ok");
  } catch (error) {
    console.warn(error);
    state.personalResults = buildPersonalFallback();
    renderGrid("personalGrid", state.personalResults, "personal");
    setStatus("AI 개인화 추천 연결에 실패해 기본 개인화 추천을 표시했습니다.", "error");
  }
}

async function requestRecommendations(payload) {
  const response = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data.items)) {
    throw new Error("Invalid response format");
  }
  return data.items;
}

function normalizeItems(items, keyword) {
  return items.map((item, index) => {
    const tags = Array.isArray(item.tags) ? item.tags : splitKeywords(keyword);
    return {
      id: item.id || `${Date.now()}-${Math.random()}-${index}`,
      title: item.title || `${keyword} 관련 콘텐츠`,
      summary: item.summary || item.description || "키워드와 관련된 콘텐츠입니다.",
      reason: item.reason || `"${keyword}" 키워드와 관련성이 높아 추천했습니다.`,
      type: item.type || "article",
      source: item.source || "AI Search",
      url: item.url || `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
      imageUrl: item.imageUrl || fallbackImages[index % fallbackImages.length],
      tags,
      score: Number(item.score || Math.max(70, 96 - index * 4))
    };
  });
}

function renderGrid(containerId, items, zone) {
  const container = $(containerId);
  container.classList.remove("empty-state");
  container.innerHTML = "";

  if (!items.length) {
    container.classList.add("empty-state");
    container.innerHTML = `<div class="empty-card"><strong>추천 결과가 없습니다.</strong><p>다른 키워드를 입력해보세요.</p></div>`;
    return;
  }

  const template = $("cardTemplate");

  items.forEach((item) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const img = card.querySelector(".thumb");
    img.src = item.imageUrl || fallbackImages[0];
    img.alt = `${item.title} 이미지`;
    img.onerror = () => {
      img.classList.add("is-fallback");
      img.removeAttribute("src");
    };

    card.querySelector(".type-badge").textContent = typeLabel(item.type);
    card.querySelector(".source").textContent = item.source;
    card.querySelector(".score").textContent = `${Math.round(item.score)}점`;
    card.querySelector("h3").textContent = item.title;
    card.querySelector(".summary").textContent = item.summary;
    card.querySelector(".reason").textContent = item.reason;

    const tags = card.querySelector(".tags");
    item.tags.slice(0, 5).forEach((tag) => {
      const span = document.createElement("span");
      span.textContent = `#${tag}`;
      tags.appendChild(span);
    });

    const link = card.querySelector(".open-link");
    link.href = item.url;
    link.textContent = item.url && item.url.includes("google.com/search") ? "검색 결과 열기" : "자료 열기";

    bindAction(card.querySelector(".like-btn"), item, "like", zone);
    bindAction(card.querySelector(".bookmark-btn"), item, "bookmark", zone);
    bindAction(card.querySelector(".share-btn"), item, "share", zone);
    bindAction(card.querySelector(".hide-btn"), item, "dislike", zone);

    container.appendChild(card);
  });
}

function bindAction(button, item, type, zone) {
  const exists = state.activities.some((activity) => activity.itemId === item.id && activity.type === type);
  if (exists) button.classList.add("active");

  button.addEventListener("click", () => {
    const idx = state.activities.findIndex((activity) => activity.itemId === item.id && activity.type === type);

    if (idx >= 0) {
      state.activities.splice(idx, 1);
      button.classList.remove("active");
    } else {
      state.activities.push({
        type,
        zone,
        itemId: item.id,
        title: item.title,
        url: item.url,
        tags: item.tags,
        source: item.source,
        keyword: state.currentKeyword,
        createdAt: new Date().toISOString()
      });
      button.classList.add("active");
    }

    saveActivities();
    updateDashboard();

    if (type !== "dislike" && getPositiveKeywords().length > 0) {
      $("personalBtn").disabled = false;
      refreshPersonalRecommendations();
    }
  });
}

function saveActivities() {
  localStorage.setItem("acr_activities_v1", JSON.stringify(state.activities));
}

function resetActivities() {
  if (!confirm("저장된 활동 기록을 모두 초기화할까요?")) return;
  state.activities = [];
  state.personalResults = [];
  saveActivities();
  updateDashboard();
  renderGrid("personalGrid", [], "personal");
  $("personalBtn").disabled = true;
  setStatus("활동 기록을 초기화했습니다.", "ok");
}

function updateDashboard() {
  const positive = state.activities.filter((a) => ["like", "bookmark", "share"].includes(a.type));
  const negative = state.activities.filter((a) => a.type === "dislike");
  $("positiveCount").textContent = positive.length;
  $("negativeCount").textContent = negative.length;

  const keywords = getPositiveKeywords().slice(0, 12);
  const cloud = $("interestKeywords");
  cloud.innerHTML = "";

  if (!keywords.length) {
    cloud.classList.add("empty");
    cloud.textContent = "아직 활동 기록이 없습니다.";
  } else {
    cloud.classList.remove("empty");
    keywords.forEach((keyword) => {
      const span = document.createElement("span");
      span.className = "keyword-chip";
      span.textContent = keyword;
      cloud.appendChild(span);
    });
  }

  $("personalBtn").disabled = keywords.length === 0;
}

function getPositiveKeywords() {
  const weighted = new Map();
  state.activities
    .filter((a) => ["like", "bookmark", "share"].includes(a.type))
    .forEach((activity) => {
      const weight = activity.type === "like" ? 2 : activity.type === "bookmark" ? 3 : 2;
      [...(activity.tags || []), ...(splitKeywords(activity.keyword || ""))].forEach((keyword) => {
        const clean = keyword.trim();
        if (!clean) return;
        weighted.set(clean, (weighted.get(clean) || 0) + weight);
      });
    });

  const negative = new Set(getNegativeKeywords());
  return [...weighted.entries()]
    .filter(([keyword]) => !negative.has(keyword))
    .sort((a, b) => b[1] - a[1])
    .map(([keyword]) => keyword);
}

function getNegativeKeywords() {
  const set = new Set();
  state.activities
    .filter((a) => a.type === "dislike")
    .forEach((activity) => {
      [...(activity.tags || []), ...(splitKeywords(activity.keyword || ""))].forEach((keyword) => {
        const clean = keyword.trim();
        if (clean) set.add(clean);
      });
    });
  return [...set];
}

function getSeenUrls() {
  return state.activities.map((a) => a.url).filter(Boolean);
}

function splitKeywords(text) {
  return String(text)
    .split(/[\s,/#]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2)
    .slice(0, 10);
}

function buildFallback(keyword, page = 1) {
  const words = splitKeywords(keyword);
  const candidates = demoPool.map((item, index) => {
    const matched = item.tags.filter((tag) => words.some((word) => tag.includes(word) || word.includes(tag))).length;
    return {
      ...item,
      id: `fallback-${page}-${index}-${keyword}`,
      score: 78 + matched * 8 - index,
      reason: matched
        ? `"${keyword}"의 핵심 키워드와 태그가 겹쳐 추천했습니다.`
        : `"${keyword}"와 함께 탐색하기 좋은 참고 콘텐츠입니다.`
    };
  });

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((item, index) => ({
      ...item,
      title: page > 1 ? `${item.title} (${page}차 추천)` : item.title,
      id: `${item.id}-${index}`
    }));
}

function buildPersonalFallback() {
  const positive = getPositiveKeywords();
  const negative = new Set(getNegativeKeywords());

  return demoPool
    .filter((item) => !item.tags.some((tag) => negative.has(tag)))
    .map((item, index) => {
      const score = item.tags.reduce((acc, tag) => acc + (positive.includes(tag) ? 12 : 0), 72) - index;
      return {
        ...item,
        id: `personal-${Date.now()}-${index}`,
        score,
        title: `${positive.slice(0, 2).join(" + ") || "관심사"} 연계 추천: ${item.title}`,
        reason: `좋아요·북마크·공유한 키워드(${positive.slice(0, 4).join(", ")})를 종합해 새롭게 추천했습니다.`
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function typeLabel(type) {
  const map = {
    article: "기사",
    video: "영상",
    image: "이미지",
    guide: "자료",
    post: "글"
  };
  return map[type] || "콘텐츠";
}

function setStatus(message, mode = "ok") {
  const panel = $("statusPanel");
  panel.classList.remove("loading", "error");
  if (mode === "loading") panel.classList.add("loading");
  if (mode === "error") panel.classList.add("error");
  $("statusText").textContent = message;
