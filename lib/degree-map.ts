export type RequirementStatus =
  | "충족"
  | "미충족"
  | "충족예정"
  | "증빙 필요"
  | "학과 확인 필요"
  | "비적용";

export type RequirementKind = "credit" | "nonCredit" | "administrative";

export type Requirement = {
  id: string;
  group: string;
  name: string;
  kind: RequirementKind;
  required: number | null;
  earned: number | null;
  unit: "학점" | "학기" | "건" | "상태";
  requiredLabel?: string;
  earnedLabel?: string;
  status: RequirementStatus;
  courses: string;
  reason: string;
  action: string;
  source: string;
  progressPrimary?: boolean;
};

export type StudentCase = {
  id: "A" | "B" | "C" | "D";
  label: string;
  shortLabel: string;
  department: string;
  yearLabel: string;
  admissionYear: number;
  semester: string;
  majorType: string;
  totalRequired: number;
  totalEarned: number;
  uSaintStatus: "불가능" | "가능" | "확인 필요";
  dataNote: string;
  requirements: Requirement[];
};

const req = (item: Requirement) => item;

export const studentCases: StudentCase[] = [
  {
    id: "A",
    label: "사례 A · 졸업유예",
    shortLabel: "졸업유예",
    department: "AI소프트웨어학부",
    yearLabel: "졸업유예",
    admissionYear: 2020,
    semester: "졸업사정 대상",
    majorType: "주전공",
    totalRequired: 133,
    totalEarned: 135,
    uSaintStatus: "불가능",
    dataNote: "실제 화면 관찰값과 기존 검증자료를 익명화했습니다.",
    requirements: [
      req({ id:"a-total", group:"졸업필수 요건", name:"총 졸업학점", kind:"credit", required:133, earned:135, unit:"학점", status:"충족", courses:"전체 인정 교과목", reason:"졸업학점 133학점 이상을 충족했습니다.", action:"추가 학점 이수는 필요하지 않습니다.", source:"학부 졸업학점 규칙", progressPrimary:true }),
      req({ id:"a-general-required", group:"교양필수", name:"교양필수", kind:"credit", required:16, earned:16, unit:"학점", status:"충족", courses:"u-SAINT 인정 교양필수", reason:"교양필수 기준 16학점을 충족했습니다.", action:"추가 이수가 필요하지 않습니다.", source:"교양필수 규칙" }),
      req({ id:"a-general-elective", group:"교양선택", name:"교양선택", kind:"credit", required:12, earned:32, unit:"학점", status:"충족", courses:"u-SAINT 인정 교양선택", reason:"교양선택 기준 12학점 이상을 충족했습니다.", action:"추가 이수가 필요하지 않습니다.", source:"교양선택 규칙" }),
      req({ id:"a-christian", group:"교양필수", name:"기독교과목", kind:"credit", required:4, earned:4, unit:"학점", status:"충족", courses:"기독교과목 인정 내역", reason:"2022학년도 이전 기독교과목 기준을 충족했습니다.", action:"추가 이수가 필요하지 않습니다.", source:"2022학년도 이전 기독교과목 규칙" }),
      req({ id:"a-major-basic", group:"전공기초", name:"전공기초", kind:"credit", required:18, earned:18, unit:"학점", status:"충족", courses:"AI소프트웨어학부 전공기초", reason:"전공기초 기준 18학점을 충족했습니다.", action:"추가 이수가 필요하지 않습니다.", source:"AI소프트웨어학부 전공기초 규칙" }),
      req({ id:"a-major-required", group:"전공", name:"전공필수", kind:"credit", required:12, earned:15, unit:"학점", status:"충족", courses:"AI소프트웨어학부 전공필수", reason:"전공필수 기준 12학점 이상을 충족했습니다.", action:"추가 이수가 필요하지 않습니다.", source:"AI소프트웨어학부 전공필수 규칙" }),
      req({ id:"a-major-total", group:"전공", name:"전공합계", kind:"credit", required:66, earned:66, unit:"학점", status:"충족", courses:"주전공 인정 과목", reason:"2023학년도 이전 전공합계 기준 66학점을 충족했습니다.", action:"추가 이수가 필요하지 않습니다.", source:"2023학년도 이전 전공합계 규칙" }),
      req({ id:"a-chapel", group:"비학점 요건", name:"채플", kind:"nonCredit", required:null, earned:null, unit:"상태", requiredLabel:"이수", earnedLabel:"이수 확인", status:"충족", courses:"채플 이수 내역", reason:"졸업사정표에서 채플 요건 충족이 확인됩니다.", action:"추가 조치가 필요하지 않습니다.", source:"학부 채플 규칙" }),
      req({ id:"a-thesis", group:"학과 졸업요건", name:"졸업논문·시험", kind:"nonCredit", required:null, earned:null, unit:"상태", requiredLabel:"합격 또는 면제", earnedLabel:"충족 확인", status:"충족", courses:"졸업사정 인정 내역", reason:"졸업논문·시험 요건 충족이 확인됩니다.", action:"별도 조치가 필요하지 않습니다.", source:"학부 졸업논문·시험 규칙" }),
      req({ id:"a-declaration", group:"행정 요건", name:"졸업확정신고", kind:"administrative", required:null, earned:null, unit:"건", requiredLabel:"신고 완료", earnedLabel:"미신고", status:"미충족", courses:"수강과목 아님", reason:"135학점을 인정받았지만 졸업확정신고가 완료되지 않아 u-SAINT 결과가 불가능으로 표시됩니다.", action:"u-SAINT에서 졸업확정신고를 완료하세요. 추가 수강은 필요하지 않습니다.", source:"학부 졸업확정신고 규칙" }),
    ],
  },
  {
    id: "B",
    label: "사례 B · 복수전공",
    shortLabel: "복수전공",
    department: "AI소프트웨어학부",
    yearLabel: "3학년",
    admissionYear: 2020,
    semester: "6학기",
    majorType: "주전공 AI소프트웨어 · 복수전공 기계공학 · 융합전공 AI모빌리티",
    totalRequired: 133,
    totalEarned: 116,
    uSaintStatus: "불가능",
    dataNote: "제공된 복수·융합전공 졸업사정표를 익명화했습니다.",
    requirements: [
      req({ id:"b-total", group:"졸업필수 요건", name:"총 졸업학점", kind:"credit", required:133, earned:116, unit:"학점", status:"미충족", courses:"전체 인정 교과목", reason:"졸업학점 기준까지 17학점이 부족합니다.", action:"남은 학기 수강계획에서 총 17학점 이상을 확보하세요.", source:"학부 졸업학점 133", progressPrimary:true }),
      req({ id:"b-transfer", group:"졸업필수 요건", name:"편입 요구 지정과목", kind:"nonCredit", required:null, earned:null, unit:"상태", requiredLabel:"해당 시 이수", earnedLabel:"충족", status:"충족", courses:"해당 없음 또는 이수 확인", reason:"u-SAINT 졸업사정표에서 충족으로 표시됩니다.", action:"추가 조치가 필요하지 않습니다.", source:"학부 편입 요구 지정과목" }),
      req({ id:"b-thesis", group:"졸업필수 요건", name:"졸업논문·졸업시험", kind:"nonCredit", required:null, earned:null, unit:"상태", requiredLabel:"이수", earnedLabel:"미확인", status:"학과 확인 필요", courses:"학과사무실 확인 필요", reason:"u-SAINT에는 부족으로 표시되며 상세 인정 여부는 학과사무실 확인 대상입니다.", action:"AI소프트웨어학부에 졸업논문·시험 또는 대체자격 인정 경로를 확인하세요.", source:"학부 졸업논문/졸업시험 이수" }),
      req({ id:"b-declaration", group:"졸업필수 요건", name:"졸업확정신고", kind:"administrative", required:null, earned:null, unit:"건", requiredLabel:"신고 완료", earnedLabel:"미신고", status:"미충족", courses:"수강과목 아님", reason:"졸업확정신고 여부가 부족으로 표시됩니다.", action:"졸업사정 대상 시기에 u-SAINT에서 졸업확정신고를 완료하세요.", source:"학부 졸업확정신고 여부" }),
      req({ id:"b-christian", group:"교양필수", name:"기독교과목", kind:"credit", required:4, earned:5, unit:"학점", status:"충족", courses:"인문고전으로서의성서, 현대인과성서", reason:"기독교과목 기준보다 1학점 많습니다.", action:"추가 이수가 필요하지 않습니다.", source:"학부 기독교과목 4학점 이상 (22 이전)" }),
      req({ id:"b-duplicate-major", group:"복수전공", name:"기계공학 복수전공필수", kind:"credit", required:null, earned:null, unit:"학점", requiredLabel:"u-SAINT 5 / 공식페이지 9", earnedLabel:"5학점 표시", status:"학과 확인 필요", courses:"고체역학실험, 기계공작실습, 열공학실험, 전산기계제도", reason:"제공된 u-SAINT 졸업사정표는 복수전공필수 5학점 충족으로 표시하지만, 현재 기계공학부 공식 교과과정은 복수전공필수 9학점을 포함하도록 안내합니다. 입학연도·복수전공 선발연도별 경과조치는 공개 페이지에서 확인되지 않습니다.", action:"기계공학부에 2020학번 복수전공자의 적용 복필학점과 지정과목을 확인하세요.", source:"기계공학부 교과과정 · u-SAINT 표시값 상충" }),
      req({ id:"b-general-required", group:"교양필수", name:"교양필수", kind:"credit", required:16, earned:16, unit:"학점", status:"충족", courses:"u-SAINT 인정 교양필수", reason:"교양필수 기준 16학점을 충족했습니다.", action:"추가 이수가 필요하지 않습니다.", source:"학부 교양필수 16" }),
      req({ id:"b-general-elective", group:"교양선택", name:"교양선택", kind:"credit", required:12, earned:15, unit:"학점", status:"충족", courses:"u-SAINT 인정 교양선택", reason:"교양선택 기준보다 3학점 많습니다.", action:"추가 이수가 필요하지 않습니다.", source:"학부 교양선택 12" }),
      req({ id:"b-integrated", group:"교양선택", name:"통합조건 3개 영역", kind:"nonCredit", required:null, earned:null, unit:"상태", requiredLabel:"3개 영역", earnedLabel:"충족", status:"충족", courses:"공동체리더십·의사소통·글로벌·창의융합 조건", reason:"화면에 표시된 세 통합조건이 모두 충족입니다.", action:"추가 조치가 필요하지 않습니다.", source:"2020학번 교양 통합조건" }),
      req({ id:"b-major-basic", group:"전공기초", name:"주전공 전공기초", kind:"credit", required:18, earned:15, unit:"학점", status:"미충족", courses:"AI소프트웨어 전공기초 인정 과목", reason:"주전공 전공기초가 3학점 부족합니다.", action:"AI소프트웨어 전공기초 인정과목 3학점을 우선 이수하세요.", source:"학부 전기-AI소프트(2301전) 18" }),
      req({ id:"b-major-required", group:"주전공", name:"주전공 전공필수", kind:"credit", required:12, earned:22, unit:"학점", status:"충족", courses:"AI소프트웨어 전공필수 인정 과목", reason:"주전공 전공필수 기준보다 10학점 많습니다.", action:"추가 이수가 필요하지 않습니다.", source:"학부 전필-AI소프트 12" }),
      req({ id:"b-major-total", group:"주전공", name:"주전공 전공합계", kind:"credit", required:36, earned:37, unit:"학점", status:"충족", courses:"AI소프트웨어 전공 인정 과목", reason:"주전공 전공합계 기준보다 1학점 많습니다.", action:"추가 이수가 필요하지 않습니다.", source:"학부 전공(전필+전선) AI소프트 36" }),
      req({ id:"b-double-major", group:"복수전공", name:"기계공학 복수전공", kind:"credit", required:42, earned:20, unit:"학점", status:"미충족", courses:"기계공학 복수전공 인정 과목", reason:"기계공학 복수전공 기준까지 22학점이 부족합니다.", action:"기계공학 복수전공 인정과목 22학점을 남은 학기에 분리해 계획하세요.", source:"학부 복수전공 42-기계" }),
      req({ id:"b-convergence-required", group:"융합전공", name:"AI모빌리티 전공필수", kind:"credit", required:15, earned:0, unit:"학점", status:"미충족", courses:"인정 과목 없음", reason:"AI모빌리티 융합전공 필수 15학점이 부족합니다.", action:"AI모빌리티 전공필수 인정과목 15학점을 확인해 계획하세요.", source:"학부 융필-AI모빌리티 15" }),
      req({ id:"b-convergence-elective", group:"융합전공", name:"AI모빌리티 전공선택", kind:"credit", required:21, earned:12, unit:"학점", status:"미충족", courses:"AI모빌리티 인정 교과목", reason:"AI모빌리티 융합전공 선택이 9학점 부족합니다.", action:"AI모빌리티 전공선택 인정과목 9학점을 계획하세요.", source:"학부 융선-AI모빌리티 21" }),
      req({ id:"b-chapel", group:"채플", name:"채플", kind:"nonCredit", required:null, earned:null, unit:"상태", requiredLabel:"6회", earnedLabel:"충족", status:"충족", courses:"채플 및 비전채플 인정 내역", reason:"u-SAINT 졸업사정표에서 충족으로 표시됩니다.", action:"추가 조치가 필요하지 않습니다.", source:"학부 채플(신입 6회, 편입2학년4회)" }),
    ],
  },
  {
    id: "C",
    label: "사례 C · AI소프트웨어학부 2학년",
    shortLabel: "AI소프트 2학년",
    department: "AI소프트웨어학부",
    yearLabel: "2학년",
    admissionYear: 2025,
    semester: "3학기",
    majorType: "주전공",
    totalRequired: 133,
    totalEarned: 60.5,
    uSaintStatus: "불가능",
    dataNote: "제공된 2학년 졸업사정표를 익명화했습니다.",
    requirements: [
      req({ id:"c-total", group:"졸업필수 요건", name:"총 졸업학점", kind:"credit", required:133, earned:60.5, unit:"학점", status:"충족예정", courses:"현재까지 인정 교과목", reason:"현재 60.5학점이며 졸업기준까지 72.5학점이 남았습니다. 2학년 재학 중이므로 장기 이수계획 대상으로 구분합니다.", action:"남은 학기별로 총 72.5학점과 영역별 부족분을 분산해 계획하세요.", source:"학부 졸업학점 133", progressPrimary:true }),
      req({ id:"c-transfer", group:"졸업필수 요건", name:"편입 요구 지정과목", kind:"nonCredit", required:null, earned:null, unit:"상태", requiredLabel:"해당 시 이수", earnedLabel:"충족", status:"충족", courses:"해당 없음", reason:"신입학 사례이며 화면에서 충족으로 표시됩니다.", action:"추가 조치가 필요하지 않습니다.", source:"학부 편입 요구 지정과목" }),
      req({ id:"c-thesis", group:"졸업필수 요건", name:"졸업논문·졸업시험", kind:"nonCredit", required:null, earned:null, unit:"상태", requiredLabel:"이수", earnedLabel:"아직 미이수", status:"충족예정", courses:"학과사무실 확인 대상", reason:"2학년 현재 아직 이수하지 않은 졸업단계 요건입니다.", action:"졸업 직전이 아니라 학과 공지 시점에 맞춰 준비 일정을 확인하세요.", source:"학부 졸업논문/졸업시험 이수" }),
      req({ id:"c-declaration", group:"졸업필수 요건", name:"졸업확정신고", kind:"administrative", required:null, earned:null, unit:"건", requiredLabel:"신고 완료", earnedLabel:"대상 전", status:"충족예정", courses:"수강과목 아님", reason:"2학년 재학 중이라 졸업확정신고 시기가 아닙니다.", action:"졸업사정 대상 학기에 신고 일정을 확인하세요.", source:"학부 졸업확정신고 여부" }),
      req({ id:"c-christian", group:"교양필수", name:"기독교과목", kind:"credit", required:3, earned:2, unit:"학점", status:"미충족", courses:"현대사회이슈읽기", reason:"기독교과목 기준까지 1학점이 부족합니다.", action:"남은 학기에 기독교과목 1학점 이상을 이수하세요.", source:"학부 기독교과목 3학점 이상 (23 이후)" }),
      req({ id:"c-general-required", group:"교양필수", name:"교양필수", kind:"credit", required:19, earned:14, unit:"학점", status:"미충족", courses:"현재 인정 교양필수", reason:"교양필수 기준까지 5학점이 부족합니다.", action:"필수 교양 영역을 확인해 5학점을 우선 배치하세요.", source:"학부 교양필수 19" }),
      req({ id:"c-balance", group:"교양선택", name:"Balance 3개 영역", kind:"nonCredit", required:null, earned:null, unit:"상태", requiredLabel:"3개 영역", earnedLabel:"충족", status:"충족", courses:"기업의이해·스프레드시트고급활용·스피치와컨텐츠", reason:"교양선택 영역 균형 조건은 충족했습니다.", action:"추가 조치가 필요하지 않습니다.", source:"Balance (교양선택) 3개 영역 이상" }),
      req({ id:"c-general-elective", group:"교양선택", name:"교양선택", kind:"credit", required:9, earned:6, unit:"학점", status:"미충족", courses:"현재 인정 교양선택", reason:"교양선택 기준까지 3학점이 부족합니다.", action:"교양선택 인정과목 3학점을 계획하세요.", source:"학부 교양선택 9" }),
      req({ id:"c-major-basic", group:"전공기초", name:"전공기초", kind:"credit", required:15, earned:18, unit:"학점", status:"충족", courses:"AI소프트웨어 전공기초 인정 과목", reason:"전공기초 기준보다 3학점 많습니다.", action:"추가 이수가 필요하지 않습니다.", source:"학부 전기-AI소프트(24-25) 15" }),
      req({ id:"c-major-required", group:"전공", name:"전공필수", kind:"credit", required:12, earned:9, unit:"학점", status:"미충족", courses:"AI소프트웨어 전공필수 인정 과목", reason:"전공필수 기준까지 3학점이 부족합니다.", action:"선후수 관계를 확인해 전공필수 3학점을 다음 학기에 우선 배치하세요.", source:"학부 전필-AI소프트 12" }),
      req({ id:"c-major-total", group:"전공", name:"전공합계", kind:"credit", required:72, earned:21, unit:"학점", status:"충족예정", courses:"현재 인정 주전공 과목", reason:"전공합계 기준까지 51학점이 남았습니다. 2학년 장기 이수계획 대상으로 봅니다.", action:"남은 정규학기에 전공필수와 전공선택 51학점을 단계적으로 배치하세요.", source:"학부 전필+전선-AI소프트 72" }),
      req({ id:"c-chapel", group:"채플", name:"채플", kind:"nonCredit", required:null, earned:null, unit:"상태", requiredLabel:"6회", earnedLabel:"이수 중", status:"충족예정", courses:"현재 채플 이수 내역", reason:"졸업사정표에서는 아직 부족으로 표시되지만 2학년 이수 진행 단계입니다.", action:"남은 학기마다 채플 이수 여부를 확인하세요.", source:"학부 채플(신입 6회, 편입2학년4회)" }),
    ],
  },
  {
    id: "D",
    label: "사례 D · 기계공학부 4학년",
    shortLabel: "기계공학 4학년",
    department: "기계공학부",
    yearLabel: "4학년",
    admissionYear: 2025,
    semester: "7학기 · 편입학",
    majorType: "주전공 · 편입",
    totalRequired: 133,
    totalEarned: 116,
    uSaintStatus: "불가능",
    dataNote: "제공된 기계공학부 편입생 졸업사정표를 익명화했습니다.",
    requirements: [
      req({ id:"d-total", group:"졸업필수 요건", name:"총 졸업학점", kind:"credit", required:133, earned:116, unit:"학점", status:"미충족", courses:"전체 인정 교과목", reason:"졸업학점 기준까지 17학점이 부족합니다.", action:"졸업 전 총 17학점 이상을 추가 확보하세요.", source:"학부 졸업학점 133", progressPrimary:true }),
      req({ id:"d-transfer", group:"졸업필수 요건", name:"편입 요구 지정과목", kind:"nonCredit", required:null, earned:null, unit:"상태", requiredLabel:"이수", earnedLabel:"충족", status:"충족", courses:"편입 인정 지정과목", reason:"편입 요구 지정과목은 충족으로 표시됩니다.", action:"추가 조치가 필요하지 않습니다.", source:"학부 편입 요구 지정과목" }),
      req({ id:"d-thesis", group:"졸업필수 요건", name:"졸업논문·졸업시험", kind:"nonCredit", required:null, earned:null, unit:"상태", requiredLabel:"이수", earnedLabel:"미확인", status:"학과 확인 필요", courses:"학과사무실 확인 필요", reason:"화면에 부족으로 표시되며 기계공학부 졸업논문·시험 인정 여부는 학과 확인이 필요합니다.", action:"기계공학부에 졸업논문 계획서·시험·대체자격 인정 절차를 즉시 확인하세요.", source:"학부 졸업논문/졸업시험 이수" }),
      req({ id:"d-declaration", group:"졸업필수 요건", name:"졸업확정신고", kind:"administrative", required:null, earned:null, unit:"건", requiredLabel:"신고 완료", earnedLabel:"미신고", status:"미충족", courses:"수강과목 아님", reason:"4학년 졸업사정표에서 졸업확정신고가 부족으로 표시됩니다.", action:"신고 가능 기간을 확인해 u-SAINT 졸업확정신고를 완료하세요.", source:"학부 졸업확정신고 여부" }),
      req({ id:"d-christian", group:"교양필수", name:"기독교과목", kind:"credit", required:3, earned:3, unit:"학점", status:"충족", courses:"편입 인정 기독교과목", reason:"기독교과목 3학점 기준을 충족했습니다.", action:"추가 이수가 필요하지 않습니다.", source:"학부 기독교과목 3학점 이상 (23 이후)" }),
      req({ id:"d-me-required", group:"전공", name:"기계 전공필수", kind:"credit", required:17, earned:13, unit:"학점", status:"미충족", courses:"기계공학 전공필수 인정 과목", reason:"기계 전공필수가 4학점 부족합니다.", action:"개설학기와 편입 인정범위를 확인해 전공필수 4학점을 우선 이수하세요.", source:"학부 23~ 전필-기계 17" }),
      req({ id:"d-general-required", group:"교양필수", name:"교양필수", kind:"credit", required:19, earned:22, unit:"학점", status:"충족", courses:"편입 인정 교양·기독교과목", reason:"교양필수 기준보다 3학점 많습니다.", action:"추가 이수가 필요하지 않습니다.", source:"학부 교양필수 19" }),
      req({ id:"d-balance", group:"교양선택", name:"Balance 3개 영역", kind:"nonCredit", required:null, earned:null, unit:"상태", requiredLabel:"3개 영역", earnedLabel:"충족", status:"충족", courses:"교양 영역 조건 충족", reason:"교양선택 3개 영역 조건은 충족입니다.", action:"추가 조치가 필요하지 않습니다.", source:"Balance (교양선택) 3개 영역 이상" }),
      req({ id:"d-general-elective", group:"교양선택", name:"교양선택", kind:"credit", required:9, earned:29, unit:"학점", status:"충족", courses:"편입 인정 교선", reason:"교양선택 기준보다 20학점 많습니다.", action:"추가 이수가 필요하지 않습니다.", source:"학부 교양선택 9" }),
      req({ id:"d-major-basic", group:"전공기초", name:"전공기초", kind:"credit", required:18, earned:15, unit:"학점", status:"미충족", courses:"공학물리1·인공지능프로그래밍·편입인정 전기", reason:"전공기초가 3학점 부족합니다.", action:"기계공학부 전공기초 인정과목 3학점을 확인해 이수하세요.", source:"학부 전기-기계 18" }),
      req({ id:"d-major-total", group:"전공", name:"기계공학 전공합계", kind:"credit", required:66, earned:49, unit:"학점", status:"미충족", courses:"기계공학 전공 인정 과목", reason:"전공합계가 17학점 부족합니다.", action:"전공필수 부족 4학점을 포함해 기계공학 전공 인정 17학점을 우선 확보하세요.", source:"학부 전필+전선-기계 66" }),
      req({ id:"d-chapel", group:"채플", name:"채플", kind:"nonCredit", required:null, earned:null, unit:"상태", requiredLabel:"편입 기준", earnedLabel:"충족", status:"충족", courses:"비전채플 인정 내역", reason:"편입생 채플 기준은 충족으로 표시됩니다.", action:"추가 조치가 필요하지 않습니다.", source:"학부 채플(신입 6회, 편입2학년4회)" }),
    ],
  },
];

