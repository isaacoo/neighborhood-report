# Unit of Work Plan

## Overview
시스템을 개발 가능한 작업 단위(unit of work)로 분해합니다. Application Design에서 정의한 27개 backend 컴포넌트, 25개 frontend 컴포넌트, 12개 service, 39개 user story를 기반으로 합니다.

## 컨텍스트
- **Project Type**: Greenfield monorepo
- **Deployment Model**: Backend는 단일 Express 앱(ECS Fargate 단일 서비스)으로 배포. Frontend는 별도 정적 호스팅(S3+CloudFront).
- **Microservices가 아님**: 트래픽 규모(동시 100명, 99% SLA)와 도메인 결합도를 고려할 때 단일 backend 모놀리스가 적합. Modular Monolith 패턴.

따라서 **Unit of Work는 "독립 배포 가능한 서비스"가 아니라 "병렬 개발 가능한 논리 모듈"** 의미로 사용합니다. 단위 간 의존이 명확하고 인터페이스가 안정되면 팀이 병렬 작업 가능.

---

## Plan Steps

### Phase 1: Unit 식별
- [ ] 1.1 도메인/기능 책임 기준으로 unit 후보 식별
- [ ] 1.2 unit 간 의존성 검토 → 적정 단위 수 결정
- [ ] 1.3 각 unit의 component 멤버 결정
- [ ] 1.4 각 unit의 story 멤버 결정

### Phase 2: Unit Definition
- [ ] 2.1 각 unit의 이름, 책임, 경계, 인터페이스 정의
- [ ] 2.2 코드 조직 전략 (디렉터리 구조) 정의
- [ ] 2.3 unit 간 통신 패턴 (in-process function call, REST, etc.)
- [ ] 2.4 `aidlc-docs/inception/application-design/unit-of-work.md` 작성

### Phase 3: Dependencies
- [ ] 3.1 Unit ↔ Unit 의존 매트릭스 (build-time + runtime)
- [ ] 3.2 Unit ↔ Component 매핑
- [ ] 3.3 Critical Path 식별 (블로킹 의존)
- [ ] 3.4 병렬화 가능 unit 식별
- [ ] 3.5 `aidlc-docs/inception/application-design/unit-of-work-dependency.md` 작성

### Phase 4: Story Mapping
- [ ] 4.1 39개 User Story를 unit에 매핑
- [ ] 4.2 unit별 story 우선순위 (foundation → feature)
- [ ] 4.3 누락 story 검증
- [ ] 4.4 `aidlc-docs/inception/application-design/unit-of-work-story-map.md` 작성

### Phase 5: Validation
- [ ] 5.1 각 unit이 독립 작업 가능한지 검증
- [ ] 5.2 단위 간 인터페이스 안정성 검증
- [ ] 5.3 각 story가 정확히 하나의 unit에 배정되었는지 확인

---

## Embedded Planning Questions

### Question UG1: Decomposition Strategy
어떤 기준으로 unit을 분해할까요?

A) **Capability-based** — 비즈니스 능력별 분해 (검색, 분석, 운영자 등) — 권장
B) **Layer-based** — 기술 레이어별 분해 (frontend/backend/database)
C) **Domain-driven (DDD bounded context)** — 도메인 컨텍스트별 분해
D) **Hybrid** — Capability + 인프라 분리
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question UG2: 적정 Unit 수
얼마나 많은 unit으로 분해할까요?

A) **5-7개** — 적정 단위 수, 병렬 개발 + 관리 부담 균형 — 권장
   예시: shared-types, backend-foundation, public-api-clients, user-features, admin-features, frontend, infra-as-code
B) **3-4개** — 큰 단위 (단순한 의존 그래프)
C) **8-10개** — 세분화된 단위 (소규모 작업)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question UG3: 외부 공공 API 클라이언트 단위 분리
6개의 외부 공공 API 클라이언트(BaseHttpClient + 5개 specific client)를 어떻게 다룰까요?

A) **별도 unit으로 묶기** — 외부 통합 레이어를 독립 unit (`public-api-clients`)으로 — 권장
B) **각 도메인 unit에 포함** — Price API client는 user-features 안에, Auth는 admin 안에
C) **Backend foundation에 포함** — 인프라 unit에 모두 포함
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question UG4: Frontend Unit 구분
Frontend는 어떻게 분해할까요?

A) **단일 frontend unit** — 사용자 측 + 운영자 측 하나의 React 앱 (라우팅으로만 구분) — 권장
B) **사용자/운영자 frontend 분리** — 별도 SPA 2개로 분리
C) **Feature 별 frontend 단위** — 각 backend unit과 짝지어 frontend도 분해
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question UG5: Shared Types Unit 위치
공통 TypeScript 타입(@neighborhood-report/shared)을 unit으로 어떻게 다룰까요?

A) **독립 unit (`shared-types`)** — 가장 먼저 안정화 — 권장 (권장; 모든 unit이 의존)
B) **Backend unit 내부에 포함** — backend가 export, frontend가 import
C) **각 unit이 자체 타입 보유** — DTO를 직렬화 경계에서 변환
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question UG6: 운영자 기능 분리
운영자(Admin) 관련 컴포넌트(C-18, C-19, C-20, C-21, C-22~C-27 일부, S-10~S-14)를 어떻게 다룰까요?

A) **독립 unit (`admin-features`)** — 운영자 도메인 분리 — 권장
B) **사용자 unit과 통합** — 같은 backend feature unit 안에서 처리
C) **인증만 분리** — Auth(C-18) + AdminUser(C-22)는 foundation, 나머지는 feature unit
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Mandatory Artifacts
- [ ] `aidlc-docs/inception/application-design/unit-of-work.md`
- [ ] `aidlc-docs/inception/application-design/unit-of-work-dependency.md`
- [ ] `aidlc-docs/inception/application-design/unit-of-work-story-map.md`
