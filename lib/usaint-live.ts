import { parseRusaintJsonFiles, type RusaintImportResult } from "./rusaint-import.ts";

export const USAINT_WORKER_URL = process.env.NEXT_PUBLIC_AI_WORKER_URL || "https://ssu-degree-map-ai.degreepath.workers.dev";
export const RUSAINT_WASM_BUILD = "20260902-sap-numeric-v2";

type ProxyResponse = { html:string; url:string; session:string };
type ProxyRequest = { url:string; form:string };
type AnonymousStudent = {
  grade:number; semester:number; status:string; apply_year:number; apply_type:string;
  department:string; majors:string[]; audit_date:string; graduation_points:number; completed_points:number;
};
type RequirementsOutput = { is_graduatable:boolean; requirements:Record<string, unknown> };

type WasmClient = {
  initialization_request():Promise<string>;
  apply_update(xml:string):void;
  anonymous_student_json():string;
  details_request():Promise<string>;
  requirements_json():string;
  free?():void;
};

type WasmModule = {
  default(input?:RequestInfo | URL | Response | BufferSource | WebAssembly.Module):Promise<unknown>;
  BrowserGraduationClient:new (html:string) => WasmClient;
};

export function connectionErrorMessage(error:unknown) {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }
  return "원인을 해석하지 못한 오류";
}

async function atStage<T>(stage:string, action:() => Promise<T> | T):Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw new Error(`${stage} 단계에서 실패했습니다: ${connectionErrorMessage(error)}`);
  }
}

async function workerPost<T>(path:string, body:unknown):Promise<T> {
  const response = await fetch(`${USAINT_WORKER_URL}${path}`, {
    method:"POST",
    headers:{ "content-type":"application/json" },
    body:JSON.stringify(body),
    cache:"no-store",
    credentials:"omit",
    referrerPolicy:"no-referrer",
  });
  const output = await response.json().catch(() => ({})) as { error?:string } & T;
  if (!response.ok) throw new Error(output.error || "u-SAINT 연결 요청에 실패했습니다.");
  return output;
}

export function rusaintAssetUrls(base:string | URL) {
  const moduleUrl = new URL("rusaint-web/degree_map_rusaint_web.js", base);
  const binaryUrl = new URL("rusaint-web/degree_map_rusaint_web_bg.wasm", base);
  moduleUrl.searchParams.set("v", RUSAINT_WASM_BUILD);
  binaryUrl.searchParams.set("v", RUSAINT_WASM_BUILD);
  return { moduleUrl:moduleUrl.href, binaryUrl:binaryUrl.href };
}

async function loadWasm():Promise<WasmModule> {
  const { moduleUrl, binaryUrl } = rusaintAssetUrls(document.baseURI);
  const wasmModule = await import(/* webpackIgnore: true */ moduleUrl) as WasmModule;
  await wasmModule.default(binaryUrl);
  return wasmModule;
}

async function runEvent(session:string, requestJson:string) {
  const request = JSON.parse(requestJson) as ProxyRequest;
  if (!request || typeof request.url !== "string" || typeof request.form !== "string") throw new Error("졸업사정 요청을 만들지 못했습니다.");
  return workerPost<ProxyResponse>("/usaint/graduation/event", { session, ...request });
}

export async function importLiveUSaint(id:string, password:string):Promise<RusaintImportResult> {
  const login = await atStage("통합로그인", () => workerPost<{ session:string }>("/usaint/login", { id, password }));
  let session = login.session;
  const initial = await atStage("졸업사정 화면 열기", () => workerPost<ProxyResponse>("/usaint/graduation/start", { session }));
  session = initial.session;
  const wasm = await atStage("rusaint WebAssembly 불러오기", loadWasm);
  const client = await atStage("졸업사정 화면 해석", () => new wasm.BrowserGraduationClient(initial.html));
  try {
    const initializationRequest = await atStage("WebDynpro 초기화 요청 생성", () => client.initialization_request());
    const initialized = await atStage("WebDynpro 초기화", () => runEvent(session, initializationRequest));
    session = initialized.session;
    await atStage("학생정보 화면 반영", () => client.apply_update(initialized.html));
    const student = await atStage("익명 학생정보 해석", () => JSON.parse(client.anonymous_student_json()) as AnonymousStudent);
    const detailsRequest = await atStage("세부 졸업요건 요청 생성", () => client.details_request());
    const details = await atStage("세부 졸업요건 조회", () => runEvent(session, detailsRequest));
    await atStage("세부 졸업요건 화면 반영", () => client.apply_update(details.html));
    const requirements = await atStage("졸업요건 표 해석", () => JSON.parse(client.requirements_json()) as RequirementsOutput);
    const result = await atStage("DegreeMap 판정 데이터 변환", () => parseRusaintJsonFiles([
      { name:"anonymous-graduation-student.json", text:JSON.stringify(student) },
      { name:"anonymous-graduation-requirements.json", text:JSON.stringify(requirements) },
    ]));
    result.studentCase.label = "내 u-SAINT · 직접 연결";
    result.studentCase.shortLabel = "내 u-SAINT";
    result.studentCase.dataNote = "현재 u-SAINT 졸업사정표를 브라우저에서 익명화·구조화한 결과입니다.";
    return result;
  } finally {
    client.free?.();
  }
}
