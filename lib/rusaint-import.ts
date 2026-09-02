import type { Requirement, RequirementKind, StudentCase } from "./degree-map.ts";

type JsonRecord = Record<string, unknown>;

export type RusaintJsonFile = {
  name: string;
  text: string;
};

export type RusaintImportSummary = {
  filesRead: number;
  requirementsImported: number;
  coursesImported: number;
  personalFieldsRemoved: string[];
  warnings: string[];
};

export type RusaintImportResult = {
  studentCase: StudentCase;
  summary: RusaintImportSummary;
};

const MAX_FILES = 8;
const MAX_TOTAL_BYTES = 5 * 1024 * 1024;
const blockedSecretKeys = new Set([
  "password", "passwd", "token", "access_token", "refresh_token", "authorization",
  "cookie", "cookies", "session", "session_id", "sso_password", "sso_id",
]);
const personalKeys = new Set([
  "number", "name", "student_number", "student_name", "rrn", "image", "alias",
  "kanji_name", "email", "tel_number", "mobile_number", "post_code", "address",
  "specific_address", "bank_account", "account_number",
]);

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizedKey(key: string) {
  return key.trim().toLowerCase().replaceAll("-", "_");
}

function inspectKeys(value: unknown, personal: Set<string>, path = "root") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectKeys(item, personal, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    const normalized = normalizedKey(key);
    if (blockedSecretKeys.has(normalized)) {
      throw new Error(`보안상 '${key}' 필드가 포함된 세션·인증 파일은 가져올 수 없습니다.`);
    }
    if (personalKeys.has(normalized)) personal.add(normalized);
    inspectKeys(child, personal, `${path}.${key}`);
  }
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const normalized = value.replaceAll(",", "").replace(/[^0-9.-]/g, "");
    if (!/[0-9]/.test(normalized)) return null;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === "충족" || value === "true") return true;
  if (value === "미충족" || value === "false") return false;
  return null;
}

function looksLikeGraduationStudent(value: unknown): value is JsonRecord {
  return isRecord(value)
    && ("graduation_points" in value || "completed_points" in value)
    && ("department" in value || "apply_year" in value);
}

function looksLikeRequirements(value: unknown): value is JsonRecord {
  return isRecord(value) && isRecord(value.requirements);
}

function looksLikeGrades(value: unknown): value is JsonRecord {
  return isRecord(value) && Array.isArray(value.grades);
}

function findPayloads(value: unknown, found: {
  student?: JsonRecord;
  requirements?: JsonRecord;
  grades?: JsonRecord;
}) {
  if (looksLikeGraduationStudent(value)) found.student ??= value;
  if (looksLikeRequirements(value)) found.requirements ??= value;
  if (looksLikeGrades(value)) found.grades ??= value;
  if (Array.isArray(value)) value.forEach((item) => findPayloads(item, found));
  else if (isRecord(value)) Object.values(value).forEach((item) => findPayloads(item, found));
}

function requirementKind(name: string, required: number | null): RequirementKind {
  if (/신고|신청|제출|승인/.test(name)) return "administrative";
  if (required !== null || /학점|교양|전공|기독교과목/.test(name)) return "credit";
  return "nonCredit";
}

function requirementGroup(name: string, category: string) {
  if (/복수전공/.test(name)) return "복수전공";
  if (/융합전공|연계전공/.test(name)) return "다전공";
  if (/교양/.test(name) || category.includes("교양")) return category || "교양";
  if (/전공기초/.test(name)) return "전공기초";
  if (/전공/.test(name) || category.includes("전공")) return category || "전공";
  if (/채플/.test(name)) return "채플";
  if (/논문|시험|자격/.test(name)) return "학과 졸업요건";
  if (/신고|신청|제출|승인/.test(name)) return "행정 요건";
  return category || "졸업필수 요건";
}

function safeSlug(value: string, index: number) {
  const slug = value.toLowerCase().replace(/[^0-9a-z가-힣]+/g, "-").replace(/^-|-$/g, "");
  return `i-${slug || `requirement-${index + 1}`}`;
}

function buildRequirement(value: unknown, index: number, fallbackName: string): Requirement | null {
  if (!isRecord(value)) return null;
  const name = asString(value.name) || fallbackName;
  if (!name) return null;
  const required = asNumber(value.requirement);
  const earned = asNumber(value.calculation);
  const result = asBoolean(value.result);
  const category = asString(value.category);
  const lectures = Array.isArray(value.lectures)
    ? value.lectures.map(asString).filter(Boolean)
    : [];
  const kind = requirementKind(name, required);
  const deficit = required !== null && earned !== null ? Math.max(0, required - earned) : null;
  const status = result === true ? "충족" : result === false ? "미충족" : "학과 확인 필요";
  const reason = result === true
    ? `u-SAINT 졸업사정표에서 ${name} 요건이 충족으로 조회되었습니다.`
    : deficit !== null
      ? `u-SAINT 계산값 ${earned}가 기준값 ${required}보다 ${deficit} 부족합니다.`
      : result === false
        ? `u-SAINT 졸업사정표에서 ${name} 요건이 미충족으로 조회되었습니다.`
        : `u-SAINT 결과에서 ${name}의 충족 여부를 확정할 수 없습니다.`;
  const action = result === true
    ? "추가 조치가 필요하지 않습니다."
    : deficit !== null && deficit > 0
      ? `${name} 인정 범위에 해당하는 과목 ${deficit}학점을 추가로 계획하세요.`
      : `해당 요건의 세부 인정 기준과 처리 방법을 u-SAINT 또는 소속 학과에서 확인하세요.`;
  return {
    id:safeSlug(name, index),
    group:requirementGroup(name, category),
    name,
    kind,
    required,
    earned,
    unit:kind === "credit" ? "학점" : kind === "administrative" ? "건" : "상태",
    requiredLabel:required === null ? "충족 필요" : undefined,
    earnedLabel:earned === null ? (result === true ? "충족" : result === false ? "미충족" : "확인 필요") : undefined,
    status,
    courses:lectures.length ? lectures.join(", ") : "세부 사용과목 미표시",
    reason,
    action,
    source:"rusaint로 조회한 u-SAINT 졸업사정표",
    progressPrimary:/총.*졸업.*학점|졸업학점/.test(name),
  };
}

