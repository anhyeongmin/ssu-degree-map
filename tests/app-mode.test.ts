import assert from "node:assert/strict";
import test from "node:test";
import { visibleStudentCases } from "../lib/app-mode.ts";
import { studentCases } from "../lib/degree-map.ts";

test("첫 화면에서는 졸업사정 사례를 노출하지 않는다", () => {
  assert.deepEqual(visibleStudentCases("entry", null), []);
});

test("데모 모드는 네 익명 사례만 제공한다", () => {
  assert.deepEqual(visibleStudentCases("demo", null).map((item) => item.id), ["A", "B", "C", "D"]);
});

test("로그인 모드는 연결한 학생 사례만 제공한다", () => {
  const imported = { ...studentCases[0], id:"I" as const, label:"내 u-SAINT · 직접 연결", shortLabel:"내 u-SAINT" };
  assert.deepEqual(visibleStudentCases("live", imported).map((item) => item.id), ["I"]);
});
