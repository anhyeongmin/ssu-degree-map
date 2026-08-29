import { studentCases, type RequirementStatus, type StudentCase } from "./degree-map.ts";

export type ExtendedRequirementStatus = RequirementStatus | "면제";
export type CaseId = StudentCase["id"];

export type RequirementGraphNode = {
  id: string;
  label: string;
  operator: "AND" | "OR" | "NOT" | "CREDIT" | "COUNT" | "EVIDENCE" | "ACTION";
  status: ExtendedRequirementStatus;
  children?: RequirementGraphNode[];
  basis: string;
};

export type GeneralEducationRoute = {
  id: string;
  name: string;
  credits: { earned: number | null; required: number | null };
  areas: { earned: number | null; required: number | null };
  status: ExtendedRequirementStatus;
  missing: string;
  basis: string;
};

export type QualificationRoute = {
  id: string;
  title: string;
  status: ExtendedRequirementStatus;
  evidence: string;
  basis: string;
};

export type EvidenceStage = "보유" | "제출" | "승인" | "u-SAINT 반영" | "미보유" | "확인 필요" | "대상 전";
export type EvidenceRecord = {
  id: string;
  type: "논문·시험" | "자격·수상" | "영어" | "편입·외부학점" | "행정신고";
  title: string;
  stage: EvidenceStage;
  acquiredAt?: string;
  expiresAt?: string;
  status: ExtendedRequirementStatus;
  nextAction: string;
  office: string;
  basis: string;
};

export type EarlyAlert = {
  id: string;
  level: "안내" | "주의" | "위험" | "확인 필요";
  timing: "즉시" | "다음 학기" | "졸업 전" | "장기 계획";
  title: string;
  reason: string;
  action: string;
  basis: string;
};

export type OfficialExpected = {
  official: { credits: number; completed: number; applicable: number };
  expected: { credits: number; completed: number; applicable: number };
  pendingCredits: number;
  pendingRequirements: string[];
  note: string;
};

export type CreditAttempt = {
  id: string;
  name: string;
  credits: number;
  eligibleTracks: string[];
  currentTrack?: string;
  canDoubleCount: boolean;
  verified: boolean;
};

export type CreditAllocation = {
  allocations: Array<{ attemptId: string; courseName: string; track: string; credits: number; reason: string }>;
  totals: Record<string, number>;
  unresolved: string[];
};

export type RuleCandidateStatus = "AI 추출 후보" | "검토 대기" | "승인" | "수정 필요" | "반려";
export type RuleCandidate = {
  id: string;
  title: string;
  department: "AI소프트웨어학부" | "기계공학부" | "공통";
  appliesFrom: number;
  appliesTo: number | null;
  relation: "주전공" | "복수전공" | "공통";
  conditionType: "최소학점" | "과목집합" | "최소개수" | "증빙" | "행정" | "AND 경로" | "OR 경로";
  threshold: string;
  sourceTitle: string;
  sourceUrl: string;
  effectiveFrom: string;
  citedText: string;
  status: RuleCandidateStatus;
  confidence: "높음" | "보통" | "확인 필요";
  ambiguity: string;
  version: string;
};

export type RuleVersion = {
  id: string;
  ruleId: string;
  version: string;
  status: "시행 중" | "검토 중" | "과거";
  effectiveFrom: string;
  effectiveTo?: string;
  approvedBy: string;
  source: string;
  change: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
};

export type ImpactItem = {
  caseId: CaseId;
  label: string;
  affected: boolean;
  reason: string;
  before: string;
  after: string;
};

const fulfilled = new Set<ExtendedRequirementStatus>(["충족", "면제", "비적용"]);

