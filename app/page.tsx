"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight,
  CircleHelp, FileCheck2, GraduationCap, Info, RotateCcw, ShieldCheck, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Scenario = "record-only" | "credit-risk";
type Status = "충족" | "미충족" | "면제" | "학과확인";
type RequirementRow = {
  id: string; group: string; name: string; required: string; earned: string;
  shortage: string; status: Status; courses: string; reason: string; action: string; source: string;
};

const initialFlags = { chapel: true, thesis: true, graduationReport: false };
const statusStyle: Record<Status, string> = {
  충족: "status status-ok", 미충족: "status status-bad",
  면제: "status status-neutral", 학과확인: "status status-check",
};

function buildRows(scenario: Scenario, flags: typeof initialFlags): RequirementRow[] {
  const creditRisk = scenario === "credit-risk";
  const totalEarned = creditRisk ? 130 : 135;
  const majorElective = creditRisk ? 33 : 45;
  return [
    {
      id: "total", group: "졸업학점", name: "총 졸업학점", required: "133학점",
      earned: `${totalEarned}학점`, shortage: totalEarned >= 133 ? "-" : `${133 - totalEarned}학점`,
      status: totalEarned >= 133 ? "충족" : "미충족", courses: "전체 인정 교과목",
      reason: totalEarned >= 133 ? `졸업기준 133학점보다 ${totalEarned - 133}학점 많습니다.` : `졸업기준 133학점까지 ${133 - totalEarned}학점이 부족합니다.`,
      action: totalEarned >= 133 ? "추가 학점 이수는 필요하지 않습니다." : "3학점 교과목 1개를 추가 이수해야 합니다.",
      source: "2020학년도 AI소프트웨어학부 교과과정표 · 총 졸업학점 기준",
    },
    {
      id: "major-required", group: "주전공", name: "전공필수", required: "24학점", earned: "27학점",
      shortage: "-", status: "충족", courses: "자료구조, 알고리즘 외 7과목",
      reason: "전공필수 인정 과목 9개, 27학점을 이수했습니다.", action: "추가 이수가 필요하지 않습니다.",
      source: "AI소프트웨어학부 2020학번 전공필수 이수체계",
    },
    {
      id: "major-elective", group: "주전공", name: "전공선택", required: "36학점",
      earned: `${majorElective}학점`, shortage: majorElective >= 36 ? "-" : `${36 - majorElective}학점`,
      status: majorElective >= 36 ? "충족" : "미충족",
      courses: creditRisk ? "인공지능, 컴퓨터비전 외 9과목" : "인공지능, 컴퓨터비전 외 13과목",
      reason: majorElective >= 36 ? `전공선택 기준보다 ${majorElective - 36}학점 많습니다.` : `전공선택 최소 36학점까지 ${36 - majorElective}학점이 부족합니다.`,
      action: majorElective >= 36 ? "추가 이수가 필요하지 않습니다." : "전공선택 3학점 교과목 1개를 우선 이수하세요.",
      source: "AI소프트웨어학부 2020학번 전공 이수학점 기준",
    },
    {
      id: "liberal-required", group: "교양", name: "교양필수", required: "15학점", earned: "16학점",
      shortage: "-", status: "충족", courses: "Academic Writing, 대학한국어 외",
      reason: "교양필수 최소학점과 필수영역을 모두 충족했습니다.", action: "추가 이수가 필요하지 않습니다.",
      source: "2020학년도 교양교육과정 이수체계",
    },
    {
      id: "liberal-elective", group: "교양", name: "교양선택", required: "12학점", earned: "14학점",
      shortage: "-", status: "충족", courses: "인간과성서, 과학기술과사회 외",
      reason: "교양 기존조건과 통합조건을 비교한 결과 두 경로 모두 충족합니다.",
      action: "현재 학생에게 더 유리한 통합조건을 적용했습니다.", source: "교양 기존조건·통합조건 적용 안내",
    },
    {
      id: "chapel", group: "비학점 요건", name: "채플", required: "6학기",
      earned: flags.chapel ? "6학기" : "5학기", shortage: flags.chapel ? "-" : "1학기",
      status: flags.chapel ? "충족" : "미충족", courses: flags.chapel ? "채플 1~6" : "채플 1~5",
      reason: flags.chapel ? "필수 채플 6학기 이수 기록이 확인됩니다." : "필수 채플 이수 기록이 1학기 부족합니다.",
      action: flags.chapel ? "추가 이수가 필요하지 않습니다." : "다음 학기에 채플 1개 분반을 신청하세요.",
      source: "학사관리시스템 채플 이수기준",
    },
    {
      id: "thesis", group: "학과 졸업요건", name: "졸업논문·대체실적", required: "합격 또는 면제",
      earned: flags.thesis ? "대체실적 승인" : "미제출", shortage: flags.thesis ? "-" : "증빙 1건",
      status: flags.thesis ? "면제" : "미충족", courses: flags.thesis ? "교내 경진대회 수상실적" : "-",
      reason: flags.thesis ? "승인된 수상실적으로 졸업논문 요건이 대체되었습니다." : "졸업논문 또는 학과가 인정하는 대체실적이 없습니다.",
      action: flags.thesis ? "대체 승인 기록을 유지하세요." : "졸업논문을 제출하거나 대체실적 증빙을 학과에 제출하세요.",
      source: "AI소프트웨어학부 졸업논문 및 대체실적 안내",
    },
    {
      id: "report", group: "행정 요건", name: "졸업확정신고", required: "신고 완료",
      earned: flags.graduationReport ? "신고 완료" : "미신고", shortage: flags.graduationReport ? "-" : "신고 1건",
      status: flags.graduationReport ? "충족" : "미충족", courses: "수강과목 아님",
      reason: flags.graduationReport ? "졸업확정신고가 정상 접수되었습니다." : "학점은 충분하지만 졸업확정신고가 완료되지 않았습니다.",
      action: flags.graduationReport ? "별도 조치가 필요하지 않습니다." : "u-SAINT에서 졸업확정신고를 완료하세요. 추가 수강은 필요 없습니다.",
      source: "2026년 8월 졸업예정자 졸업사정표 확인 안내",
    },
  ];
}

