import { catalogCourses, officialSources, type CatalogCourse, type DepartmentId } from "./curriculum-data.ts";
import type { Requirement, StudentCase } from "./degree-map.ts";

export type CourseImpact = {
  requirementId: string;
  requirementName: string;
  credits: number;
};

export type CourseRecommendation = {
  key: string;
  course: CatalogCourse;
  impacts: CourseImpact[];
  priority: "필수 우선" | "부족학점 해소" | "장기 계획" | "학과 확인 필요";
  verification: "공식 과목" | "수강내역 대조 필요" | "학과 확인 필요";
  reason: string;
  sourceTitle: string;
  sourceUrl: string;
};

export type RecommendationTarget = {
  requirementId: string;
  name: string;
  before: number;
  required: number;
  deficit: number;
  coverable: boolean;
};

export type WhatIfRow = RecommendationTarget & {
  added: number;
  after: number;
  remaining: number;
  resolved: boolean;
};

export type WhatIfResult = {
  selectedCredits: number;
  projectedTotal: number;
  totalShortage: number;
  rows: WhatIfRow[];
};

export type RecommendationPlan = {
  candidates: CourseRecommendation[];
  targets: RecommendationTarget[];
  minimalPath: CourseRecommendation[];
  unresolved: Requirement[];
  completedNames: string[];
  notice: string;
};

const caseDepartments: Record<StudentCase["id"], DepartmentId[]> = {
  A: ["ai"],
  B: ["ai", "mechanical"],
  C: ["ai"],
  D: ["mechanical"],
  I: ["ai", "mechanical"],
};

const explicitCompleted: Record<StudentCase["id"], string[]> = {
  A: [],
  B: ["고체역학실험", "기계공작실습", "열공학실험", "전산기계제도"],
  C: [],
  D: ["공학물리1", "인공지능프로그래밍"],
  I: [],
};

const planCache = new Map<StudentCase["id"], RecommendationPlan>();

function numericDeficit(requirement: Requirement) {
  if (requirement.required === null || requirement.earned === null) return 0;
  return Math.max(0, requirement.required - requirement.earned);
}

function requirementById(studentCase: StudentCase, id: string) {
  return studentCase.requirements.find((item) => item.id === id);
}

function impact(studentCase: StudentCase, id: string, credits: number): CourseImpact | null {
  const requirement = requirementById(studentCase, id);
  if (!requirement || numericDeficit(requirement) <= 0) return null;
  return { requirementId:id, requirementName:requirement.name, credits };
}

function impactByName(studentCase: StudentCase, pattern: RegExp, credits: number) {
  const requirement = studentCase.requirements.find((item) => pattern.test(item.name));
  return requirement ? impact(studentCase, requirement.id, credits) : null;
}

function courseImpacts(studentCase: StudentCase, course: CatalogCourse) {
  const primary = studentCase.requirements.find((item) => item.progressPrimary);
  const items: Array<CourseImpact | null> = [primary ? impact(studentCase, primary.id, course.credits) : null];
  if (studentCase.id === "B") {
    if (course.department === "ai" && course.classification === "전기") items.push(impact(studentCase, "b-major-basic", course.credits));
    if (course.department === "mechanical") items.push(impact(studentCase, "b-double-major", course.credits));
  }
  if (studentCase.id === "C") {
    if (course.classification === "전필") items.push(impact(studentCase, "c-major-required", course.credits));
    if (course.classification === "전필" || course.classification === "전선") items.push(impact(studentCase, "c-major-total", course.credits));
  }
  if (studentCase.id === "D") {
    if (course.classification === "전기") items.push(impact(studentCase, "d-major-basic", course.credits));
    if (course.classification === "전필") items.push(impact(studentCase, "d-me-required", course.credits));
    if (course.classification === "전필" || course.classification === "전선") items.push(impact(studentCase, "d-major-total", course.credits));
  }
  if (studentCase.id === "I") {
    if (course.classification === "전기") items.push(impactByName(studentCase, /전공기초/, course.credits));
    if (course.classification === "전필") items.push(impactByName(studentCase, /전공필수|복수전공필수/, course.credits));
    if (course.classification === "전필" || course.classification === "전선") {
      items.push(impactByName(studentCase, course.department === "mechanical" && studentCase.majorType.includes("다전공") ? /복수전공.*기계|기계.*복수전공/ : /전공합계|전공\(전필\+전선\)|전공.*학점/, course.credits));
    }
  }
  return items.filter((item): item is CourseImpact => Boolean(item));
}