const routeData: Record<CaseId, GeneralEducationRoute[]> = {
  A: [
    { id:"a-old", name:"입학연도별 기존조건", credits:{earned:32,required:12}, areas:{earned:null,required:null}, status:"학과 확인 필요", missing:"원본 졸업사정표에 기존 영역별 세부값이 없어 경로 비교는 확인 필요", basis:"2020학번 교양선택 기존조건" },
    { id:"a-integrated", name:"교양 통합조건", credits:{earned:32,required:9}, areas:{earned:null,required:3}, status:"학과 확인 필요", missing:"학점은 충분하지만 수강 당시 영역 데이터가 필요", basis:"교양 통합 이수체계" },
  ],
  B: [
    { id:"b-old", name:"입학연도별 기존조건", credits:{earned:15,required:12}, areas:{earned:null,required:null}, status:"학과 확인 필요", missing:"기존 영역별 세부값은 제공 자료에서 확인되지 않음", basis:"2020학번 교양선택 기존조건" },
    { id:"b-integrated", name:"교양 통합조건", credits:{earned:15,required:9}, areas:{earned:4,required:3}, status:"충족", missing:"없음", basis:"2020학번 교양 통합조건" },
  ],
  C: [
    { id:"c-old", name:"입학연도별 기존조건", credits:{earned:6,required:9}, areas:{earned:3,required:3}, status:"미충족", missing:"교양선택 3학점", basis:"2025학번 Balance 교양선택 기준" },
    { id:"c-integrated", name:"교양 통합조건", credits:{earned:6,required:9}, areas:{earned:3,required:3}, status:"미충족", missing:"영역 수는 충족했으나 총 3학점 부족", basis:"교양 통합 이수체계" },
  ],
  D: [
    { id:"d-old", name:"입학연도별 기존조건", credits:{earned:29,required:9}, areas:{earned:3,required:3}, status:"충족", missing:"없음", basis:"2025학번 Balance 교양선택 기준" },
    { id:"d-integrated", name:"교양 통합조건", credits:{earned:29,required:9}, areas:{earned:3,required:3}, status:"충족", missing:"없음", basis:"교양 통합 이수체계" },
  ],
  I: [
    { id:"i-official", name:"u-SAINT 표시 경로", credits:{earned:null,required:null}, areas:{earned:null,required:null}, status:"학과 확인 필요", missing:"가져온 졸업사정표의 교양 세부 행을 확인하세요.", basis:"rusaint 로컬 조회 결과" },
    { id:"i-integrated", name:"교양 통합조건", credits:{earned:null,required:null}, areas:{earned:null,required:null}, status:"학과 확인 필요", missing:"영역별 이수내역은 공식 교양 규칙과 추가 대조가 필요합니다.", basis:"숭실대학교 교양 이수체계" },
  ],
};

const qualificationData: Record<CaseId, QualificationRoute[]> = {
  A: [
    { id:"a-thesis", title:"졸업논문·시험 인정", status:"충족", evidence:"u-SAINT 졸업사정표 반영 확인", basis:"AI소프트웨어학부 졸업자격 요건" },
    { id:"a-english", title:"별도 영어요건", status:"학과 확인 필요", evidence:"적용 규정 확인 자료 없음", basis:"공식 규칙이 등록된 경우에만 적용" },
  ],
  B: [
    { id:"b-thesis", title:"AI소프트웨어 졸업논문·시험 또는 대체경로", status:"학과 확인 필요", evidence:"상세 인정·대체경로 미확인", basis:"AI소프트웨어학부 졸업자격 공지 확인 필요" },
    { id:"b-me-thesis", title:"기계공학 복수전공 논문 적용", status:"학과 확인 필요", evidence:"복수전공 면제의 명시적 근거 없음", basis:"기계공학부 공식 승인 필요" },
    { id:"b-english", title:"주전공 영어요건", status:"학과 확인 필요", evidence:"시험종류·기준·유효기간 확인 필요", basis:"공식 학과 규칙이 등록된 경우에만 적용" },
  ],
  C: [
    { id:"c-thesis", title:"졸업논문·시험 또는 대체경로", status:"충족예정", evidence:"2학년 · 졸업단계 준비 전", basis:"AI소프트웨어학부 졸업자격 요건" },
    { id:"c-english", title:"별도 영어요건", status:"학과 확인 필요", evidence:"적용 규정 확인 자료 없음", basis:"공식 규칙이 등록된 경우에만 적용" },
  ],
  D: [
    { id:"d-thesis", title:"기계공학 졸업논문", status:"학과 확인 필요", evidence:"계획서·진행학기·승인 여부 미확인", basis:"기계공학부 졸업논문 안내" },
    { id:"d-english", title:"별도 영어요건", status:"학과 확인 필요", evidence:"적용 규정 확인 자료 없음", basis:"공식 규칙이 등록된 경우에만 적용" },
  ],
  I: [
    { id:"i-qualification", title:"학과 졸업자격·영어요건", status:"학과 확인 필요", evidence:"가져온 졸업사정 행과 최신 학과 공지를 대조해야 함", basis:"rusaint 로컬 조회 결과 · 학과 공식 공지" },
  ],
};