function parseRequirements(payload: JsonRecord) {
  const raw = payload.requirements;
  if (!isRecord(raw)) return [];
  return Object.entries(raw)
    .map(([key, value], index) => buildRequirement(value, index, key))
    .filter((item): item is Requirement => Boolean(item));
}

function parseCompletedCourses(payload?: JsonRecord): NonNullable<StudentCase["completedCourses"]> {
  if (!payload || !Array.isArray(payload.grades)) return [];
  return payload.grades.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const name = asString(entry.course_name) || asString(entry.class_name);
    const code = asString(entry.course_code) || asString(entry.code);
    if (!name && !code) return [];
    return [{
      code,
      name:name || "과목명 확인 필요",
      credits:asNumber(entry.credits) ?? asNumber(entry.grade_points) ?? 0,
      classification:asString(entry.classification),
      year:asString(entry.year),
      semester:asString(entry.semester),
      grade:asString(entry.grade) || asString(entry.rank),
    }];
  });
}

function inferTotal(requirements: Requirement[], field: "required" | "earned") {
  const primary = requirements.find((item) => item.progressPrimary);
  return primary?.[field] ?? 0;
}

export function parseRusaintJsonFiles(files: RusaintJsonFile[]): RusaintImportResult {
  if (!files.length) throw new Error("rusaint JSON 파일을 한 개 이상 선택하세요.");
  if (files.length > MAX_FILES) throw new Error(`한 번에 최대 ${MAX_FILES}개 파일만 가져올 수 있습니다.`);
  const totalBytes = files.reduce((sum, file) => sum + new TextEncoder().encode(file.text).byteLength, 0);
  if (totalBytes > MAX_TOTAL_BYTES) throw new Error("선택한 JSON 파일의 총크기는 5MB 이하여야 합니다.");

  const personal = new Set<string>();
  const payloads: { student?: JsonRecord; requirements?: JsonRecord; grades?: JsonRecord } = {};
  for (const file of files) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(file.text);
    } catch {
      throw new Error(`${file.name}: 올바른 JSON 파일이 아닙니다.`);
    }
    inspectKeys(parsed, personal);
    findPayloads(parsed, payloads);
  }
  if (!payloads.requirements) {
    throw new Error("졸업요건 데이터가 없습니다. `rusaint --format json graduation requirements` 결과를 포함하세요.");
  }

  const requirements = parseRequirements(payloads.requirements);
  if (!requirements.length) throw new Error("u-SAINT 졸업요건 행을 해석하지 못했습니다.");
  const student = payloads.student;
  const completedCourses = parseCompletedCourses(payloads.grades);
  const department = asString(student?.department) || "학과 확인 필요";
  const grade = asNumber(student?.grade);
  const semester = asNumber(student?.semester);
  const applyYear = asNumber(student?.apply_year) ?? 0;
  const majors = Array.isArray(student?.majors) ? student.majors.map(asString).filter(Boolean) : [];
  const graduationPoints = asNumber(student?.graduation_points) ?? inferTotal(requirements, "required");
  const completedPoints = asNumber(student?.completed_points) ?? inferTotal(requirements, "earned");
  const isGraduatable = asBoolean(payloads.requirements.is_graduatable);
  const majorType = majors.length > 1
    ? `주전공 ${majors[0]} · 다전공 ${majors.slice(1).join(" · ")}`
    : majors.length === 1 ? `주전공 ${majors[0]}` : "전공 관계 확인 필요";
  const warnings: string[] = [];
  if (!student) warnings.push("졸업사정 학생정보 파일이 없어 학과·학년·입학연도 일부를 확인할 수 없습니다.");
  if (!payloads.grades) warnings.push("이수구분별 성적 파일이 없어 추천 과목과 기존 이수과목의 완전한 중복 검사는 제한됩니다.");
  if (!requirements.some((item) => item.progressPrimary)) warnings.push("총 졸업학점 행을 자동 식별하지 못해 진행률 기준값을 별도로 확인해야 합니다.");

  return {
    studentCase:{
      id:"I",
      label:"내 u-SAINT · 로컬 분석",
      shortLabel:"내 u-SAINT",
      department,
      yearLabel:grade ? `${grade}학년` : "학년 확인 필요",
      admissionYear:applyYear,
      semester:semester ? `${semester}학기` : "이수학기 확인 필요",
      majorType,
      totalRequired:graduationPoints,
      totalEarned:completedPoints,
      uSaintStatus:isGraduatable === true ? "가능" : isGraduatable === false ? "불가능" : "확인 필요",
      dataNote:"rusaint JSON을 브라우저 안에서만 익명화·구조화한 결과입니다.",
      requirements,
      completedCourses,
    },
    summary:{
      filesRead:files.length,
      requirementsImported:requirements.length,
      coursesImported:completedCourses.length,
      personalFieldsRemoved:[...personal].sort(),
      warnings,
    },
  };
}