function eligible(studentCase: StudentCase, course: CatalogCourse) {
  if (!caseDepartments[studentCase.id].includes(course.department)) return false;
  if (studentCase.id === "I") {
    const related = course.department === "mechanical"
      ? `${studentCase.department} ${studentCase.majorType}`.includes("기계")
      : `${studentCase.department} ${studentCase.majorType}`.includes("AI");
    if (!related) return false;
  }
  if (course.verification === "공식 자료 충돌") return false;
  const importedCompleted = studentCase.completedCourses?.map((item) => item.name) ?? [];
  if ([...explicitCompleted[studentCase.id], ...importedCompleted].includes(course.name)) return false;
  if (studentCase.id === "A") return false;
  if (studentCase.id === "B" && course.department === "ai" && course.classification !== "전기") return false;
  if (studentCase.id === "C" && course.department === "ai" && course.year < 2) return false;
  return true;
}

function priorityFor(studentCase: StudentCase, course: CatalogCourse, impacts: CourseImpact[]): CourseRecommendation["priority"] {
  if (studentCase.id === "B" && course.department === "mechanical" && course.doubleMajorRequired) return "학과 확인 필요";
  if (impacts.some((item) => item.requirementId.includes("required") || item.requirementId === "d-me-required")) return "필수 우선";
  if (studentCase.id === "C") return "장기 계획";
  return "부족학점 해소";
}

function recommendationReason(studentCase: StudentCase, course: CatalogCourse, impacts: CourseImpact[]) {
  const labels = impacts.filter((item) => !item.requirementId.endsWith("-total")).map((item) => item.requirementName);
  const benefits = labels.length ? labels.join("·") : "총 졸업학점";
  if (studentCase.id === "B" && course.department === "mechanical" && course.doubleMajorRequired) {
    return `${benefits}에 기여할 수 있는 공식 복필 표시 과목입니다. 다만 공개 표의 복필 합계 충돌 때문에 적용 여부를 학과에 확인해야 합니다.`;
  }
  return `${benefits} 부족분과 총 졸업학점에 동시에 기여하는 공식 교과목 후보입니다.`;
}

function comparePlans(a: number[], b: number[], candidates: CourseRecommendation[]) {
  if (a.length !== b.length) return a.length - b.length;
  const creditsA = a.reduce((sum, index) => sum + candidates[index].course.credits, 0);
  const creditsB = b.reduce((sum, index) => sum + candidates[index].course.credits, 0);
  return creditsA - creditsB;
}

function calculateMinimalPath(candidates: CourseRecommendation[], targets: RecommendationTarget[]) {
  const coverable = targets.filter((item) => item.coverable);
  if (!candidates.length || !coverable.length) return [];
  const caps = coverable.map((item) => Math.round(item.deficit * 2));
  const encode = (values: number[]) => values.join("/");
  const states = new Map<string, { values: number[]; selected: number[] }>();
  states.set(encode(caps.map(() => 0)), { values:caps.map(() => 0), selected:[] });

  candidates.forEach((candidate, candidateIndex) => {
    const snapshot = [...states.values()];
    for (const state of snapshot) {
      const nextValues = state.values.map((value, targetIndex) => {
        const target = coverable[targetIndex];
        const added = candidate.impacts.find((item) => item.requirementId === target.requirementId)?.credits ?? 0;
        return Math.min(caps[targetIndex], value + Math.round(added * 2));
      });
      if (nextValues.every((value, index) => value === state.values[index])) continue;
      const key = encode(nextValues);
      const selected = [...state.selected, candidateIndex];
      const current = states.get(key);
      if (!current || comparePlans(selected, current.selected, candidates) < 0) states.set(key, { values:nextValues, selected });
    }
  });
  const goal = states.get(encode(caps));
  return goal ? goal.selected.map((index) => candidates[index]) : [];
}

