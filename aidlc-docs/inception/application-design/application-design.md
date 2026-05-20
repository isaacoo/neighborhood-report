# Application Design (Consolidated)

본 문서는 이사갈 동네 리포트 서비스의 application-level design을 통합 정리합니다. 상세 산출물은 동일 디렉토리의 다음 파일을 참조하세요:
- `components.md` — 컴포넌트 정의 및 책임
- `component-methods.md` — 메소드 시그니처 (TypeScript)
- `services.md` — Application Service Layer
- `component-dependency.md` — 의존성·통신 패턴·데이터 플로우

---

## 1. Design Decisions

본 디자인은 Application Design 단계에서 사용자가 승인한 8개 결정에 기반합니다:

| 항목 | 결정 |
|------|------|
| AD1 컴포넌트 분리 | Standard (도메인별 + 외부 API 클라이언트 별도, ~27 backend 컴포넌트) |
| AD2 외부 API 클라이언트 | Per-API client + 공통 BaseHttpClient (재시도/타임아웃/로깅 표준화) |
| AD3 Service 패턴 | Application Service per use-case (Hexagonal/Clean) |
| AD4 데이터 영속성 | Repository pattern (interface 추상화, in-memory mock 가능) |
| AD5 Frontend 상태 | React Context + useReducer |
| AD6 Frontend 라우팅 | React Router DOM v6 |
| AD7 Admin Panel | 동일 React 앱 내 `/admin/*` 라우트 |
| AD8 캐시 위치 | Repository 내부 (Read-through 패턴) |

---

## 2. Architecture Overview

### Layered Architecture
```
┌─────────────────────────────────────────────┐
│ Frontend (React SPA)                        │
│   Pages → Components → Hooks → Context      │
└─────────────────────────────────────────────┘
                  │ REST/JSON
                  ▼
┌─────────────────────────────────────────────┐
│ Backend HTTP (Express Routers + Middleware) │
└─────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ Application Service Layer (per use-case)    │
└─────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ Domain Components (Analyzers, Engines)      │
└─────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ Infrastructure (Clients, Cache, Auth, Log)  │
│ + Repositories (Interface + PG impl)        │
└─────────────────────────────────────────────┘
                  │
        ┌─────────┼──────────┬──────────────┐
        ▼         ▼          ▼              ▼
    PostgreSQL  Redis    공공 API 5종   AWS Secrets
```

### Monorepo Structure
```
neighborhood-report/
├── packages/
│   ├── shared/        # @neighborhood-report/shared (TS types)
│   ├── backend/       # @neighborhood-report/backend
│   │   └── src/
│   │       ├── routes/        # Express routers (HTTP layer)
│   │       ├── services/      # Application services (S-01 ~ S-14)
│   │       ├── domain/        # Domain components (C-01 ~ C-09)
│   │       ├── clients/       # External API clients (C-10 ~ C-16)
│   │       ├── cache/         # CacheManager (C-17)
│   │       ├── auth/          # AuthService (C-18)
│   │       ├── middleware/    # Express middleware (RateLimiter C-19, AuthMiddleware, errorHandler)
│   │       ├── audit/         # AuditLogger (C-20)
│   │       ├── monitoring/    # ApiStatusRecorder (C-21)
│   │       ├── repositories/  # Repository interfaces + PG impl (C-22 ~ C-27)
│   │       ├── db/            # knex 마이그레이션, seed
│   │       ├── config/        # 환경 변수 로드, DI composition
│   │       └── index.ts
│   └── frontend/      # @neighborhood-report/frontend
│       └── src/
│           ├── pages/         # F-01 ~ F-10
│           ├── components/    # F-20 ~ F-29
│           ├── infrastructure/# F-30 ~ F-34 (ApiClient, LocalStorage, Context)
│           ├── App.tsx
│           └── main.tsx
├── docker-compose.yml          # 로컬 PG + Redis
├── package.json (workspace root)
└── .env.example
```

---

## 3. Component Inventory Summary

