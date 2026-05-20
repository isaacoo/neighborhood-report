# Application Design Plan

## Overview
Requirements (14 FR), User Stories (39개), Personas (6개)를 기반으로 시스템의 컴포넌트, 메소드, 서비스 레이어, 의존성을 정의합니다.

## Methodology
- 컴포넌트는 **Single Responsibility** 원칙으로 식별
- 외부 API별 클라이언트는 별도 컴포넌트로 분리 (mock 가능)
- Service 레이어는 컴포넌트 오케스트레이션 담당 (HTTP route handler가 직접 호출)
- 모든 컴포넌트 인터페이스는 TypeScript interface로 정의 (테스트 용이)

---

## Plan Steps

### Phase 1: Component Identification
- [ ] 1.1 핵심 비즈니스 컴포넌트 식별 (Search/Candidate/Price/Infra/Environment/Safety/Score)
- [ ] 1.2 인프라 컴포넌트 식별 (Cache/Auth/RateLimit/AuditLog)
- [ ] 1.3 외부 API 클라이언트 컴포넌트 식별 (5개 공공 API)
- [ ] 1.4 운영자 패널 컴포넌트 식별 (ApiStatus/CacheAdmin/WeightAdmin/AccountAdmin)
- [ ] 1.5 Frontend 컴포넌트 식별 (검색/등록/리포트/비교/Admin)
- [ ] 1.6 `aidlc-docs/inception/application-design/components.md` 작성

### Phase 2: Component Methods
- [ ] 2.1 각 컴포넌트의 public 메소드 시그니처 정의
- [ ] 2.2 입출력 타입 명시 (TypeScript interface)
- [ ] 2.3 메소드 목적 (1줄 설명, 비즈니스 규칙 상세는 Functional Design 단계로 연기)
- [ ] 2.4 `aidlc-docs/inception/application-design/component-methods.md` 작성

### Phase 3: Service Layer
- [ ] 3.1 사용자 측 Service 정의 (검색/리포트/비교)
- [ ] 3.2 운영자 측 Service 정의 (인증/API상태/캐시/가중치/계정)
- [ ] 3.3 Service ↔ Component 오케스트레이션 패턴
- [ ] 3.4 `aidlc-docs/inception/application-design/services.md` 작성

### Phase 4: Dependencies
- [ ] 4.1 컴포넌트 의존성 매트릭스 작성
- [ ] 4.2 통신 패턴 (sync REST 호출, in-process function call, 캐시 read-through)
- [ ] 4.3 데이터 플로우 다이어그램
- [ ] 4.4 `aidlc-docs/inception/application-design/component-dependency.md` 작성

### Phase 5: Consolidation
- [ ] 5.1 `aidlc-docs/inception/application-design/application-design.md` 통합 문서 작성

---

## Embedded Design Questions

### Question AD1: Component Granularity
컴포넌트 분리 수준은?

A) Standard — 비즈니스 도메인별 + 외부 API 클라이언트 별도 (~15-20 컴포넌트)
B) Fine-grained — 더 작은 단위로 분해 (예: PriceFetcher, PriceAggregator, PriceFormatter 분리)
C) Coarse-grained — 도메인 레이어 통합 (예: PriceService 하나로 모든 가격 로직)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question AD2: External API Client Pattern
외부 공공 API 클라이언트 추상화는?

A) Per-API client + 공통 BaseHttpClient (재시도/타임아웃/로깅 공통화) — 권장
B) Single unified client (모든 API를 하나의 클래스에서 호출)
C) Per-API client without 공통 base (각자 구현)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question AD3: Service Layer Pattern
Service 레이어 패턴은?

A) Application Service per use-case (예: GenerateReportService, CompareCandidatesService) — Hexagonal/Clean Architecture 권장
B) Domain Service (도메인별로 묶음, 예: ReportService가 generate/get/list 모두 담당)
C) Service 없이 route handler가 직접 component 호출
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question AD4: 데이터 영속성 추상화
DB/캐시 접근 패턴은?

A) Repository pattern (Interface로 추상화, in-memory mock 가능) — 권장
B) Direct ORM/client 사용 (knex/ioredis 직접 호출)
C) Hybrid — Repository는 도메인 entity, 단순 query는 직접 호출
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question AD5: Frontend State Management
Frontend 상태 관리는?

A) React Context + useReducer (외부 라이브러리 최소화) — 권장
B) Redux Toolkit (대규모 상태 관리)
C) Zustand (경량 상태 관리)
D) TanStack Query (서버 상태) + React Context (클라이언트 상태)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question AD6: Frontend Routing
Frontend 라우팅 구조는?

A) React Router DOM v6 + 페이지 단위 라우팅 — 권장
B) 단일 페이지 (탭 기반 SPA)
C) Next.js App Router (SSR 활용)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question AD7: Admin Panel 분리 방식
Admin Panel을 별도 SPA로 분리할까요?

A) 동일 React 앱 내 `/admin/*` 라우트 (배포 통합) — 권장
B) 별도 React 앱 (독립 배포, 별도 도메인)
C) Backend rendered Admin Panel (서버 사이드 템플릿)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question AD8: 외부 API 호출 시 캐시 처리 위치
캐시 read-through 로직 위치는?

A) Repository 내부 (캐시 → 외부 API → DB → 반환) — 권장
B) Service 레이어에서 명시적으로 분기
C) 별도 Cache Decorator 패턴
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Mandatory Artifacts
- [ ] `aidlc-docs/inception/application-design/components.md`
- [ ] `aidlc-docs/inception/application-design/component-methods.md`
- [ ] `aidlc-docs/inception/application-design/services.md`
- [ ] `aidlc-docs/inception/application-design/component-dependency.md`
- [ ] `aidlc-docs/inception/application-design/application-design.md` (consolidation)
