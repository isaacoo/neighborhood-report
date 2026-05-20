# Unit of Work

본 문서는 시스템을 7개의 작업 단위(unit of work)로 분해합니다.

## Decomposition Strategy
- **Strategy**: Capability-based decomposition (UG1=A)
- **Unit Count**: 7개 (UG2=A, 최초 안내 예시 그대로 채택)
- **External API Clients**: 별도 unit으로 분리 (UG3=A)
- **Frontend**: 단일 unit, 라우팅으로 사용자/운영자 구분 (UG4=A)
- **Shared Types**: 독립 unit (UG5=A)
- **Admin Features**: 독립 unit (UG6=A)

**Deployment Model**: Backend는 단일 Express 앱(ECS Fargate)으로 배포되는 **Modular Monolith**. Unit은 "독립 배포 단위"가 아니라 "병렬 개발 가능한 논리 모듈" + "코드 모듈 경계".

## Unit Inventory

| Unit ID | Unit Name | Type | Description |
|---------|-----------|------|-------------|
| U-1 | shared-types | Shared library | TypeScript 타입 정의 + 공통 상수 |
| U-2 | backend-foundation | Foundation | 인프라/공통 미들웨어/Auth/Cache/Repository 구현 |
| U-3 | public-api-clients | Foundation | 외부 공공 API 클라이언트 (BaseHttpClient + 6 clients) |
| U-4 | user-features | Feature | 사용자 측 도메인/서비스/라우트 (검색·분석·리포트·비교) |
| U-5 | admin-features | Feature | 운영자 측 도메인/서비스/라우트 (인증·API상태·캐시·가중치·계정) |
| U-6 | frontend | Feature | React SPA (사용자 + 운영자 통합) |
| U-7 | infra-as-code | Infrastructure | AWS CDK/Terraform 코드, Docker Compose, GitHub Actions |

---

## Unit Definitions

### U-1. shared-types

**Purpose**: 모든 다른 unit이 의존하는 TypeScript 타입과 상수의 단일 출처.

**Scope**:
- Domain types: Candidate, PriceSummary, InfraResult, EnvironmentResult, SafetyResult, ScoreResult, Report
- Infrastructure types: CacheEntry, ApiStatusInfo, AuditLogEntry
- Admin types: AdminUser, AuthToken, WeightConfig, WeightPreset
- API types: ApiResponse<T>, PaginationMeta, error code enums
- 공통 상수: CACHE_TTL, FACILITY_CATEGORIES, AIR_QUALITY_GRADES

**Code Location**: `packages/shared/`

**Public Surface**:
- 타입 export only (런타임 코드 최소화)
- 일부 상수와 타입 가드 함수 (`isFacilityCategory`, etc.)

**Components Included**: (Application Design 컴포넌트 매핑 없음, type 만 보유)

**Stories Mapped**: 직접 매핑되는 story 없음. 모든 다른 unit의 prerequisite.

**Deliverable Target**: `dist/index.d.ts`, `src/*.ts` (타입 패키지)

---

### U-2. backend-foundation

**Purpose**: backend 앱 부팅, 공통 인프라(DB/Redis 연결, JWT, 미들웨어, 감사 로그), Repository 구현체 제공.

**Scope**:
- Express 앱 구성 (`src/index.ts`, `src/app.ts`)
- DI Composition root (`src/composition.ts`)
- Database 연결 (PostgreSQL via knex), 마이그레이션, seed
- Redis 연결
- 환경 변수 로드 (`src/config/env.ts`, dotenv)
- Middleware (errorHandler, request logger, cors, auth, rate limiter)
- Security & Auth: bcrypt, JWT 발급/검증, 비밀번호 정책, 로그인 잠금
- Cross-cutting: AuditLogger, ApiStatusRecorder
- Repository 구현체 (PostgreSQL via knex)

**Code Location**: `packages/backend/src/{app.ts, composition.ts, config/, middleware/, auth/, audit/, monitoring/, cache/, repositories/, db/}`

**Components Included** (Application Design):
- C-17 CacheManager
- C-18 AuthService
- C-19 RateLimiter
- C-20 AuditLogger
- C-21 ApiStatusRecorder
- C-22 AdminUserRepository (PostgreSQL impl)
- C-23 WeightConfigRepository
- C-24 WeightPresetRepository
- C-25 CacheMetadataRepository
- C-26 ApiStatusLogRepository
- C-27 AuditLogRepository

