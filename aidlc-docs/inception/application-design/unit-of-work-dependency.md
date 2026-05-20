# Unit of Work Dependencies

본 문서는 7개 Unit 간의 의존 관계, 빌드/배포 순서, 병렬화 가능 영역을 정의합니다.

## Dependency Graph (Build-Time)

```
                  U-1 shared-types
                  │  │  │  │  │
        ┌─────────┘  │  │  │  └────────┐
        │            │  │  │           │
        ▼            ▼  ▼  ▼           ▼
  U-2 backend-foundation              U-6 frontend
        │
        │
        ▼
  U-3 public-api-clients
        │
        │
   ┌────┴────┐
   ▼         ▼
 U-4       U-5
 user-    admin-
 features features
   │         │
   └────┬────┘
        │
        ▼
  (assembled in backend single process)
        │
        ▼
  U-7 infra-as-code (deploys assembled backend + frontend)
```

**Note**: U-7는 빌드 결과물을 배포하므로 다른 unit의 빌드 출력을 입력으로 받음 (배포 시점 의존). 직접 코드 의존은 없음.

---

## Unit ↔ Unit Dependency Matrix

| From \ To | U-1 shared | U-2 foundation | U-3 clients | U-4 user | U-5 admin | U-6 frontend | U-7 infra |
|-----------|------------|----------------|-------------|----------|-----------|--------------|-----------|
| **U-1** | — | — | — | — | — | — | — |
| **U-2** | ✅ types | — | — | — | — | — | — |
| **U-3** | ✅ types | ✅ ApiStatusRecorder | — | — | — | — | — |
| **U-4** | ✅ types | ✅ Cache/Repos/Auth | ✅ api clients | — | — | — | — |
| **U-5** | ✅ types | ✅ Auth/Repos/Audit | ✅ api clients (status check) | — | — | — | — |
| **U-6** | ✅ types (DTO) | — | — | (HTTP) | (HTTP) | — | — |
| **U-7** | (build output) | (build output) | (build output) | (build output) | (build output) | (build output) | — |

✅ = 빌드/런타임 의존 존재 (해당 row의 unit이 column의 unit에 의존)

---

## Critical Path (Build/Development Sequence)

### Sequential Path (블로킹 의존)

```
1. U-1 shared-types
   ↓ (모든 unit이 의존)
2. U-2 backend-foundation
   ↓ (다른 backend unit이 의존)
3. U-3 public-api-clients
   ↓
4. U-4 user-features ──┐
5. U-5 admin-features ──┤  (U-4와 U-5는 서로 독립, 병렬 가능)
                        ↓
6. (Backend assembly + integration tests)
   ↓
7. U-7 infra-as-code (deployment)
```

**Frontend (U-6)는 평행 트랙**:
```
U-1 shared-types
   ↓
U-6 frontend (backend의 contract만 알면 진행 가능)
   ↓
(통합 시점에 backend과 E2E 테스트)
```

---

## Parallelization Opportunities

| Phase | 병렬 가능 Unit 조합 | Rationale |
|-------|---------------------|-----------|
| Phase A (Foundation) | U-1 only | 모든 후속 unit의 prerequisite |
| Phase B (Foundation+) | U-2 || U-3 (부분) | U-3은 U-2의 ApiStatusRecorder 인터페이스만 알면 됨 |
| Phase C (Features) | U-4 || U-5 || U-6 || U-7 (초기 골격) | feature 개발 + frontend + IaC 골격 동시 진행 |
| Phase D (Integration) | (sequential) | 통합 + E2E 테스트는 순차 |
| Phase E (Deploy) | U-7 final | 모든 빌드 산출물 필요 |

**Maximum parallelism**: U-1 완료 후 4개 unit 병렬 가능 (U-2/U-3 골격, U-6 골격, U-7 골격).

---

## Unit ↔ Component Mapping

### U-1 shared-types
TypeScript types only. No application components mapped. 모든 컴포넌트의 입출력 타입 정의 출처.

### U-2 backend-foundation
- C-17 CacheManager
- C-18 AuthService
- C-19 RateLimiter
- C-20 AuditLogger
- C-21 ApiStatusRecorder
- C-22 AdminUserRepository (interface + PG impl)
- C-23 WeightConfigRepository (interface + PG impl)
- C-24 WeightPresetRepository (interface + PG impl)
- C-25 CacheMetadataRepository (interface + PG impl)
- C-26 ApiStatusLogRepository (interface + PG impl)
- C-27 AuditLogRepository (interface + PG impl)
- Express middleware: errorHandler, requestLogger, authMiddleware, corsMiddleware
- DB 연결, Redis 연결, env loader, composition root

