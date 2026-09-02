# SSU DegreeMap

숭실대학교 u-SAINT 졸업사정표의 익숙한 표 구조를 유지하면서, 네 개의 익명 사례에 대해 부족 원인·다음 행동·판정 근거를 설명하는 정적 웹 MVP입니다. 졸업요건과 진행률은 결정론적 규칙 엔진이 계산하며, Cloudflare Workers AI는 그 결과를 한국어로 설명하고 행동 우선순위를 정하는 데만 사용합니다.

- GitHub Pages: https://anhyeongmin.github.io/ssu-degree-map/
- Cloudflare Worker: https://ssu-degree-map-ai.degreepath.workers.dev

## 구현 범위

- `사례 A · 졸업유예`, `사례 B · 복수전공`, `사례 C · AI소프트웨어학부 2학년`, `사례 D · 기계공학부 4학년` 전환
- 총학점 진행률, 비학점·행정 완료율, 전체 확인 요건 완료율 분리
- `충족`, `미충족`, `충족예정`, `증빙 필요`, `학과 확인 필요`, `비적용` 판정
- 각 행의 계산값, 부족 원인, 다음 행동, 근거 확인
- 버튼을 눌렀을 때만 Workers AI 추론 실행
- 사례·입력 해시별 브라우저 세션 캐시로 중복 호출 방지
- AI 실패 시 규칙 기반 판정은 계속 제공
- AI소프트웨어학부·기계공학부 공식 교과목 코드, 학점, 학년·학기 검색
- 2020~2025 AI계열 교과과정과 전필·복수전공필수 변경 이력
- 기계공학 복수전공 42학점·복수전공필수 9학점·실험 선택 규칙
- 공식 자료끼리 충돌하는 코드·복필 합계를 자동 확정하지 않고 `학과 확인 필요`로 표시
- 부족요건과 공식 교과목을 연결한 결정론적 우선 이수과목 후보
- 과목 수·학점 기준의 공개자료 범위 최소 추가이수 경로
- 선택 과목 이수 가정 전후의 총학점·영역별 What-if 비교
- 전체 수강내역이 없는 사례는 `수강내역 대조 필요`로 제한하고 이미 확인된 이수과목은 후보에서 제외

### 상세기획서 기능 ID 반영

- `S-01~06`: 전주기 대시보드, 공식/예상 현황 분리, 우선 미충족 요건, 7단계 상태, 출처·버전, 조기경보
- `R-01~06`: 우선 이수과목, 공개자료 범위 최소경로, 추천 이유, 개설학기·선수·대상 검증, 불필요 추천 차단, What-if
- `C-01~09`: 과목 계보, 교양 기존/통합 OR, 졸업자격·영어 경로, 학생관계 예외, 다전공 학점배정, 외부학점·최소성적의 확인 필요 보존
- `E-01~04`: 증빙 보유·제출·승인·u-SAINT 반영 분리, 행정절차, 유효기간 경고
- `A-01~06`: Workers AI 규정 후보 추출, 담당자 승인 게이트, 변경 영향분석, 규칙 버전·감사, 반복 위험 분석, 216개 회귀시험
- `rusaint` 로컬 커넥터: 실제 u-SAINT 졸업사정 학생정보·요건·이수구분별 성적 JSON 가져오기, 개인정보 제거, 기존 이수과목 추천 제외

상세기획서가 요구한 대표 복잡 사례를 완전하게 시연하는 범위입니다. 모든 학과의 비공개 규정, 로그인된 u-SAINT 자동 연동, 실제 담당자 승인 저장은 학교 권한과 내부 API가 필요한 확장 지점으로 분리하며 연결된 것처럼 표시하지 않습니다.

## 실제 u-SAINT 데이터 가져오기

웹의 `u-SAINT 가져오기` 탭에서 숭실 통합로그인 계정으로 직접 연결할 수 있습니다. Cloudflare Worker는 허용된 숭실 로그인·졸업사정 주소로만 요청을 중계하며, 비밀번호를 로그인 요청 직후 폐기합니다. 로그인 쿠키는 `SESSION_KEY`로 AES-GCM 암호화한 1시간짜리 토큰으로 브라우저 메모리에만 돌려줍니다. 별도 서버·데이터베이스·상시 실행 PC는 사용하지 않습니다.

