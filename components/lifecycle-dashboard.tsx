"use client";

import {
  AlertTriangle, ArrowRight, BookOpenCheck, CheckCircle2, CircleHelp, GitBranch,
  Languages, Network, Route, ShieldAlert, ShieldCheck, Split, TrendingUp,
} from "lucide-react";
import type { StudentCase } from "@/lib/degree-map";
import {
  buildRequirementGraph, calculateOfficialExpected, getCaseAllocation, getEarlyAlerts,
  getGeneralEducationRoutes, getPreferredGeneralEducationRoute, getQualificationRoutes,
  type ExtendedRequirementStatus, type RequirementGraphNode,
} from "@/lib/full-degree-map";

const statusClass: Record<ExtendedRequirementStatus, string> = {
  "충족":"status status-ok", "미충족":"status status-bad", "충족예정":"status status-planned",
  "면제":"status status-neutral", "비적용":"status status-neutral",
  "증빙 필요":"status status-evidence", "학과 확인 필요":"status status-check",
};

function GraphNode({ node, depth = 0 }: { node: RequirementGraphNode; depth?: number }) {
  return (
    <li className={`graph-depth-${Math.min(depth, 2)}`}>
      <div className="graph-node">
        <span className="operator-badge">{node.operator}</span>
        <div><strong>{node.label}</strong><small>{node.basis}</small></div>
        <span className={statusClass[node.status]}>{node.status}</span>
      </div>
      {node.children?.length ? <ul>{node.children.map((child) => <GraphNode key={child.id} node={child} depth={depth + 1} />)}</ul> : null}
    </li>
  );
}