### Backend (27)
- **Domain (9)**: SearchEngine, CandidateManager, PriceAnalyzer, InfraAnalyzer, EnvironmentAnalyzer, SafetyAnalyzer, ScoreEngine, ReportComposer, ComparisonEngine
- **Public API Clients (7)**: BaseHttpClient(공통) + RegionCode/MolitTrade/MolitRent/AirKorea/KmaForecast/HiraHospital
- **Cross-Cutting (5)**: CacheManager, AuthService, RateLimiter, AuditLogger, ApiStatusRecorder
- **Repositories (6)**: AdminUser, WeightConfig, WeightPreset, CacheMetadata, ApiStatusLog, AuditLog

### Backend Application Services (12)
- **User-Facing (7)**: SearchRegion, AnalyzePrice, AnalyzeInfra, AnalyzeEnvironment, AnalyzeSafety, GenerateReport, CompareCandidates
- **Admin-Facing (5)**: AdminLogin, AdminAccount, ApiStatus, CacheAdmin, WeightAdmin

### Frontend
- **Pages (10)**: 사용자 4개 + 운영자 6개
- **Reusable Component Groups (10)**: 검색, 후보지, 가격, 인프라, 환경, 안전, 점수, 비교, Admin, 공통 UX
- **Infrastructure (5)**: ApiClient, CandidateLocalStorage, AuthContext, CandidatesContext, AppRouter

---

## 4. API Endpoints (REST)

### User-Facing
| Method | Endpoint | Service | Description |
|--------|----------|---------|-------------|
| GET | `/api/search?q={query}` | S-01 SearchRegion | 지역 검색 |
| GET | `/api/analysis/price/:regionCode?period={3m\|6m\|12m}` | S-02 AnalyzePrice | 실거래가 요약 |
| GET | `/api/analysis/price/:regionCode/trades?period&type&page` | S-02 AnalyzePrice | 거래 상세 목록 |
| GET | `/api/analysis/infra/:regionCode` | S-03 AnalyzeInfra | 생활 인프라 |
| GET | `/api/analysis/environment/:regionCode` | S-04 AnalyzeEnvironment | 환경/기상 |
| GET | `/api/analysis/safety/:regionCode` | S-05 AnalyzeSafety | 안전 인프라 |
| POST | `/api/report/:regionCode/generate?period` | S-06 GenerateReport | 리포트 생성 |
| GET | `/api/report/:regionCode?period` | S-06 GenerateReport | 리포트 조회 (캐시 포함) |
| GET | `/api/compare?regions={r1,r2,...}&sortBy={category}` | S-07 CompareCandidates | 후보지 비교 |
| GET | `/api/health` | (no service) | Health check |

### Admin-Facing
| Method | Endpoint | Service | Description |
|--------|----------|---------|-------------|
| POST | `/api/admin/auth/login` | S-10 AdminLogin | 로그인 (JWT 발급) |
| GET | `/api/admin/auth/me` | (AuthMiddleware) | 현재 운영자 정보 |
| POST | `/api/admin/auth/register` | S-11 AdminAccount | 신규 admin 생성 (superadmin) |
| POST | `/api/admin/auth/change-password` | S-11 AdminAccount | 비밀번호 변경 |
| GET | `/api/admin/accounts` | S-11 AdminAccount | 운영자 목록 (superadmin) |
| DELETE | `/api/admin/accounts/:id` | S-11 AdminAccount | 운영자 삭제 (superadmin) |
| GET | `/api/admin/apis` | S-12 ApiStatus | API 상태 목록 |
| POST | `/api/admin/apis/:name/retry` | S-12 ApiStatus | 수동 재시도 |
| GET | `/api/admin/cache?apiName&regionCode` | S-13 CacheAdmin | 캐시 상태 |
| POST | `/api/admin/cache/:regionCode/refresh` | S-13 CacheAdmin | 특정 지역 캐시 무효화 |
| GET | `/api/admin/weights` | S-14 WeightAdmin | 활성 가중치 |
| PUT | `/api/admin/weights` | S-14 WeightAdmin | 가중치 변경 (새 버전) |
| GET | `/api/admin/weights/versions` | S-14 WeightAdmin | 버전 목록 |
| GET | `/api/admin/weights/presets` | S-14 WeightAdmin | 프리셋 목록 |
| POST | `/api/admin/weights/presets` | S-14 WeightAdmin | 프리셋 추가 |
| PATCH | `/api/admin/weights/presets/:id` | S-14 WeightAdmin | 프리셋 수정 |
| DELETE | `/api/admin/weights/presets/:id` | S-14 WeightAdmin | 프리셋 삭제 |

