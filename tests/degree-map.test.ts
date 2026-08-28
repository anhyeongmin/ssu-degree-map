import assert from "node:assert/strict";
import test from "node:test";
import { buildAiPayload, calculateProgress, studentCases } from "../lib/degree-map.ts";
import { catalogCourses, courseHistories, graduationRules, officialSources } from "../lib/curriculum-data.ts";

test("네 사례의 학점 진행률은 실제 인정학점에 따라 다르다", () => {
  const values = studentCases.map((item) => calculateProgress(item).creditPercent);
  assert.deepEqual(values, [100, 87.2, 45.5, 87.2]);
});

test("확인되지 않은 요건은 충족 분자에 포함되지 않는다", () => {
  const mechanical = studentCases.find((item) => item.id === "D")!;
  const progress = calculateProgress(mechanical);
  assert.ok(mechanical.requirements.some((item) => item.status === "학과 확인 필요"));
  assert.ok(progress.requirementNumerator < progress.requirementDenominator);
});

test("졸업유예 사례의 유일한 미충족 요건은 졸업확정신고다", () => {
  const item = studentCases.find((student) => student.id === "A")!;
  assert.deepEqual(item.requirements.filter((row) => row.status === "미충족").map((row) => row.name), ["졸업확정신고"]);
});

test("복수전공 사례는 주전공·복수전공·융합전공을 분리한다", () => {
  const item = studentCases.find((student) => student.id === "B")!;
  assert.ok(item.requirements.some((row) => row.group === "주전공"));
  assert.ok(item.requirements.some((row) => row.group === "복수전공"));
  assert.ok(item.requirements.some((row) => row.group === "융합전공"));
});

test("2학년 사례는 장기 이수요건을 충족예정으로 구분한다", () => {
  const item = studentCases.find((student) => student.id === "C")!;
  assert.ok(item.requirements.some((row) => row.status === "충족예정"));
});

test("AI 전송 데이터에는 직접 식별자나 원본 이미지가 없다", () => {
  const collectKeys = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(collectKeys);
    if (!value || typeof value !== "object") return [];
    return Object.entries(value).flatMap(([key, nested]) => [key, ...collectKeys(nested)]);
  };
  for (const item of studentCases) {
    const keys = collectKeys(buildAiPayload(item));
    for (const forbidden of ["studentName", "studentNumber", "birthDate", "phone", "email", "rawImage", "학번", "성명"]) {
      assert.equal(keys.includes(forbidden), false);
    }
  }
});

test("두 학부 공식 교과목에는 코드·학점·출처가 모두 있다", () => {
  assert.ok(catalogCourses.some((course) => course.department === "ai"));
  assert.ok(catalogCourses.some((course) => course.department === "mechanical"));
  for (const course of catalogCourses) {
    assert.match(course.code, /^\d{8}$/);
    assert.ok(course.credits > 0);
    assert.ok(officialSources.some((source) => source.id === course.sourceId));
  }
});

test("AI 2020학번과 2025학번 졸업학점 규칙을 분리한다", () => {
  const legacy = graduationRules.find((rule) => rule.id === "ai-2014-2023")!;
  const current = graduationRules.find((rule) => rule.id === "ai-2024-2025")!;
  assert.equal(legacy.values.find((value) => value.label === "전공기초")?.value, "18학점");
  assert.equal(current.values.find((value) => value.label === "전공기초")?.value, "15학점");
  assert.equal(legacy.values.find((value) => value.label === "전공합계")?.value, "66학점");
  assert.equal(current.values.find((value) => value.label === "전공합계")?.value, "72학점");
});

test("기계공학 복수전공은 42학점·복필 9학점이며 공개표 불일치를 자동 충족하지 않는다", () => {
  const rule = graduationRules.find((item) => item.id === "me-double")!;
  const markedCredits = catalogCourses
    .filter((course) => course.department === "mechanical" && course.doubleMajorRequired)
    .reduce((sum, course) => sum + course.credits, 0);
  assert.equal(rule.values.find((value) => value.label === "전공합계")?.value, "42학점 이상");
  assert.equal(rule.values.find((value) => value.label === "복수전공필수")?.value, "9학점 포함");
  assert.equal(markedCredits, 7);
  assert.equal(rule.status, "학과 확인 필요");
  assert.ok(courseHistories.some((history) => history.department === "mechanical" && history.kind === "공식 자료 충돌"));
});

test("동일 코드가 충돌하는 AI 과목은 확인 필요 상태로 보존한다", () => {
  const duplicated = catalogCourses.filter((course) => course.department === "ai" && course.code === "21500762");
  assert.deepEqual(duplicated.map((course) => course.name).sort(), ["멀티모달딥러닝", "클라우드컴퓨팅"].sort());
  assert.ok(duplicated.some((course) => course.verification === "공식 자료 충돌"));
});