export function LifecycleDashboard({ studentCase }: { studentCase: StudentCase }) {
  const comparison = calculateOfficialExpected(studentCase);
  const alerts = getEarlyAlerts(studentCase);
  const routes = getGeneralEducationRoutes(studentCase.id);
  const preferred = getPreferredGeneralEducationRoute(studentCase.id);
  const qualifications = getQualificationRoutes(studentCase.id);
  const graph = buildRequirementGraph(studentCase);
  const allocation = getCaseAllocation(studentCase);
  const officialPercent = Math.round((comparison.official.completed / comparison.official.applicable) * 100);
  const expectedPercent = Math.round((comparison.expected.completed / comparison.expected.applicable) * 100);

  return (
    <div className="lifecycle-shell">
      <section className="panel lifecycle-hero">
        <div>
          <span className="engine-badge"><TrendingUp /> S-01 · S-02 전주기 상태</span>
          <h2>공식 확정값과 예상값을 분리합니다</h2>
          <p>확인되지 않은 수강·신청 학점은 예상값에도 임의로 더하지 않습니다.</p>
        </div>
        <div className="snapshot-date"><span>데이터 기준일</span><strong>2026.08.29</strong><small>규칙 v2026.1</small></div>
      </section>

      <section className="official-expected-grid">
        <article className="panel">
          <div className="comparison-heading"><ShieldCheck /><span>공식 확정 현황</span></div>
          <strong>{officialPercent}%</strong>
          <p>{comparison.official.completed}/{comparison.official.applicable}개 적용 요건 · {comparison.official.credits}학점</p>
          <small>u-SAINT 졸업사정표에서 확인된 값만 사용</small>
        </article>
        <article className="panel expected-card">
          <div className="comparison-heading"><Route /><span>예상 현황</span></div>
          <strong>{expectedPercent}%</strong>
          <p>{comparison.expected.completed}/{comparison.expected.applicable}개 · 미확정 추가학점 {comparison.pendingCredits}학점</p>
          <small>{comparison.note}</small>
        </article>
        <article className="panel">
          <div className="comparison-heading"><CircleHelp /><span>처리 중 요건</span></div>
          <strong>{comparison.pendingRequirements.length}개</strong>
          <p>{comparison.pendingRequirements.join(" · ") || "확인된 처리 중 항목 없음"}</p>
          <small>처리 완료 전에는 공식 분자에 포함하지 않음</small>
        </article>
      </section>

      <div className="full-feature-grid">
        <section className="panel early-warning-panel">
          <div className="panel-heading"><div><h2>졸업위험 조기경보</h2><p>S-03 · S-06 학년과 상태에 따라 즉시·장기 행동을 분리합니다.</p></div><span className="verified-badge"><ShieldAlert /> {alerts.length}개</span></div>
          <div className="early-alert-list">
            {alerts.map((alert) => (
              <article key={alert.id}>
                <span className={`alert-level level-${alert.level.replace(" ", "-")}`}>{alert.level}</span>
                <div><strong>{alert.title}</strong><p>{alert.reason}</p><small><ArrowRight /> {alert.timing} · {alert.action}</small><em>{alert.basis}</em></div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel general-route-panel">
          <div className="panel-heading"><div><h2>교양 복수경로 판정</h2><p>C-02 기존조건과 통합조건을 OR로 각각 계산합니다.</p></div><Split /></div>
          <div className="route-list">
            {routes.map((route) => (
              <article key={route.id} className={preferred.id === route.id ? "preferred" : ""}>
                <div><strong>{route.name}</strong>{preferred.id === route.id && <span>우선 경로</span>}</div>
                <p>학점 {route.credits.earned ?? "미확인"}/{route.credits.required ?? "미확인"} · 영역 {route.areas.earned ?? "미확인"}/{route.areas.required ?? "미확인"}</p>
                <small>{route.missing}</small>
                <footer><span className={statusClass[route.status]}>{route.status}</span><em>{route.basis}</em></footer>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="full-feature-grid">
        <section className="panel qualification-panel">
          <div className="panel-heading"><div><h2>학과자격·영어요건</h2><p>C-03 · C-04 공식 규칙이 없으면 기본값을 만들지 않습니다.</p></div><Languages /></div>
          <div className="qualification-list">
            {qualifications.map((item) => (
              <article key={item.id}><BookOpenCheck /><div><strong>{item.title}</strong><p>{item.evidence}</p><small>{item.basis}</small></div><span className={statusClass[item.status]}>{item.status}</span></article>
            ))}
          </div>
        </section>

        <section className="panel allocation-panel">
          <div className="panel-heading"><div><h2>다전공 학점 배정</h2><p>C-05 · C-06 중복합산하지 않고 승인된 관계만 배정합니다.</p></div><GitBranch /></div>
          {studentCase.id === "B" || (studentCase.id === "I" && /다전공|복수전공|융합전공|연계전공/.test(studentCase.majorType)) ? (
            <>
              <div className="allocation-totals">{Object.entries(allocation.totals).map(([track, credits]) => <div key={track}><span>{track}</span><strong>{credits}학점</strong></div>)}</div>
              <div className="allocation-list">{allocation.allocations.map((item) => <p key={`${item.attemptId}-${item.track}`}><CheckCircle2 /><strong>{item.courseName}</strong><span>{item.track} · {item.credits}학점</span><small>{item.reason}</small></p>)}</div>
              {allocation.unresolved.map((item) => <div className="allocation-unresolved" key={item}><AlertTriangle />{item}</div>)}
            </>
          ) : <div className="empty-feature"><Network /><strong>현재 사례는 다전공 배정 대상이 아닙니다.</strong><p>규칙 엔진은 학생관계가 비적용인 기능을 계산에서 제외합니다.</p></div>}
        </section>
      </div>

      <section className="panel rule-graph-panel">
        <div className="panel-heading"><div><h2>요구조건 그래프</h2><p>C-01 · C-07~09 AND·OR·학점·증빙·행정 노드와 불확실성을 보존합니다.</p></div><span className="verified-badge"><Network /> 결정론적 그래프</span></div>
        <ul className="requirement-graph"><GraphNode node={graph} /></ul>
        <div className="rule-note"><ShieldCheck /><p><strong>최소성적·외부학점 안전 원칙</strong> 공식 규정에 최소성적이 없으면 기본값을 적용하지 않습니다. 편입·교환·학점교류 등은 취득·신청·승인·반영 상태를 분리하고, 실제 확인값이 없으면 학과 확인 필요로 유지합니다.</p></div>
      </section>
    </div>
  );
}
