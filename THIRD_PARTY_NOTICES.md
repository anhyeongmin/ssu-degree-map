# Third-party notices

## rusaint

DegreeMap의 u-SAINT 연결 기능과 선택적 로컬 JSON 가져오기 기능은 다음 오픈소스 프로젝트의 공개 출력 형식 및 졸업사정표 파싱 구조를 사용합니다.

- Project: [EATSTEAK/rusaint](https://github.com/EATSTEAK/rusaint)
- Description: 숭실대학교 u-SAINT 비공식 Rust 클라이언트
- License: MIT
- Version verified during integration: repository `main` commit `103e04a8ccd37fa383ab339d6e39045983b5e2f2`

Copyright (c) 2023-2025 Koo Hyomin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

DegreeMap은 rusaint 0.16.3의 졸업사정표 데이터 모델과 WebDynpro 이벤트 흐름을 브라우저 전용 Rust/WebAssembly 어댑터로 수정해 포함합니다. 네이티브 HTTP·쿠키·파일 세션 계층은 포함하지 않으며, 직접 식별자인 성명과 학번은 WebAssembly 출력 구조에서 제거했습니다. 원본 rusaint CLI JSON을 로컬에서 익명화·정규화하는 호환 방식도 함께 제공합니다.

## wdpe

브라우저 전용 어댑터는 rusaint가 사용하는 WebDynpro Parse Engine을 사용합니다.

- Project: [EATSTEAK/wdpe](https://github.com/EATSTEAK/wdpe)
- License: MIT
- Version: 0.4.3

Copyright (c) 2023-2025 Koo Hyomin

위 rusaint 절에 기재된 MIT 허가문과 보증 부인 조건이 동일하게 적용됩니다.
