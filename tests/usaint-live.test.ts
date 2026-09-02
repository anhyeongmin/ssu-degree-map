import assert from "node:assert/strict";
import test from "node:test";
import { connectionErrorMessage } from "../lib/usaint-live.ts";

test("Rust/WASM 문자열 예외를 사용자에게 보이는 원인으로 보존한다", () => {
  assert.equal(connectionErrorMessage("No such element: WD01"), "No such element: WD01");
});

test("Error 객체와 알 수 없는 예외를 안전한 문구로 정규화한다", () => {
  assert.equal(connectionErrorMessage(new Error("졸업요건 표 없음")), "졸업요건 표 없음");
  assert.equal(connectionErrorMessage({ reason:"private" }), "원인을 해석하지 못한 오류");
});
