export type DepartmentId = "ai" | "mechanical";

export type OfficialSource = {
  id: string;
  title: string;
  issuer: string;
  url: string;
  publishedAt?: string;
  verifiedAt: string;
  format: "HTML" | "PDF" | "XLSX";
  scope: string;
};

export type CatalogCourse = {
  department: DepartmentId;
  code: string;
  name: string;
  credits: number;
  hours: number;
  year: number;
  semester: 1 | 2;
  classification: "전기" | "전필" | "전선";
  doubleMajorRequired?: boolean;
  sourceId: string;
  verification?: "확인" | "공식 자료 충돌";
  note?: string;
  curriculumStatus: "현재 교육과정" | "폐지·대체" | "확인 필요";
  offeredSemesters: Array<1 | 2>;
  prerequisites: string[];
  eligibleRelations: Array<"주전공" | "복수전공" | "공통">;
};

export type CourseHistory = {
  department: DepartmentId;
  code: string;
  kind: "명칭 변경" | "이수구분 변경" | "폐지·대체" | "공식 자료 충돌";
  before: string;
  after: string;
  effective: string;
  note: string;
  sourceIds: string[];
};

export type GraduationRule = {
  id: string;
  department: DepartmentId;
  title: string;
  appliesTo: string;
  values: Array<{ label: string; value: string }>;
  relation: "주전공" | "복수전공" | "공통";
  status: "공식 확인" | "학과 확인 필요";
  note: string;
  sourceIds: string[];
};

export const officialSources: OfficialSource[] = [
  {
    id: "ai-credits-2026",
    title: "AI소프트웨어학부 졸업요이수 학점 안내",
    issuer: "숭실대학교 AI융합학부",
    url: "https://aix.ssu.ac.kr/notice_view.html?category=1&idx=1763",
    publishedAt: "2026-03-04",
    verifiedAt: "2026-08-29",
    format: "HTML",
    scope: "입학연도별 전공기초·전공·전필·소속전공 최소학점",
  },
  {
    id: "ai-curriculum-2025",
    title: "2025학년도 교과과정표(배포용)",
    issuer: "숭실대학교 AI융합학부",
    url: "https://aix.ssu.ac.kr/notice_view.html?category=1&idx=1649",
    publishedAt: "2025-08-25",
    verifiedAt: "2026-08-29",
    format: "PDF",
    scope: "2022~2025 입학자 과목코드·과목명·학점·학년·학기·이수구분",
  },
  {
    id: "ai-curriculum-2020",
    title: "2020학년도 전공 교과과정표",
    issuer: "숭실대학교 AI융합학부",
    url: "https://aix.ssu.ac.kr/curriculum_view.html?idx=7",
    verifiedAt: "2026-08-29",
    format: "PDF",
    scope: "2020 입학자 과목코드·과목명·학점·이수구분",
  },
  {
    id: "ai-required-history",
    title: "전필학점 인정 관련 안내 및 전필변경내역(2015-2025)",
    issuer: "숭실대학교 AI융합학부",
    url: "https://aix.ssu.ac.kr/notice_view.html?category=1&idx=1551",
    publishedAt: "2025-01-02",
    verifiedAt: "2026-08-29",
    format: "XLSX",
    scope: "연도별 전필 변경, 폐지 과목과 전필 대체 인정 절차",
  },
  {
    id: "ai-double-history",
    title: "교과목 폐지로 인한 복필 대체 과목 및 복필교과과목(17-25)",
    issuer: "숭실대학교 AI융합학부",
    url: "https://aix.ssu.ac.kr/notice_view.html?category=1&idx=1451",
    publishedAt: "2024-06-07",
    verifiedAt: "2026-08-29",
    format: "XLSX",
    scope: "2017~2025 입학연도별 복수전공필수와 폐지 과목 대체",
  },
  {
    id: "ai-double-relaxation",
    title: "졸업요건(복필) 기준 완화 안내 - 2020년까지 입학자",
    issuer: "숭실대학교 AI융합학부",
    url: "https://aix.ssu.ac.kr/notice_view.html?category=1&idx=1675",
    publishedAt: "2025-09-16",
    verifiedAt: "2026-08-29",
    format: "HTML",
    scope: "2020학년도 이전 AI융합 복수전공필수 36→33학점",
  },
  {
    id: "me-current-curriculum",
    title: "기계공학부 교과과정",
    issuer: "숭실대학교 기계공학부",
    url: "https://me.ssu.ac.kr/about/about03.php",
    verifiedAt: "2026-08-29",
    format: "HTML",
    scope: "현재 과목코드·과목명·학점·복필 표시와 복수전공·실험·졸업논문 요건",
  },
  {
    id: "university-completion",
    title: "교과 이수 및 졸업사정 기준",
    issuer: "숭실대학교",
    url: "https://ssu.ac.kr/%ED%95%99%EC%82%AC/%EA%B5%90%EC%9C%A1%C2%B7%EA%B5%90%EA%B3%BC%EA%B3%BC%EC%A0%95/%EA%B5%90%EA%B3%BC%EA%B3%BC%EC%A0%95/%EA%B5%90%EA%B3%BC%EA%B3%BC%EC%A0%95%EC%9D%98-%EC%9D%B4%EC%88%98/",
    verifiedAt: "2026-08-29",
    format: "HTML",
    scope: "입학연도·교과과정 변경 시 이수구분 적용 원칙과 기독교교육 요건",
  },
];

