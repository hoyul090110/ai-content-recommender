const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST 요청만 지원합니다." });

  const body = typeof req.body === "string" ? safeJsonParse(req.body) || {} : (req.body || {});
  const keyword = String(body.keyword || "").trim();
  const page = Number(body.page || 0);
  const mode = body.mode === "personal" ? "personal" : "keyword";
  const profile = body.profile || {};

  if (!keyword && mode !== "personal") {
    return res.status(400).json({ error: "키워드가 필요합니다." });
  }

  if (!OPENAI_API_KEY) {
    return res.status(200).json(buildFallback(keyword || "맞춤 추천", page, profile, mode, "OPENAI_API_KEY가 없습니다."));
  }

  const prompt = buildPrompt(keyword, page, profile, mode);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        tools: [{ type: "web_search", search_context_size: "medium" }],
        tool_choice: "required",
        input: prompt,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI API error", text);
      return res.status(200).json(buildFallback(keyword || "맞춤 추천", page, profile, mode, text));
    }

    const data = await response.json();
    const text = extractText(data);
    const parsed = safeJsonParse(text);

    if (!parsed || !Array.isArray(parsed.items)) {
      return res.status(200).json(buildFallback(keyword || "맞춤 추천", page, profile, mode, "JSON 파싱 실패"));
    }

    const items = normalizeItems(parsed.items, keyword, profile, mode);

    return res.status(200).json({
      message: parsed.message || (mode === "personal" ? "나의 활동을 종합해 새로운 실제 콘텐츠를 추천했습니다." : "입력 키워드와 관련된 실제 콘텐츠를 검색해 추천했습니다."),
      items,
      usedAi: true,
      mode,
    });
  } catch (error) {
    console.error(error);
    return res.status(200).json(buildFallback(keyword || "맞춤 추천", page, profile, mode, String(error)));
  }
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function buildPrompt(keyword, page, profile, mode) {
  const positiveKeywords = formatWeighted(profile.positiveKeywords || []);
  const negativeKeywords = formatWeighted(profile.negativeKeywords || []);
  const positiveTitles = (profile.positiveTitles || []).join(" / ") || "없음";
  const negativeTitles = (profile.negativeTitles || []).join(" / ") || "없음";
  const positiveUrls = (profile.positiveUrls || []).join(" / ") || "없음";

  if (mode === "personal") {
    return `
너는 한국어 콘텐츠 큐레이션 AI다. 반드시 웹 검색을 사용해서 실제로 접근 가능한 콘텐츠만 추천한다.

목표:
- 사용자가 좋아요/북마크/공유한 키워드들을 종합해서 새로운 콘텐츠를 추천한다.
- 사용자가 긍정 표시한 원본 콘텐츠를 그대로 다시 보여주지 않는다.
- 사용자가 관심없음으로 표시한 키워드와 콘텐츠는 제외하거나 비중을 크게 낮춘다.
- 단순히 태그 이름으로 가짜 제목을 만들지 말고, 검색 결과에서 확인한 실제 콘텐츠 제목과 URL을 사용한다.

사용자 긍정 관심사: ${positiveKeywords || "없음"}
사용자 부정 관심사: ${negativeKeywords || "없음"}
이미 긍정 표시한 제목: ${positiveTitles}
이미 긍정 표시한 URL: ${positiveUrls}
관심없음 제목: ${negativeTitles}
참고용 현재 키워드: ${keyword || "없음"}
페이지 번호: ${page}

추천 규칙:
1. 실제 웹에 있는 콘텐츠 10개를 추천한다.
2. 뉴스, 블로그, 영상, 강의, 공식문서, 튜토리얼, 리포트 등 다양한 유형을 섞는다.
3. 이미 긍정 표시한 제목/URL과 같은 콘텐츠는 제외한다.
4. 추천 이유에는 어떤 긍정 관심사 때문에 추천했는지 설명한다.
5. URL은 검색으로 확인한 실제 URL만 넣는다. 모르면 빈 문자열로 둔다.
6. 콘텐츠에 대표 이미지, 썸네일, 영상 썸네일, 기사 이미지가 확인되면 imageUrl에 직접 접근 가능한 이미지 URL을 넣는다. 확인되지 않으면 빈 문자열로 둔다.
7. 반드시 JSON만 출력한다. 마크다운 금지.

출력 형식:
{
  "message": "짧은 한국어 안내 문장",
  "items": [
    {
      "title": "실제 콘텐츠 제목",
      "type": "영상|블로그|강의|뉴스|공식문서|튜토리얼|리포트|가이드 중 하나",
      "category": "카테고리",
      "description": "2문장 이내 설명",
      "reason": "사용자의 긍정 키워드를 종합한 추천 이유",
      "tags": ["태그1", "태그2", "태그3"],
      "score": 0부터 100 사이 숫자,
      "url": "실제 URL",
      "sourceName": "사이트 이름",
      "imageUrl": "콘텐츠 대표 이미지 또는 썸네일 URL. 없으면 빈 문자열"
    }
  ]
}`;
  }

  return `
너는 한국어 콘텐츠 검색 추천 AI다. 반드시 웹 검색을 사용해서 실제로 접근 가능한 콘텐츠만 추천한다.

목표:
- 사용자가 입력한 키워드와 직접 관련된 실제 콘텐츠를 찾아 추천한다.
- 단순히 예시 제목을 생성하지 말고, 검색 결과에서 확인한 실제 콘텐츠 제목과 URL을 사용한다.
- 사용자가 관심없음으로 표시한 주제는 제외하거나 비중을 낮춘다.

입력 키워드: ${keyword}
페이지 번호: ${page}
사용자 긍정 관심사: ${positiveKeywords || "없음"}
사용자 부정 관심사: ${negativeKeywords || "없음"}
관심없음 제목: ${negativeTitles}

추천 규칙:
1. 실제 웹에 있는 콘텐츠 10개를 추천한다.
2. 키워드와 직접 관련성이 높은 것부터 추천한다.
3. 뉴스, 블로그, 영상, 강의, 공식문서, 튜토리얼, 리포트 등 다양한 유형을 섞는다.
4. 관심없음 키워드와 관련된 콘텐츠는 제외하거나 낮은 점수를 준다.
5. URL은 검색으로 확인한 실제 URL만 넣는다. 모르면 빈 문자열로 둔다.
6. 콘텐츠에 대표 이미지, 썸네일, 영상 썸네일, 기사 이미지가 확인되면 imageUrl에 직접 접근 가능한 이미지 URL을 넣는다. 확인되지 않으면 빈 문자열로 둔다.
7. 반드시 JSON만 출력한다. 마크다운 금지.

출력 형식:
{
  "message": "짧은 한국어 안내 문장",
  "items": [
    {
      "title": "실제 콘텐츠 제목",
      "type": "영상|블로그|강의|뉴스|공식문서|튜토리얼|리포트|가이드 중 하나",
      "category": "카테고리",
      "description": "2문장 이내 설명",
      "reason": "키워드와 연결된 추천 이유",
      "tags": ["태그1", "태그2", "태그3"],
      "score": 0부터 100 사이 숫자,
      "url": "실제 URL",
      "sourceName": "사이트 이름",
      "imageUrl": "콘텐츠 대표 이미지 또는 썸네일 URL. 없으면 빈 문자열"
    }
  ]
}`;
}

