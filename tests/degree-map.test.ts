import assert from "node:assert/strict";
import test from "node:test";
import { buildAiPayload, calculateProgress, studentCases } from "../lib/degree-map.ts";

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