const fulfilledStatuses = new Set<RequirementStatus>(["충족", "비적용"]);

export function calculateProgress(studentCase: StudentCase) {
  const primaryCredit = studentCase.requirements.find((item) => item.progressPrimary);
  const creditNumerator = primaryCredit?.earned ?? studentCase.totalEarned;
  const creditDenominator = primaryCredit?.required ?? studentCase.totalRequired;
  const creditPercent = Math.round(Math.min(1, creditNumerator / creditDenominator) * 1000) / 10;

  const applicable = studentCase.requirements.filter((item) => item.status !== "비적용");
  const completed = applicable.filter((item) => fulfilledStatuses.has(item.status));
  const nonCredit = applicable.filter((item) => item.kind !== "credit");
  const nonCreditCompleted = nonCredit.filter((item) => fulfilledStatuses.has(item.status));

  return {
    creditNumerator,
    creditDenominator,
    creditPercent,
    requirementNumerator: completed.length,
    requirementDenominator: applicable.length,
    requirementPercent: applicable.length ? Math.round((completed.length / applicable.length) * 100) : 0,
    nonCreditNumerator: nonCreditCompleted.length,
    nonCreditDenominator: nonCredit.length,
    nonCreditPercent: nonCredit.length ? Math.round((nonCreditCompleted.length / nonCredit.length) * 100) : 0,
    excluded: studentCase.requirements.filter((item) => item.status === "비적용").map((item) => item.name),
  };
}

