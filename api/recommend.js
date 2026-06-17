const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

function fallbackItems(keyword, mode = "search") {
  const base = keyword || "AI 콘텐츠";
  const topics = mode === "personal"
    ? [
        `${base}를 융합한 최신 콘텐츠 추천`,
        `${base} 관심사를 바탕으로 한 프로젝트 사례`,
        `${base}와 연결되는 진로·학습 자료`,
        `${base} 기반 심화 탐구 주제`,
        `${base} 관련 영상·기사 큐레이션`,
      ]
    : [
        `${base} 핵심 개념 정리`,
        `${base} 관련 최신 기사`,
        `${base} 입문자를 위한 영상`,
        `${base} 실제 사례와 이미지 자료`,
        `${base} 더 알아보기`,
      ];

  return topics.map((title, index) => ({
    title,
    description: `“${base}” 키워드와 관련된 콘텐츠입니다. AI 연결이 실패했을 때 표시되는 기본 추천 결과입니다.`,
    reason: mode === "personal"
      ? "사용자가 긍정 표시한 키워드들을 종합해 새로운 주제로 추천했습니다."
      : "입력한 키워드와 관련성이 높아 추천했습니다.",
    url: `https://www.google.com/search?q=${encodeURIComponent(title)}`,
    source: "Google Search",
    type: index % 2 === 0 ? "article" : "video",
    category: base,
    tags: [base, "AI추천", "콘텐츠"],
    score: 92 - index * 3,
    imageUrl: "",
  }));
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw error;
  }
}

function extractOutputText(data) {
  if (data.output_text) return data.output_text;

  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) parts.push(content.text);
      if (content.type === "text" && content.text) parts.push(content.text);
    }
  }
  return parts.join("\n");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 지원합니다." });
  }

  const {
    keyword = "",
    mode = "search",
    page = 1,
    positiveKeywords = [],
    negativeKeywords = [],
    seenUrls = [],
  } = req.body || {};

  if (!keyword || !String(keyword).trim()) {
    return res.status(400).json({ error: "keyword가 필요합니다." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ fallback: true, items: fallbackItems(keyword, mode) });
  }

  const systemPrompt = `너는 한국어 콘텐츠 추천 큐레이터다.
사용자 키워드를 바탕으로 실제 웹에서 확인 가능한 기사, 영상, 이미지 자료, 블로그, 공식 문서 등을 추천한다.
반드시 JSON만 반환한다. 마크다운, 설명 문장, 코드블록은 금지한다.
각 콘텐츠는 실제로 열 수 있는 URL이 있어야 한다.
대표 이미지나 썸네일 URL을 확인할 수 있으면 imageUrl에 넣고, 없으면 빈 문자열로 둔다.
사용자가 관심없음으로 표시한 주제와 seenUrls에 있는 URL은 되도록 제외한다.`;

  const userPrompt = mode === "personal"
    ? `사용자가 긍정 표시한 키워드들을 종합해 새로운 콘텐츠를 추천해줘.
긍정 키워드: ${positiveKeywords.join(", ") || keyword}
입력/융합 키워드: ${keyword}
관심없음 키워드: ${negativeKeywords.join(", ") || "없음"}
이미 본 URL: ${seenUrls.slice(0, 20).join(", ") || "없음"}
조건:
- 좋아요/북마크/공유한 콘텐츠를 그대로 다시 보여주지 말 것
- 키워드들을 융합해서 새로운 기사, 영상, 이미지 자료를 추천할 것
- 한국어 결과 중심
- ${page}번째 묶음처럼 이전과 다른 결과를 추천할 것
JSON 형식:
{"items":[{"title":"","description":"","reason":"","url":"","source":"","type":"article|video|image|blog|official","category":"","tags":[""],"score":90,"imageUrl":""}]}`
    : `사용자 키워드: ${keyword}
관심없음 키워드: ${negativeKeywords.join(", ") || "없음"}
이미 본 URL: ${seenUrls.slice(0, 20).join(", ") || "없음"}
조건:
- 실제 인터넷에서 검색 가능한 관련 콘텐츠를 추천할 것
- 기사, 영상, 이미지 자료가 섞이면 좋음
- 한국어 결과 중심, 필요하면 영어 자료도 포함 가능
- ${page}번째 묶음처럼 이전과 다른 결과를 추천할 것
JSON 형식:
{"items":[{"title":"","description":"","reason":"","url":"","source":"","type":"article|video|image|blog|official","category":"","tags":[""],"score":90,"imageUrl":""}]}`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        tools: [{ type: "web_search" }],
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error", response.status, errorText);
      return res.status(200).json({ fallback: true, items: fallbackItems(keyword, mode) });
    }

    const data = await response.json();
    const outputText = extractOutputText(data);
    const parsed = safeJsonParse(outputText);
    const items = Array.isArray(parsed.items) ? parsed.items : [];

    if (!items.length) {
      return res.status(200).json({ fallback: true, items: fallbackItems(keyword, mode) });
    }

    const cleaned = items.slice(0, 8).map((item, index) => ({
      title: item.title || `${keyword} 추천 콘텐츠 ${index + 1}`,
      description: item.description || "관련 콘텐츠입니다.",
      reason: item.reason || "키워드와 관련성이 높습니다.",
      url: item.url || `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
      source: item.source || "Web",
      type: item.type || "article",
      category: item.category || keyword,
      tags: Array.isArray(item.tags) ? item.tags.slice(0, 5) : [keyword],
      score: Number(item.score || 80),
      imageUrl: item.imageUrl || "",
    }));

    return res.status(200).json({ fallback: false, items: cleaned });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ fallback: true, items: fallbackItems(keyword, mode) });
  }
}
