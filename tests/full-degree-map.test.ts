import test from "node:test";
import assert from "node:assert/strict";
import { studentCases } from "../lib/degree-map.ts";
import {
  allocateCredits,
  buildRequirementGraph,
  calculateOfficialExpected,
  calculateRuleImpact,
  getEvidenceRecords,
  getGeneralEducationRoutes,
  getPreferredGeneralEducationRoute,
  ruleCandidates,
  runRegressionSuite,
} from "../lib/full-degree-map.ts";

test("네 사례 모두 기존·통합 교양 경로를 독립 계산한다", () => {
  for (const item of studentCases) {
    const routes = getGeneralEducationRoutes(item.id);
    assert.equal(routes.length, 2);
    assert.ok(routes.some((route) => route.name.includes("기존조건")));
    assert.ok(routes.some((route) => route.name.includes("통합조건")));
    assert.ok(getPreferredGeneralEducationRoute(item.id));
  }
});

test("확인되지 않은 수강학점은 예상 총학점에 더하지 않는다", () => {
  for (const item of studentCases) {
    const result = calculateOfficialExpected(item);
    assert.equal(result.pendingCredits, 0);
    assert.equal(result.expected.credits, result.official.credits);
    assert.ok(result.expected.completed >= result.official.completed);
  }
});

test("요구조건 그래프는 교양 OR와 전체 AND를 보존한다", () => {
  const graph = buildRequirementGraph(studentCases[1]);
  assert.equal(graph.operator, "AND");
  assert.equal(graph.children?.[0].operator, "OR");
  assert.ok(graph.children?.some((item) => item.status === "학과 확인 필요"));
  assert.notEqual(graph.status, "충족");
});

test("다전공 배정은 승인되지 않은 과목을 자동 중복합산하지 않는다", () => {
  const result = allocateCredits(
    [
      {
        id: "verified",
        name: "승인 과목",
        credits: 3,
        eligibleTracks: ["주전공", "복수전공"],
        canDoubleCount: false,
        verified: true,
      },
      {
        id: "unknown",
        name: "미확인 과목",
        credits: 3,
        eligibleTracks: ["주전공", "복수전공"],
        canDoubleCount: true,
        verified: false,
      },
    ],
    { 주전공: 3, 복수전공: 3 },
  );
  assert.equal(result.allocations.filter((item) => item.attemptId === "verified").length, 1);
  assert.equal(result.allocations.filter((item) => item.attemptId === "unknown").length, 0);
  assert.ok(result.unresolved.some((item) => item.includes("미확인 과목")));
});

test("증빙은 학생 달성과 학교 반영 상태를 분리한다", () => {
  const records = getEvidenceRecords("A");
  assert.ok(records.some((item) => item.stage === "u-SAINT 반영"));
  assert.ok(records.some((item) => item.stage === "미보유"));
});

test("규정 변경 영향은 학과·학번·학생관계를 함께 적용한다", () => {
  const impact = calculateRuleImpact(ruleCandidates[0]);
  assert.equal(impact.length, 4);
  assert.ok(impact.some((item) => item.affected));
  assert.ok(impact.some((item) => !item.affected));
});

test("216개 표준 회귀 시나리오가 불확실성 보존 검사를 통과한다", () => {
  const result = runRegressionSuite();
  assert.equal(result.total, 216);
  assert.equal(result.failed, 0);
});
