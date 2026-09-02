const SMARTID_LOGIN_URL = "https://smartid.ssu.ac.kr/Symtra_sso/smln.asp";
const SMARTID_LOGIN_POST_URL = "https://smartid.ssu.ac.kr/Symtra_sso/smln_pcs.asp";
const USAINT_PORTAL_URL = "https://saint.ssu.ac.kr/irj/portal";
const USAINT_SSO_URL = "https://saint.ssu.ac.kr/webSSO/sso.jsp";
const GRADUATION_APP_URL = "https://ecc.ssu.ac.kr/sap/bc/webdynpro/SAP/ZCMW8015";
const SESSION_TTL_MS = 60 * 60 * 1000;
const MAX_LOGIN_BODY_BYTES = 8 * 1024;
const MAX_EVENT_BODY_BYTES = 128 * 1024;
const MAX_REDIRECTS = 8;
const BROWSER_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlDecode(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sessionKey(secret) {
  if (typeof secret !== "string" || secret.length < 32) throw new Error("SESSION_KEY is not configured");
  let bytes;
  try { bytes = base64UrlDecode(secret); } catch { bytes = new Uint8Array(); }
  if (bytes.byteLength !== 32 && encoder.encode(secret).byteLength === 32) bytes = encoder.encode(secret);
  if (bytes.byteLength !== 32) throw new Error("SESSION_KEY must contain exactly 32 bytes");
  return crypto.subtle.importKey("raw", bytes, { name:"AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function sealSession(value, secret, now = Date.now()) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await sessionKey(secret);
  const plaintext = encoder.encode(JSON.stringify({ ...value, issuedAt:now, expiresAt:now + SESSION_TTL_MS }));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name:"AES-GCM", iv }, key, plaintext));
  return `v1.${base64UrlEncode(iv)}.${base64UrlEncode(encrypted)}`;
}

export async function openSession(token, secret, now = Date.now()) {
  if (typeof token !== "string" || token.length > 24_000) throw new Error("Invalid session token");
  const [version, encodedIv, encodedPayload] = token.split(".");
  if (version !== "v1" || !encodedIv || !encodedPayload) throw new Error("Invalid session token");
  const key = await sessionKey(secret);
  const plaintext = await crypto.subtle.decrypt(
    { name:"AES-GCM", iv:base64UrlDecode(encodedIv) },
    key,
    base64UrlDecode(encodedPayload),
  );
  const value = JSON.parse(decoder.decode(plaintext));
  if (!value || !Array.isArray(value.cookies) || !Number.isFinite(value.expiresAt) || value.expiresAt <= now) {
    throw new Error("Expired session token");
  }
  return value;
}

function splitSetCookies(headers) {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const combined = headers.get("set-cookie");
  if (!combined) return [];
  return combined.split(/,(?=\s*[^;,=\s]+=[^;,]+)/u);
}

export function storeResponseCookies(jar, response) {
  const responseUrl = new URL(response.url);
  for (const header of splitSetCookies(response.headers)) {
    const parts = header.split(";").map((part) => part.trim()).filter(Boolean);
    const separator = parts[0]?.indexOf("=") ?? -1;
    if (separator <= 0) continue;
    const cookie = {
      name:parts[0].slice(0, separator),
      value:parts[0].slice(separator + 1),
      domain:responseUrl.hostname,
      path:"/",
      secure:false,
      hostOnly:true,
    };
    let remove = false;
    for (const attribute of parts.slice(1)) {
      const [rawName, ...rawValue] = attribute.split("=");
      const name = rawName.toLowerCase();
      const value = rawValue.join("=");
      if (name === "domain" && value) {
        cookie.domain = value.replace(/^\./u, "").toLowerCase();
        cookie.hostOnly = false;
      } else if (name === "path" && value) cookie.path = value;
      else if (name === "secure") cookie.secure = true;
      else if (name === "max-age" && Number(value) <= 0) remove = true;
      else if (name === "expires" && Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now()) remove = true;
    }
    const index = jar.findIndex((item) => item.name === cookie.name && item.domain === cookie.domain && item.path === cookie.path);
    if (index >= 0) jar.splice(index, 1);
    if (!remove && cookie.value) jar.push(cookie);
  }
  return jar;
}

