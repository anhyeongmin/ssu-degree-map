# SSU DegreeMap

숭실대학교 u-SAINT 졸업사정표의 익숙한 표 구조를 유지하면서, 네 개의 익명 사례에 대해 부족 원인·다음 행동·판정 근거를 설명하는 정적 웹 MVP입니다. 졸업요건과 진행률은 결정론적 규칙 엔진이 계산하며, Cloudflare Workers AI는 그 결과를 한국어로 설명하고 행동 우선순위를 정하는 데만 사용합니다.

## 구현 범위

- `사례 A · 졸업유예`, `사례 B · 복수전공`, `사례 C · AI소프트웨어학부 2학년`, `사례 D · 기계공학부 4학년` 전환
- 총학점 진행률, 비학점·행정 완료율, 전체 확인 요건 완료율 분리
- `충족`, `미충족`, `충족예정`, `증빙 필요`, `학과 확인 필요`, `비적용` 판정
- 각 행의 계산값, 부족 원인, 다음 행동, 근거 확인
- 버튼을 눌렀을 때만 Workers AI 추론 실행
- 사례·입력 해시별 브라우저 세션 캐시로 중복 호출 방지
- AI 실패 시 규칙 기반 판정은 계속 제공

## 판정과 AI의 경계

```text
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

루트 테스트는 네 사례의 진행률·학년별 판정·전공 분리·AI 전송 데이터 비식별화를 검증합니다. `worker/tests`는 허용 입력, 개인정보 차단, 자유입력 차단, AI JSON 응답 스키마를 검증합니다.

## Worker 배포

```bash
cd worker
npm ci
npm exec wrangler login
npm run deploy
```

Workers AI binding 이름은 `AI`, 기본 모델은 `@cf/meta/llama-3.1-8b-instruct-fast`입니다. 토큰이나 배포 비밀값은 저장소에 커밋하지 않습니다.

## GitHub Pages 배포

`main` 브랜치에 변경사항이 올라가면 GitHub Actions가 Next.js 정적 사이트를 빌드하고 GitHub Pages에 배포합니다. Worker 주소는 Actions 워크플로의 공개 환경변수 `NEXT_PUBLIC_AI_WORKER_URL`로 주입합니다.

> 이 MVP는 제공된 졸업사정표의 익명 구조화 사례를 설명하기 위한 시연판입니다. 최종 졸업 판정과 최신 규정 적용은 u-SAINT 및 소속 학과 확인이 필요합니다.
