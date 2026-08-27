const Anthropic = require("@anthropic-ai/sdk");
const OpenAI = require("openai");

const client = new Anthropic();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports.extractReceiptData = async (fileData) => {
  // fileData = { base64: "...", ext: "jpg" }
  if(!fileData?.base || !fileData?.ext) return {};

  // 확장자로 미디어 타입 결정
  const ext = fileData.ext.toLowerCase().replace('.', '');
  const mediaType =
    ext === "png"
      ? "image/png"
      : ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : "image/webp";

  const response = await client.messages.create({
    model: "claude-opus-4-5-20251101",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: fileData.base,
            },
          },
          {
            type: "text",
            text: `이 문서는 한국어 거래명세서입니다. 다음 정보를 정확히 추출해주세요.
- 상호명 (공급자, 상호, 법인명)
- 거래일자 (작성일) 예) 2026-01-27
- 품목들 (품명, 수량, 단가) 배열 형태로 추출해주세요.
수량은 단위를 빼고 정수형 숫자로 추출해주세요. 예) 100g -> 100
단가는 정수형 숫자로 추출해주세요. 
각 키값은 "상호명", "거래일자", "품목들" 입니다.
글자가 불명확하면 [불명확] 이나 0 이나 오늘날짜(예) 2026-01-27 로 표시하세요.
순수 JSON만 출력하세요. 마크다운 코드블록(\`\`\`)이나 다른 설명 없이 JSON만 출력하세요.`,
          },
        ],
      },
    ],
  });

  // JSON 파싱
  let jsonText = response.content[0].text;
  console.log('jsonText1', response.content);
  jsonText = jsonText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  console.log('jsonText2', jsonText);
  return JSON.parse(jsonText);
};


module.exports.extractReceiptDataOpenAI = async (fileData) => {
  // fileData = { base: "...", ext: "jpg" }
  if (!fileData?.base || !fileData?.ext) return {};

  // 확장자로 미디어 타입 결정
  const ext = fileData.ext.toLowerCase().replace('.', '');
  const mediaType =
    ext === "png"
      ? "image/png"
      : ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : "image/webp";

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mediaType};base64,${fileData.base}`,
            },
          },
          {
            type: "text",
            text: `
이 문서는 한국어 거래명세서입니다. 다음 정보를 정확히 추출해주세요.

- 상호명 (공급자, 상호, 법인명)
- 거래일자 (작성일) 예) 2026-01-27
- 품목들 (품명, 수량, 단가) 배열 형태

규칙:
- 수량은 단위를 제거하고 정수만 (예: 100g → 100)
- 단가는 정수형 숫자
- 키값은 반드시 "상호명", "거래일자", "품목들"
- 불명확하면:
  - 문자열 → "[불명확]"
  - 숫자 → 0
  - 날짜 → 2026-01-27
- 순수 JSON만 출력
- 마크다운, 설명, 코드블록 절대 금지
`.trim(),
          },
        ],
      },
    ],
  });

  let jsonText = response.choices[0].message.content;

  // 혹시 모를 안전 처리
  jsonText = jsonText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(jsonText);
};
