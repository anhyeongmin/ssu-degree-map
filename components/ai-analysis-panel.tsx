"use client";

import { useState } from "react";
import { AlertCircle, Bot, CheckCircle2, Clock3, RefreshCcw, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildAiPayload, type StudentCase } from "@/lib/degree-map";
import { hashPayload, readSessionCache, validateAiAnalysis, writeSessionCache, type AiAnalysis } from "@/lib/ai-analysis";

const workerUrl = process.env.NEXT_PUBLIC_AI_WORKER_URL ?? "";

type Props = { studentCase: StudentCase };

export function AiAnalysisPanel({ studentCase }: Props) {
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function requestAnalysis(force = false) {
    if (state === "loading") return;
    setState("loading");
    setErrorMessage("");
    const payload = buildAiPayload(studentCase);
    try {
      const inputHash = await hashPayload(payload);
      const cacheKey = `ssu-degree-map-ai:${studentCase.id}:${inputHash}`;
      if (!force) {
        const cached = readSessionCache(cacheKey);
        if (cached) {
          setAnalysis(cached);
          setState("success");
          return;
        }
      }
      if (!workerUrl) throw new Error("AI Worker 주소가 설정되지 않았습니다.");
      const response = await fetch(workerUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, inputHash }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !validateAiAnalysis(result)) {
        throw new Error(result?.error || "AI 응답 형식이 올바르지 않습니다.");
      }
      writeSessionCache(cacheKey, result);
      setAnalysis(result);
      setState("success");
    } catch (error) {
      setAnalysis(null);
      setState("error");
      setErrorMessage(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
    }
  }

  return (
    <section className="panel ai-panel" aria-live="polite">
      <div className="ai-panel-heading">
        <div>
          <div className="ai-badge"><Sparkles aria-hidden="true" /> AI 맞춤 분석</div>
          <h2>규칙 판정을 학생 관점으로 설명</h2>
          <p>버튼을 누를 때만 익명화된 구조화 데이터로 실제 Workers AI 추론을 실행합니다.</p>
        </div>
        {state !== "success" && (
          <Button onClick={() => requestAnalysis(false)} disabled={state === "loading"} className="ai-request-button">
            {state === "loading" ? <><Clock3 className="animate-spin" /> 분석 생성 중</> : <><Bot /> AI 맞춤 분석 받기</>}
          </Button>
        )}
      </div>

      {state === "idle" && (
        <div className="ai-empty"><Bot aria-hidden="true" /><div><strong>AI 분석은 자동 실행되지 않습니다.</strong><p>규칙 엔진의 판정은 위에서 바로 확인할 수 있으며, AI는 설명만 생성합니다.</p></div></div>
      )}

      {state === "loading" && (
        <div className="ai-skeleton" aria-label="AI 분석을 생성하는 중">
          <span /><span /><span /><span />
        </div>
      )}

      {state === "error" && (
        <div className="ai-error">
          <AlertCircle aria-hidden="true" />
          <div><strong>AI 맞춤 분석을 불러오지 못했습니다.</strong><p>아래의 규칙 기반 졸업요건 판정 결과는 계속 확인할 수 있습니다.</p><small>{errorMessage}</small></div>
          <Button variant="outline" size="sm" onClick={() => requestAnalysis(true)}><RefreshCcw /> 재시도</Button>
        </div>
      )}

      {state === "success" && analysis && (
        <div className="ai-result">
          <div className="ai-summary-grid">
            <div className="ai-summary-card"><span>현재 상태 요약</span><p>{analysis.summary}</p></div>
            <div className={`risk-card risk-${analysis.riskLevel.replace(" ", "-")}`}><span>위험 수준</span><strong>{analysis.riskLevel}</strong><p>{analysis.riskReason}</p></div>
          </div>
          <div className="ai-priorities">
            <h3>행동 우선순위</h3>
            {analysis.priorities.map((priority) => (
              <article key={`${priority.rank}-${priority.title}`}>
                <span className="priority-rank">{priority.rank}</span>
                <div><h4>{priority.title}</h4><p>{priority.reason}</p><strong>행동</strong><p>{priority.action}</p><small><ShieldCheck /> 근거: {priority.basis}</small></div>
              </article>
            ))}
          </div>
          {analysis.warnings.length > 0 && <div className="ai-warnings"><h3>증빙·학과 확인 필요</h3>{analysis.warnings.map((warning) => <p key={warning}><AlertCircle />{warning}</p>)}</div>}
          <div className="ai-meta">
            <span><Bot /> AI 생성 결과</span>
            <span>모델 {analysis.model}</span>
            <span>{new Date(analysis.generatedAt).toLocaleString("ko-KR")}</span>
            <Button variant="ghost" size="sm" onClick={() => requestAnalysis(true)}><RefreshCcw /> 새로 생성</Button>
          </div>
          <div className="ai-confidence"><CheckCircle2 /><p>{analysis.confidenceNote}</p></div>
        </div>
      )}

      <p className="ai-fixed-note">AI는 DegreeMap 규칙 엔진의 판정 결과를 이해하기 쉽게 설명합니다. 최종 졸업 판정은 u-SAINT 및 소속 학과 확인이 필요합니다.</p>
    </section>
  );
}
