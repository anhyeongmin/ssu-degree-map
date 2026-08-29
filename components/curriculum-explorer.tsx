"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle, BookCopy, Database, ExternalLink, GitBranch,
  History, Layers3, Search, ShieldCheck,
} from "lucide-react";
import {
  catalogCourses, courseHistories, departmentLabels, graduationRules, officialSources,
  sourcesByIds, type DepartmentId,
} from "@/lib/curriculum-data";
import type { StudentCase } from "@/lib/degree-map";

type ViewId = "courses" | "history" | "rules" | "sources";

const caseScope: Record<"A" | "B" | "C" | "D", { primary: DepartmentId; message: string }> = {
  A: { primary: "ai", message: "2020학번 AI계열 주전공 규칙과 과목 이력을 우선 표시합니다." },
  B: { primary: "ai", message: "AI 주전공과 기계공학 복수전공을 분리해 확인합니다. 두 학부를 전환해 보세요." },
  C: { primary: "ai", message: "2025학번 AI계열 교과과정과 장기 이수계획에 사용할 과목을 표시합니다." },
  D: { primary: "mechanical", message: "기계공학 주전공·편입 사례에 적용되는 현재 공개 교과과정을 표시합니다." },
};

function scopeFor(studentCase: StudentCase) {
  if (studentCase.id !== "I") return caseScope[studentCase.id];
  const primary: DepartmentId = studentCase.department.includes("기계") ? "mechanical" : "ai";
  return {
    primary,
    message:`로컬 u-SAINT 사례의 ${studentCase.department} 정보와 공개 교과목 스냅샷을 대조합니다. 실제 적용 이수구분은 u-SAINT 조회 결과를 우선 확인하세요.`,
  };
}

