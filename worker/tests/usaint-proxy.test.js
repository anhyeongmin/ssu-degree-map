import assert from "node:assert/strict";
import test from "node:test";
import {
  cookieHeader,
  openSession,
  sealSession,
  storeResponseCookies,
} from "../src/usaint-proxy.js";
import worker from "../src/index.js";

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

function request(path, body) {
  return new Request(`https://worker.example${path}`, {
    method:"POST",
    headers:{ origin:"https://anhyeongmin.github.io", "content-type":"application/json" },
    body:JSON.stringify(body),
  });
}

function mockResponse(url, body, init = {}) {
  const response = new Response(body, init);
  Object.defineProperty(response, "url", { value:url });
  return response;
}

test("로그인 왕복은 sToken과 WAF를 SSO에 전달하고 비밀번호를 세션에 저장하지 않는다", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const target = String(url);
    const headers = new Headers(init.headers);
    calls.push({ target, method:init.method, cookie:headers.get("cookie") || "", body:String(init.body || "") });
    if (target.endsWith("/Symtra_sso/smln.asp")) {
      return mockResponse(target, '<input value="TYPE" name="in_tp_bit"><input value="CAUSE" name="rqst_caus_cd">');
    }
    if (target.endsWith("/Symtra_sso/smln_pcs.asp")) {
      return mockResponse(target, "ok", { headers:{ "set-cookie":"sToken=login-token; Path=/; Secure; HttpOnly" } });
    }
    if (target === "https://saint.ssu.ac.kr/irj/portal") {
      return mockResponse(target, "portal", { headers:{ "set-cookie":"WAF=shield; Path=/; Secure" } });
    }
    if (target.startsWith("https://saint.ssu.ac.kr/webSSO/sso.jsp?")) {
      assert.match(headers.get("cookie") || "", /(?:^|; )sToken=login-token(?:;|$)/u);
      assert.match(headers.get("cookie") || "", /(?:^|; )WAF=shield(?:;|$)/u);
      return mockResponse(target, "signed in", { headers:{ "set-cookie":"MYSAPSSO2=sap-session; Domain=.ssu.ac.kr; Path=/; Secure; HttpOnly" } });
    }
    throw new Error(`Unexpected upstream URL: ${target}`);
  };

  try {
    const response = await worker.fetch(request("/usaint/login", { id:"20201234", password:"private-password" }), { SESSION_KEY:secret });
    assert.equal(response.status, 200);
    const output = await response.json();
    assert.equal(typeof output.session, "string");
    assert.equal(output.session.includes("private-password"), false);
    const opened = await openSession(output.session, secret);
    assert.equal(JSON.stringify(opened).includes("private-password"), false);
    assert.equal(opened.cookies.some((cookie) => cookie.name === "MYSAPSSO2"), true);
    assert.equal(calls.filter((call) => call.body.includes("private-password")).length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("u-SAINT 프록시는 추가 필드와 임의 WebDynpro URL을 거부한다", async () => {
  const env = { SESSION_KEY:secret };
  const malformedLogin = await worker.fetch(request("/usaint/login", { id:"20201234", password:"secret", savePassword:true }), env);
  assert.equal(malformedLogin.status, 400);

  const session = await sealSession({ cookies:[] }, secret);
  const arbitraryUrl = await worker.fetch(request("/usaint/graduation/event", {
    session,
    url:"https://example.com/private",
    form:"SAPEVENTQUEUE=test",
  }), env);
  assert.equal(arbitraryUrl.status, 400);
});

test("허용되지 않은 Origin은 인증 처리 전에 차단한다", async () => {
  const response = await worker.fetch(new Request("https://worker.example/usaint/login", {
    method:"POST",
    headers:{ origin:"https://evil.example", "content-type":"application/json" },
    body:JSON.stringify({ id:"20201234", password:"secret" }),
  }), { SESSION_KEY:secret });
  assert.equal(response.status, 403);
});

test("상태 확인은 암호화 비밀키 설정 여부만 공개한다", async () => {
  const ready = await worker.fetch(request("/usaint/status", {}), { SESSION_KEY:secret });
  assert.equal(ready.status, 200);
  assert.deepEqual(await ready.json(), {
    status:"ready",
    service:"u-SAINT encrypted session proxy",
    sessionEncryptionConfigured:true,
    sessionTtlSeconds:3600,
    storesCredentials:false,
  });

  const missing = await worker.fetch(request("/usaint/status", {}), {});
  assert.equal(missing.status, 503);
  assert.deepEqual(await missing.json(), {
    status:"configuration-required",
    sessionEncryptionConfigured:false,
  });
});

test("상태 확인 요청도 추가 필드를 거부한다", async () => {
  const response = await worker.fetch(request("/usaint/status", { revealSecret:true }), { SESSION_KEY:secret });
  assert.equal(response.status, 400);
});