**Stories Mapped**: foundation은 직접 매핑되는 비즈니스 story 없음. 다음 항목들이 본 unit의 검증 기준:
- US-036, US-037, US-038, US-039 (인증/계정 - C-18, C-22 사용)
- 모든 admin US (감사 로그 - C-20 사용)
- 모든 외부 API 사용 US (캐시 - C-17 사용)

**Build Output**: 다른 unit이 import 가능한 internal 모듈 (단일 backend 앱의 일부).

---

### U-3. public-api-clients

**Purpose**: 5개 외부 공공 API의 클라이언트 추상화. 모든 backend feature가 import하여 사용.

**Scope**:
- BaseHttpClient (재시도, 타임아웃, 응답 시간 측정, ApiStatusRecorder 연동)
- 5개 specific client: RegionCodeClient, MolitTradeClient, MolitRentClient, AirKoreaClient, KmaForecastClient, HiraHospitalClient
- 외부 API XML/JSON 응답 파싱 및 정규화
- 외부 API 명세에 따른 raw type 정의 (필요 시 shared-types로 promote)

**Code Location**: `packages/backend/src/clients/`

**Components Included**:
- C-10 BaseHttpClient
- C-11 RegionCodeClient
- C-12 MolitTradeClient
- C-13 MolitRentClient
- C-14 AirKoreaClient
- C-15 KmaForecastClient
- C-16 HiraHospitalClient

**Stories Mapped**: 클라이언트 자체는 직접 story 없음. 다음 story가 본 unit의 검증 기준:
- US-001, US-002 (RegionCodeClient)
- US-009, US-010, US-011, US-012 (Molit Trade/Rent)
- US-016, US-017 (AirKorea, KmaForecast)
- US-013 (HiraHospital - 병원·약국)

---

### U-4. user-features

**Purpose**: 사용자 측 비즈니스 로직, Application Service, REST 라우트.

**Scope**:
- Domain components: SearchEngine, CandidateManager, PriceAnalyzer, InfraAnalyzer, EnvironmentAnalyzer, SafetyAnalyzer, ScoreEngine, ReportComposer, ComparisonEngine
- Application Services: S-01 ~ S-07 (SearchRegion, AnalyzePrice, AnalyzeInfra, AnalyzeEnvironment, AnalyzeSafety, GenerateReport, CompareCandidates)
- Routes: `/api/search`, `/api/analysis/*`, `/api/report/*`, `/api/compare`
- Distance util (Haversine), 가격 포맷팅 util, 면적대 분류 util

**Code Location**: `packages/backend/src/{domain/, services/user/, routes/user/}`

**Components Included**:
- C-01 ~ C-09 (모든 domain components)
- S-01 ~ S-07 (모든 user-facing services)

**Stories Mapped**: US-001 ~ US-028 (총 28개 사용자 측 story)

---

### U-5. admin-features

**Purpose**: 운영자 측 비즈니스 로직, Application Service, REST 라우트, AuthMiddleware 적용 라우트 그룹.

**Scope**:
- Application Services: S-10 ~ S-14 (AdminLogin, AdminAccount, ApiStatus, CacheAdmin, WeightAdmin)
- Routes: `/api/admin/*`
- Admin-specific helpers (가중치 합 검증 등)

**Code Location**: `packages/backend/src/{services/admin/, routes/admin/}`

**Components Included**:
- S-10 ~ S-14 (모든 admin-facing services)

(C-18 AuthService, C-22 AdminUserRepository 등은 foundation에 위치하지만 본 unit이 사용)

**Stories Mapped**: US-029 ~ US-039 (총 11개 운영자 측 story)

---

### U-6. frontend

**Purpose**: React SPA. 사용자 측 + 운영자 측 통합 빌드 (라우팅으로 구분).

**Scope**:
- Pages: F-01 ~ F-10 (사용자 4 + 운영자 6)
- Reusable components: F-20 ~ F-29
- Infrastructure: F-30 ~ F-34 (ApiClient, LocalStorage, Context, Router)
- Vite 빌드 설정, 환경별 .env

**Code Location**: `packages/frontend/`

**Components Included**: F-01 ~ F-34 전부

**Stories Mapped**: 모든 사용자 + 운영자 story의 UI 부분 (US-001 ~ US-039 전부, AC 중 UI 측면)

**Build Output**: 정적 빌드 (`packages/frontend/dist/`) → S3+CloudFront 호스팅

---

### U-7. infra-as-code

**Purpose**: AWS 인프라 정의, Docker Compose 로컬 환경, GitHub Actions CI/CD.