export function cookieHeader(jar, targetUrl) {
  const url = new URL(targetUrl);
  return jar
    .filter((cookie) => {
      const domainMatches = cookie.hostOnly
        ? url.hostname === cookie.domain
        : url.hostname === cookie.domain || url.hostname.endsWith(`.${cookie.domain}`);
      return domainMatches && url.pathname.startsWith(cookie.path || "/") && (!cookie.secure || url.protocol === "https:");
    })
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

async function upstreamFetch(url, init, jar, fetchImpl = fetch) {
  let currentUrl = new URL(url);
  let method = init.method || "GET";
  let body = init.body;
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const headers = new Headers(init.headers || {});
    if (!headers.has("accept")) headers.set("accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
    if (!headers.has("accept-language")) headers.set("accept-language", "ko,en;q=0.9,en-US;q=0.8");
    if (!headers.has("cache-control")) headers.set("cache-control", "max-age=0");
    if (!headers.has("user-agent")) headers.set("user-agent", BROWSER_USER_AGENT);
    const cookies = cookieHeader(jar, currentUrl);
    if (cookies) headers.set("cookie", cookies);
    const response = await fetchImpl(currentUrl, { ...init, method, body, headers, redirect:"manual" });
    storeResponseCookies(jar, response);
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    if (!location) return response;
    currentUrl = new URL(location, currentUrl);
    if (response.status === 303 || ((response.status === 301 || response.status === 302) && method === "POST")) {
      method = "GET";
      body = undefined;
    }
  }
  throw new Error("Too many upstream redirects");
}

function hiddenInput(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const input = html.match(new RegExp(`<input\\b[^>]*\\bname=["']${escaped}["'][^>]*>`, "iu"))?.[0];
  return input?.match(/\bvalue=["']([^"']*)["']/iu)?.[1] || "";
}

function loginErrorMessage(html) {
  return html.match(/alert\(["']([^"']{1,200})["']\)/u)?.[1] || "아이디 또는 비밀번호를 확인해 주세요.";
}

function allowedGraduationUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.hostname === "ecc.ssu.ac.kr"
      && url.pathname.startsWith("/sap/bc/webdynpro/SAP/ZCMW8015");
  } catch {
    return false;
  }
}

function json(body, status, origin) {
  return Response.json(body, {
    status,
    headers:{
      "access-control-allow-origin":origin,
      "access-control-allow-methods":"POST, OPTIONS",
      "access-control-allow-headers":"content-type",
      "cache-control":"no-store",
      "vary":"Origin",
    },
  });
}

async function readJson(request, maxBytes) {
  const declared = Number(request.headers.get("content-length") || "0");
  if (declared > maxBytes) throw new Error("BODY_TOO_LARGE");
  const text = await request.text();
  if (encoder.encode(text).byteLength > maxBytes) throw new Error("BODY_TOO_LARGE");
  return JSON.parse(text);
}

async function login(request, env, origin) {
  const body = await readJson(request, MAX_LOGIN_BODY_BYTES);
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !["id", "password"].includes(key))) {
    return json({ error:"로그인 요청 형식이 올바르지 않습니다." }, 400, origin);
  }
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^\d{5,12}$/u.test(id) || password.length < 1 || password.length > 200) {
    return json({ error:"아이디 또는 비밀번호 형식이 올바르지 않습니다." }, 400, origin);
  }
  const cookies = [];
  const formResponse = await upstreamFetch(SMARTID_LOGIN_URL, { method:"GET" }, cookies);
  const formHtml = await formResponse.text();
  const inTpBit = hiddenInput(formHtml, "in_tp_bit");
  const requestCause = hiddenInput(formHtml, "rqst_caus_cd");
  if (!inTpBit || !requestCause) return json({ error:"숭실 통합로그인 화면을 읽지 못했습니다." }, 502, origin);

  const form = new URLSearchParams({ in_tp_bit:inTpBit, rqst_caus_cd:requestCause, userid:id, pwd:password });
  const loginResponse = await upstreamFetch(SMARTID_LOGIN_POST_URL, {
    method:"POST",
    headers:{ "content-type":"application/x-www-form-urlencoded" },
    body:form.toString(),
  }, cookies);
  const tokenCookie = cookies.find((cookie) => cookie.name === "sToken" && cookie.value);
  if (!tokenCookie) return json({ error:loginErrorMessage(await loginResponse.text()) }, 401, origin);

  await upstreamFetch(USAINT_PORTAL_URL, { method:"GET" }, cookies);
  const ssoUrl = new URL(USAINT_SSO_URL);
  ssoUrl.searchParams.set("sToken", tokenCookie.value);
  ssoUrl.searchParams.set("sIdno", id);
  await upstreamFetch(ssoUrl, { method:"GET" }, cookies);
  if (!cookies.some((cookie) => cookie.name === "MYSAPSSO2" && cookie.value)) {
    return json({ error:"u-SAINT 인증 세션을 만들지 못했습니다." }, 502, origin);
  }
  const session = await sealSession({ cookies }, env.SESSION_KEY);
  return json({ session, expiresInSeconds:SESSION_TTL_MS / 1000 }, 200, origin);
}