const ai = (
  code: string, name: string, year: number, semester: 1 | 2,
  classification: CatalogCourse["classification"], credits = 3,
  doubleMajorRequired = false, note?: string,
): CatalogCourse => ({
  department: "ai", code, name, credits,
  hours: code === "21506741" || code === "21506798" || code === "21506867" || code === "21500304" ? 4 : credits,
  year, semester, classification, doubleMajorRequired,
  sourceId: "ai-curriculum-2025", verification: "확인", note,
  curriculumStatus:"현재 교육과정", offeredSemesters:[semester],
  prerequisites:note?.startsWith("선수과목:") ? [note.replace("선수과목:", "").trim()] : [],
  eligibleRelations:doubleMajorRequired ? ["주전공","복수전공"] : ["주전공"],
});

const me = (
  code: string, name: string, year: number, semester: 1 | 2,
  classification: CatalogCourse["classification"], credits = 3,
  doubleMajorRequired = false,
): CatalogCourse => ({
  department: "mechanical", code, name, credits,
  hours: credits === 1 ? 2 : code === "21505312" ? 3 : credits,
  year, semester, classification, doubleMajorRequired,
  sourceId: "me-current-curriculum", verification: "확인",
  curriculumStatus:"현재 교육과정", offeredSemesters:[semester], prerequisites:[],
  eligibleRelations:doubleMajorRequired ? ["주전공","복수전공"] : ["주전공"],
});