**Scope**:
- AWS CDK 스택 (또는 Terraform): VPC, ALB, ECS Fargate, RDS, ElastiCache, S3, CloudFront, Secrets Manager, CloudWatch
- Backend Dockerfile
- `docker-compose.yml` (로컬: PostgreSQL + Redis + backend + frontend)
- `.github/workflows/`: lint, test, security scan, build, deploy
- 마이그레이션 트리거, seed 실행 자동화

**Code Location**: `infra/`, `.github/workflows/`, `docker-compose.yml`, `Dockerfile.backend`

**Components Included**: (인프라; application code 없음)

**Stories Mapped**: 직접 매핑되는 story 없음. 다음 NFR 충족 검증:
- NFR-2 (Auto Scaling)
- NFR-3 (가용성, 백업)
- NFR-4 (Secrets Manager, CORS, audit log destination)
- NFR-8 (배포 환경, CI/CD)

---

## Code Organization Strategy

### Repository Structure
```
neighborhood-report/                # monorepo root
├── packages/
│   ├── shared/                     # U-1 shared-types
│   │   └── src/
│   │       ├── types/{candidate, price, infra, environment, safety, score, cache, weight, admin, api}.ts
│   │       ├── constants.ts
│   │       └── index.ts
│   │
│   ├── backend/                    # U-2 + U-3 + U-4 + U-5 (Modular Monolith)
│   │   ├── src/
│   │   │   ├── app.ts              # U-2: Express 앱 조립
│   │   │   ├── composition.ts      # U-2: DI composition root
│   │   │   ├── index.ts            # U-2: 부팅 entry
│   │   │   ├── config/             # U-2
│   │   │   ├── middleware/         # U-2
│   │   │   ├── auth/               # U-2
│   │   │   ├── audit/              # U-2
│   │   │   ├── monitoring/         # U-2
│   │   │   ├── cache/              # U-2
│   │   │   ├── repositories/       # U-2 (interface + PG impl)
│   │   │   ├── db/                 # U-2 (knex migrations, seed)
│   │   │   ├── clients/            # U-3 외부 API
│   │   │   ├── domain/             # U-4 도메인 컴포넌트
│   │   │   ├── services/
│   │   │   │   ├── user/           # U-4 use-case services
│   │   │   │   └── admin/          # U-5 admin services
│   │   │   ├── routes/
│   │   │   │   ├── user/           # U-4 사용자 라우트
│   │   │   │   └── admin/          # U-5 admin 라우트
│   │   │   └── utils/              # U-4 (haversine, 가격 포맷 등)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/                   # U-6
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── infrastructure/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
│
├── infra/                          # U-7 IaC
│   └── (CDK or Terraform 코드)
│
├── .github/workflows/              # U-7
├── docker-compose.yml              # U-7
├── Dockerfile.backend              # U-7
├── package.json                    # workspace root
└── tsconfig.base.json
```

### Module Boundary Enforcement
- **Build-time**: TypeScript module 경로 + ESLint `no-restricted-imports` 룰
- **Backend 단일 process**이지만 unit 간 import는 **public surface(route handler·service interface)만** 허용
- foundation → public-api-clients → user-features/admin-features 단방향 의존
- shared-types는 모든 unit에서 import 가능

### Frontend ↔ Backend 통신
- 직접 코드 의존 없음
- HTTP REST API + shared-types(공통 DTO)

---

## Communication Patterns

| Source Unit | Target Unit | Mechanism |
|-------------|-------------|-----------|
| U-2, U-3, U-4, U-5, U-6 | U-1 (shared-types) | TypeScript import (build-time) |
| U-3 | U-2 (BaseHttpClient → ApiStatusRecorder) | In-process function call |
| U-4 | U-2 (CacheManager, repositories) | In-process function call |
| U-4 | U-3 (api clients) | In-process function call |
| U-5 | U-2 (AuthService, AuditLogger, repositories) | In-process function call |
| U-5 | U-3 (api clients - status check용) | In-process function call |
| U-6 | U-2~U-5 (backend) | HTTPS REST API |
| U-7 | (deploys all) | AWS CDK provisions, Docker images |

---

## Validation
- ✅ 모든 컴포넌트가 정확히 하나의 unit에 배정됨
- ✅ 모든 user story가 unit에 매핑됨 (story-map.md 참조)
- ✅ 단방향 의존 (foundation → clients → features) 검증 통과
- ✅ shared-types가 모든 unit의 prerequisite으로 식별됨