async function graduationStart(request, env, origin) {
  const body = await readJson(request, MAX_LOGIN_BODY_BYTES);
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => key !== "session")) {
    return json({ error:"졸업사정 시작 요청 형식이 올바르지 않습니다." }, 400, origin);
  }
  const session = await openSession(body.session, env.SESSION_KEY);
  const response = await upstreamFetch(GRADUATION_APP_URL, { method:"GET" }, session.cookies);
  if (!response.ok) return json({ error:"u-SAINT 졸업사정표를 불러오지 못했습니다." }, 502, origin);
  const html = await response.text();
  const refreshedSession = await sealSession({ cookies:session.cookies }, env.SESSION_KEY);
  return json({ html, url:response.url, session:refreshedSession }, 200, origin);
}

async function graduationEvent(request, env, origin) {
  const body = await readJson(request, MAX_EVENT_BODY_BYTES);
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !["session", "url", "form"].includes(key))) {
    return json({ error:"졸업사정 이벤트 요청 형식이 올바르지 않습니다." }, 400, origin);
  }
  if (!allowedGraduationUrl(body.url) || typeof body.form !== "string" || body.form.length > 96 * 1024) {
    return json({ error:"허용되지 않은 졸업사정 요청입니다." }, 400, origin);
  }
  const session = await openSession(body.session, env.SESSION_KEY);
  const response = await upstreamFetch(body.url, {
    method:"POST",
    headers:{
      "accept":"*/*",
      "content-type":"application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with":"XMLHttpRequest",
    },
    body:body.form,
  }, session.cookies);
  if (!response.ok) return json({ error:"u-SAINT 졸업사정 이벤트 처리에 실패했습니다." }, 502, origin);
  const html = await response.text();
  const refreshedSession = await sealSession({ cookies:session.cookies }, env.SESSION_KEY);
  return json({ html, url:response.url, session:refreshedSession }, 200, origin);
}

export async function handleUSaintRequest(request, env, origin) {
  try {
    const path = new URL(request.url).pathname;
    if (path === "/usaint/login") return login(request, env, origin);
    if (path === "/usaint/graduation/start") return graduationStart(request, env, origin);
    if (path === "/usaint/graduation/event") return graduationEvent(request, env, origin);
    return json({ error:"지원하지 않는 u-SAINT 요청입니다." }, 404, origin);
  } catch (error) {
    if (error instanceof SyntaxError) return json({ error:"JSON 요청만 허용됩니다." }, 400, origin);
    if (error instanceof Error && error.message === "BODY_TOO_LARGE") return json({ error:"요청 본문이 너무 큽니다." }, 413, origin);
    if (error instanceof Error && /session token|decrypt|SESSION_KEY/iu.test(error.message)) {
      return json({ error:"로그인 세션이 만료되었거나 올바르지 않습니다. 다시 로그인해 주세요." }, 401, origin);
    }
    return json({ error:"u-SAINT 연결에 실패했습니다. 잠시 후 다시 시도해 주세요." }, 502, origin);
  }
}