export const catalogCourses: CatalogCourse[] = [
  ai("21500544", "물리및실험", 1, 1, "전기"),
  ai("21506741", "프로그래밍및실습1", 1, 1, "전기"),
  ai("21506797", "기초AI수학", 1, 1, "전기"),
  ai("21500545", "오픈소스기초설계", 1, 2, "전기"),
  ai("21506798", "프로그래밍및실습2", 1, 2, "전기"),
  ai("21506866", "이산수학", 1, 2, "전필"),
  ai("21506911", "자료구조", 2, 1, "전선"),
  ai("21506915", "고급AI수학", 2, 1, "전필", 3, true),
  ai("21500145", "확률및통계", 2, 1, "전선"),
  ai("21506867", "고급프로그래밍및실습", 2, 1, "전선"),
  ai("21506913", "컴퓨터구조", 2, 1, "전선"),
  ai("21500310", "인공지능입문", 2, 2, "전선"),
  ai("21500140", "알고리즘", 2, 2, "전선"),
  ai("21500761", "머신러닝", 2, 2, "전필", 3, true, "선수과목: 확률및통계"),
  ai("21506869", "디지털시스템입문", 2, 2, "전필"),
  ai("21500301", "웹프로그래밍", 2, 2, "전선"),
  ai("21506912", "시스템프로그래밍", 2, 2, "전선"),
  ai("21500759", "데이터베이스", 2, 2, "전선"),
  ai("21500764", "자율주행프로그래밍", 2, 2, "전선"),
  ai("21500141", "운영체제", 3, 1, "전필"),
  ai("21500550", "서버프로그래밍", 3, 1, "전선"),
  ai("21500757", "데이터사이언스", 3, 1, "전선"),
  ai("21500758", "네트워크", 3, 1, "전선"),
  ai("21500760", "로봇공학개론", 3, 1, "전선"),
  ai("21500763", "딥러닝프로그래밍", 3, 1, "전선"),
  ai("21500303", "센서네트워크", 3, 2, "전선"),
  ai("21500304", "지능형로봇및실습", 3, 2, "전선"),
  ai("21500311", "AI임베디드프로그래밍", 3, 2, "전선"),
  ai("21500549", "컴퓨터비전", 3, 2, "전선"),
  ai("21500765", "자연언어처리", 3, 2, "전선"),
  ai("21506868", "모바일프로그래밍", 3, 2, "전선"),
  ai("21500138", "캡스톤디자인", 4, 1, "전선"),
  ai("21500308", "IoT프로그래밍", 4, 1, "전선"),
  ai("21500548", "빅데이터컴퓨팅", 4, 1, "전선"),
  ai("21500551", "GPU프로그래밍", 4, 1, "전선"),
  ai("21501523", "분산임베디드시스템", 4, 1, "전선"),
  ai("21500307", "고급캡스톤디자인", 4, 2, "전선"),
  ai("21500766", "빅데이터응용프로그래밍", 4, 2, "전선"),
  ai("21500762", "클라우드컴퓨팅", 4, 2, "전선"),
  { ...ai("21500762", "멀티모달딥러닝", 4, 2, "전선"), verification: "공식 자료 충돌", note: "공식 신설 공지와 배포용 PDF가 클라우드컴퓨팅과 동일 코드를 표기함" },

  me("21506137", "공학수학1", 1, 1, "전기"),
  me("50067628", "공학물리1", 1, 1, "전기"),
  me("50101922", "인공지능프로그래밍", 1, 1, "전기"),
  me("21506518", "공학화학1", 1, 1, "전선"),
  me("50104408", "공학수학2", 1, 2, "전기"),
  me("50104415", "공학물리2", 1, 2, "전기"),
  me("21505571", "공학설계입문", 1, 2, "전선"),
  me("21505570", "정역학", 1, 2, "전선"),
  me("21505312", "전산기계제도", 2, 1, "전필", 2, true),
  me("21503561", "고체역학", 2, 1, "전필"),
  me("21501767", "열역학", 2, 1, "전필"),
  me("21502663", "동역학", 2, 1, "전필"),
  me("50102349", "고급공학수학1", 2, 1, "전선"),
  me("21503220", "기구학", 2, 1, "전선"),
  me("21503615", "유체역학", 2, 2, "전필"),
  me("21502648", "기계공작실습", 2, 2, "전선", 1, true),
  me("21504371", "고급공학수학2", 2, 2, "전선"),
  me("21505565", "응용프로그래밍", 2, 2, "전선"),
  me("21503616", "열시스템해석", 2, 2, "전선"),
  me("21503554", "구조역학", 2, 2, "전선"),
  me("21503744", "기계요소설계", 3, 1, "전선"),
  me("21505745", "수치해석", 3, 1, "전선"),
  me("21503742", "고체역학실험", 3, 1, "전선", 3, true),
  me("21503540", "제조공학", 3, 1, "전선"),
  me("21503745", "동력시스템공학", 3, 1, "전선"),
  me("21503748", "점성및압축성유동", 3, 1, "전선"),
  me("21504101", "기계진동학", 3, 1, "전선"),
  me("21506732", "메카트로닉스", 3, 1, "전선"),
  me("21505744", "지능기계설계", 3, 2, "전선"),
  me("21504103", "유체공학실험", 3, 2, "전선"),
  me("21505584", "재료공학", 3, 2, "전선"),
  me("21505583", "열전달", 3, 2, "전선"),
  me("21505908", "자동제어", 3, 2, "전선"),
  me("21505486", "종합설계", 4, 1, "전필"),
  me("21508010", "열유체응용설계", 4, 1, "전선"),
  me("21506209", "마이크로컨트롤러", 4, 1, "전선"),
  me("21504100", "열공학실험", 4, 1, "전선", 1, true),
  me("21505655", "전산응용설계", 4, 1, "전선"),
  me("21505654", "기계설비공학", 4, 1, "전선"),
  me("21505486", "종합설계", 4, 2, "전필"),
  me("21506088", "진동실험", 4, 2, "전선", 1),
  me("21504374", "IoT실험", 4, 2, "전선", 1),
  me("21504110", "전산응용가공", 4, 2, "전선"),
  me("21504109", "자동차공학", 4, 2, "전선"),
  me("21504375", "에너지공학", 4, 2, "전선"),
];

