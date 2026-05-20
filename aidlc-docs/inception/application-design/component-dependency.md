# Component Dependencies

본 문서는 컴포넌트 간 의존 관계와 통신 패턴, 데이터 플로우를 정의합니다.

## Dependency Layers

낮은 번호 레이어가 높은 번호 레이어에 의존 가능. 역방향 의존 금지.

| Layer | 역할 | 컴포넌트 |
|-------|------|---------|
| 1 (Top) | HTTP Routing | Express Routers, Middleware |
| 2 | Application Service | S-01 ~ S-14 |
| 3 | Domain | C-01 ~ C-09 (Engines/Analyzers) |
| 4 | Infrastructure | C-10 ~ C-21 (Clients, Cache, Auth, Logger) |
| 5 | Repository | C-22 ~ C-27 |
| 6 (Bottom) | External | PostgreSQL, Redis, 공공 API |

**Rule**: Layer N 컴포넌트는 Layer N+1 이상의 컴포넌트에만 의존. 단, 같은 레이어 내 의존 가능.

---

## Backend Dependency Matrix

### Domain Component Dependencies

| Component | Depends On |
|-----------|------------|
| C-01 SearchEngine | C-11 RegionCodeClient |
| C-02 CandidateManager | (no dependencies, pure logic) |
| C-03 PriceAnalyzer | C-12 MolitTradeClient, C-13 MolitRentClient |
| C-04 InfraAnalyzer | C-16 HiraHospitalClient, DistanceUtil (in C-04) |
| C-05 EnvironmentAnalyzer | C-14 AirKoreaClient, C-15 KmaForecastClient |
| C-06 SafetyAnalyzer | (외부 안전 시설 API client - 발급 후 추가) |
| C-07 ScoreEngine | C-23 WeightConfigRepository |
| C-08 ReportComposer | (no external dependencies, pure assembly) |
| C-09 ComparisonEngine | (no external dependencies, pure logic) |

### Service Layer Dependencies

| Service | Depends On |
|---------|------------|
| S-01 SearchRegion | C-01 SearchEngine |
| S-02 AnalyzePrice | C-03 PriceAnalyzer, C-17 CacheManager |
| S-03 AnalyzeInfra | C-04 InfraAnalyzer, C-11 RegionCodeClient, C-17 CacheManager |
| S-04 AnalyzeEnvironment | C-05 EnvironmentAnalyzer, C-11 RegionCodeClient, C-17 CacheManager |
| S-05 AnalyzeSafety | C-06 SafetyAnalyzer, C-11 RegionCodeClient, C-17 CacheManager |
| S-06 GenerateReport | S-02, S-03, S-04, S-05, C-07 ScoreEngine, C-08 ReportComposer, C-11 RegionCodeClient |
| S-07 CompareCandidates | S-06 GenerateReport, C-09 ComparisonEngine |
| S-10 AdminLogin | C-18 AuthService, C-20 AuditLogger |
| S-11 AdminAccount | C-22 AdminUserRepository, C-18 AuthService, C-20 AuditLogger |
| S-12 ApiStatus | C-21 ApiStatusRecorder, C-10 BaseHttpClient (각 client), C-20 AuditLogger |
| S-13 CacheAdmin | C-17 CacheManager, C-25 CacheMetadataRepository, C-20 AuditLogger |
| S-14 WeightAdmin | C-23 WeightConfigRepo, C-24 WeightPresetRepo, C-20 AuditLogger |

### Infrastructure ↔ Repository Dependencies

| Component | Depends On |
|-----------|------------|
| C-10 BaseHttpClient | C-21 ApiStatusRecorder (보고용) |
| C-11~16 (Public API clients) | C-10 BaseHttpClient (extends) |
| C-17 CacheManager | Redis client, C-25 CacheMetadataRepository |
| C-18 AuthService | C-22 AdminUserRepository, JWT lib, bcrypt, Redis (잠금 카운터) |
| C-19 RateLimiter | Redis |
| C-20 AuditLogger | C-27 AuditLogRepository, CloudWatch SDK |
| C-21 ApiStatusRecorder | C-26 ApiStatusLogRepository |
| C-22~27 Repositories | knex (PostgreSQL) |

---

## Communication Patterns

