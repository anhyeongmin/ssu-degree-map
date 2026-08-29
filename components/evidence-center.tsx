"use client";

import { AlertCircle, CheckCircle2, Clock3, FileCheck2, FileSearch, ShieldCheck, UploadCloud } from "lucide-react";
import type { StudentCase } from "@/lib/degree-map";
import { calculateEvidenceExpiry, getEvidenceRecords, type ExtendedRequirementStatus } from "@/lib/full-degree-map";

const statusClass: Record<ExtendedRequirementStatus, string> = {
  "충족":"status status-ok", "미충족":"status status-bad", "충족예정":"status status-planned",
  "면제":"status status-neutral", "비적용":"status status-neutral",
  "증빙 필요":"status status-evidence", "학과 확인 필요":"status status-check",
};

const stages = ["보유", "제출", "승인", "u-SAINT 반영"] as const;

export function EvidenceCenter({ studentCase }: { studentCase: StudentCase }) {
  const records = getEvidenceRecords(studentCase.id);
  return (
    <div className="evidence-shell">
      <section className="panel evidence-hero">
        <div><span className="engine-badge"><FileSearch /> E-01~04 증빙·행정</span><h2>달성 상태와 학교 반영 상태를 분리합니다</h2><p>원본 증빙은 이 공개 MVP나 Workers AI로 전송하지 않습니다. 구조화 상태만 관리합니다.</p></div>
        <div className="privacy-seal"><ShieldCheck /><div><strong>로컬·비식별 원칙</strong><span>원본 이미지 외부전송 없음</span></div></div>
      </section>

      <section className="panel evidence-workflow">
        <div className="panel-heading"><div><h2>증빙 이행 흐름</h2><p>보유 → 제출 → 승인 → u-SAINT 반영을 각각 기록합니다.</p></div><span className="verified-badge"><FileCheck2 /> {records.length}개 항목</span></div>
        <div className="evidence-list">
          {records.map((record) => {
            const expiry = calculateEvidenceExpiry(record);
            const currentIndex = stages.indexOf(record.stage as typeof stages[number]);
            return (
              <article key={record.id}>
                <div className="evidence-title"><div><span>{record.type}</span><strong>{record.title}</strong></div><span className={statusClass[record.status]}>{record.status}</span></div>
                <div className="stage-track">
                  {stages.map((stage, index) => <div key={stage} className={currentIndex >= index ? "done" : ""}><span>{currentIndex >= index ? <CheckCircle2 /> : <Clock3 />}</span><small>{stage}</small></div>)}
                  {currentIndex < 0 && <div className="stage-exception"><AlertCircle /><small>{record.stage}</small></div>}
                </div>
                <div className="evidence-detail">
                  <p><strong>다음 행동</strong>{record.nextAction}</p>
                  <p><strong>담당</strong>{record.office}</p>
                  <p><strong>만료 검증</strong>{expiry.message}</p>
                  <small>{record.basis}</small>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel local-evidence-note">
        <UploadCloud /><div><strong>증빙 AI 추출의 공개 데모 경계</strong><p>상세기획서의 자격증명·점수·취득일 추출 구조는 구현하되, 실제 개인정보 포함 원본은 학교 내부 환경에서만 처리해야 합니다. 현재 공개 배포판은 원본 업로드를 차단하고 익명 구조화 상태만 보여줍니다.</p></div>
      </section>
    </div>
  );
}