export const courseHistories: CourseHistory[] = [
  { department:"ai", code:"21506797", kind:"명칭 변경", before:"공학수학 (2020~2022)", after:"기초AI수학 (2023~)", effective:"2023학년도", note:"과목ID는 유지되고 명칭이 변경됨", sourceIds:["ai-curriculum-2020","ai-curriculum-2025"] },
  { department:"ai", code:"21506915", kind:"명칭 변경", before:"선형대수", after:"고급AI수학", effective:"2022학년도 교과과정부터 확인", note:"연도별 전필표와 교과과정표를 함께 적용해야 함", sourceIds:["ai-curriculum-2020","ai-curriculum-2025","ai-required-history"] },
  { department:"ai", code:"21506869", kind:"명칭 변경", before:"디지털시스템설계", after:"디지털시스템입문", effective:"2022학년도 교과과정부터 확인", note:"동일 과목ID로 명칭 변경", sourceIds:["ai-curriculum-2020","ai-curriculum-2025"] },
  { department:"ai", code:"21500141", kind:"명칭 변경", before:"운영체제 → 운영체제및실습", after:"운영체제", effective:"2022~2023학년도", note:"명칭과 실습 포함 여부가 연도별로 달라 수강연도 이수구분을 확인", sourceIds:["ai-curriculum-2020","ai-curriculum-2025","ai-required-history"] },
  { department:"ai", code:"21500304", kind:"명칭 변경", before:"센서모션로봇공학", after:"지능형로봇및실습", effective:"2022학년도 교과과정부터 확인", note:"동일 과목ID의 명칭 변경", sourceIds:["ai-curriculum-2020","ai-curriculum-2025"] },
  { department:"ai", code:"21500763", kind:"명칭 변경", before:"딥러닝프로그래밍및실습", after:"딥러닝프로그래밍", effective:"2023학년도", note:"학점은 3학점으로 유지", sourceIds:["ai-curriculum-2025"] },
  { department:"ai", code:"21500143·21500144 외", kind:"폐지·대체", before:"전기전자회로·실험, 운영체제실습, 센서모션로봇실습, 마이크로프로세서응용·실험", after:"시스템프로그래밍, 컴퓨터구조, IoT프로그래밍, 디지털시스템입문, AI임베디드프로그래밍 중 부족학점만큼", effective:"2025-01-02 공지", note:"자동 인정이 아니라 수강 후 이수구분변경 신청 필요", sourceIds:["ai-required-history"] },
  { department:"ai", code:"21500143·21500144", kind:"폐지·대체", before:"복필 전기전자회로·전기전자회로실험", after:"시스템프로그래밍 또는 컴퓨터구조", effective:"2024-06-07 공지", note:"복필 이수구분변경 신청이 필요하며 이미 원 과목을 이수한 경우 비적용", sourceIds:["ai-double-history"] },
  { department:"ai", code:"21500762", kind:"공식 자료 충돌", before:"클라우드컴퓨팅", after:"멀티모달딥러닝", effective:"2025-2학기 신설 공지", note:"두 과목에 동일 코드가 표기되어 자동 대체관계를 확정하지 않고 학과 확인 필요", sourceIds:["ai-curriculum-2025"] },
  { department:"mechanical", code:"복필 합계", kind:"공식 자료 충돌", before:"현재 표에서 복필로 식별되는 7학점", after:"안내문 요구 복수전공필수 9학점", effective:"현재 공개 교과과정", note:"누락된 2학점 과목 또는 이수구분을 학과에 확인해야 함", sourceIds:["me-current-curriculum"] },
];