### Sync In-Process Function Call
대부분의 컴포넌트 간 호출은 동일 Node.js 프로세스 내 함수 호출. 빠르고 단순.

### REST/HTTP (External)
- Frontend → Backend: REST/JSON
- Backend → 공공 API: REST/JSON or REST/XML (axios)

### Cache Read-Through Pattern
```
Service.execute(regionCode)
    ↓
CacheManager.getOrFetch(key, ttl, fetcher)
    ├── Redis.get(key) → hit? → return cached + isStale=false
    ├── miss → fetcher() → external API call
    │           ↓
    │       Redis.set(key, data, ttl)
    │       CacheMetadataRepo.save(meta)
    │       return data + isStale=false
    └── miss + fetcher fails → stale 시도
                ↓
            CacheMetadataRepo.findStale(key) exists?
            ├── Yes → return stale data + isStale=true
            └── No → throw ExternalApiError
```

### JWT Auth Flow
```
1. POST /api/admin/auth/login (email, password)
   → AdminLoginService → AuthService.login()
   → JWT 생성 + lastLoginAt 갱신
   → AuditLogger.log({action:'admin.login'})
   → 응답: {accessToken, expiresIn, tokenType:'Bearer'}

2. (Frontend) Authorization: Bearer <token> 헤더 부착

3. (Backend) AuthMiddleware.verifyToken()
   → 검증 통과 시 req.admin = {id, email, role}
   → route handler 진입
```

### Audit Log Flow
```
모든 Admin 변경 작업
    ↓
Service.execute() 성공/실패 후
    ↓
AuditLogger.log({adminId, action, target, result, details})
    ├── AuditLogRepository.log() → PostgreSQL audit_logs
    └── CloudWatch Logs (구조화 JSON)
```

---

## Data Flow Diagrams

### 1. Search → Register Candidate Flow

```
User
  ↓ (1) 검색어 입력
Frontend SearchPage
  ↓ (2) GET /api/search?q=...
Backend Search Router
  ↓ (3) SearchRegionService.execute(query)
SearchEngine
  ↓ (4) RegionCodeClient.search(query)
        ↓ via BaseHttpClient
        ↓ (5) HTTPS GET apis.data.go.kr/StanReginCd
공공데이터포털
  ↓ (6) JSON 응답
RegionCodeClient ← (7) 정규화
SearchEngine ← (8) RegionSearchResult[]
SearchRegionService ← (9) 결과
Backend ← (10) JSON 응답
Frontend ← (11) 결과 표시
  ↓ (12) 사용자가 후보지 선택
Frontend (CandidateLocalStorage.add)
  ↓ (13) LocalStorage 저장
화면 갱신
```

### 2. Generate Report Flow

```
Frontend ReportPage
  ↓ POST /api/report/:regionCode/generate
Backend Report Router
  ↓ AuthMiddleware (사용자 측은 인증 없음, 통과)
  ↓ RateLimiter (10 req/min per IP)
  ↓ GenerateReportService.execute(regionCode, period)
  ├── RegionCodeClient.findByCode(regionCode) → 좌표 획득
  ├── Promise.allSettled([
  │     S-02 AnalyzePrice (CacheManager → MolitTrade/Rent)
  │     S-03 AnalyzeInfra (CacheManager → HiraHospital + 거리 계산)
  │     S-04 AnalyzeEnv (CacheManager → AirKorea + KmaForecast)
  │     S-05 AnalyzeSafety (CacheManager → ...)
  │   ])
  ├── 데이터 부족 카테고리 식별
  ├── ScoreEngine.calculate(inputs, weights)
  └── ReportComposer.compose(...) → Report
  ↓
Frontend ← Report 응답
  ↓ 화면 렌더링 (ScoreCard, ScoreRationaleToggle, ReportSummary)
```

### 3. Compare Candidates Flow

```
Frontend ComparisonPage
  ↓ GET /api/compare?regions=R1,R2,R3
Backend Compare Router
  ↓ CompareCandidatesService.execute([R1,R2,R3], sortBy)
  ├── Promise.all([
  │     GenerateReportService(R1)
  │     GenerateReportService(R2)
  │     GenerateReportService(R3)
  │   ])
  ├── ComparisonEngine.compare(reports)
  └── (sortBy 있으면) ComparisonEngine.sortByCategory(reports, category)
  ↓
Frontend ← ComparisonResult
  ↓ 비교 테이블 + 강점/약점 카드
```

