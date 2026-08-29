import assert from "node:assert/strict";
import test from "node:test";
import {
  cookieHeader,
  openSession,
  sealSession,
  storeResponseCookies,
} from "../src/usaint-proxy.js";

const secret = "0123456789abcdef0123456789abcdef";

test("u-SAINT 세션은 AES-GCM으로 암호화되고 만료시간을 검증한다", async () => {
  const token = await sealSession({ cookies:[{ name:"MYSAPSSO2", value:"private", domain:"ssu.ac.kr", path:"/", secure:true, hostOnly:false }] }, secret, 1_000);
  assert.equal(token.includes("private"), false);
  const opened = await openSession(token, secret, 2_000);
  assert.equal(opened.cookies[0].name, "MYSAPSSO2");
  await assert.rejects(() => openSession(token, secret, 3_601_001), /Expired session token/u);
});

test("암호화된 세션은 다른 키나 변조된 페이로드로 열리지 않는다", async () => {
  const token = await sealSession({ cookies:[] }, secret);
  await assert.rejects(() => openSession(token, "abcdef0123456789abcdef0123456789"));
  await assert.rejects(() => openSession(`${token.slice(0, -1)}x`, secret));
});

test("Set-Cookie의 도메인과 경로를 보존해 허용 대상에만 전송한다", () => {
  const headers = new Headers();
  headers.append("set-cookie", "MYSAPSSO2=abc; Domain=.ssu.ac.kr; Path=/; Secure; HttpOnly");
  const response = { url:"https://saint.ssu.ac.kr/webSSO/sso.jsp", headers };
  const jar = storeResponseCookies([], response);
  assert.equal(cookieHeader(jar, "https://ecc.ssu.ac.kr/sap/bc/webdynpro/SAP/ZCMW8015"), "MYSAPSSO2=abc");
  assert.equal(cookieHeader(jar, "https://example.com/"), "");
  assert.equal(cookieHeader(jar, "http://ecc.ssu.ac.kr/"), "");
});

test("동일 쿠키 갱신과 삭제를 중복 없이 처리한다", () => {
  const jar = [];
  storeResponseCookies(jar, { url:"https://smartid.ssu.ac.kr/", headers:new Headers({ "set-cookie":"sToken=one; Path=/; Secure" }) });
  storeResponseCookies(jar, { url:"https://smartid.ssu.ac.kr/", headers:new Headers({ "set-cookie":"sToken=two; Path=/; Secure" }) });
  assert.equal(jar.length, 1);
  assert.equal(jar[0].value, "two");
  storeResponseCookies(jar, { url:"https://smartid.ssu.ac.kr/", headers:new Headers({ "set-cookie":"sToken=gone; Path=/; Max-Age=0" }) });
  assert.equal(jar.length, 0);
});