function formatWeighted(values) {
  return values
    .map((value) => {
      if (typeof value === "string") return value;
      return `${value.keyword || ""}(${value.weight || 1})`;
    })
    .filter(Boolean)
    .join(", ");
}

function extractText(data) {
  if (data.output_text) return data.output_text;
  const output = data.output || [];
  for (const item of output) {
    for (const content of item.content || []) {
      if (content.text) return content.text;
    }
  }
  return "";
}

function safeJsonParse(text) {
  try {
    const cleaned = String(text)
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    const match = String(text).match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeItems(items, keyword, profile, mode) {
  const positiveTitles = new Set((profile.positiveTitles || []).map(normalizeText));
  const positiveUrls = new Set((profile.positiveUrls || []).filter(Boolean));
  const negativeWords = new Set((profile.negativeKeywords || []).map((x) => normalizeText(typeof x === "string" ? x : x.keyword)));
  const seen = new Set();

  return items
    .filter(Boolean)
    .map((item, index) => {
      const url = String(item.url || item.sourceUrl || "").trim();
      const title = String(item.title || `${keyword} 추천 콘텐츠 ${index + 1}`).trim();
      const tags = Array.isArray(item.tags) ? item.tags.map(String).slice(0, 6) : [keyword].filter(Boolean);
      const category = String(item.category || tags[0] || keyword || "추천");
      const lowered = normalizeText([title, category, ...tags].join(" "));
      let score = Math.max(0, Math.min(100, Number(item.score || 80)));

      for (const word of negativeWords) {
        if (word && lowered.includes(word)) score = Math.max(0, score - 25);
      }

      return {
        title,
        type: String(item.type || "콘텐츠"),
        category,
        description: String(item.description || `${keyword}와 관련된 실제 콘텐츠입니다.`),
        reason: String(item.reason || (mode === "personal" ? "사용자 활동과 관련성이 높습니다." : "입력 키워드와 관련성이 높습니다.")),
        tags,
        score,
        url,
        sourceUrl: url,
        sourceName: String(item.sourceName || getHostName(url) || "웹 검색"),
        imageUrl: String(item.imageUrl || item.thumbnail || item.thumbnailUrl || item.image || "").trim(),
      };
    })
    .filter((item) => {
      const key = item.url || `${item.title}|${item.category}`;
      if (seen.has(key)) return false;
      seen.add(key);
      if (mode === "personal" && positiveTitles.has(normalizeText(item.title))) return false;
      if (mode === "personal" && item.url && positiveUrls.has(item.url)) return false;
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function getHostName(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function buildFallback(keyword, page, profile, mode, errorMessage = "") {
  const positive = (profile.positiveKeywords || []).map((x) => typeof x === "string" ? x : x.keyword);
  const negative = new Set((profile.negativeKeywords || []).map((x) => typeof x === "string" ? x : x.keyword));
  const expanded = expand(`${keyword} ${positive.slice(0, 6).join(" ")}`);
  const topics = expanded.filter((topic) => !negative.has(topic));
  const types = ["영상", "블로그", "강의", "뉴스", "튜토리얼", "가이드", "리포트", "공식문서"];

  const items = Array.from({ length: 10 }, (_, i) => {
    const topic = topics[(i + page) % Math.max(1, topics.length)] || keyword || "추천";
    const type = types[(i + page) % types.length];
    const prefix = mode === "personal" ? "활동 종합" : "검색형";
    return {
      title: `${prefix} ${topic} ${type} 콘텐츠 ${page * 10 + i + 1}`,
      type,
      category: topic,
      description: `${keyword}와 사용자의 관심 신호를 바탕으로 ${topic} 관점에서 추천한 데모 콘텐츠입니다.`,
      reason: mode === "personal"
        ? `긍정 표시한 키워드들을 종합했을 때 '${topic}' 관심사가 높게 나타났습니다.`
        : `입력 키워드 '${keyword}'와 '${topic}'의 의미가 연결되어 추천했습니다.`,
      tags: [keyword, topic, type].filter(Boolean),
      score: 92 - (i % 6) * 4,
      url: "",
      sourceUrl: "",
      sourceName: "데모 추천",
      imageUrl: "",
    };
  });

  return {
    message: mode === "personal"
      ? "AI 검색 연결에 실패해 활동 기반 데모 추천을 표시했습니다."
      : "AI 검색 연결에 실패해 키워드 기반 데모 추천을 표시했습니다.",
    items,
    usedAi: false,
    mode,
    error: errorMessage,
  };
}

function expand(keyword) {
  const result = new Set(String(keyword).split(/\s+/).filter(Boolean));
  const dict = {
    AI: ["인공지능", "머신러닝", "데이터", "진로", "자동화", "미래기술"],
    인공지능: ["AI", "머신러닝", "딥러닝", "데이터", "윤리"],
    진로: ["학과", "직업", "포트폴리오", "면접", "대학", "탐구"],
    공부: ["집중", "시험", "학습법", "시간관리", "동기부여", "노트정리"],
    영화: ["힐링", "감동", "리뷰", "스토리", "OST", "연출"],
    코딩: ["파이썬", "자바스크립트", "웹개발", "프로젝트", "GitHub", "알고리즘"],
    축구: ["전술", "선수", "리그", "하이라이트", "분석", "훈련"],
  };
  for (const [key, values] of Object.entries(dict)) {
    if (String(keyword).toLowerCase().includes(key.toLowerCase())) values.forEach((v) => result.add(v));
  }
  ["입문", "심화", "트렌드", "사례", "추천", "분석"].forEach((v) => result.add(v));
  return [...result];
}