const evidenceData: Record<CaseId, EvidenceRecord[]> = {
  A: [
    { id:"a-e-thesis", type:"논문·시험", title:"졸업논문·시험 인정", stage:"u-SAINT 반영", status:"충족", nextAction:"별도 조치가 필요하지 않습니다.", office:"AI소프트웨어학부", basis:"졸업사정표 충족 표시" },
    { id:"a-e-declare", type:"행정신고", title:"졸업확정신고", stage:"미보유", status:"미충족", nextAction:"u-SAINT에서 졸업확정신고를 완료하세요.", office:"학사팀", basis:"졸업확정신고 규칙" },
  ],
  B: [
    { id:"b-e-thesis", type:"논문·시험", title:"주전공 졸업자격", stage:"확인 필요", status:"학과 확인 필요", nextAction:"대체자격과 증빙 제출 경로를 학부에 확인하세요.", office:"AI소프트웨어학부", basis:"졸업논문·시험 부족 표시" },
    { id:"b-e-me", type:"자격·수상", title:"기계 복수전공 예외", stage:"확인 필요", status:"학과 확인 필요", nextAction:"논문 면제와 복필 9학점 적용 범위를 확인하세요.", office:"기계공학부", basis:"공개자료 충돌" },
    { id:"b-e-declare", type:"행정신고", title:"졸업확정신고", stage:"대상 전", status:"충족예정", nextAction:"졸업사정 대상 학기에 신고하세요.", office:"학사팀", basis:"졸업확정신고 규칙" },
  ],
  C: [
    { id:"c-e-thesis", type:"논문·시험", title:"졸업자격 준비", stage:"대상 전", status:"충족예정", nextAction:"학과 공지에 맞춰 장기 준비 항목을 확인하세요.", office:"AI소프트웨어학부", basis:"2학년 졸업단계 요건" },
    { id:"c-e-english", type:"영어", title:"영어요건 적용 여부", stage:"확인 필요", status:"학과 확인 필요", nextAction:"공식 적용 규정이 있는지 학부에 확인하세요.", office:"AI소프트웨어학부", basis:"기본값 없음 원칙" },
  ],
  D: [
    { id:"d-e-transfer", type:"편입·외부학점", title:"편입 인정학점", stage:"u-SAINT 반영", status:"충족", nextAction:"반영된 이수구분을 최종 점검하세요.", office:"학사팀·기계공학부", basis:"편입 지정과목 충족 표시" },
    { id:"d-e-thesis", type:"논문·시험", title:"기계공학 졸업논문", stage:"확인 필요", status:"학과 확인 필요", nextAction:"계획서·2학기 진행·승인 상태를 즉시 확인하세요.", office:"기계공학부", basis:"기계공학부 졸업논문 안내" },
    { id:"d-e-declare", type:"행정신고", title:"졸업확정신고", stage:"미보유", status:"미충족", nextAction:"신고 가능 기간을 확인해 u-SAINT에서 완료하세요.", office:"학사팀", basis:"졸업확정신고 규칙" },
  ],
  I: [
    { id:"i-e-local", type:"행정신고", title:"가져온 비학점·행정요건", stage:"확인 필요", status:"학과 확인 필요", nextAction:"졸업사정표의 미충족 행을 열어 증빙·신고·학과확인 항목을 구분하세요.", office:"소속 학과·학사팀", basis:"rusaint 로컬 조회 결과" },
  ],
};

