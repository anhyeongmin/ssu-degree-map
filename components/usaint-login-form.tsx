"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Laptop, LockKeyhole, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentCase } from "@/lib/degree-map";
import type { RusaintImportSummary } from "@/lib/rusaint-import";
import { importLiveUSaint } from "@/lib/usaint-live";

type Props = {
  onImported: (studentCase: StudentCase, summary: RusaintImportSummary) => void;
};

export function USaintLoginForm({ onImported }: Props) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function connectUSaint() {
    if (state === "loading") return;
    setState("loading");
    setMessage("");
    try {
      const result = await importLiveUSaint(studentId, password);
      setPassword("");
      setStudentId("");
      setState("success");
      setMessage("u-SAINT 졸업사정표를 익명화해 DegreeMap에 연결했습니다.");
      onImported(result.studentCase, result.summary);
    } catch (error) {
      setPassword("");
      setState("error");
      setMessage(error instanceof Error ? error.message : "u-SAINT 연결 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="usaint-login-form">
      <div className="usaint-login-fields">
        <label>
          <span>학번</span>
          <input
            inputMode="numeric"
            autoComplete="username"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value.replace(/\D/g, "").slice(0, 12))}
            placeholder="학번 입력"
            disabled={state === "loading"}
          />
        </label>
        <label>
          <span>비밀번호</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="숭실 통합로그인 비밀번호"
            disabled={state === "loading"}
            onKeyDown={(event) => { if (event.key === "Enter") void connectUSaint(); }}
          />
        </label>
        <Button className="import-action" onClick={connectUSaint} disabled={!studentId || !password || state === "loading"}>
          {state === "loading" ? <><Laptop className="animate-spin" /> 졸업사정표 연결 중</> : <><LogIn /> u-SAINT 로그인</>}
        </Button>
      </div>
      <div className="import-note"><LockKeyhole /><p><strong>계정정보는 저장하지 않습니다.</strong> 비밀번호는 통합로그인 요청 직후 폐기되며, 로그인 쿠키는 Worker의 비밀키로 암호화된 단기 토큰으로만 처리됩니다.</p></div>
      {state === "error" && <div className="import-result error"><AlertCircle /><div><strong>연결하지 못했습니다.</strong><p>{message}</p></div></div>}
      {state === "success" && <div className="import-result success"><CheckCircle2 /><div><strong>직접 연결 완료</strong><p>{message}</p></div></div>}
    </div>
  );
}
