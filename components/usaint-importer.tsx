"use client";

import { useRef, useState } from "react";
import {
  AlertCircle, CheckCircle2, Database, ExternalLink, FileJson2, Laptop,
  LockKeyhole, ShieldCheck, TerminalSquare, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentCase } from "@/lib/degree-map";
import {
  parseRusaintJsonFiles, type RusaintImportSummary,
} from "@/lib/rusaint-import";

type Props = {
  onImported: (studentCase: StudentCase, summary: RusaintImportSummary) => void;
};

const commands = [
  "rusaint --format json -o graduation-student.json graduation student-info",
  "rusaint --format json -o graduation-requirements.json graduation requirements",
  "rusaint --format json -o grades.json grades by-classification",
];

export function USaintImporter({ onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState<RusaintImportSummary | null>(null);

  async function importFiles() {
    if (!files.length || state === "loading") return;
    setState("loading");
    setMessage("");
    try {
      const contents = await Promise.all(files.map(async (file) => ({ name:file.name, text:await file.text() })));
      const result = parseRusaintJsonFiles(contents);
      setSummary(result.summary);
      setState("success");
      setMessage("로컬 분석 사례를 만들었습니다. 위 사례 선택기에서 ‘내 u-SAINT’를 선택해 졸업사정 결과와 AI 분석을 확인할 수 있습니다.");
      onImported(result.studentCase, result.summary);
    } catch (error) {
      setSummary(null);
      setState("error");
      setMessage(error instanceof Error ? error.message : "가져오기 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="usaint-import-shell">
      <section className="panel usaint-import-hero">
        <div>
          <span className="engine-badge"><Database /> RUSAINT LOCAL CONNECTOR</span>
          <h2>실제 u-SAINT 졸업사정 데이터를 DegreeMap으로 가져오기</h2>
          <p>rusaint가 생성한 JSON을 이 브라우저 안에서만 읽고, 이름·학번 등 개인 식별 필드를 제거한 뒤 기존 결정론적 규칙 엔진에 연결합니다.</p>
        </div>
        <div className="privacy-seal"><ShieldCheck /><div><strong>외부 업로드 없음</strong><span>원본 JSON은 Worker·AI로 전송하지 않음</span></div></div>
      </section>

      <div className="usaint-import-grid">
        <section className="panel importer-steps">
          <div className="panel-heading"><div><h2>1. PowerShell에서 JSON 만들기</h2><p>rusaint 설치와 로그인 설정을 마친 폴더에서 아래 명령을 실행합니다.</p></div><TerminalSquare /></div>
          <div className="command-list">
            {commands.map((command, index) => <div key={command}><span>{index + 1}</span><code>{command}</code></div>)}
          </div>
          <div className="import-note"><LockKeyhole /><p><strong>세션 파일은 선택하지 마세요.</strong> `session.json`, `.env`, 비밀번호·토큰·쿠키가 포함된 파일은 가져오기 검증기가 거부합니다.</p></div>
          <a className="upstream-link" href="https://github.com/EATSTEAK/rusaint/blob/main/packages/rusaint-cli/README.md" target="_blank" rel="noreferrer">rusaint CLI 설치·사용법 <ExternalLink /></a>
        </section>

        <section className="panel importer-upload">
          <div className="panel-heading"><div><h2>2. 결과 JSON 선택</h2><p>졸업요건 파일은 필수이며 학생정보·성적 파일은 함께 넣을수록 분석이 정확해집니다.</p></div><FileJson2 /></div>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            multiple
            onChange={(event) => {
              setFiles(Array.from(event.target.files ?? []));
              setState("idle");
              setSummary(null);
              setMessage("");
            }}
          />
          <button className="json-dropzone" type="button" onClick={() => inputRef.current?.click()}>
            <Upload /><strong>{files.length ? `${files.length}개 파일 선택됨` : "rusaint JSON 파일 선택"}</strong><span>최대 8개 · 합계 5MB · 브라우저 메모리에서만 처리</span>
          </button>
          {files.length > 0 && <div className="selected-json-files">{files.map((file) => <span key={`${file.name}-${file.size}`}><FileJson2 />{file.name}<small>{Math.max(1, Math.round(file.size / 1024))}KB</small></span>)}</div>}
          <Button className="import-action" onClick={importFiles} disabled={!files.length || state === "loading"}>
            {state === "loading" ? <><Laptop className="animate-spin" /> 로컬 구조화 중</> : <><Upload /> DegreeMap으로 가져오기</>}
          </Button>

          {state === "error" && <div className="import-result error"><AlertCircle /><div><strong>가져오지 못했습니다.</strong><p>{message}</p></div></div>}
          {state === "success" && summary && <div className="import-result success"><CheckCircle2 /><div><strong>익명 로컬 사례 생성 완료</strong><p>{message}</p><small>요건 {summary.requirementsImported}개 · 이수과목 {summary.coursesImported}개 · 제거한 개인정보 필드 {summary.personalFieldsRemoved.length}종</small>{summary.warnings.map((warning) => <em key={warning}>{warning}</em>)}</div></div>}
        </section>
      </div>

      <section className="panel importer-security">
        <ShieldCheck />
        <div><h2>데이터 경계</h2><p>브라우저가 읽는 원본에는 이름과 학번이 들어 있을 수 있지만, 생성되는 DegreeMap 사례에는 저장하지 않습니다. AI 버튼을 누를 때도 학과·입학연도·학년·전공관계·요건 상태·부족학점·근거만 전송합니다.</p></div>
        <div><span><CheckCircle2 /> 비밀번호·세션 차단</span><span><CheckCircle2 /> 개인정보 필드 제거</span><span><CheckCircle2 /> 원본 파일 미저장</span><span><CheckCircle2 /> 규칙 판정과 AI 설명 분리</span></div>
      </section>
    </div>
  );
}