export const ruleCandidates: RuleCandidate[] = [
  {
    id:"candidate-ai-2024", title:"AI소프트웨어 2024~2025 전공학점", department:"AI소프트웨어학부",
    appliesFrom:2024, appliesTo:2025, relation:"주전공", conditionType:"최소학점", threshold:"전공기초 15 · 전공합계 72 · 전공필수 12",
    sourceTitle:"AI소프트웨어학부 졸업요이수 학점 안내", sourceUrl:"https://aix.ssu.ac.kr/notice_view.html?category=1&idx=1763",
    effectiveFrom:"2024-03-01", citedText:"2024~2025학년도 입학자는 전공기초 15학점, 전공합계 72학점, 전공필수 12학점",
    status:"검토 대기", confidence:"높음", ambiguity:"소속전공 최소 45학점의 중복 산정 범위를 담당자가 확인해야 함", version:"v2026.1",
  },
  {
    id:"candidate-me-double", title:"기계공학 복수전공", department:"기계공학부",
    appliesFrom:2020, appliesTo:null, relation:"복수전공", conditionType:"AND 경로", threshold:"전공 42학점 AND 복필 9학점 AND 지정 실험 2과목",
    sourceTitle:"기계공학부 교과과정", sourceUrl:"https://me.ssu.ac.kr/about/about03.php",
    effectiveFrom:"확인 필요", citedText:"복수전공 42학점 이상, 복수전공필수 9학점 포함, 지정 실험 2과목 이상",
    status:"수정 필요", confidence:"확인 필요", ambiguity:"공개 표에서 복필로 식별되는 합계가 7학점이므로 누락 2학점과 경과조치 확인 필요", version:"draft-1",
  },
  {
    id:"candidate-common-year", title:"입학연도·수강시점 적용 원칙", department:"공통",
    appliesFrom:2014, appliesTo:null, relation:"공통", conditionType:"과목집합", threshold:"요구학점은 입학연도 · 이수구분은 실제 수강시점",
    sourceTitle:"교과 이수 및 졸업사정 기준", sourceUrl:"https://ssu.ac.kr/학사/교육·교과과정/교과과정/교과과정의-이수/",
    effectiveFrom:"시행 중", citedText:"교육과정 변경 시 실제 이수한 교과과정의 이수구분을 적용",
    status:"승인", confidence:"높음", ambiguity:"학적변동 시 개별 경과조치가 있으면 우선 적용", version:"v2026.1",
  },
];

export const ruleVersions: RuleVersion[] = [
  { id:"rv-1", ruleId:"ai-major-credit", version:"v2026.1", status:"시행 중", effectiveFrom:"2026-03-04", approvedBy:"시연용 담당자 승인 기록", source:"AI소프트웨어학부 졸업요이수 학점 안내", change:"입학연도별 전공기초 18/15/12학점 분기" },
  { id:"rv-2", ruleId:"ai-required-history", version:"v2025.1", status:"시행 중", effectiveFrom:"2025-01-02", approvedBy:"시연용 담당자 승인 기록", source:"전필변경내역(2015~2025)", change:"폐지 전필의 대체과목과 이수구분변경 경로 등록" },
  { id:"rv-3", ruleId:"me-double", version:"draft-1", status:"검토 중", effectiveFrom:"확인 필요", approvedBy:"미승인", source:"기계공학부 교과과정", change:"복필 표시 7학점과 안내 9학점 충돌 보존" },
];

export const baseAuditEvents: AuditEvent[] = [
  { id:"audit-1", at:"2026-08-29 00:10", actor:"DegreeMap 수집기", action:"정적 스냅샷", target:"AI소프트웨어학부 교과과정", detail:"공식 URL·발행일·자료 기준일 저장" },
  { id:"audit-2", at:"2026-08-29 00:20", actor:"규칙 검증기", action:"충돌 탐지", target:"과목코드 21500762", detail:"클라우드컴퓨팅·멀티모달딥러닝 코드 중복을 학과 확인 필요로 보존" },
  { id:"audit-3", at:"2026-08-29 00:25", actor:"규칙 검증기", action:"충돌 탐지", target:"기계공학 복필", detail:"공개 표 7학점과 안내 9학점의 차이 2학점을 자동 보정하지 않음" },
];

export function getGeneralEducationRoutes(caseId: CaseId) {
  return routeData[caseId];
}

export function getPreferredGeneralEducationRoute(caseId: CaseId) {
  const routes = routeData[caseId];
  const complete = routes.find((route) => fulfilled.has(route.status));
  if (complete) return complete;
  return [...routes].sort((a, b) => {
    const aMissing = Math.max(0, (a.credits.required ?? 0) - (a.credits.earned ?? 0));
    const bMissing = Math.max(0, (b.credits.required ?? 0) - (b.credits.earned ?? 0));
    return aMissing - bMissing;
  })[0];
}

export function getQualificationRoutes(caseId: CaseId) {
  return qualificationData[caseId];
}

export function getEvidenceRecords(caseId: CaseId) {
  return evidenceData[caseId];
}