export const graduationRules: GraduationRule[] = [
  { id:"ai-2014-2023", department:"ai", title:"AI소프트웨어 주전공 졸업학점", appliesTo:"2014~2023학년도 입학", relation:"주전공", status:"공식 확인", values:[{label:"전공기초",value:"18학점"},{label:"전공합계",value:"66학점"},{label:"전공필수",value:"12학점"},{label:"소속전공 최소",value:"45학점"}], note:"전공기초는 반드시 입학연도 기준을 적용", sourceIds:["ai-credits-2026"] },
  { id:"ai-2024-2025", department:"ai", title:"AI소프트웨어 주전공 졸업학점", appliesTo:"2024~2025학년도 입학", relation:"주전공", status:"공식 확인", values:[{label:"전공기초",value:"15학점"},{label:"전공합계",value:"72학점"},{label:"전공필수",value:"12학점"},{label:"소속전공 최소",value:"45학점"}], note:"현재 개설 전공기초가 부족하면 전공과목 수강 후 이수구분변경 필요", sourceIds:["ai-credits-2026"] },
  { id:"ai-2026", department:"ai", title:"AI소프트웨어 주전공 졸업학점", appliesTo:"2026학년도 이후 입학", relation:"주전공", status:"공식 확인", values:[{label:"전공기초",value:"12학점"},{label:"전공합계",value:"72학점"},{label:"전공필수",value:"12학점"},{label:"소속전공 최소",value:"45학점"}], note:"AI소프트웨어학부 현재 기준", sourceIds:["ai-credits-2026"] },
  { id:"ai-double", department:"ai", title:"AI계열 복수전공필수 변천", appliesTo:"AI계열을 복수전공하는 학생", relation:"복수전공", status:"공식 확인", values:[{label:"2017~2020",value:"36학점"},{label:"2021~2022",value:"28학점"},{label:"2023",value:"9학점"},{label:"2024 이후",value:"6학점"}], note:"2020학년도 이전 입학자는 2025년 완화 공지에 따라 복필 33학점·복선 추가 3학점 경로도 확인", sourceIds:["ai-double-history","ai-double-relaxation"] },
  { id:"me-main", department:"mechanical", title:"기계공학 주전공 과목 요건", appliesTo:"현재 공개 교과과정 및 사례 D", relation:"주전공", status:"공식 확인", values:[{label:"전공필수 편성",value:"17학점"},{label:"실험선택",value:"지정 5과목 중 2과목 이상"},{label:"졸업논문",value:"총 2학기 진행"}], note:"사례 D의 전공합계·전공기초 수치는 제공된 u-SAINT 졸업사정표 값을 유지", sourceIds:["me-current-curriculum"] },
  { id:"me-double", department:"mechanical", title:"기계공학 복수전공", appliesTo:"기계공학부를 복수전공하는 학생", relation:"복수전공", status:"학과 확인 필요", values:[{label:"전공합계",value:"42학점 이상"},{label:"복수전공필수",value:"9학점 포함"},{label:"실험선택",value:"지정 5과목 중 2과목 이상"}], note:"현재 공개 표에서 복필 표시는 7학점만 식별되어 나머지 2학점은 자동 판정하지 않음", sourceIds:["me-current-curriculum"] },
  { id:"common-year", department:"ai", title:"입학연도·교과변경 적용 원칙", appliesTo:"두 학부 공통", relation:"공통", status:"공식 확인", values:[{label:"요구학점",value:"입학연도 기준"},{label:"과목 이수구분",value:"실제 이수 시점 기준"}], note:"학적변동·교과과정 변경 후에는 수강 시점의 이수구분으로 지정학점을 충족", sourceIds:["university-completion"] },
];

export const departmentLabels: Record<DepartmentId, string> = {
  ai: "AI소프트웨어학부",
  mechanical: "기계공학부",
};

export function sourcesByIds(ids: string[]) {
  return officialSources.filter((source) => ids.includes(source.id));
}
