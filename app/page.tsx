"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, CircleHelp,
  FileCheck2, GraduationCap, Info, School, ShieldCheck, Sparkles,
} from "lucide-react";
import { AiAnalysisPanel } from "@/components/ai-analysis-panel";
import { AdminConsole } from "@/components/admin-console";
import { CourseRecommendationPlanner } from "@/components/course-recommendation-planner";
import { CurriculumExplorer } from "@/components/curriculum-explorer";
import { EvidenceCenter } from "@/components/evidence-center";
import { LifecycleDashboard } from "@/components/lifecycle-dashboard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calculateProgress, shortageLabel, studentCases, valueLabel,
  type Requirement, type RequirementStatus,
} from "@/lib/degree-map";

const statusStyle: Record<RequirementStatus, string> = {
  "충족": "status status-ok",
  "미충족": "status status-bad",
  "충족예정": "status status-planned",
  "면제": "status status-neutral",
  "증빙 필요": "status status-evidence",
  "학과 확인 필요": "status status-check",
  "비적용": "status status-neutral",
};

const isComplete = (status: RequirementStatus) => status === "충족" || status === "면제" || status === "비적용";

export default function Home() {
  const [caseId, setCaseId] = useState<"A" | "B" | "C" | "D">("A");
  const [selectedRow, setSelectedRow] = useState<Requirement | null>(null);
  const studentCase = useMemo(() => studentCases.find((item) => item.id === caseId) ?? studentCases[0], [caseId]);
  const progress = useMemo(() => calculateProgress(studentCase), [studentCase]);
  const actions = studentCase.requirements.filter((item) => !isComplete(item.status));
  const unmet = studentCase.requirements.filter((item) => item.status === "미충족");
  const confirmation = studentCase.requirements.filter((item) => item.status === "학과 확인 필요" || item.status === "증빙 필요");
  const summary = studentCase.id === "A"
    ? "추가 수강은 필요 없습니다. 졸업확정신고만 완료하면 됩니다."
    : studentCase.id === "C"
      ? "2학년 현재 이수 중인 요건과 장기 계획 대상을 구분해 표시합니다."
      : `${studentCase.totalRequired - studentCase.totalEarned}학점과 ${unmet.filter((item) => item.kind !== "credit").length}개 비학점·행정 요건을 확인해야 합니다.`;

  function changeCase(id: "A" | "B" | "C" | "D") {
    setCaseId(id);
    setSelectedRow(null);
  }

  return (
    <main className="min-h-screen bg-[#f3f5f8] text-[#1d2a3a]">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand" aria-label="SSU DegreeMap"><div className="brand-mark">SSU</div><div><strong>DegreeMap</strong><span>학사요건 분석 시스템</span></div></div>
          <div className="top-meta"><span>사례 2026.08.28 · 공식자료 2026.08.29</span><span className="divider" /><span>익명 졸업사정 사례</span></div>
        </div>
      </header>

      <div className="workspace">
        <div className="breadcrumb">학사관리 <ChevronRight /> 졸업사정 <ChevronRight /><strong>DegreeMap 분석</strong></div>
        <section className="page-heading">
          <div><p className="eyebrow">EVIDENCE-GROUNDED ACADEMIC NAVIGATOR</p><h1>전주기 졸업요건 분석</h1><p>익명 졸업사정 사례를 승인 규칙 그래프로 해석하고, 과목·증빙·행정·변경 영향을 한 화면에서 설명합니다.</p></div>
          <div className="profile-chip"><GraduationCap /><div><span>현재 선택 사례</span><strong>{studentCase.label}</strong></div></div>
        </section>

        <section className="case-switcher" aria-label="익명 학생 사례 선택">
          {studentCases.map((item) => (
            <button key={item.id} onClick={() => changeCase(item.id)} className={item.id === caseId ? "active" : ""} aria-pressed={item.id === caseId}>
              <span className="case-letter">{item.id}</span>
              <div><strong>{item.shortLabel}</strong><p>{item.department} · {item.yearLabel}</p><small>{item.totalEarned}/{item.totalRequired}학점 · {item.majorType}</small></div>
              {item.id === caseId && <CheckCircle2 aria-hidden="true" />}
            </button>
          ))}
        </section>

        <section className="case-context panel">
          <div><School /><span>학과·학년</span><strong>{studentCase.department} · {studentCase.yearLabel}</strong></div>
          <div><span>입학연도</span><strong>{studentCase.admissionYear}년</strong><small>{studentCase.semester}</small></div>
          <div><span>전공 구분</span><strong>{studentCase.majorType}</strong></div>
          <div><span>기존 u-SAINT 결과</span><strong className="bad-text">{studentCase.uSaintStatus}</strong><small>{studentCase.dataNote}</small></div>
        </section>

        <Tabs defaultValue="audit" className="degree-tabs">
          <TabsList variant="line" className="main-tabs">
            <TabsTrigger value="audit">졸업사정 결과</TabsTrigger>
            <TabsTrigger value="lifecycle">전주기 분석</TabsTrigger>
            <TabsTrigger value="recommend">과목 추천·What-if</TabsTrigger>
            <TabsTrigger value="curriculum">교과목·변경 이력</TabsTrigger>
            <TabsTrigger value="evidence">증빙·행정</TabsTrigger>
            <TabsTrigger value="progress">진행률 산식</TabsTrigger>
            <TabsTrigger value="rules">적용 규칙·근거</TabsTrigger>
            <TabsTrigger value="admin">관리자 콘솔</TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="tab-panel">
            <section className="decision-banner hold">
              <div className="decision-icon"><AlertCircle /></div>
              <div className="decision-copy"><span className="decision-label">기존 u-SAINT 졸업사정 결과</span><div className="decision-title-row"><h2>{studentCase.uSaintStatus}</h2><span>{progress.requirementNumerator}/{progress.requirementDenominator}개 확인 요건 충족</span></div><p>{summary}</p></div>
              <div className="decision-score"><strong>{progress.requirementPercent}%</strong><span>확인 요건 완료율</span><Progress value={progress.requirementPercent} aria-label={`확인 요건 완료율 ${progress.requirementPercent}%`} /></div>
            </section>

            <section className="progress-strip" aria-label="결정론적 진행률 요약">
              <div><span>학점 진행률</span><strong>{progress.creditPercent}%</strong><p>{progress.creditNumerator}/{progress.creditDenominator}학점</p></div>
              <div><span>비학점·행정 완료율</span><strong>{progress.nonCreditPercent}%</strong><p>{progress.nonCreditNumerator}/{progress.nonCreditDenominator}개</p></div>
              <div><span>미충족</span><strong>{unmet.length}개</strong><p>규칙 엔진 판정</p></div>
              <div><span>증빙·학과 확인</span><strong>{confirmation.length}개</strong><p>충족으로 간주하지 않음</p></div>
            </section>

            <div className="audit-grid">
              <section className="panel audit-table-panel">
                <div className="panel-heading"><div><h2>졸업사정표</h2><p>행을 선택하면 계산값·판정 이유·다음 행동·근거가 열립니다.</p></div><div className="credit-summary"><span>졸업필요학점 <strong>{studentCase.totalRequired}</strong></span><span>인정학점 <strong>{studentCase.totalEarned}</strong></span></div></div>
                <Table className="audit-table">
                  <TableHeader><TableRow><TableHead>구분</TableHead><TableHead>졸업요건</TableHead><TableHead className="text-right">기준</TableHead><TableHead className="text-right">인정/현황</TableHead><TableHead className="text-right">부족</TableHead><TableHead className="text-center">판정</TableHead><TableHead>사용 과목·증빙</TableHead><TableHead><span className="sr-only">상세</span></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {studentCase.requirements.map((row, index) => (
                      <TableRow key={row.id} className={!isComplete(row.status) ? "row-failed" : ""} tabIndex={0} onClick={() => setSelectedRow(row)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedRow(row); } }}>
                        <TableCell className="group-cell">{index === 0 || studentCase.requirements[index - 1]?.group !== row.group ? row.group : ""}</TableCell>
                        <TableCell className="requirement-cell">{row.name}</TableCell><TableCell className="text-right numeric">{valueLabel(row, "required")}</TableCell><TableCell className="text-right numeric strong">{valueLabel(row, "earned")}</TableCell>
                        <TableCell className={`text-right numeric ${shortageLabel(row) !== "-" ? "shortage" : ""}`}>{shortageLabel(row)}</TableCell>
                        <TableCell className="text-center"><span className={statusStyle[row.status]}>{row.status === "충족" && <Check />}{row.status}</span></TableCell>
                        <TableCell className="course-cell">{row.courses}</TableCell><TableCell><ChevronRight className="row-arrow" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>

              <aside className="action-stack">
                <section className="panel action-panel"><div className="panel-kicker"><Sparkles /> DEGREE MAP 규칙 해설</div><h2>앞으로 해야 할 일</h2><div className="action-list">{actions.slice(0, 6).map((item, index) => <button key={item.id} onClick={() => setSelectedRow(item)} className="action-item"><span>{index + 1}</span><div><strong>{item.name}</strong><p>{item.action}</p></div><ArrowRight /></button>)}</div></section>
                <section className="panel insight-panel"><div className="insight-icon"><ShieldCheck /></div><div><span>판정 원칙</span><strong>확인 불가 항목을 충족으로 계산하지 않음</strong><p>AI는 위 계산 결과를 변경하지 않고 설명만 생성합니다.</p></div></section>
              </aside>
            </div>

        <AiAnalysisPanel key={studentCase.id} studentCase={studentCase} />
          </TabsContent>

          <TabsContent value="lifecycle" className="tab-panel">
            <LifecycleDashboard key={studentCase.id} studentCase={studentCase} />
          </TabsContent>

          <TabsContent value="recommend" className="tab-panel">
            <CourseRecommendationPlanner key={studentCase.id} studentCase={studentCase} />
          </TabsContent>

          <TabsContent value="curriculum" className="tab-panel">
            <CurriculumExplorer key={studentCase.id} caseId={studentCase.id} />
          </TabsContent>

          <TabsContent value="evidence" className="tab-panel">
            <EvidenceCenter key={studentCase.id} studentCase={studentCase} />
          </TabsContent>

          <TabsContent value="progress" className="tab-panel">
            <section className="panel formula-panel">
              <div className="panel-heading"><div><h2>진행률 계산식</h2><p>AI가 아닌 고정된 규칙 엔진이 계산합니다.</p></div><span className="verified-badge"><ShieldCheck /> 결정론적 계산</span></div>
              <div className="formula-grid">
                <article><span>학점 진행률</span><strong>{progress.creditPercent}%</strong><code>min(인정 총학점 {progress.creditNumerator} ÷ 졸업학점 {progress.creditDenominator}, 1)</code><p>영역별 학점은 상세 판정에 쓰되 중복 합산을 피하려고 총 졸업학점 행만 분자·분모로 사용합니다.</p></article>
                <article><span>비학점·행정 완료율</span><strong>{progress.nonCreditPercent}%</strong><code>충족 {progress.nonCreditNumerator} ÷ 적용 요건 {progress.nonCreditDenominator}</code><p>충족예정·증빙 필요·학과 확인 필요·미충족은 완료 분자에 넣지 않습니다.</p></article>
                <article><span>전체 확인 요건 완료율</span><strong>{progress.requirementPercent}%</strong><code>충족 {progress.requirementNumerator} ÷ 확인 가능 요건 {progress.requirementDenominator}</code><p>비적용 항목은 분모에서 제외합니다. 제외: {progress.excluded.length ? progress.excluded.join(", ") : "없음"}</p></article>
              </div>
              <div className="rule-note"><Info /><p><strong>과장 방지</strong> 졸업논문·시험, 증빙, 학과 확인, 졸업확정신고 등은 학점과 분리합니다. 화면에서 확인되지 않은 값은 자동으로 충족 처리하지 않습니다.</p></div>
            </section>
          </TabsContent>

          <TabsContent value="rules" className="tab-panel">
            <section className="panel rules-panel">
              <div className="panel-heading"><div><h2>이번 판정에 사용한 근거</h2><p>제공된 졸업사정표에 실제 표시된 기준명과 상태만 사용했습니다.</p></div><span className="verified-badge"><ShieldCheck /> {studentCase.requirements.length}개 규칙</span></div>
              <div className="rule-list">{studentCase.requirements.map((row, index) => <button key={row.id} onClick={() => setSelectedRow(row)}><span className="rule-number">R{String(index + 1).padStart(2, "0")}</span><div><strong>{row.name}</strong><p>{row.source}</p></div><span className="rule-scope">{studentCase.admissionYear} · {row.group}</span><ChevronRight /></button>)}</div>
              <div className="rule-note"><Info /><p><strong>MVP 안내</strong> 이 시연판은 제공된 네 졸업사정표의 익명 구조화 데이터입니다. 최종 졸업 판정과 최신 규정 적용은 u-SAINT 및 소속 학과 확인이 필요합니다.</p></div>
            </section>
          </TabsContent>

          <TabsContent value="admin" className="tab-panel">
            <AdminConsole />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={Boolean(selectedRow)} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent className="detail-dialog sm:max-w-2xl">{selectedRow && <><DialogHeader><div className="dialog-status-row"><span className={statusStyle[selectedRow.status]}>{selectedRow.status}</span><span>{selectedRow.group}</span></div><DialogTitle>{selectedRow.name}</DialogTitle><DialogDescription>규칙 엔진에 사용된 값과 근거입니다.</DialogDescription></DialogHeader>
          <div className="detail-values"><div><span>졸업기준</span><strong>{valueLabel(selectedRow, "required")}</strong></div><div><span>인정/현황</span><strong>{valueLabel(selectedRow, "earned")}</strong></div><div><span>부족</span><strong className={shortageLabel(selectedRow) !== "-" ? "bad-text" : ""}>{shortageLabel(selectedRow)}</strong></div></div>
          <div className="explain-box"><div><CircleHelp /><span>왜 이렇게 판정됐나요?</span></div><p>{selectedRow.reason}</p></div>
          <div className="next-action-box"><div><FileCheck2 /><span>다음 행동</span></div><p>{selectedRow.action}</p></div>
          <div className="source-box"><BookOpen /><div><span>판정 근거</span><strong>{selectedRow.source}</strong></div><span className="source-version">자료 기준 2026.08.28</span></div></>}</DialogContent>
      </Dialog>
    </main>
  );
}