export function getCourseRecommendationPlan(studentCase: StudentCase): RecommendationPlan {
  const cached = studentCase.id === "I" ? undefined : planCache.get(studentCase.id);
  if (cached) return cached;
  const completedNames = [...new Set([
    ...explicitCompleted[studentCase.id],
    ...(studentCase.completedCourses?.map((item) => item.name) ?? []),
  ])];
  const seenCourses = new Set<string>();
  const candidates = catalogCourses
    .filter((course) => eligible(studentCase, course))
    .filter((course) => {
      const canonicalKey = `${course.department}-${course.code}-${course.name}`;
      if (seenCourses.has(canonicalKey)) return false;
      seenCourses.add(canonicalKey);
      return true;
    })
    .map((course): CourseRecommendation | null => {
      const impacts = courseImpacts(studentCase, course);
      if (!impacts.length) return null;
      const source = officialSources.find((item) => item.id === course.sourceId);
      if (!source) return null;
      const priority = priorityFor(studentCase, course, impacts);
      return {
        key:`${course.department}-${course.code}-${course.name}-${course.semester}`,
        course,
        impacts,
        priority,
        verification:priority === "학과 확인 필요" ? "학과 확인 필요" : "수강내역 대조 필요",
        reason:recommendationReason(studentCase, course, impacts),
        sourceTitle:source.title,
        sourceUrl:source.url,
      };
    })
    .filter((item): item is CourseRecommendation => Boolean(item))
    .sort((a, b) => {
      const score = (item: CourseRecommendation) => item.impacts.reduce((sum, impactItem) => sum + impactItem.credits, 0)
        + (item.course.classification === "전필" ? 8 : 0)
        + (item.course.doubleMajorRequired ? 5 : 0)
        - item.course.year * .05;
      return score(b) - score(a) || a.course.year - b.course.year || a.course.semester - b.course.semester;
    });

  const targets = studentCase.requirements
    .filter((item) => item.kind === "credit" && numericDeficit(item) > 0)
    .map((item): RecommendationTarget => ({
      requirementId:item.id,
      name:item.name,
      before:item.earned ?? 0,
      required:item.required ?? 0,
      deficit:numericDeficit(item),
      coverable:candidates.some((candidate) => candidate.impacts.some((candidateImpact) => candidateImpact.requirementId === item.id)),
    }));
  const unresolved = studentCase.requirements.filter((item) => {
    if (["충족", "면제", "비적용"].includes(item.status)) return false;
    if (item.kind !== "credit") return true;
    return !targets.find((target) => target.requirementId === item.id)?.coverable;
  });
  const minimalPath = calculateMinimalPath(candidates, targets);
  const notice = studentCase.id === "A"
    ? "학점 요건은 이미 충족되어 추가 과목을 추천하지 않습니다. 졸업확정신고만 필요합니다."
    : "제공된 졸업사정표에는 전체 수강과목이 없으므로 공식 교과목 후보를 제시합니다. 선택 전 u-SAINT 이수내역과 실제 개설 여부를 대조해야 합니다.";
  const result = { candidates, targets, minimalPath, unresolved, completedNames, notice };
  if (studentCase.id !== "I") planCache.set(studentCase.id, result);
  return result;
}

export function calculateWhatIf(studentCase: StudentCase, selected: CourseRecommendation[]): WhatIfResult {
  const plan = getCourseRecommendationPlan(studentCase);
  const selectedCredits = selected.reduce((sum, item) => sum + item.course.credits, 0);
  const rows = plan.targets.map((target): WhatIfRow => {
    const added = selected.reduce((sum, item) => sum + (item.impacts.find((impactItem) => impactItem.requirementId === target.requirementId)?.credits ?? 0), 0);
    const after = Math.min(target.required, target.before + added);
    const remaining = Math.max(0, target.required - after);
    return { ...target, added, after, remaining, resolved:remaining === 0 };
  });
  const projectedTotal = studentCase.totalEarned + selectedCredits;
  return {
    selectedCredits,
    projectedTotal,
    totalShortage:Math.max(0, studentCase.totalRequired - projectedTotal),
    rows,
  };
}
