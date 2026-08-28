export const DEFAULT_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
export const ALLOWED_ORIGINS = new Set([
  "https://anhyeongmin.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

const MAX_BODY_BYTES = 32 * 1024;
const FORBIDDEN_KEYS = new Set([
  "name", "studentName", "studentNumber", "studentId", "birthDate", "phone", "email", "address",
  "이름", "성명", "학번", "생년월일", "전화번호", "이메일", "주소", "image", "rawImage",
]);
const ALLOWED_TOP_LEVEL = new Set([
  "caseId", "department", "admissionYear", "yearLabel", "majorType", "creditSummary", "progress",
  "requirements", "fulfilled", "unmet", "planned", "evidenceNeeded", "departmentConfirmation",
  "recommendedActions", "ruleSources", "inputHash",
]);
const VALID_STATUSES = new Set(["충족", "미충족", "충족예정", "증빙 필요", "학과 확인 필요", "비적용"]);
const RISK_LEVELS = new Set(["낮음", "보통", "높음", "확인 필요"]);
const REQUIREMENT_KEYS = new Set(["id", "group", "label", "status", "required", "earned", "shortage", "action", "basis"]);
const CREDIT_KEYS = new Set(["required", "earned", "shortage"]);
const PROGRESS_KEYS = new Set([
  "creditNumerator", "creditDenominator", "creditPercent", "requirementNumerator", "requirementDenominator",
  "requirementPercent", "nonCreditNumerator", "nonCreditDenominator", "nonCreditPercent", "excluded",
]);

function corsHeaders(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    "vary": "Origin",
  };
}

function jsonResponse(body, status, origin) {
  return Response.json(body, {
    status,
    headers: { ...corsHeaders(origin), "cache-control": "no-store" },
  });
}

function hasForbiddenKey(value) {
  if (Array.isArray(value)) return value.some(hasForbiddenKey);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nested]) => FORBIDDEN_KEYS.has(key) || hasForbiddenKey(nested));
}

const isShortString = (value, max = 500) => typeof value === "string" && value.length > 0 && value.length <= max;
const isStringArray = (value, maxItems = 30) => Array.isArray(value) && value.length <= maxItems && value.every((item) => isShortString(item, 500));

export function validateInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok:false, error:"요청 본문은 객체여야 합니다." };
  if (hasForbiddenKey(input)) return { ok:false, error:"개인정보 또는 원본 이미지 필드는 전송할 수 없습니다." };
  const unknown = Object.keys(input).filter((key) => !ALLOWED_TOP_LEVEL.has(key));
  if (unknown.length) return { ok:false, error:"허용되지 않은 필드가 포함되어 있습니다." };
  if (!["A", "B", "C", "D"].includes(input.caseId)) return { ok:false, error:"유효하지 않은 익명 사례입니다." };
  if (!isShortString(input.department, 80) || !isShortString(input.yearLabel, 40) || !isShortString(input.majorType, 160)) return { ok:false, error:"학생 구분 정보가 올바르지 않습니다." };
  if (!Number.isInteger(input.admissionYear) || input.admissionYear < 2000 || input.admissionYear > 2030) return { ok:false, error:"입학연도가 올바르지 않습니다." };
  const credit = input.creditSummary;
  if (!credit || typeof credit !== "object" || ![credit.required, credit.earned, credit.shortage].every(Number.isFinite)) return { ok:false, error:"학점 요약이 올바르지 않습니다." };
  if (Object.keys(credit).some((key) => !CREDIT_KEYS.has(key))) return { ok:false, error:"학점 요약에 허용되지 않은 필드가 있습니다." };
  if (!Array.isArray(input.requirements) || input.requirements.length < 1 || input.requirements.length > 30) return { ok:false, error:"졸업요건 개수가 올바르지 않습니다." };
  for (const item of input.requirements) {
    if (!item || typeof item !== "object") return { ok:false, error:"졸업요건 형식이 올바르지 않습니다." };
    if (Object.keys(item).some((key) => !REQUIREMENT_KEYS.has(key))) return { ok:false, error:"졸업요건에 허용되지 않은 필드가 있습니다." };
    const keys = ["id", "group", "label", "required", "earned", "shortage", "action", "basis"];
    if (!keys.every((key) => isShortString(item[key], key === "action" || key === "basis" ? 500 : 160))) return { ok:false, error:"졸업요건 필드가 올바르지 않습니다." };
    if (!VALID_STATUSES.has(item.status)) return { ok:false, error:"졸업요건 상태가 올바르지 않습니다." };
  }
  for (const key of ["fulfilled", "unmet", "planned", "evidenceNeeded", "departmentConfirmation", "recommendedActions", "ruleSources"]) {
    if (!isStringArray(input[key])) return { ok:false, error:`${key} 목록이 올바르지 않습니다.` };
  }
  if (!input.progress || typeof input.progress !== "object") return { ok:false, error:"진행률 정보가 올바르지 않습니다." };
  if (Object.keys(input.progress).some((key) => !PROGRESS_KEYS.has(key))) return { ok:false, error:"진행률에 허용되지 않은 필드가 있습니다." };
  const progressNumbers = [...PROGRESS_KEYS].filter((key) => key !== "excluded").map((key) => input.progress[key]);
  if (!progressNumbers.every(Number.isFinite) || !isStringArray(input.progress.excluded, 30)) return { ok:false, error:"진행률 값이 올바르지 않습니다." };
  if (input.inputHash !== undefined && !/^[a-f0-9]{64}$/.test(input.inputHash)) return { ok:false, error:"입력 해시가 올바르지 않습니다." };
  return { ok:true, value:input };
}

