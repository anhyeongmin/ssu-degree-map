"use client";

import { useMemo, useState } from "react";
import {
  Activity, AlertCircle, Bot, Check, CheckCircle2, Clock3, FileClock, FileSearch,
  GitCompareArrows, History, PlayCircle, RefreshCcw, ShieldCheck, ThumbsDown, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  baseAuditEvents, calculateRuleImpact, getIssueAnalytics, officialNoticeSamples,
  ruleCandidates as initialCandidates, ruleVersions, runRegressionSuite,
  type AuditEvent, type RuleCandidate, type RuleCandidateStatus,
} from "@/lib/full-degree-map";

type ExtractedCandidate = {
  title: string;
  conditionType: string;
  appliesTo: string;
  threshold: string;
  effectiveFrom: string;
  citedText: string;
  ambiguity: string;
  confidence: "높음" | "보통" | "확인 필요";
};

type ExtractionResponse = {
  candidates: ExtractedCandidate[];
  model: string;
  generatedAt: string;
  aiGenerated: true;
};

const workerUrl = process.env.NEXT_PUBLIC_AI_WORKER_URL ?? "";

function validateExtraction(value: unknown): value is ExtractionResponse {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return item.aiGenerated === true && typeof item.model === "string" && typeof item.generatedAt === "string"
    && Array.isArray(item.candidates) && item.candidates.length > 0 && item.candidates.length <= 8
    && item.candidates.every((candidate) => candidate && typeof candidate === "object"
      && ["title","conditionType","appliesTo","threshold","effectiveFrom","citedText","ambiguity","confidence"]
        .every((key) => typeof (candidate as Record<string, unknown>)[key] === "string"));
}

const statusOrder: RuleCandidateStatus[] = ["AI 추출 후보", "검토 대기", "수정 필요", "승인", "반려"];

