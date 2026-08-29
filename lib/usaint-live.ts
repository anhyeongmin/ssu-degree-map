import { parseRusaintJsonFiles, type RusaintImportResult } from "./rusaint-import";

export const USAINT_WORKER_URL = process.env.NEXT_PUBLIC_AI_WORKER_URL || "https://ssu-degree-map-ai.degreepath.workers.dev";

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

async function workerPost<T>(path:string, body:unknown):Promise<T> {
  const response = await fetch(`${USAINT_WORKER_URL}${path}`, {
    method:"POST",
    headers:{ "content-type":"application/json" },
    body:JSON.stringify(body),
  });
  const output = await response.json().catch(() => ({})) as { error?:string } & T;
  if (!response.ok) throw new Error(output.error || "u-SAINT 연결 요청에 실패했습니다.");
  return output;
}

async function loadWasm():Promise<WasmModule> {
  const moduleUrl = new URL("rusaint-web/degree_map_rusaint_web.js", document.baseURI).href;
  const module = await import(/* webpackIgnore: true */ moduleUrl) as WasmModule;
  await module.default();
  return module;
}

async function runEvent(session:string, requestJson:string) {
  const request = JSON.parse(requestJson) as ProxyRequest;
  if (!request || typeof request.url !== "string" || typeof request.form !== "string") throw new Error("졸업사정 요청을 만들지 못했습니다.");
  return workerPost<ProxyResponse>("/usaint/graduation/event", { session, ...request });
}

export async function importLiveUSaint(id:string, password:string):Promise<RusaintImportResult> {
  const login = await workerPost<{ session:string }>("/usaint/login", { id, password });
  let session = login.session;
  const initial = await workerPost<ProxyResponse>("/usaint/graduation/start", { session });
  session = initial.session;
  const wasm = await loadWasm();
  const client = new wasm.BrowserGraduationClient(initial.html);
  try {
    const initialized = await runEvent(session, await client.initialization_request());
    session = initialized.session;
    client.apply_update(initialized.html);
    const student = JSON.parse(client.anonymous_student_json()) as AnonymousStudent;
    const details = await runEvent(session, await client.details_request());
    client.apply_update(details.html);
    const requirements = JSON.parse(client.requirements_json()) as RequirementsOutput;
    return parseRusaintJsonFiles([
      { name:"anonymous-graduation-student.json", text:JSON.stringify(student) },
      { name:"anonymous-graduation-requirements.json", text:JSON.stringify(requirements) },
    ]);
  } finally {
    client.free?.();
  }
}

