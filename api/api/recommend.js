const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 지원합니다." });
  }

  const body = typeof req.body === "string" ? safeJsonParse(req.body) || {} : (req.body || {});
  const keyword = String(body.keyword || "").trim();
  const page = Number(body.page || 0);
  const profile = body.profile || {};

  if (!keyword) return res.status(400).json({ error: "키워드가 필요합니다." });

  if (!OPENAI_API_KEY) {
    return res.status(200).json(buildFallback(keyword, page, profile));
  }

  const prompt = `
너는 한국어 콘텐츠 추천 AI야.
사용자가 입력한 키워드와 사용자 활동을 바탕으로 콘텐츠 추천 카드 12개를 만들어라.
실제 존재 여부가 확실하지 않은 URL은 만들지 말고, 콘텐츠 제목/유형/설명/추천이유/태그만 만들어라.
관심없음 키워드와 관련된 주제는 줄이거나 제외해라.

입력 키워드: ${keyword}
페이지 번호: ${page}
좋아하는 관심사: ${(profile.positiveKeywords || []).join(", ") || "없음"}
관심없음 관심사: ${(profile.negativeKeywords || []).join(", ") || "없음"}
좋아요한 제목: ${(profile.likedTitles || []).join(" / ") || "없음"}
북마크한 제목: ${(profile.bookmarkedTitles || []).join(" / ") || "없음"}
공유한 제목: ${(profile.sharedTitles || []).join(" / ") || "없음"}

반드시 아래 JSON 형식만 출력해라. 마크다운 금지.
{
  "message": "짧은 한국어 안내 문장",
  "items": [
    {
      "title": "콘텐츠 제목",
      "type": "영상|블로그|강의|뉴스|팟캐스트|튜토리얼|가이드 중 하나",
      "category": "카테고리",
      "description": "2문장 이내 설명",
      "reason": "추천 이유",
      "tags": ["태그1", "태그2", "태그3"],
      "score": 0부터 100 사이 숫자
    }
  ]
}
`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: prompt,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI API error", text);
      return res.status(200).json(buildFallback(keyword, page, profile));
    }

    const data = await response.json();
    const text = extractText(data);
    const parsed = safeJsonParse(text) || buildFallback(keyword, page, profile);
    parsed.items = normalizeItems(parsed.items || [], keyword);
    return res.status(200).json(parsed);
  } catch (error) {
    console.error(error);
    return res.status(200).json(buildFallback(keyword, page, profile));
  }
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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
    try { return JSON.parse(match[0]); } catch { return null; }
  }
}

function normalizeItems(items, keyword) {
  return items.slice(0, 12).map((item, index) => ({
    title: String(item.title || `${keyword} 추천 콘텐츠 ${index + 1}`),
    type: String(item.type || "콘텐츠"),
    category: String(item.category || keyword),
    description: String(item.description || `${keyword}와 관련된 콘텐츠입니다.`),
    reason: String(item.reason || "입력한 키워드와 관련성이 높습니다."),
    tags: Array.isArray(item.tags) ? item.tags.map(String).slice(0, 6) : [keyword],
    score: Math.max(0, Math.min(100, Number(item.score || 80)))
  }));
}

function buildFallback(keyword, page, profile) {
  const expanded = expand(keyword);
  const negative = new Set(profile.negativeKeywords || []);
  const topics = expanded.filter((topic) => !negative.has(topic));
  const types = ["영상", "블로그", "강의", "뉴스", "팟캐스트", "튜토리얼", "가이드", "리뷰"];
  const items = Array.from({ length: 12 }, (_, i) => {
    const topic = topics[(i + page) % Math.max(1, topics.length)] || keyword;
    const type = types[(i + page) % types.length];
    return {
      title: `${keyword} 관련 ${topic} ${type} 추천 ${page * 12 + i + 1}`,
      type,
      category: topic,
      description: `${keyword}를 더 잘 이해할 수 있도록 ${topic} 관점에서 추천하는 ${type} 콘텐츠입니다.`,
      reason: `입력 키워드 '${keyword}'와 '${topic}'의 의미가 연결되어 추천되었습니다.`,
      tags: [keyword, topic, type],
      score: 94 - (i % 7) * 3
    };
  });
  return { message: "추천 콘텐츠를 생성했습니다.", items };
}

function expand(keyword) {
  const result = new Set(keyword.split(/\s+/).filter(Boolean));
  const dict = {
    "AI": ["인공지능", "머신러닝", "데이터", "진로", "자동화", "미래기술"],
    "진로": ["학과", "직업", "포트폴리오", "면접", "대학", "탐구"],
    "공부": ["집중", "시험", "학습법", "시간관리", "동기부여", "노트정리"],
    "영화": ["힐링", "감동", "리뷰", "스토리", "OST", "연출"],
    "코딩": ["파이썬", "자바스크립트", "웹개발", "프로젝트", "GitHub", "알고리즘"],
    "축구": ["전술", "선수", "리그", "하이라이트", "분석", "훈련"]
  };
  for (const [key, values] of Object.entries(dict)) {
    if (keyword.toLowerCase().includes(key.toLowerCase())) values.forEach((v) => result.add(v));
  }
  ["입문", "심화", "트렌드", "사례", "추천", "분석"].forEach((v) => result.add(v));
  return [...result];
}