export function AdminConsole() {
  const [candidates, setCandidates] = useState<RuleCandidate[]>(initialCandidates);
  const [selectedId, setSelectedId] = useState(initialCandidates[0].id);
  const [noticeId, setNoticeId] = useState<(typeof officialNoticeSamples)[number]["id"]>(officialNoticeSamples[0].id);
  const [extractState, setExtractState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [extractMeta, setExtractMeta] = useState<{ model:string; at:string } | null>(null);
  const [extractError, setExtractError] = useState("");
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(baseAuditEvents);
  const [regressionRuns, setRegressionRuns] = useState(0);
  const selected = candidates.find((item) => item.id === selectedId) ?? candidates[0];
  const impact = useMemo(() => calculateRuleImpact(selected), [selected]);
  const analytics = getIssueAnalytics();
  const regression = runRegressionSuite();

  function updateStatus(status: RuleCandidateStatus) {
    setCandidates((items) => items.map((item) => item.id === selected.id ? { ...item, status } : item));
    setAuditEvents((items) => [{
      id:`audit-ui-${Date.now()}`, at:new Date().toLocaleString("ko-KR"), actor:"시연 담당자",
      action:status, target:selected.title, detail:status === "승인" ? "승인된 규칙만 판정 후보 버전에 포함" : "공식 판정에는 반영하지 않음",
    }, ...items]);
  }

  async function extractRules() {
    const notice = officialNoticeSamples.find((item) => item.id === noticeId) ?? officialNoticeSamples[0];
    setExtractState("loading");
    setExtractError("");
    try {
      if (!workerUrl) throw new Error("AI Worker 주소가 설정되지 않았습니다.");
      const response = await fetch(workerUrl, {
        method:"POST", headers:{ "content-type":"application/json" },
        body:JSON.stringify({ task:"rule-extraction", sourceId:notice.id, sourceTitle:notice.title, sourceUrl:notice.url, sourceText:notice.text }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok || !validateExtraction(result)) {
        const message = result && typeof result === "object" && "error" in result ? String((result as { error?:unknown }).error) : "AI 규칙 후보 형식이 올바르지 않습니다.";
        throw new Error(message);
      }
      const mapped = result.candidates.map((item, index): RuleCandidate => ({
        id:`ai-${notice.id}-${Date.now()}-${index}`, title:item.title,
        department:notice.id.startsWith("me-") ? "기계공학부" : "AI소프트웨어학부",
        appliesFrom:Number(item.appliesTo.match(/20\d{2}/)?.[0] ?? 2020), appliesTo:null,
        relation:notice.id.startsWith("me-") ? "복수전공" : "주전공",
        conditionType:["최소학점","과목집합","최소개수","증빙","행정","AND 경로","OR 경로"].includes(item.conditionType)
          ? item.conditionType as RuleCandidate["conditionType"] : "과목집합",
        threshold:item.threshold, sourceTitle:notice.title, sourceUrl:notice.url,
        effectiveFrom:item.effectiveFrom, citedText:item.citedText, status:"AI 추출 후보",
        confidence:item.confidence, ambiguity:item.ambiguity, version:"AI-draft",
      }));
      setCandidates((items) => [...mapped, ...items]);
      setSelectedId(mapped[0].id);
      setExtractMeta({ model:result.model, at:result.generatedAt });
      setAuditEvents((items) => [{
        id:`audit-extract-${Date.now()}`, at:new Date().toLocaleString("ko-KR"), actor:"Workers AI",
        action:"규정 후보 추출", target:notice.title, detail:`${mapped.length}개 후보 생성 · 승인 전 공식 판정 미반영`,
      }, ...items]);
      setExtractState("success");
    } catch (error) {
      setExtractState("error");
      setExtractError(error instanceof Error ? error.message : "규정 후보 추출에 실패했습니다.");
    }
  }

  return (
    <div className="admin-shell">
      <section className="panel admin-hero">
        <div><span className="ai-badge"><ShieldCheck /> 관리자 MVP · A-01~06</span><h2>AI 후보를 검토한 뒤에만 규칙 엔진에 반영</h2><p>추출 → 승인 → 영향분석 → 회귀시험 → 배포 → 감사 흐름을 한 화면에서 재현합니다.</p></div>
        <div className="admin-gate"><span>공식 판정 게이트</span><strong>승인 규칙만 사용</strong><small>{candidates.filter((item) => item.status === "승인").length}/{candidates.length}개 승인</small></div>
      </section>

      <section className="panel extraction-panel">
        <div className="panel-heading"><div><h2>규정 후보 AI 추출</h2><p>A-01 실제 Workers AI가 선택한 공식 공지 문장에서 구조화 후보를 만듭니다.</p></div><span className="verified-badge"><Bot /> 원문 고정 입력</span></div>
        <div className="extract-controls">
          <label><span>공식 공지</span><select value={noticeId} onChange={(event) => setNoticeId(event.target.value as typeof noticeId)}>{officialNoticeSamples.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          <Button onClick={extractRules} disabled={extractState === "loading"}>{extractState === "loading" ? <><Clock3 className="animate-spin" /> 추출 중</> : <><FileSearch /> AI 규칙 후보 추출</>}</Button>
        </div>
        <blockquote>{officialNoticeSamples.find((item) => item.id === noticeId)?.text}</blockquote>
        {extractState === "error" && <div className="admin-error"><AlertCircle /><div><strong>AI 규정 추출 실패</strong><p>{extractError}</p></div><Button variant="outline" size="sm" onClick={extractRules}><RefreshCcw /> 재시도</Button></div>}
        {extractState === "success" && extractMeta && <div className="extraction-meta"><CheckCircle2 /> 실제 AI 후보 생성 완료 · 모델 {extractMeta.model} · {new Date(extractMeta.at).toLocaleString("ko-KR")}</div>}
      </section>

      <div className="admin-grid">
        <section className="panel candidate-panel-admin">
          <div className="panel-heading"><div><h2>담당자 승인 워크플로</h2><p>A-02 후보별 출처·적용대상·모호성을 검토합니다.</p></div></div>
          <div className="candidate-admin-layout">
            <nav>{statusOrder.map((status) => <div key={status}><span>{status}</span><strong>{candidates.filter((item) => item.status === status).length}</strong></div>)}</nav>
            <div className="candidate-admin-list">{candidates.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={item.id === selected.id ? "active" : ""}><span>{item.department} · {item.relation}</span><strong>{item.title}</strong><small>{item.threshold}</small><em>{item.status}</em></button>)}</div>
            <article className="candidate-review">
              <div><span className="operator-badge">{selected.conditionType}</span><span className={`confidence confidence-${selected.confidence.replace(" ", "-")}`}>신뢰 {selected.confidence}</span></div>
              <h3>{selected.title}</h3>
              <p><strong>적용</strong>{selected.appliesFrom}~{selected.appliesTo ?? "현재"}학번 · {selected.relation}</p>
              <p><strong>조건</strong>{selected.threshold}</p>
              <blockquote>{selected.citedText}</blockquote>
              <div className="ambiguity"><AlertCircle /><p><strong>모호성</strong>{selected.ambiguity}</p></div>
              <a href={selected.sourceUrl} target="_blank" rel="noreferrer">{selected.sourceTitle}</a>
              <div className="review-actions"><Button onClick={() => updateStatus("승인")}><Check /> 승인</Button><Button variant="outline" onClick={() => updateStatus("수정 필요")}><GitCompareArrows /> 수정 필요</Button><Button variant="outline" onClick={() => updateStatus("반려")}><ThumbsDown /> 반려</Button></div>
              <small>승인 전 후보는 학생 판정에 사용되지 않습니다.</small>
            </article>
          </div>
        </section>

        <section className="panel impact-panel">
          <div className="panel-heading"><div><h2>변경 영향 분석</h2><p>A-03 학과·학번·학생관계 조건으로 네 사례를 재평가합니다.</p></div><span className="verified-badge"><Users /> {impact.filter((item) => item.affected).length}명 영향</span></div>
          <div className="impact-list">{impact.map((item) => <article key={item.caseId} className={item.affected ? "affected" : ""}><span>{item.caseId}</span><div><strong>{item.label}</strong><p>{item.reason}</p><small>{item.before} → {item.after}</small></div><em>{item.affected ? "영향" : "제외"}</em></article>)}</div>
        </section>
      </div>

      <div className="admin-grid">
        <section className="panel version-panel">
          <div className="panel-heading"><div><h2>규칙 버전·감사기록</h2><p>A-04 시행일·승인자·변경·재현 정보를 보존합니다.</p></div><FileClock /></div>
          <div className="version-list">{ruleVersions.map((item) => <article key={item.id}><History /><div><strong>{item.ruleId} · {item.version}</strong><p>{item.change}</p><small>{item.effectiveFrom} · {item.approvedBy} · {item.source}</small></div><em>{item.status}</em></article>)}</div>
          <div className="audit-log">{auditEvents.slice(0, 8).map((item) => <p key={item.id}><span>{item.at}</span><strong>{item.action}</strong><em>{item.target}</em><small>{item.actor} · {item.detail}</small></p>)}</div>
        </section>

        <section className="panel analytics-panel">
          <div className="panel-heading"><div><h2>문의·오류 분석</h2><p>A-05 현재 익명 사례의 반복 위험요건을 집계합니다.</p></div><Activity /></div>
          <div className="analytics-cards">
            <article><span>전체 요건</span><strong>{analytics.totalRequirements}</strong></article>
            <article><span>학과 확인</span><strong>{analytics.confirmation}</strong></article>
            <article><span>행정 미완료</span><strong>{analytics.administrative}</strong></article>
            <article><span>출처 충돌</span><strong>{analytics.sourceConflicts}</strong></article>
          </div>
          <div className="topic-list">{analytics.repeatedTopics.map((item) => <p key={item.label}><span>{item.label}</span><strong>{item.count}건</strong></p>)}</div>
        </section>
      </div>

      <section className="panel regression-panel">
        <div className="panel-heading"><div><h2>규정 회귀시험</h2><p>A-06 학과·학번·상태 조합 216건으로 불확실성 보존과 분기 회귀를 검사합니다.</p></div><Button onClick={() => setRegressionRuns((value) => value + 1)}><PlayCircle /> 회귀시험 실행</Button></div>
        <div className="regression-summary">
          <div><span>시나리오</span><strong>{regression.total}</strong></div><div><span>통과</span><strong className="good-text">{regression.passed}</strong></div><div><span>실패</span><strong className={regression.failed ? "bad-text" : "good-text"}>{regression.failed}</strong></div><div><span>실행 횟수</span><strong>{regressionRuns}</strong></div>
        </div>
        <div className="coverage-tags">{regression.coverage.map((item) => <span key={item}>{item}</span>)}</div>
        <p className="regression-note"><ShieldCheck /> 동일 입력은 같은 판정경로를 만들고, 학과 확인 필요 항목은 승인 없이 충족·면제로 바뀌지 않습니다.</p>
      </section>
    </div>
  );
}
