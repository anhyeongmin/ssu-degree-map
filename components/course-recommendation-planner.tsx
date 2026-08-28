"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle, ArrowRight, BookCheck, Check, CircleHelp, ExternalLink,
  FlaskConical, Layers3, RefreshCcw, Route, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  calculateWhatIf, getCourseRecommendationPlan, type CourseRecommendation,
} from "@/lib/course-recommendation";
import type { StudentCase } from "@/lib/degree-map";

export function CourseRecommendationPlanner({ studentCase }: { studentCase: StudentCase }) {
  const plan = useMemo(() => getCourseRecommendationPlan(studentCase), [studentCase]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const selected = useMemo(
    () => plan.candidates.filter((item) => selectedKeys.has(item.key)),
    [plan, selectedKeys],
  );
  const whatIf = useMemo(() => calculateWhatIf(studentCase, selected), [studentCase, selected]);
  const pathCredits = plan.minimalPath.reduce((sum, item) => sum + item.course.credits, 0);

  function toggle(item: CourseRecommendation) {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(item.key)) next.delete(item.key);
      else next.add(item.key);
      return next;
    });
  }

  function selectMinimalPath() {
    setSelectedKeys(new Set(plan.minimalPath.map((item) => item.key)));
  }

  if (!plan.candidates.length) {
    return (
      <section className="panel no-course-plan">
        <div className="no-course-icon"><BookCheck /></div>
        <div><span>불필요 수강 방지</span><h2>추천 과목 없음</h2><p>{plan.notice}</p></div>
      </section>
    );
  }

  return (
    <div className="recommendation-shell">
      <section className="panel recommendation-hero">
        <div><div className="engine-badge"><ShieldCheck /> 결정론적 추천 엔진</div><h2>우선 이수과목·최소 추가이수 경로</h2><p>{plan.notice}</p></div>
        <div className="path-summary"><span>공개자료로 계산 가능한 최소 후보</span><strong>{plan.minimalPath.length}과목 · {pathCredits}학점</strong><small>미확인 수강내역과 실제 개설학기는 별도 대조</small></div>
      </section>

      <section className="recommendation-targets" aria-label="과목 추천 대상 부족요건">
        {plan.targets.map((target) => <article key={target.requirementId} className={!target.coverable ? "target-unresolved" : ""}>
          <span>{target.name}</span><strong>{target.deficit}학점 부족</strong><p>{target.coverable ? "공식 교과목 후보 연결" : "현재 수집 범위 밖"}</p>
        </article>)}
      </section>

      <div className="planner-grid">
        <section className="panel candidate-panel">
          <div className="panel-heading"><div><h2>추천 후보</h2><p>과목을 선택하면 오른쪽 What-if 결과가 즉시 바뀝니다.</p></div><span className="verified-badge"><Layers3 /> {plan.candidates.length}개 공식 후보</span></div>
          <div className="candidate-list">
            {plan.candidates.map((item) => {
              const active = selectedKeys.has(item.key);
              return <button key={item.key} className={active ? "candidate active" : "candidate"} aria-pressed={active} onClick={() => toggle(item)}>
                <span className="candidate-check">{active && <Check />}</span>
                <div className="candidate-main">
                  <div className="candidate-title"><code>{item.course.code}</code><strong>{item.course.name}</strong><span className={`candidate-priority priority-${item.priority.replaceAll(" ", "-")}`}>{item.priority}</span></div>
                  <p>{item.reason}</p>
                  <div className="impact-tags">{item.impacts.map((impact) => <span key={impact.requirementId}>{impact.requirementName} +{impact.credits}</span>)}</div>
                  <small>{item.course.year}학년 {item.course.semester}학기 · {item.course.classification} · {item.course.credits}학점 · {item.verification}</small>
                </div>
              </button>;
            })}
          </div>
        </section>

        <aside className="planner-side">
          <section className="panel what-if-panel">
            <div className="what-if-heading"><div><FlaskConical /><span>COURSE WHAT-IF</span><h2>선택 전후 비교</h2></div><div className="planner-buttons"><Button size="sm" onClick={selectMinimalPath}><Route /> 최소경로 선택</Button><Button size="sm" variant="outline" onClick={() => setSelectedKeys(new Set())}><RefreshCcw /> 초기화</Button></div></div>
            <div className="what-if-total">
              <div><span>현재 인정학점</span><strong>{studentCase.totalEarned}</strong></div><ArrowRight /><div><span>선택 과목 이수 가정</span><strong>{whatIf.projectedTotal}</strong></div>
              <p>{selected.length}과목 · +{whatIf.selectedCredits}학점 · 총학점 부족 {whatIf.totalShortage}학점</p>
            </div>
            <div className="what-if-rows">{whatIf.rows.map((row) => <article key={row.requirementId} className={row.resolved ? "resolved" : ""}>
              <div><strong>{row.name}</strong><span>{row.coverable ? "과목 선택 반영" : "현재 계산 불가"}</span></div>
              <p>{row.before} <ArrowRight /> {row.after} / {row.required}학점</p>
              <small>{row.resolved ? <><Check /> 부족 해소 가정</> : `${row.remaining}학점 남음`}</small>
            </article>)}</div>
          </section>

          {plan.unresolved.length > 0 && <section className="panel unresolved-panel"><div><AlertTriangle /><span>과목 선택만으로 확정할 수 없는 항목</span></div>{plan.unresolved.map((item) => <article key={item.id}><strong>{item.name}</strong><p>{item.action}</p></article>)}</section>}

          <section className="panel recommendation-basis"><CircleHelp /><div><strong>추천의 정확성 경계</strong><p>추천과 What-if는 AI가 아니라 공식 교과목과 졸업사정표 부족값을 연결한 규칙 엔진 결과입니다. 전체 이수과목·성적·실제 개설·수강자격이 없으므로 최종 수강 추천이 아니라 검증 가능한 후보입니다.</p>{plan.candidates.slice(0, 2).map((item) => <a key={item.sourceUrl} href={item.sourceUrl} target="_blank" rel="noreferrer">{item.sourceTitle}<ExternalLink /></a>)}</div></section>
        </aside>
      </div>
    </div>
  );
}
