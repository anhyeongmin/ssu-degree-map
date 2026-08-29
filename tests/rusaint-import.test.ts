import assert from "node:assert/strict";
import test from "node:test";
import { buildAiPayload, calculateProgress } from "../lib/degree-map.ts";
import { parseRusaintJsonFiles } from "../lib/rusaint-import.ts";

const student = {
  number:20201234,
  name:"실제이름",
  grade:4,
  semester:8,
  status:"재학",
  apply_year:2020,
  apply_type:"신입학",
  department:"AI소프트웨어학부",
  majors:["AI소프트웨어", "기계공학"],
  audit_date:"2026-08-29",
  graduation_points:133,
  completed_points:116,
};

const requirements = {
  is_graduatable:false,
  requirements:{
    total:{ name:"총 졸업학점", requirement:133, calculation:116, difference:-17, result:false, category:"", lectures:[] },
    major:{ name:"복수전공 기계공학", requirement:42, calculation:20, difference:-22, result:false, category:"복수전공", lectures:["고체역학"] },
    chapel:{ name:"채플", requirement:null, calculation:null, difference:null, result:true, category:"채플", lectures:["비전채플"] },
  },
};

const grades = {
  student_number:"20201234",
  student_name:"실제이름",
  department:"AI소프트웨어학부",
  grades:[
    { classification:"복수전공선택", year:"2025", semester:"2", course_code:"21500001", course_name:"고체역학", credits:"3", score:"95", grade:"A+", note:"" },
  ],
};

function file(name: string, value: unknown) {
  return { name, text:JSON.stringify(value) };
}

test("rusaint 졸업요건·학생정보·성적을 익명 로컬 사례로 변환한다", () => {
  const result = parseRusaintJsonFiles([
    file("student.json", student), file("requirements.json", requirements), file("grades.json", grades),
  ]);
  assert.equal(result.studentCase.id, "I");
  assert.equal(result.studentCase.totalRequired, 133);
  assert.equal(result.studentCase.totalEarned, 116);
  assert.equal(result.studentCase.uSaintStatus, "불가능");
  assert.match(result.studentCase.majorType, /기계공학/);
  assert.equal(result.studentCase.requirements.length, 3);
  assert.equal(result.studentCase.completedCourses?.[0].code, "21500001");
  assert.equal(calculateProgress(result.studentCase).creditPercent, 87.2);
  assert.equal(buildAiPayload(result.studentCase).caseId, "B");
});

test("이름·학번은 StudentCase와 AI 요청에 남지 않는다", () => {
  const result = parseRusaintJsonFiles([file("student.json", student), file("requirements.json", requirements), file("grades.json", grades)]);
  const caseJson = JSON.stringify(result.studentCase);
  const aiJson = JSON.stringify(buildAiPayload(result.studentCase));
  for (const secret of ["실제이름", "20201234"]) {
    assert.equal(caseJson.includes(secret), false);
    assert.equal(aiJson.includes(secret), false);
  }
  assert.ok(result.summary.personalFieldsRemoved.includes("number"));
  assert.ok(result.summary.personalFieldsRemoved.includes("student_number"));
});

test("세션·인증정보가 포함된 JSON은 거부한다", () => {
  assert.throws(
    () => parseRusaintJsonFiles([file("session.json", { token:"secret", requirements:requirements.requirements })]),
    /세션·인증 파일/,
  );
});

test("졸업요건 파일이 없으면 안전하게 중단한다", () => {
  assert.throws(() => parseRusaintJsonFiles([file("student.json", student)]), /졸업요건 데이터/);
});