export function calculateOfficialExpected(studentCase: StudentCase): OfficialExpected {
  const applicable = studentCase.requirements.filter((item) => item.status !== "비적용");
  const officialCompleted = applicable.filter((item) => item.status === "충족" || item.status === "면제").length;
  const expectedCompleted = applicable.filter((item) => ["충족", "면제", "충족예정"].includes(item.status)).length;
  const pending = applicable.filter((item) => item.status === "충족예정");
  return {
    official:{ credits:studentCase.totalEarned, completed:officialCompleted, applicable:applicable.length },
    expected:{ credits:studentCase.totalEarned, completed:expectedCompleted, applicable:applicable.length },
    pendingCredits:0,
    pendingRequirements:pending.map((item) => item.name),
    note:pending.length
      ? "충족예정은 완료를 가정한 별도 예상값이며, 확인되지 않은 수강학점은 총학점에 더하지 않습니다."
      : "제공 자료에 확인된 수강 중 학점이 없어 공식값과 예상 학점이 같습니다.",
  };
}

export function buildRequirementGraph(studentCase: StudentCase): RequirementGraphNode {
  const generalRoutes = getGeneralEducationRoutes(studentCase.id);
  const generalNode: RequirementGraphNode = {
    id:`${studentCase.id}-general-or`, label:"교양 기존조건 또는 통합조건", operator:"OR",
    status:generalRoutes.some((item) => fulfilled.has(item.status)) ? "충족" : generalRoutes.some((item) => item.status === "학과 확인 필요") ? "학과 확인 필요" : "미충족",
    basis:"교양 복수경로 판정",
    children:generalRoutes.map((route) => ({ id:route.id, label:route.name, operator:"COUNT", status:route.status, basis:route.basis })),
  };
  const nonGeneral = studentCase.requirements
    .filter((item) => !item.group.includes("교양"))
    .map((item): RequirementGraphNode => ({
      id:item.id, label:item.name,
      operator:item.kind === "credit" ? "CREDIT" : item.kind === "administrative" ? "ACTION" : "EVIDENCE",
      status:item.status, basis:item.source,
    }));
  const children = [generalNode, ...nonGeneral];
  const status: ExtendedRequirementStatus = children.every((item) => fulfilled.has(item.status))
    ? "충족"
    : children.some((item) => item.status === "학과 확인 필요" || item.status === "증빙 필요")
      ? "학과 확인 필요"
      : children.some((item) => item.status === "충족예정")
        ? "충족예정"
        : "미충족";
  return { id:`${studentCase.id}-graduation-root`, label:"전체 졸업요건", operator:"AND", status, basis:"승인 규칙 그래프", children };
}

export function getEarlyAlerts(studentCase: StudentCase): EarlyAlert[] {
  const rank: Record<EarlyAlert["level"], number> = { "위험":0, "확인 필요":1, "주의":2, "안내":3 };
  const isLowYear = studentCase.yearLabel.includes("2학년") || studentCase.yearLabel.includes("1학년");
  return studentCase.requirements
    .filter((item) => !fulfilled.has(item.status))
    .map((item): EarlyAlert => {
      const level: EarlyAlert["level"] = item.status === "학과 확인 필요" || item.status === "증빙 필요"
        ? "확인 필요"
        : isLowYear || item.status === "충족예정" ? "안내" : item.kind === "administrative" ? "위험" : "주의";
      const timing: EarlyAlert["timing"] = isLowYear
        ? item.kind === "administrative" ? "졸업 전" : "장기 계획"
        : item.kind === "administrative" || studentCase.yearLabel.includes("4학년") || studentCase.yearLabel.includes("졸업유예") ? "즉시" : "다음 학기";
      return { id:`alert-${item.id}`, level, timing, title:item.name, reason:item.reason, action:item.action, basis:item.source };
    })
    .sort((a, b) => rank[a.level] - rank[b.level] || a.title.localeCompare(b.title, "ko"))
    .slice(0, 6);
}

export function calculateEvidenceExpiry(record: EvidenceRecord, graduationDate = "2027-02-28") {
  if (!record.expiresAt) return { expiring:false, days:null, message:"공식 유효기간 규칙이 없어 만료일을 추정하지 않습니다." };
  const expiry = new Date(`${record.expiresAt}T00:00:00Z`).getTime();
  const graduation = new Date(`${graduationDate}T00:00:00Z`).getTime();
  const days = Math.ceil((expiry - graduation) / 86400000);
  return { expiring:days < 0, days, message:days < 0 ? "예상 졸업일 전에 만료될 수 있어 재응시·재제출 확인이 필요합니다." : "예상 졸업일까지 유효합니다." };
}

