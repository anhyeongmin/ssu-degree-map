"use client";

import { ArrowRight, BarChart3, CheckCircle2, GraduationCap, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";
import { USaintLoginForm } from "@/components/usaint-login-form";
import type { StudentCase } from "@/lib/degree-map";
import type { RusaintImportSummary } from "@/lib/rusaint-import";

type Props = {
  onDemo: () => void;
  onAuthenticated: (studentCase: StudentCase, summary: RusaintImportSummary) => void;
};

export function EntryGateway({ onDemo, onAuthenticated }: Props) {
  return (
    <main className="entry-page">
      <header className="entry-topbar">
        <div className="entry-topbar-inner">
          <div className="brand" aria-label="SSU DegreeMap"><div className="brand-mark">SSU</div><div><strong>DegreeMap</strong><span>학사요건 분석 시스템</span></div></div>
          <span className="entry-security"><ShieldCheck /> 비밀번호 저장 없음 · AI 개인정보 전송 없음</span>
        </div>
      </header>

      <section className="entry-layout">
        <div className="entry-intro">
          <span className="entry-kicker"><Sparkles /> EVIDENCE-GROUNDED ACADEMIC NAVIGATOR</span>
          <h1>내 졸업요건을<br />한 번에 확인하세요.</h1>
          <p>u-SAINT 졸업사정표를 연결하면 현재 이수현황, 부족요건, 추천 과목과 다음 행동을 근거와 함께 분석합니다.</p>
          <div className="entry-benefits">
            <article><GraduationCap /><div><strong>졸업요건 자동 구조화</strong><span>학점·비학점·행정요건을 분리해 계산</span></div></article>
            <article><BarChart3 /><div><strong>부족 원인과 다음 행동</strong><span>추가 이수와 학과 확인 항목을 우선순위로 안내</span></div></article>
            <article><CheckCircle2 /><div><strong>근거 기반 AI 설명</strong><span>규칙 엔진의 판정을 변경하지 않고 이해하기 쉽게 설명</span></div></article>
          </div>
        </div>

        <div className="entry-actions">
          <section className="entry-login-panel">
            <div className="entry-card-heading">
              <span>내 정보로 시작</span>
              <h2>u-SAINT 로그인</h2>
              <p>별도의 DegreeMap 회원가입 없이 숭실 통합로그인으로 연결합니다.</p>
            </div>
            <USaintLoginForm onImported={onAuthenticated} />
          </section>

          <section className="entry-demo-panel">
            <div><PlayCircle /><div><strong>로그인 없이 기능을 먼저 확인해 보세요.</strong><span>졸업유예·복수전공·2학년·4학년 익명 사례가 제공됩니다.</span></div></div>
            <button type="button" onClick={onDemo}>데모로 확인하기 <ArrowRight /></button>
          </section>
        </div>
      </section>

      <footer className="entry-footer">
        <strong>데이터 처리 원칙</strong>
        <span>비밀번호는 저장하지 않으며, 졸업사정표는 브라우저에서 이름·학번을 제거한 뒤 분석합니다.</span>
        <span>최종 졸업 판정은 u-SAINT 및 소속 학과 확인이 필요합니다.</span>
      </footer>
    </main>
  );
}