### 4. Admin Cache Refresh Flow

```
Frontend AdminCachePage
  ↓ POST /api/admin/cache/:regionCode/refresh
Backend Admin Router
  ↓ AuthMiddleware (JWT 검증) → req.admin
  ↓ RateLimiter (admin policy)
  ↓ CacheAdminService.refreshRegion(regionCode, admin)
  ├── CacheManager.invalidateByRegion(regionCode) → Redis DEL
  ├── CacheMetadataRepository.deleteByRegionCode(regionCode) → PostgreSQL
  └── AuditLogger.log({action:'cache.refresh', target:regionCode, ...})
  ↓
Frontend ← {invalidated: N}
  ↓ 토스트 "캐시 갱신됨"
```

---

## Frontend Component Tree

```
<App>
  └── <BrowserRouter>
       ├── <AuthProvider>
       │    └── <CandidatesProvider>
       │         └── <AppRouter>
       │              ├── /            → SearchPage
       │              │                  ├── SearchInput
       │              │                  ├── SearchResults
       │              │                  └── RegionResultCard*
       │              │
       │              ├── /candidates  → CandidateListPage
       │              │                  └── CandidateCard*
       │              │                       ├── AliasInput
       │              │                       └── DeleteConfirmDialog
       │              │
       │              ├── /reports/:r  → ReportPage
       │              │                  ├── PriceSummaryTable
       │              │                  ├── InfraGrid
       │              │                  ├── AirQualityBadge
       │              │                  ├── WeatherForecastCard
       │              │                  ├── SafetyFacilityList
       │              │                  ├── ScoreCard*
       │              │                  └── ReportSummary
       │              │
       │              ├── /compare     → ComparisonPage
       │              │                  ├── ComparisonTable
       │              │                  ├── SortByCategoryControl
       │              │                  └── StrengthWeaknessBadge*
       │              │
       │              └── /admin/*     → <AuthGuard>
       │                                 └── <AdminLayout>
       │                                      └── (AdminLogin/Dashboard/...)
       │
       └── <ToastNotifier> (global)
```

`*` = 반복 렌더링 (map)

---

## Frontend State Dependencies

| State | Owner | Persisted | Used By |
|-------|-------|-----------|---------|
| 후보지 목록 | CandidatesContext | LocalStorage | SearchPage, CandidateListPage, ComparisonPage |
| 인증 상태 (JWT, admin info) | AuthContext | sessionStorage | AdminLogin, AuthGuard, AdminLayout, ApiClient (헤더 부착) |
| 비교 정렬 기준 | ComparisonPage local state | LocalStorage (last selection) | ComparisonPage |
| 검색 결과 | SearchPage local state | (없음) | SearchPage |
| 리포트 데이터 | ReportPage local state | (캐시는 backend) | ReportPage |

---

## Failure Modes & Resilience

### 외부 공공 API 장애
- BaseHttpClient: 3회 재시도 (exponential backoff)
- CacheManager: stale fallback (만료된 캐시도 사용 가능)
- Service: Promise.allSettled로 부분 실패 허용
- ScoreEngine: 데이터 부족 카테고리는 점수 산정에서 제외
- UI: "오래된 데이터 사용 중" 또는 "데이터 부족" 표시

### Redis 장애
- CacheManager는 Redis 실패 시 직접 외부 API 호출 (캐시 비활성)
- AuthService 잠금 카운터는 Redis 장애 시 잠금 미적용 (가용성 우선)
- RateLimiter는 Redis 장애 시 fail-open (트래픽 허용)

### PostgreSQL 장애
- AdminUser 조회 실패 → 401 응답 (서비스 가용 유지)
- AuditLog 기록 실패 → CloudWatch에만 기록 (변경 작업은 진행)
- Cache 메타데이터 조회 실패 → CacheManager는 Redis 데이터만으로 동작

---

## Build-Time Dependencies (Package level)

```
@neighborhood-report/shared (0 deps from this monorepo)
   ↑ import types
@neighborhood-report/backend (deps: shared)
@neighborhood-report/frontend (deps: shared)
```

- `shared` 패키지가 변경되면 backend/frontend 모두 재빌드
- backend, frontend 간 직접 의존 없음 (HTTP API로 통신)