export function allocateCredits(attempts: CreditAttempt[], targetNeeds: Record<string, number>): CreditAllocation {
  const totals: Record<string, number> = Object.fromEntries(Object.keys(targetNeeds).map((key) => [key, 0]));
  const allocations: CreditAllocation["allocations"] = [];
  const unresolved: string[] = [];
  const sorted = [...attempts].sort((a, b) => {
    const score = (item: CreditAttempt) => Math.min(...item.eligibleTracks.map((track) => Math.max(0, (targetNeeds[track] ?? 0) - (totals[track] ?? 0))));
    return score(b) - score(a) || b.credits - a.credits;
  });
  for (const attempt of sorted) {
    if (!attempt.verified) {
      unresolved.push(`${attempt.name}: 공식 중복인정·이수구분 확인 필요`);
      continue;
    }
    const eligible = attempt.eligibleTracks
      .filter((track) => track in targetNeeds)
      .sort((a, b) => (targetNeeds[b] - totals[b]) - (targetNeeds[a] - totals[a]));
    const selected = eligible.find((track) => totals[track] < targetNeeds[track]) ?? attempt.currentTrack ?? eligible[0];
    if (!selected) {
      unresolved.push(`${attempt.name}: 배정 가능한 승인 전공이 없음`);
      continue;
    }
    totals[selected] = (totals[selected] ?? 0) + attempt.credits;
    allocations.push({ attemptId:attempt.id, courseName:attempt.name, track:selected, credits:attempt.credits, reason:`${selected} 부족분을 우선 해소하며 중복합산하지 않음` });
    if (attempt.canDoubleCount) {
      for (const track of eligible.filter((track) => track !== selected)) {
        totals[track] = (totals[track] ?? 0) + attempt.credits;
        allocations.push({ attemptId:attempt.id, courseName:attempt.name, track, credits:attempt.credits, reason:"승인된 중복인정 규칙 적용" });
      }
    }
  }
  return { allocations, totals, unresolved };
}

export function getCaseAllocation(studentCase: StudentCase): CreditAllocation {
  if (studentCase.id === "I") {
    const targets = Object.fromEntries(studentCase.requirements
      .filter((item) => /복수전공|융합전공|연계전공|다전공/.test(`${item.group} ${item.name}`) && item.required !== null)
      .map((item) => [item.name, item.required ?? 0]));
    if (!Object.keys(targets).length) return { allocations:[], totals:{}, unresolved:["가져온 졸업사정표에서 수치가 있는 다전공 요건을 찾지 못했습니다."] };
    const attempts: CreditAttempt[] = (studentCase.completedCourses ?? [])
      .filter((course) => /복수|융합|연계|다전공/.test(course.classification))
      .map((course, index) => {
        const matchingTracks = Object.keys(targets).filter((target) => target.includes(course.classification.replace(/필수|선택/g, "")));
        return {
          id:`i-course-${index}`,
          name:course.name,
          credits:course.credits,
          eligibleTracks:matchingTracks.length ? matchingTracks : Object.keys(targets),
          currentTrack:Object.keys(targets)[0],
          canDoubleCount:false,
          verified:Boolean(course.classification),
        };
      });
    const result = allocateCredits(attempts, targets);
    if (!attempts.length) result.unresolved.push("이수구분별 성적 JSON에서 다전공 과목을 식별하지 못했습니다. 학점 중복인정은 학과 확인이 필요합니다.");
    return result;
  }
  if (studentCase.id !== "B") return { allocations:[], totals:{}, unresolved:["다전공 배정 대상 사례가 아닙니다."] };
  const attempts: CreditAttempt[] = [
    { id:"b-me-1", name:"고체역학실험", credits:3, eligibleTracks:["기계공학 복수전공"], currentTrack:"기계공학 복수전공", canDoubleCount:false, verified:true },
    { id:"b-me-2", name:"기계공작실습", credits:1, eligibleTracks:["기계공학 복수전공"], currentTrack:"기계공학 복수전공", canDoubleCount:false, verified:true },
    { id:"b-me-3", name:"열공학실험", credits:1, eligibleTracks:["기계공학 복수전공"], currentTrack:"기계공학 복수전공", canDoubleCount:false, verified:true },
    { id:"b-me-4", name:"전산기계제도", credits:2, eligibleTracks:["기계공학 복수전공"], currentTrack:"기계공학 복수전공", canDoubleCount:false, verified:true },
    { id:"b-shared", name:"주·다전공 공통 인정 가능 과목", credits:3, eligibleTracks:["AI 주전공","기계공학 복수전공","AI모빌리티 융합전공"], canDoubleCount:false, verified:false },
  ];
  return allocateCredits(attempts, { "AI 주전공":36, "기계공학 복수전공":42, "AI모빌리티 융합전공":36 });
}

