# Requirements Verification Questions

이미 사용자가 작성해주신 입력 자료(`requirements/neighborhood-report-requirements.md`, `requirements/constraints.md`)와 이전 대화에서의 결정 사항을 기반으로 분석한 결과, 아래 항목들을 명확히 하면 요구사항이 완성됩니다. 각 질문 아래 `[Answer]:` 태그에 답변을 적어주세요.

---

## Extension Opt-In Questions

### Question 1: Security Extensions
보안 extension 규칙을 이 프로젝트에 강제 적용할까요?

A) Yes — 모든 SECURITY 규칙을 blocking constraint로 강제 적용 (운영 가능 수준의 애플리케이션 권장)
B) No — 모든 SECURITY 규칙을 건너뛰기 (PoC, 프로토타입, 실험적 프로젝트에 적합)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2: Property-Based Testing Extension
Property-based testing (PBT) 규칙을 이 프로젝트에 강제 적용할까요?

A) Yes — 모든 PBT 규칙을 blocking constraint로 강제 적용 (비즈니스 로직, 데이터 변환, 직렬화, 상태 컴포넌트가 있는 프로젝트 권장)
B) Partial — 순수 함수와 직렬화 round-trip에만 PBT 규칙 적용 (알고리즘 복잡도가 제한된 프로젝트에 적합)
C) No — 모든 PBT 규칙 건너뛰기 (단순 CRUD, UI 전용, 비즈니스 로직 없는 통합 레이어에 적합)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Functional Requirements 명확화

### Question 3: 후보지 등록 최대 개수
이전 대화에서 "MVP 제한 무시하고 최종 서비스 requirement 기준대로 진행"으로 결정되었습니다. requirements 문서에는 **최대 5개**로 명시되어 있습니다. 이를 확정할까요?

A) 5개 (현재 requirements 문서대로)
B) 3개 (MVP 제한 적용)
C) 10개 (확장)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4: 사용자 인증 방식
constraints.md에는 "OAuth, SNS 로그인 미사용", "사용자별 장기 이력 관리 미제공"이라고 되어 있어 **사용자(이사 예정자)는 비로그인**으로 보입니다. 한편 운영자(Admin)는 인증이 필요합니다. 이 구조가 맞을까요?

A) 사용자: 비로그인 + LocalStorage / 운영자: ID/PW 로그인 (JWT)
B) 사용자: 이메일 회원가입 + LocalStorage 동기화 / 운영자: ID/PW 로그인
C) 사용자: 비로그인 / 운영자: SSO (예: AWS Cognito)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5: 데이터 영속성
사용자(비로그인)의 후보지 데이터는 LocalStorage에만 저장하나요, 아니면 서버에도 익명 식별자로 저장하나요?

A) LocalStorage만 사용 (브라우저 변경 시 데이터 소실)
B) LocalStorage + 서버 익명 ID (브라우저 식별자 기반 동기화)
C) LocalStorage + URL 공유 가능한 임시 스냅샷
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 6: 좌표 기반 시설 검색의 좌표 출처
생활 인프라/안전 분석은 후보지 중심 좌표를 기준으로 반경별 시설을 조회합니다. **법정동 단위의 중심 좌표**를 어떻게 확보할까요?

A) 행정안전부 법정동코드 API의 좌표 정보를 활용 (별도 좌표 데이터셋 불필요)
B) Geocoding API로 동 이름을 좌표로 변환 (별도 API 발급 필요할 수 있음)
C) VWorld 또는 공간정보 오픈플랫폼 API 추가 발급
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 7: 점수 산정 가중치 기본값
운영자가 가중치를 변경할 수 있지만, **초기 기본 가중치**의 합계가 1.0이 되어야 합니다. 6개 카테고리(주거비/생활인프라/교통/환경/안전/데이터신뢰도)의 초기 기본값을 어떻게 할까요?

A) 균등 분배 (각 0.167, 1/6씩)
B) 추천 가중치: 주거비 0.25, 생활인프라 0.20, 교통 0.15, 환경 0.15, 안전 0.15, 데이터신뢰도 0.10
C) 운영자가 첫 배포 시 직접 입력 (시스템에 기본값 미설정)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Non-Functional Requirements 명확화

### Question 8: 동시 사용자 수 (예상 트래픽)
AWS 배포 시 인프라 사이징의 기준이 됩니다.

A) 소규모: 동시 사용자 ~100명 (개인 프로젝트 / 베타)
B) 중규모: 동시 사용자 ~1,000명 (소규모 서비스 출시)
C) 대규모: 동시 사용자 ~10,000명 (대중 서비스)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 9: 응답 시간 목표
리포트 생성 요청 시 사용자 응답 시간 목표는?

A) 1초 이내 (캐시 히트 위주)
B) 3초 이내 (캐시 미스 시 외부 API 호출 1-2회 허용)
C) 10초 이내 (전체 데이터 조회 허용, 진행 상태 표시)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 10: 가용성 목표
서비스 가용성 SLA 목표는?

A) 99% (월 7시간 다운타임 허용, 개인 프로젝트 수준)
B) 99.5% (월 3.6시간 다운타임 허용)
C) 99.9% (월 43분 다운타임 허용, 운영 서비스 수준)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 11: 다국어 지원
현재 한국어 기반인데, 영어 등 다국어 지원이 MVP에 필요할까요?

A) 한국어 only (다국어 지원 없음)
B) 한국어 + 영어 (i18n 구조 준비)
C) 다국어 확장 가능한 구조만 만들고 콘텐츠는 한국어만 작성
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 12: 접근성 (WCAG)
웹 접근성 준수 수준은?

A) WCAG 2.1 AA 준수 (정부/공공 서비스 권장 수준)
B) WCAG 2.1 A 준수 (기본 수준)
C) 접근성 가이드라인 미적용 (개인 프로젝트)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Technical Context 명확화

### Question 13: AWS 배포 아키텍처
AWS 운영 환경의 배포 방식은?

A) ECS Fargate (컨테이너) + RDS PostgreSQL + ElastiCache Redis + ALB
B) Lambda + API Gateway + DynamoDB (서버리스)
C) EC2 + RDS PostgreSQL + ElastiCache Redis (전통적)
D) AppRunner + RDS + ElastiCache (간소화된 컨테이너)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 14: Frontend 호스팅
React Frontend의 배포 방식은?

A) S3 + CloudFront (정적 호스팅, SPA 방식)
B) Amplify Hosting (CI/CD 통합)
C) Backend과 함께 ECS에서 SSR/CSR 통합 배포
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 15: 모니터링 및 로깅
운영 환경의 모니터링/로깅 도구는?

A) AWS CloudWatch (CloudWatch Logs + Metrics + Alarms)
B) AWS CloudWatch + X-Ray (분산 트레이싱 추가)
C) 외부 도구 (Datadog, New Relic 등)
D) 모니터링 미적용 (MVP)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Quality Attributes 명확화

### Question 16: 자동화 테스트 범위
QA 자동화의 범위는?

A) Unit + Integration + E2E (전체 자동화)
B) Unit + Integration (E2E는 수동)
C) Unit only (최소 수준)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 17: CI/CD 파이프라인
배포 자동화 수준은?

A) GitHub Actions를 통한 자동 빌드/테스트/배포 (main 브랜치 push 시 staging, 태그 push 시 production)
B) GitHub Actions로 빌드/테스트만 자동, 배포는 수동
C) 로컬 빌드/배포 (CI/CD 없음)
X) Other (please describe after [Answer]: tag below)

[Answer]: A