export default function Home() {
  const [scenario, setScenario] = useState<Scenario>("record-only");
  const [flags, setFlags] = useState(initialFlags);
  const [selectedRow, setSelectedRow] = useState<RequirementRow | null>(null);
  const rows = useMemo(() => buildRows(scenario, flags), [scenario, flags]);
  const failed = rows.filter((row) => row.status === "미충족");
  const satisfied = rows.length - failed.length;
  const completion = Math.round((satisfied / rows.length) * 100);
  const totalEarned = scenario === "credit-risk" ? 130 : 135;
  const overallPass = failed.length === 0;
  const summary = overallPass
    ? "모든 졸업요건을 충족했습니다. 졸업사정 최종 확인만 남았습니다."
    : failed.length === 1 && failed[0]?.id === "report"
      ? "추가 수강은 필요 없습니다. 졸업확정신고만 완료하면 됩니다."
      : `${failed.map((item) => item.name).join(", ")} 요건을 먼저 해결해야 합니다.`;
  const reset = () => { setScenario("record-only"); setFlags(initialFlags); };

  return (
    <main className="min-h-screen bg-[#f3f5f8] text-[#1d2a3a]">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand" aria-label="SSU DegreeMap">
            <div className="brand-mark">SSU</div>
            <div><strong>DegreeMap</strong><span>학사요건 분석 시스템</span></div>
          </div>
          <div className="top-meta"><span>2026.08.28 기준</span><span className="divider" /><span>안형민 · AI소프트웨어학부</span></div>
        </div>
      </header>

      <div className="workspace">
        <div className="breadcrumb">
          학사관리 <ChevronRight aria-hidden="true" /> 졸업사정 <ChevronRight aria-hidden="true" /><strong>DegreeMap 분석</strong>
        </div>
        <section className="page-heading">
          <div>
            <p className="eyebrow">MY GRADUATION AUDIT</p>
            <h1>졸업사정 분석</h1>
            <p>기존 졸업사정표의 판정에 부족 원인, 다음 행동, 공식 근거를 연결합니다.</p>
          </div>
          <div className="profile-chip"><GraduationCap aria-hidden="true" /><div><span>적용 교과과정</span><strong>2020학번 · AI소프트웨어학부</strong></div></div>
        </section>

        <Tabs defaultValue="audit" className="degree-tabs">
          <TabsList variant="line" className="main-tabs">
            <TabsTrigger value="audit">졸업사정 결과</TabsTrigger>
            <TabsTrigger value="edit">이수내역 편집</TabsTrigger>
            <TabsTrigger value="rules">적용 규칙·근거</TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="tab-panel">
            <section className={`decision-banner ${overallPass ? "pass" : "hold"}`}>
              <div className="decision-icon">{overallPass ? <CheckCircle2 /> : <AlertCircle />}</div>
              <div className="decision-copy">
                <span className="decision-label">현재 졸업판정</span>
                <div className="decision-title-row"><h2>{overallPass ? "졸업요건 충족" : "졸업요건 미충족"}</h2><span>{satisfied}/{rows.length}개 요건 완료</span></div>
                <p>{summary}</p>
              </div>
              <div className="decision-score"><strong>{completion}%</strong><span>요건 완료율</span><Progress value={completion} aria-label={`요건 완료율 ${completion}%`} /></div>
            </section>

            <div className="audit-grid">
              <section className="panel audit-table-panel">
                <div className="panel-heading">
                  <div><h2>졸업사정표</h2><p>행을 선택하면 판정 이유와 공식 근거를 확인할 수 있습니다.</p></div>
                  <div className="credit-summary"><span>졸업필요학점 <strong>133</strong></span><span>인정학점 <strong>{totalEarned}</strong></span></div>
                </div>
                <Table className="audit-table">
                  <TableHeader><TableRow>
                    <TableHead>구분</TableHead><TableHead>졸업요건</TableHead><TableHead className="text-right">기준</TableHead>
                    <TableHead className="text-right">인정/현황</TableHead><TableHead className="text-right">부족</TableHead>
                    <TableHead className="text-center">판정</TableHead><TableHead>사용 과목·증빙</TableHead><TableHead><span className="sr-only">상세</span></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow key={row.id} className={row.status === "미충족" ? "row-failed" : ""} tabIndex={0}
                        onClick={() => setSelectedRow(row)}
                        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedRow(row); } }}>
                        <TableCell className="group-cell">{index === 0 || rows[index - 1]?.group !== row.group ? row.group : ""}</TableCell>
                        <TableCell className="requirement-cell">{row.name}</TableCell>
                        <TableCell className="text-right numeric">{row.required}</TableCell>
                        <TableCell className="text-right numeric strong">{row.earned}</TableCell>
                        <TableCell className={`text-right numeric ${row.shortage !== "-" ? "shortage" : ""}`}>{row.shortage}</TableCell>
                        <TableCell className="text-center"><span className={statusStyle[row.status]}>{row.status === "충족" && <Check aria-hidden="true" />}{row.status}</span></TableCell>
                        <TableCell className="course-cell">{row.courses}</TableCell><TableCell><ChevronRight className="row-arrow" aria-hidden="true" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>

              <aside className="action-stack">
                <section className="panel action-panel">
                  <div className="panel-kicker"><Sparkles aria-hidden="true" /> DEGREE MAP 해설</div><h2>지금 해야 할 일</h2>
                  {failed.length ? <div className="action-list">{failed.map((item, index) => (
                    <button key={item.id} onClick={() => setSelectedRow(item)} className="action-item">
                      <span>{index + 1}</span><div><strong>{item.name}</strong><p>{item.action}</p></div><ArrowRight aria-hidden="true" />
                    </button>
                  ))}</div> : <div className="all-clear"><CheckCircle2 aria-hidden="true" /><strong>필수 조치가 없습니다.</strong><p>모든 학점·비학점·행정 요건이 충족되었습니다.</p></div>}
                </section>
                <section className="panel insight-panel"><div className="insight-icon"><ShieldCheck aria-hidden="true" /></div><div><span>판정 신뢰도</span><strong>공식 규칙 8개와 대조 완료</strong><p>확정 판정은 승인된 규칙 엔진이 계산하며, 설명은 해당 근거만 사용합니다.</p></div></section>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="edit" className="tab-panel">
            <div className="editor-grid">
              <section className="panel form-panel">
                <div className="panel-heading"><div><h2>시연용 학생 데이터</h2><p>조건을 바꾸면 졸업사정 결과가 즉시 다시 계산됩니다.</p></div><Button variant="outline" size="sm" onClick={reset}><RotateCcw aria-hidden="true" /> 초기화</Button></div>
                <div className="form-section">
                  <label htmlFor="scenario">성적표 시나리오</label>
                  <Select value={scenario} onValueChange={(value) => setScenario(value as Scenario)}>
                    <SelectTrigger id="scenario" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="record-only">135학점 이수 · 졸업확정신고만 미완료</SelectItem><SelectItem value="credit-risk">130학점 이수 · 전공선택 3학점 부족</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="form-section">
                  <span className="form-label">비학점·행정 요건</span>
                  <div className="check-list">
                    <label><Checkbox checked={flags.chapel} onCheckedChange={(checked) => setFlags((prev) => ({ ...prev, chapel: checked === true }))} /><div><strong>채플 6학기</strong><span>필수 채플 이수 기록</span></div></label>
                    <label><Checkbox checked={flags.thesis} onCheckedChange={(checked) => setFlags((prev) => ({ ...prev, thesis: checked === true }))} /><div><strong>졸업논문·대체실적</strong><span>논문 합격 또는 대체실적 승인</span></div></label>
                    <label><Checkbox checked={flags.graduationReport} onCheckedChange={(checked) => setFlags((prev) => ({ ...prev, graduationReport: checked === true }))} /><div><strong>졸업확정신고</strong><span>u-SAINT 졸업확정신고 접수 여부</span></div></label>
                  </div>
                </div>
              </section>
              <section className="panel live-result">
                <div className="panel-kicker"><Sparkles aria-hidden="true" /> LIVE AUDIT</div><h2>{overallPass ? "졸업요건 충족" : `${failed.length}개 요건 미충족`}</h2><p>{summary}</p>
                <div className="live-metrics"><div><span>인정학점</span><strong>{totalEarned}<small>/133</small></strong></div><div><span>완료요건</span><strong>{satisfied}<small>/{rows.length}</small></strong></div><div><span>판정</span><strong className={overallPass ? "good-text" : "bad-text"}>{overallPass ? "가능" : "보류"}</strong></div></div>
                <div className="mini-actions">{failed.map((item) => <button key={item.id} onClick={() => setSelectedRow(item)}><AlertCircle aria-hidden="true" /><span><strong>{item.name}</strong>{item.shortage} 부족</span><ChevronRight aria-hidden="true" /></button>)}</div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="tab-panel">
            <section className="panel rules-panel">
              <div className="panel-heading"><div><h2>이번 판정에 적용된 규칙</h2><p>학생의 학번·소속과 일치하는 승인 규칙만 계산에 사용했습니다.</p></div><span className="verified-badge"><ShieldCheck aria-hidden="true" /> 8개 규칙 검증됨</span></div>
              <div className="rule-list">{rows.map((row, index) => (
                <button key={row.id} onClick={() => setSelectedRow(row)}><span className="rule-number">R{String(index + 1).padStart(2, "0")}</span><div><strong>{row.name}</strong><p>{row.source}</p></div><span className="rule-scope">2020학번 · 주전공</span><ChevronRight aria-hidden="true" /></button>
              ))}</div>
              <div className="rule-note"><Info aria-hidden="true" /><p><strong>MVP 안내</strong> 현재 시연판은 상세기획서의 익명화 사례를 규칙 데이터로 구현했습니다. 실제 서비스에서는 담당자가 승인한 학칙·학과 공지 버전과 학생 성적 데이터를 연결합니다.</p></div>
            </section>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={Boolean(selectedRow)} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent className="detail-dialog sm:max-w-2xl">
          {selectedRow && <>
            <DialogHeader><div className="dialog-status-row"><span className={statusStyle[selectedRow.status]}>{selectedRow.status}</span><span>{selectedRow.group}</span></div><DialogTitle>{selectedRow.name}</DialogTitle><DialogDescription>판정에 사용된 계산값과 공식 근거입니다.</DialogDescription></DialogHeader>
            <div className="detail-values"><div><span>졸업기준</span><strong>{selectedRow.required}</strong></div><div><span>인정/현황</span><strong>{selectedRow.earned}</strong></div><div><span>부족</span><strong className={selectedRow.shortage !== "-" ? "bad-text" : ""}>{selectedRow.shortage}</strong></div></div>
            <div className="explain-box"><div><CircleHelp aria-hidden="true" /><span>왜 이렇게 판정됐나요?</span></div><p>{selectedRow.reason}</p></div>
            <div className="next-action-box"><div><FileCheck2 aria-hidden="true" /><span>다음 행동</span></div><p>{selectedRow.action}</p></div>
            <div className="source-box"><BookOpen aria-hidden="true" /><div><span>공식 근거</span><strong>{selectedRow.source}</strong></div><span className="source-version">적용 버전 2026.08</span></div>
          </>}
        </DialogContent>
      </Dialog>
    </main>
  );
}