export function CurriculumExplorer({ studentCase }: { studentCase: StudentCase }) {
  const scope = scopeFor(studentCase);
  const [department, setDepartment] = useState<DepartmentId>(scope.primary);
  const [view, setView] = useState<ViewId>("courses");
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");

  const courses = useMemo(() => catalogCourses.filter((course) => {
    const search = query.trim().toLowerCase();
    return course.department === department
      && (year === "all" || String(course.year) === year)
      && (!search || `${course.code} ${course.name} ${course.classification}`.toLowerCase().includes(search));
  }), [department, query, year]);
  const histories = courseHistories.filter((item) => item.department === department);
  const rules = graduationRules.filter((item) => item.department === department || item.relation === "공통");
  const sourceIds = new Set([
    ...catalogCourses.filter((course) => course.department === department).map((course) => course.sourceId),
    ...histories.flatMap((item) => item.sourceIds),
    ...rules.flatMap((item) => item.sourceIds),
  ]);
  const sources = officialSources.filter((source) => sourceIds.has(source.id));
  const conflicts = courseHistories.filter((item) => item.department === department && item.kind === "공식 자료 충돌");
  const doubleMajorCredits = catalogCourses
    .filter((course) => course.department === department && course.doubleMajorRequired)
    .reduce((sum, course) => sum + course.credits, 0);

  function switchDepartment(next: DepartmentId) {
    setDepartment(next);
    setQuery("");
    setYear("all");
  }

  return (
    <section className="curriculum-shell">
      <div className="curriculum-hero panel">
        <div>
          <span className="data-badge"><Database /> 공식 자료 스냅샷</span>
          <h2>교과목·코드·변경 이력</h2>
          <p>{scope.message}</p>
        </div>
        <div className="department-toggle" aria-label="학부 선택">
          {(["ai", "mechanical"] as DepartmentId[]).map((id) => (
            <button key={id} className={department === id ? "active" : ""} onClick={() => switchDepartment(id)}>
              <strong>{departmentLabels[id]}</strong>
              <span>{catalogCourses.filter((course) => course.department === id).length}개 과목</span>
            </button>
          ))}
        </div>
      </div>

      <div className="catalog-stats">
        <div><BookCopy /><span>확인된 교과목</span><strong>{catalogCourses.filter((course) => course.department === department).length}</strong><small>과목코드 포함</small></div>
        <div><History /><span>변경·대체 이력</span><strong>{histories.length}</strong><small>공식 원문 대조</small></div>
        <div><GitBranch /><span>표시된 복수전공필수</span><strong>{doubleMajorCredits}학점</strong><small>{department === "mechanical" ? "공개 표 기준" : "2024 이후 현재표"}</small></div>
        <div className={conflicts.length ? "stat-warning" : ""}><AlertTriangle /><span>공식 자료 충돌</span><strong>{conflicts.length}</strong><small>자동 확정하지 않음</small></div>
      </div>

      {conflicts.length > 0 && (
        <div className="conflict-banner"><AlertTriangle /><div><strong>공식 자료 사이에 확인이 필요한 항목이 있습니다.</strong><p>{conflicts.map((item) => item.note).join(" · ")}</p></div></div>
      )}

      <div className="catalog-layout">
        <section className="panel catalog-panel">
          <div className="catalog-nav" role="tablist" aria-label="교과 데이터 보기">
            {([
              ["courses", "교과목 목록"], ["history", "변경 이력"],
              ["rules", "졸업·복수전공 규칙"], ["sources", "공식 출처"],
            ] as Array<[ViewId, string]>).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={view === id} className={view === id ? "active" : ""} onClick={() => setView(id)}>{label}</button>
            ))}
          </div>

          {view === "courses" && <>
            <div className="catalog-tools">
              <label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="과목명 또는 8자리 과목코드 검색" /></label>
              <select value={year} onChange={(event) => setYear(event.target.value)} aria-label="학년 필터">
                <option value="all">전체 학년</option><option value="1">1학년</option><option value="2">2학년</option><option value="3">3학년</option><option value="4">4학년</option>
              </select>
            </div>
            <div className="catalog-table-wrap">
              <table className="catalog-table">
                <thead><tr><th>학년·학기</th><th>과목코드</th><th>교과목명</th><th>구분</th><th>시간/학점</th><th>관계·선수조건</th><th>검증</th></tr></thead>
                <tbody>{courses.map((course, index) => (
                  <tr key={`${course.department}-${course.code}-${course.name}-${course.semester}-${index}`} className={course.verification === "공식 자료 충돌" ? "conflict-row" : ""}>
                    <td>{course.year}-{course.semester}</td><td><code>{course.code}</code></td><td><strong>{course.name}</strong>{course.note && <small>{course.note}</small>}</td>
                    <td><span className={`course-type type-${course.classification}`}>{course.classification}</span></td><td>{course.hours}/{course.credits}</td>
                    <td>{course.doubleMajorRequired ? <span className="double-required">복필</span> : <small>{course.eligibleRelations.join("·")}</small>}{course.prerequisites.length ? <small>선수: {course.prerequisites.join("·")}</small> : null}</td>
                    <td>{course.verification === "공식 자료 충돌" ? <span className="verify-conflict">확인 필요</span> : <span className="verify-ok"><ShieldCheck /> 공식 확인</span>}</td>
                  </tr>
                ))}</tbody>
              </table>
              {!courses.length && <div className="empty-catalog">검색 조건에 해당하는 교과목이 없습니다.</div>}
            </div>
          </>}

          {view === "history" && <div className="history-list">
            {histories.map((item, index) => <article key={`${item.code}-${index}`} className={item.kind === "공식 자료 충돌" ? "history-conflict" : ""}>
              <div className="history-marker"><span>{index + 1}</span></div>
              <div className="history-main"><div className="history-title"><code>{item.code}</code><span>{item.kind}</span><small>{item.effective}</small></div>
                <div className="history-change"><span>{item.before}</span><strong>→</strong><span>{item.after}</span></div><p>{item.note}</p>
                <div className="inline-sources">{sourcesByIds(item.sourceIds).map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.title}<ExternalLink /></a>)}</div>
              </div>
            </article>)}
          </div>}

          {view === "rules" && <div className="graduation-rule-grid">
            {rules.map((rule) => <article key={rule.id} className={rule.status === "학과 확인 필요" ? "rule-warning" : ""}>
              <div className="rule-card-top"><span>{rule.relation}</span><small>{rule.status}</small></div><h3>{rule.title}</h3><p className="applies-to">{rule.appliesTo}</p>
              <div className="rule-values">{rule.values.map((value) => <div key={value.label}><span>{value.label}</span><strong>{value.value}</strong></div>)}</div>
              <p className="rule-card-note">{rule.note}</p><div className="inline-sources">{sourcesByIds(rule.sourceIds).map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer">근거 보기<ExternalLink /></a>)}</div>
            </article>)}
          </div>}

          {view === "sources" && <div className="source-catalog">
            {sources.map((source, index) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
              <span className="source-index">S{String(index + 1).padStart(2, "0")}</span><div><strong>{source.title}</strong><p>{source.issuer} · {source.format} · 확인 {source.verifiedAt}</p><small>{source.scope}</small></div><ExternalLink />
            </a>)}
          </div>}
        </section>

        <aside className="panel catalog-principle">
          <div className="principle-icon"><Layers3 /></div><span>DegreeMap 적용 원칙</span><h3>요구학점과 과목 이력을 분리</h3>
          <ol><li><strong>요구학점</strong><p>학생의 입학연도 기준</p></li><li><strong>과목 이수구분</strong><p>실제 수강 시점의 교과과정 기준</p></li><li><strong>폐지·대체</strong><p>공지된 대체과목과 이수구분변경 절차 확인</p></li><li><strong>자료 충돌</strong><p>자동 판정하지 않고 학과 확인 필요</p></li></ol>
          <p className="snapshot-note">공식 공개 자료를 2026-08-29에 수집한 정적 스냅샷입니다. 학생 개인정보와 u-SAINT 원본은 크롤링하지 않습니다.</p>
        </aside>
      </div>
    </section>
  );
}