응답 표준 형식:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "dataTimestamp": "2026-05-20T...", "isStaleCache": false }
}
```

에러 응답:
```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "..." }
}
```

---

## 5. Cross-Cutting Patterns

### Cache Read-Through (per FR-10, NFR-3.2)
모든 외부 API 호출은 CacheManager.getOrFetch()를 통해 read-through. 외부 API 실패 시 stale fallback 시도.

### Authentication (per FR-12, NFR-4.3)
JWT 1시간 만료, sessionStorage. AuthMiddleware가 `/api/admin/*` (login 제외) 보호.

### Rate Limiting (per NFR-4.6)
IP 기반. 정책: 검색 60/min, 리포트 10/min, Admin 100/min.

### Audit Log (per NFR-4.8)
모든 Admin 변경 작업은 AuditLogger.log()로 기록 (DB + CloudWatch).

### Error Handling (per FR-7, FR-13)
외부 API 부분 실패 → 데이터 부족 처리. 전체 실패 + 캐시 없음 → 명시적 실패 응답 + 재시도 버튼.

---

## 6. Traceability

| FR | Components | Services | Frontend |
|----|-----------|----------|----------|
| FR-1 검색 | C-01, C-11 | S-01 | F-01, F-20 |
| FR-2 후보지 | C-02 | (frontend-driven) | F-01, F-02, F-21, F-31 |
| FR-3 실거래가 | C-03, C-12, C-13, C-17 | S-02 | F-03, F-22 |
| FR-4 인프라 | C-04, C-16, C-17 | S-03 | F-03, F-23 |
| FR-5 환경 | C-05, C-14, C-15, C-17 | S-04 | F-03, F-24 |
| FR-6 안전 | C-06, C-17 | S-05 | F-03, F-25 |
| FR-7 점수 | C-07, C-08, C-23 | S-06 | F-03, F-26 |
| FR-8 비교 | C-09 | S-07 | F-04, F-27 |
| FR-9 API 상태 | C-21, C-26 | S-12 | F-07, F-28 |
| FR-10 캐시 | C-17, C-25 | S-13 | F-08, F-28 |
| FR-11 가중치 | C-23, C-24 | S-14 | F-09, F-28 |
| FR-12 계정 | C-18, C-22 | S-10, S-11 | F-05, F-10, F-32 |
| FR-13 데이터 처리 | C-08 (메타데이터), C-17 (stale 표시) | (모든 service에 횡단 적용) | F-26 (산정 근거 표시) |
| FR-14 범위 제한 | (해당 기능 미구현) | — | — |

---

## 7. Open Items (다음 단계로 이관)

다음 항목은 **Functional Design** 단계에서 상세화됩니다:
- 점수 산정 공식 (각 카테고리별 0~100 매핑)
- 가격 면적대 그룹핑 임계값 정확화
- 대기질 KHAI 등급 임계값 (정확 수치)
- 별칭 정규화 규칙
- 강점/약점 자동 분류 임계값 (상위/하위 N개)
- 데이터 부족 판정 임계값 (각 카테고리별)

다음 항목은 **NFR Requirements/Design** 단계에서 명시됩니다:
- Retry/Circuit Breaker 정확한 정책
- Cache 키 해싱 전략
- JWT secret rotation 정책
- 비밀번호 정책 정확 표현

다음 항목은 **Infrastructure Design** 단계에서 명시됩니다:
- AWS 리소스 sizing (Fargate vCPU/Memory, RDS instance class, ElastiCache node type)
- VPC/Subnet/SG 설계
- Secrets Manager에 저장할 비밀 목록
- CloudWatch 알람 임계값
- IaC tool 선택 (CDK vs Terraform)