브라우저의 Rust/WebAssembly 어댑터는 [rusaint](https://github.com/EATSTEAK/rusaint)의 졸업사정 WebDynpro 처리 흐름과 [wdpe](https://github.com/EATSTEAK/wdpe)의 순수 파서를 사용합니다. 이름과 학번을 제외한 구조화 결과만 DegreeMap 규칙 엔진에 전달합니다.

직접 연결이 일시적으로 불가능할 때는 rusaint CLI가 만든 JSON을 로컬에서 선택하는 방식도 계속 사용할 수 있습니다.

```powershell
rusaint --format json -o graduation-student.json graduation student-info
rusaint --format json -o graduation-requirements.json graduation requirements
rusaint --format json -o grades.json grades by-classification
```

- `graduation-requirements.json`은 필수입니다.
- 학생정보 JSON의 이름·학번 등 식별 필드는 사례 생성 시 제거합니다.
- 비밀번호, 토큰, 쿠키, 세션 필드가 발견되면 파일을 거부합니다.
- 로컬 가져오기의 원본 JSON은 GitHub Pages, Cloudflare Worker 또는 Workers AI로 업로드하지 않습니다.
- AI에는 기존과 동일하게 익명 구조화 판정 데이터만 전달합니다.
- 가져온 성적의 과목명은 추가 이수과목 추천에서 제외합니다.

rusaint는 MIT 라이선스의 비공식 u-SAINT 클라이언트입니다. 원 프로젝트의 저작권과 라이선스 고지는 [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)에 보존합니다. 최종 졸업 판정과 최신 규정은 u-SAINT 및 소속 학과에서 다시 확인해야 합니다.

## 공식 교과 데이터

`lib/curriculum-data.ts`는 2026-08-29에 확인한 공식 공개 자료의 정적 스냅샷입니다. 학생 개인정보, 로그인된 u-SAINT 데이터, 졸업사정표 원본 이미지는 수집하지 않습니다.

- 숭실대학교 AI융합학부의 2020·2022~2025 교과과정표
- AI소프트웨어학부 입학연도별 졸업 이수학점 안내
- 전필변경내역(2015~2025) 및 복필교과목(2017~2025)
- 기계공학부 현재 교과과정과 복수전공·실험·졸업논문 안내
- 숭실대학교 교과 이수 및 졸업사정 공통 기준

요구학점은 입학연도 기준, 과목 이수구분은 실제 수강 시점 기준으로 분리합니다. 공개 자료로 완전히 확인되지 않는 기계공학 복수전공필수 2학점과 AI 과목코드 중복은 임의로 보정하지 않습니다.

## 판정과 AI의 경계

```text
u-SAINT → Cloudflare Worker(암호화 세션 중계) → 브라우저 WASM(익명 구조화)
                                               ↓
익명 사례 데이터 → DegreeMap 규칙 엔진 → 확정된 판정·진행률
                                      ↓
GitHub Pages → Cloudflare Worker → Workers AI 설명(JSON)
```

AI는 진행률, 충족 여부, 졸업 가능 여부를 계산하거나 바꾸지 않습니다. Worker에는 이름·실제 학번·연락처·주소·원본 이미지가 아닌 익명 구조화 판정 데이터만 전송합니다.

## 로컬 실행

```bash
npm ci
npm run dev
```

기본 주소는 `http://localhost:3000`입니다. 실제 AI를 함께 확인하려면 빌드 또는 개발 환경의 `NEXT_PUBLIC_AI_WORKER_URL`에 배포된 Worker URL을 설정합니다.

## 검증

```bash
npm run lint
npm test
npm run build
```

루트 테스트는 네 사례의 진행률·학년별 판정·전공 분리·AI 전송 데이터 비식별화, 교양 OR, 다전공 배정, 증빙 단계, 영향분석과 216개 회귀 시나리오를 검증합니다. `worker/tests`는 허용 입력, 개인정보·자유입력 차단, AI JSON 응답 스키마, 공식 도메인 제한과 규정 인용문 원문 일치를 검증합니다.

## Worker 배포

```powershell
Set-Location worker
npm ci
npx wrangler login

$bytes = New-Object byte[] 32
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes) | npx wrangler secret put SESSION_KEY

npm run deploy
```

Workers AI binding 이름은 `AI`, 기본 모델은 `@cf/meta/llama-3.1-8b-instruct-fast`입니다. `SESSION_KEY`는 Cloudflare에만 저장하며 저장소에 커밋하지 않습니다. `/usaint/status`는 비밀값 자체가 아니라 암호화 설정 완료 여부만 반환합니다. 무료 할당량이 끝나면 유료 결제를 시도하거나 가짜 결과를 표시하지 않고 오류를 반환합니다.

## GitHub Pages 배포

`main` 브랜치에 변경사항이 올라가면 GitHub Actions가 Rust 브라우저 어댑터를 WebAssembly로 만들고 테스트를 실행한 다음 Next.js 정적 사이트를 GitHub Pages에 배포합니다. Worker 주소는 Actions 워크플로의 공개 환경변수 `NEXT_PUBLIC_AI_WORKER_URL`로 주입합니다.

> 이 MVP는 제공된 졸업사정표의 익명 구조화 사례를 설명하기 위한 시연판입니다. 최종 졸업 판정과 최신 규정 적용은 u-SAINT 및 소속 학과 확인이 필요합니다.
