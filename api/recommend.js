export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 지원합니다." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!apiKey) {
    return res.status(200).json({
      items: [],
      fallback: true,
      message: "OPENAI_API_KEY가 설정되지 않았습니다."
    });
  }

  const {
    mode = "search",
    keyword = "",
    positiveKeywords = [],
    negativeKeywords = [],
    seenUrls = [],
    page = 1
  } = req.body || {};

  const prompt = buildPrompt({ mode, keyword, positiveKeywords, negativeKeywords, seenUrls, page });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        tools: [{ type: "web_search_preview" }],
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "content_recommendations",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                items: {
                  type: "array",
                  minItems: 4,
                  maxItems: 8,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      title: { type: "string" },
                      summary: { type: "string" },
                      reason: { type: "string" },
                      type: { type: "string", enum: ["article", "video", "image", "guide", "post"] },
                      source: { type: "string" },
                      url: { type: "string" },
                      imageUrl: { type: "string" },
                      tags: {
                        type: "array",
                        minItems: 2,
                        maxItems: 6,
                        items: { type: "string" }
                      },
                      score: { type: "number" }
                    },
                    required: ["title", "summary", "reason", "type", "source", "url", "imageUrl", "tags", "score"]
                  }
                }
              },
              required: ["items"]
            }
          }
        }
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      return res.status(200).json({ items: [], fallback: true, message: detail });
    }

    const data = await response.json();
    const outputText = data.output_text || extractOutputText(data);
    const parsed = JSON.parse(outputText || "{\"items\":[]}");
    return res.status(200).json({ items: Array.isArray(parsed.items) ? parsed.items : [] });
  } catch (error) {
    return res.status(200).json({
      items: [],
      fallback: true,
      message: error.message || "AI 추천 요청 실패"
    });
  }
}

function buildPrompt({ mode, keyword, positiveKeywords, negativeKeywords, seenUrls, page }) {
  const safeKeyword = String(keyword || "").trim() || "추천 콘텐츠";
  const positive = positiveKeywords.length ? positiveKeywords.join(", ") : "없음";
  const negative = negativeKeywords.length ? negativeKeywords.join(", ") : "없음";
  const seen = seenUrls.length ? seenUrls.slice(0, 20).join("\n") : "없음";

  if (mode === "personal") {
    return `
너는 한국어 콘텐츠 추천 전문가다.
사용자의 긍정 활동 키워드를 융합하여 실제 웹에서 찾을 만한 새로운 콘텐츠를 추천해라.

사용자 긍정 키워드: ${positive}
사용자가 관심없음으로 표시한 키워드: ${negative}
이미 본 URL 또는 제외할 URL:
${seen}

조건:
- 이미 본 URL과 같은 콘텐츠를 다시 추천하지 마라.
- 긍정 키워드를 단순 나열하지 말고 융합 주제로 추천해라.
- 예: "AI + 데이터 분석 + 진로"라면 "고등학생을 위한 AI 데이터 분석 진로 프로젝트"처럼 결합한다.
- 기사, 영상, 이미지 자료가 섞이도록 추천한다.
- 한국어 사용자가 이해하기 쉽게 작성한다.
- imageUrl은 실제 썸네일을 알 수 없으면 빈 문자열 ""로 둔다.
- 반드시 JSON 스키마에 맞게만 답해라.
`;
  }

  return `
너는 한국어 콘텐츠 검색 추천 전문가다.
사용자가 입력한 키워드를 바탕으로 실제 웹에서 찾을 수 있는 관련 콘텐츠를 추천해라.

검색 키워드: ${safeKeyword}
요청 페이지: ${page}
사용자 긍정 키워드: ${positive}
사용자가 관심없음으로 표시한 키워드: ${negative}
이미 본 URL 또는 제외할 URL:
${seen}

조건:
- 실제 기사, 영상, 이미지 자료처럼 접근 가능한 콘텐츠를 우선 추천한다.
- title, summary, source, url, tags, reason을 구체적으로 작성한다.
- 관심없음 키워드와 강하게 관련된 콘텐츠는 피한다.
- 같은 주제만 반복하지 말고 다양한 관점으로 추천한다.
- imageUrl은 실제 썸네일을 알 수 없으면 빈 문자열 ""로 둔다.
- 반드시 JSON 스키마에 맞게만 답해라.
`;
}

function extractOutputText(data) {
  try {
    const message = data.output?.find((item) => item.type === "message");
    const content = message?.content?.find((item) => item.type === "output_text");
    return content?.text || "";
  } catch {
    return "";
  }
}