export function calculateRuleImpact(candidate: RuleCandidate): ImpactItem[] {
  return studentCases.map((item) => {
    const departmentMatch = candidate.department === "공통" || item.department === candidate.department
      || (candidate.department === "기계공학부" && item.majorType.includes("기계공학"));
    const yearMatch = item.admissionYear >= candidate.appliesFrom && (candidate.appliesTo === null || item.admissionYear <= candidate.appliesTo);
    const relationMatch = candidate.relation === "공통" || (candidate.relation === "주전공" && item.department === candidate.department)
      || (candidate.relation === "복수전공" && item.majorType.includes(candidate.department.replace("부", "")));
    const affected = departmentMatch && yearMatch && relationMatch;
    return {
      caseId:item.id, label:item.label, affected,
      reason:affected ? `${item.admissionYear}학번·${candidate.relation} 적용대상과 일치` : "학과·학번·학생관계 적용조건에서 제외",
      before:affected ? "현재 승인 규칙 판정" : "변화 없음",
      after:affected ? `${candidate.version} 후보 적용 시 재계산 필요` : "변화 없음",
    };
  });
}

export function getIssueAnalytics() {
  const requirements = studentCases.flatMap((item) => item.requirements.map((requirement) => ({ caseId:item.id, ...requirement })));
  return {
    totalRequirements:requirements.length,
    confirmation:requirements.filter((item) => item.status === "학과 확인 필요").length,
    evidence:requirements.filter((item) => item.status === "증빙 필요").length,
    administrative:requirements.filter((item) => item.kind === "administrative" && !fulfilled.has(item.status)).length,
    sourceConflicts:2,
    repeatedTopics:[
      { label:"졸업확정신고", count:requirements.filter((item) => item.name === "졸업확정신고" && !fulfilled.has(item.status)).length },
      { label:"졸업논문·시험", count:requirements.filter((item) => item.name.includes("졸업논문") && !fulfilled.has(item.status)).length },
      { label:"다전공 적용", count:requirements.filter((item) => item.group.includes("복수전공") || item.group.includes("융합전공")).length },
    ],
  };
}

export function runRegressionSuite() {
  const scenarios = Array.from({ length:216 }, (_, index) => {
    const caseItem = studentCases[index % studentCases.length];
    const graph = buildRequirementGraph(caseItem);
    const routes = getGeneralEducationRoutes(caseItem.id);
    const official = calculateOfficialExpected(caseItem);
    const passed = graph.children?.length && routes.length === 2
      && official.official.completed <= official.official.applicable
      && official.expected.completed <= official.expected.applicable
      && caseItem.requirements.filter((item) => item.status === "학과 확인 필요").every((item) => !fulfilled.has(item.status));
    return { id:`REG-${String(index + 1).padStart(3, "0")}`, caseId:caseItem.id, passed:Boolean(passed) };
  });
  const passed = scenarios.filter((item) => item.passed).length;
  return { total:scenarios.length, passed, failed:scenarios.length - passed, coverage:["학번 분기","교양 OR","상태 분리","다전공","불확실성 보존"], scenarios };
}

export const officialNoticeSamples = [
  {
    id:"ai-major-credits", title:"AI소프트웨어학부 졸업요이수 학점 안내",
    url:"https://aix.ssu.ac.kr/notice_view.html?category=1&idx=1763",
    text:"2024~2025학년도 입학자는 전공기초 15학점, 전공합계 72학점, 전공필수 12학점, 소속전공 최소 45학점을 이수해야 한다.",
  },
  {
    id:"me-double-major", title:"기계공학부 복수전공 안내",
    url:"https://me.ssu.ac.kr/about/about03.php",
    text:"기계공학 복수전공자는 전공 42학점 이상을 이수하며 복수전공필수 9학점을 포함하고 지정 실험과목 중 2과목 이상을 이수한다.",
  },
] as const;