export function validateModelOutput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (!isShortString(value.summary, 1000) || !RISK_LEVELS.has(value.riskLevel) || !isShortString(value.riskReason, 1000)) return false;
  if (!Array.isArray(value.priorities) || value.priorities.length > 3) return false;
  if (!value.priorities.every((item, index) => item && typeof item === "object" && Number.isInteger(item.rank) && item.rank === index + 1
    && ["title", "reason", "action", "basis"].every((key) => isShortString(item[key], 1000)))) return false;
  if (!isStringArray(value.warnings, 10) || !isShortString(value.confidenceNote, 1000)) return false;
  return true;
}

export const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type:"string" },
    riskLevel: { type:"string", enum:["낮음", "보통", "높음", "확인 필요"] },
    riskReason: { type:"string" },
    priorities: {
      type:"array", maxItems:3,
      items:{ type:"object", additionalProperties:false, properties:{
        rank:{ type:"integer", minimum:1, maximum:3 }, title:{ type:"string" }, reason:{ type:"string" }, action:{ type:"string" }, basis:{ type:"string" },
      }, required:["rank", "title", "reason", "action", "basis"] },
    },
    warnings:{ type:"array", items:{ type:"string" }, maxItems:10 },
    confidenceNote:{ type:"string" },
  },
  required:["summary", "riskLevel", "riskReason", "priorities", "warnings", "confidenceNote"],
};

function buildMessages(input) {
  return [
    {
      role:"system",
      content:[
        "당신은 SSU DegreeMap의 한국어 설명 생성기입니다.",
        "입력은 익명화된 결정론적 규칙 엔진 결과입니다. 규칙 엔진의 상태·학점·판정을 변경하거나 새 졸업 가능 여부를 판정하지 마세요.",
        "입력에 없는 과목명, 학점, 규정, 기한을 만들지 마세요. 모호하면 반드시 '확인 필요'로 쓰세요.",
        "우선순위는 최대 3개이며 입력 action과 basis에 근거해야 합니다.",
        "저학년은 장기 이수계획을, 4학년·졸업유예는 즉시 행정·졸업요건을 우선하세요.",
        "복수전공 사례는 주전공·복수전공·융합전공을 섞지 말고 구분하세요.",
        "반드시 한국어 JSON만 반환하세요.",
      ].join(" "),
    },
    { role:"user", content:JSON.stringify(input) },
  ];
}

const worker = {
  async fetch(request, env) {
    const origin = request.headers.get("origin") || "";
    if (!ALLOWED_ORIGINS.has(origin)) return jsonResponse({ error:"허용되지 않은 출처입니다." }, 403, "null");
    if (request.method === "OPTIONS") return new Response(null, { status:204, headers:corsHeaders(origin) });
    if (request.method !== "POST") return jsonResponse({ error:"POST 요청만 허용됩니다." }, 405, origin);
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > MAX_BODY_BYTES) return jsonResponse({ error:"요청 본문이 너무 큽니다." }, 413, origin);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return jsonResponse({ error:"요청 본문이 너무 큽니다." }, 413, origin);
    let body;
    try { body = JSON.parse(raw); } catch { return jsonResponse({ error:"JSON 요청만 허용됩니다." }, 400, origin); }
    const checked = validateInput(body);
    if (!checked.ok) return jsonResponse({ error:checked.error }, 400, origin);

    const model = env.AI_MODEL || DEFAULT_MODEL;
    try {
      const result = await env.AI.run(model, {
        messages:buildMessages(checked.value),
        response_format:{ type:"json_schema", json_schema:OUTPUT_SCHEMA },
        max_tokens:900,
        temperature:0.2,
      });
      const output = result?.response ?? result;
      const parsed = typeof output === "string" ? JSON.parse(output) : output;
      if (!validateModelOutput(parsed)) return jsonResponse({ error:"AI 응답 검증에 실패했습니다." }, 502, origin);
      return jsonResponse({ ...parsed, model, generatedAt:new Date().toISOString(), aiGenerated:true, inputHash:body.inputHash }, 200, origin);
    } catch (error) {
      console.error("workers-ai-request-failed", { caseId:body.caseId, inputHash:body.inputHash, message:error instanceof Error ? error.message : "unknown" });
      return jsonResponse({ error:"AI 맞춤 분석을 생성하지 못했습니다. 무료 할당량 또는 모델 상태를 확인해 주세요." }, 503, origin);
    }
  },
};

export default worker;