### U-3 public-api-clients
- C-10 BaseHttpClient
- C-11 RegionCodeClient
- C-12 MolitTradeClient
- C-13 MolitRentClient
- C-14 AirKoreaClient
- C-15 KmaForecastClient
- C-16 HiraHospitalClient

### U-4 user-features
**Domain Components**:
- C-01 SearchEngine
- C-02 CandidateManager
- C-03 PriceAnalyzer
- C-04 InfraAnalyzer
- C-05 EnvironmentAnalyzer
- C-06 SafetyAnalyzer
- C-07 ScoreEngine
- C-08 ReportComposer
- C-09 ComparisonEngine

**Services**:
- S-01 SearchRegionService
- S-02 AnalyzePriceService
- S-03 AnalyzeInfraService
- S-04 AnalyzeEnvironmentService
- S-05 AnalyzeSafetyService
- S-06 GenerateReportService
- S-07 CompareCandidatesService

**Utils**:
- DistanceUtil (Haversine)
- PriceFormatter
- AreaRangeClassifier

### U-5 admin-features
**Services**:
- S-10 AdminLoginService
- S-11 AdminAccountService
- S-12 ApiStatusService
- S-13 CacheAdminService
- S-14 WeightAdminService

(인프라 컴포넌트는 U-2, repositories도 U-2에 위치)

### U-6 frontend
**Pages**: F-01 ~ F-10
**Components**: F-20 ~ F-29
**Infrastructure**: F-30 ~ F-34

### U-7 infra-as-code
- AWS CDK 스택 (VPC, ALB, ECS, RDS, ElastiCache, S3, CloudFront, Secrets Manager)
- Docker images
- GitHub Actions workflows
- Docker Compose (로컬)

---

## Cross-Unit Concerns

### Type Stability (U-1)
- U-1은 가장 먼저 안정화되어야 함
- 변경 시 모든 의존 unit 재빌드 필요
- 변경은 사실상 하위 호환되어야 함 (Major bump 시 모든 unit 동시 업데이트)

### Composition Root (U-2의 `composition.ts`)
- 모든 unit의 컴포넌트를 인스턴스화하고 의존성 주입
- 새 컴포넌트 추가 시 본 파일도 수정 필요 (cross-unit touchpoint)

### API Contract (U-4/U-5 ↔ U-6)
- REST API 명세 (application-design.md `/api/...` endpoints)
- shared-types의 DTO가 실제 wire format
- 변경 시 양측 동시 업데이트 필요

### Database Schema (U-2)
- 마이그레이션은 U-2 소유
- 다른 unit이 새 테이블/컬럼 필요 시 U-2에 PR

---

## Risk Areas

| Risk | Mitigation |
|------|------------|
| U-1 타입 변경으로 인한 cascade rebuild | 변경 빈도 낮게 유지, semver 적용 |
| U-2 composition.ts 충돌 (다중 PR) | merge 시점 조율, 인터페이스 우선 합의 |
| U-3 외부 API 응답 형식 변경 | Adapter 패턴으로 격리, 통합 테스트로 조기 감지 |
| U-4 ↔ U-5 공통 helper 중복 | 공통 helper는 U-2 utils로 promote |
| U-6 ↔ Backend contract drift | shared-types를 wire format 단일 출처로 사용 + E2E 테스트 |

---

## Independence Verification

각 unit이 독립 작업 가능한지 검증:

| Unit | 독립성 평가 | 협력 필요 시점 |
|------|-------------|---------------|
| U-1 | ✅ 완전 독립 | 새 도메인 추가 시 |
| U-2 | ✅ U-1 안정화 후 독립 | 새 cross-cutting 추가 시 |
| U-3 | ✅ U-2의 ApiStatusRecorder 인터페이스 안정화 후 독립 | 외부 API 변경 시 |
| U-4 | ✅ U-2/U-3 안정화 후 독립 | service contract 변경 시 |
| U-5 | ✅ U-2/U-3 안정화 후 독립 | service contract 변경 시 |
| U-6 | ⚠️ Backend API contract 안정화 후 독립 | API 변경 시 (shared-types로 완화) |
| U-7 | ⚠️ Backend Dockerfile, Frontend 빌드 산출물 형식 안정화 후 독립 | 인프라 요건 변경 시 |