export function shortageLabel(requirement: Requirement) {
  if (requirement.required !== null && requirement.earned !== null) {
    const shortage = Math.max(0, requirement.required - requirement.earned);
    return shortage === 0 ? "-" : `${shortage}${requirement.unit}`;
  }
  if (requirement.status === "충족" || requirement.status === "비적용") return "-";
  if (requirement.status === "증빙 필요") return "증빙";
  if (requirement.status === "학과 확인 필요") return "확인";
  return requirement.unit === "건" ? "1건" : "미완료";
}

export function valueLabel(requirement: Requirement, field: "required" | "earned") {
  const custom = field === "required" ? requirement.requiredLabel : requirement.earnedLabel;
  if (custom) return custom;
  const value = requirement[field];
  return value === null ? "-" : `${value}${requirement.unit}`;
}

export function buildAiPayload(studentCase: StudentCase) {
  const progress = calculateProgress(studentCase);
  const requirements = studentCase.requirements.map((item) => ({
    id: item.id,
    group: item.group,
    label: item.name,
    status: item.status,
    required: valueLabel(item, "required"),
    earned: valueLabel(item, "earned"),
    shortage: shortageLabel(item),
    action: item.action,
    basis: item.source,
  }));
  const byStatus = (status: RequirementStatus) => requirements.filter((item) => item.status === status).map((item) => item.label);
  return {
    caseId: studentCase.id,
    department: studentCase.department,
    admissionYear: studentCase.admissionYear,
    yearLabel: studentCase.yearLabel,
    majorType: studentCase.majorType,
    creditSummary: {
      required: studentCase.totalRequired,
      earned: studentCase.totalEarned,
      shortage: Math.max(0, studentCase.totalRequired - studentCase.totalEarned),
    },
    progress,
    requirements,
    fulfilled: byStatus("충족"),
    unmet: byStatus("미충족"),
    planned: byStatus("충족예정"),
    evidenceNeeded: byStatus("증빙 필요"),
    departmentConfirmation: byStatus("학과 확인 필요"),
    recommendedActions: studentCase.requirements.filter((item) => !fulfilledStatuses.has(item.status)).map((item) => item.action).slice(0, 8),
    ruleSources: [...new Set(studentCase.requirements.map((item) => item.source))],
  };
}
