# Services

본 문서는 Service Layer를 정의합니다. Application Service는 use-case별로 분리되어 도메인 컴포넌트와 인프라 컴포넌트를 오케스트레이션하며, HTTP route handler가 직접 호출합니다 (Hexagonal/Clean Architecture).

## 패턴 요약

```
HTTP Route Handler
    ↓
Application Service (per use-case)
    ↓
Domain Components (analyzers, engines)
    ↓
Repository / External API Client (via CacheManager)
```

각 Service는 다음 원칙을 따른다:
- **Single Use-Case**: 하나의 사용자 의도(예: "리포트 생성", "후보지 비교")만 담당
- **Stateless**: 인스턴스 상태 없음, 의존성 주입으로 협력자 받음
- **Transactional Boundary**: 필요 시 단일 Service 메소드가 트랜잭션 경계
- **Error Translation**: 도메인 예외 → HTTP 에러 응답 (route 레이어에서 변환)

---

## User-Facing Services

### S-01. SearchRegionService
**Use-Case**: 지역 검색 (US-001, US-002)

**Method**:
```typescript
class SearchRegionService {
  constructor(private searchEngine: SearchEngine) {}
  async execute(query: string): Promise<{ results: RegionSearchResult[]; suggestions: string[] }>;
}
```

**Orchestration**:
1. SearchEngine.search(query)
2. 결과 0건이면 SearchEngine.suggestAlternatives(query)
3. 응답 반환

**Used By**: `GET /api/search`

---

### S-02. AnalyzePriceService
**Use-Case**: 후보지 실거래가 분석 (US-009 ~ US-012)

**Method**:
```typescript
class AnalyzePriceService {
  constructor(
    private priceAnalyzer: PriceAnalyzer,
    private cacheManager: CacheManager
  ) {}
  async getSummary(sggCode: string, period: PricePeriod): Promise<PriceSummary>;
  async listTrades(sggCode: string, period: PricePeriod, tradeType: TradeType, page: number): Promise<TradeListResult>;
}
```

**Orchestration**:
1. CacheManager로 read-through
2. miss 시 PriceAnalyzer가 MolitTrade/RentClient 호출
3. 면적대별 그룹핑 + 신뢰도 플래그
4. 응답 반환

**Used By**: `GET /api/analysis/price/:regionCode`, `GET /api/analysis/price/:regionCode/trades`

---

### S-03. AnalyzeInfraService
**Use-Case**: 생활 인프라 분석 (US-013 ~ US-015)

**Method**:
```typescript
class AnalyzeInfraService {
  constructor(
    private infraAnalyzer: InfraAnalyzer,
    private regionCodeClient: RegionCodeClient,  // 좌표 조회용
    private cacheManager: CacheManager
  ) {}
  async execute(regionCode: string): Promise<InfraResult>;
}
```

**Orchestration**:
1. 후보지 좌표 조회 (RegionCodeClient via cache, 30일 TTL)
2. CacheManager로 시설 데이터 read-through (7일 TTL)
3. InfraAnalyzer가 반경별 분류 + 점수 산정
4. 응답 반환

**Used By**: `GET /api/analysis/infra/:regionCode`

---

### S-04. AnalyzeEnvironmentService
**Use-Case**: 환경/기상 분석 (US-016 ~ US-018)

**Method**:
```typescript
class AnalyzeEnvironmentService {
  constructor(
    private environmentAnalyzer: EnvironmentAnalyzer,
    private regionCodeClient: RegionCodeClient,
    private cacheManager: CacheManager
  ) {}
  async execute(regionCode: string): Promise<EnvironmentResult>;
}
```

**Orchestration**:
1. 후보지 좌표 조회
2. CacheManager로 대기질·기상 read-through (1시간 TTL)
3. EnvironmentAnalyzer가 등급 판정 + 생활 불편 요약
4. 응답 반환

**Used By**: `GET /api/analysis/environment/:regionCode`

---

### S-05. AnalyzeSafetyService
**Use-Case**: 안전 인프라 분석 (US-019, US-020)

**Method**:
```typescript
class AnalyzeSafetyService {
  constructor(
    private safetyAnalyzer: SafetyAnalyzer,
    private regionCodeClient: RegionCodeClient,
    private cacheManager: CacheManager
  ) {}
  async execute(regionCode: string): Promise<SafetyResult>;
}
```

**Used By**: `GET /api/analysis/safety/:regionCode`

---

### S-06. GenerateReportService
**Use-Case**: 단일 후보지 종합 리포트 생성 (US-021 ~ US-024)

**Method**:
```typescript
class GenerateReportService {
  constructor(
    private analyzePrice: AnalyzePriceService,
    private analyzeInfra: AnalyzeInfraService,
    private analyzeEnv: AnalyzeEnvironmentService,
    private analyzeSafety: AnalyzeSafetyService,
    private scoreEngine: ScoreEngine,
    private reportComposer: ReportComposer,
    private regionCodeClient: RegionCodeClient
  ) {}
  async execute(regionCode: string, period: PricePeriod): Promise<Report>;
}
```

**Orchestration**:
1. 지역 정보 조회 (RegionCodeClient)
2. 4개 분석 Service 병렬 실행 (Promise.allSettled로 부분 실패 허용)
3. 데이터 부족 카테고리 식별
4. ScoreEngine.calculate(inputs)
5. ReportComposer.compose(...) → Report 객체
6. 응답 반환 (실패 카테고리는 "데이터 부족" 표시, stale 캐시 사용 시 경고)

**Error Handling**:
- 모든 분석이 실패하고 캐시도 없으면 → ReportGenerationError throw
- 일부 실패 + 일부 성공 → 데이터 부족으로 처리하되 리포트는 생성

**Used By**: `POST /api/report/:regionCode/generate`, `GET /api/report/:regionCode`

---

### S-07. CompareCandidatesService
**Use-Case**: 다수 후보지 비교 (US-025 ~ US-028)

**Method**:
```typescript
class CompareCandidatesService {
  constructor(
    private generateReport: GenerateReportService,
    private comparisonEngine: ComparisonEngine
  ) {}
  async execute(regionCodes: string[], sortBy?: string): Promise<ComparisonResult>;
}
```

**Orchestration**:
1. 각 regionCode에 대해 GenerateReportService 병렬 호출 (Promise.all)
2. ComparisonEngine.compare(reports)
3. sortBy가 있으면 ComparisonEngine.sortByCategory
4. 응답 반환

**Used By**: `GET /api/compare?regions=R1,R2,R3`

---

## Admin-Facing Services

### S-10. AdminLoginService
**Use-Case**: 운영자 로그인 (US-036)

**Method**:
```typescript
class AdminLoginService {
  constructor(
    private authService: AuthService,
    private auditLogger: AuditLogger
  ) {}
  async execute(email: string, password: string): Promise<AuthToken>;
}
```

**Orchestration**:
1. AuthService.getLockUntil(email) → 잠금 상태 확인
2. AuthService.login(email, password)
3. 실패 시 recordFailedLogin → 5회 시 잠금
4. 성공 시 lastLoginAt 갱신, AuditLogger.log({action: 'admin.login', result: 'success'})
5. JWT 반환

**Used By**: `POST /api/admin/auth/login`

---

### S-11. AdminAccountService
**Use-Case**: 운영자 계정 관리 (US-037, US-038, US-039)

**Methods**:
```typescript
class AdminAccountService {
  constructor(
    private adminUserRepo: AdminUserRepository,
    private authService: AuthService,
    private auditLogger: AuditLogger
  ) {}
  async createAdmin(creator: AdminUser, input: CreateAdminRequest): Promise<AdminUser>;
  async changePassword(userId: string, current: string, next: string): Promise<void>;
  async listAdmins(): Promise<AdminUser[]>;
  async deleteAdmin(adminId: string, deletedBy: AdminUser): Promise<void>;
}
```

**Orchestration**:
- `createAdmin`: superadmin 권한 검증 → 이메일 중복 확인 → 비밀번호 정책 검증 → bcrypt 해시 → save → 감사 로그
- `changePassword`: 현재 비밀번호 검증 → 정책 검증 → 새 해시 저장 → 감사 로그

**Used By**: `POST /api/admin/auth/register`, `POST /api/admin/auth/change-password`, `GET/DELETE /api/admin/accounts/:id`

---

### S-12. ApiStatusService
**Use-Case**: API 상태 조회 및 수동 재시도 (US-029, US-030)

**Methods**:
```typescript
class ApiStatusService {
  constructor(
    private apiStatusRecorder: ApiStatusRecorder,
    private clients: { name: string; client: BaseHttpClient; healthCheck: () => Promise<void> }[],
    private auditLogger: AuditLogger
  ) {}
  async listStatuses(): Promise<ApiStatusInfo[]>;
  async retry(apiName: string, admin: AdminUser): Promise<{ success: boolean; latencyMs?: number; error?: string }>;
}
```

**Orchestration**:
- `listStatuses`: 모든 API의 상태 조회 (recorder + 최근 에러)
- `retry`: 해당 API의 healthCheck 실행 → 결과 기록 → 감사 로그

**Used By**: `GET /api/admin/apis`, `POST /api/admin/apis/:name/retry`

---

### S-13. CacheAdminService
**Use-Case**: 캐시 관리 (US-031, US-032)

**Methods**:
```typescript
class CacheAdminService {
  constructor(
    private cacheMetaRepo: CacheMetadataRepository,
    private cacheManager: CacheManager,
    private auditLogger: AuditLogger
  ) {}
  async listCacheStatus(filters: { apiName?: string; regionCode?: string }): Promise<CacheStatus[]>;
  async refreshRegion(regionCode: string, admin: AdminUser): Promise<{ invalidated: number }>;
}
```

**Orchestration**:
- `refreshRegion`: cacheManager.invalidateByRegion(regionCode) → cacheMetaRepo.deleteByRegionCode → 감사 로그

**Used By**: `GET /api/admin/cache`, `POST /api/admin/cache/:regionCode/refresh`

---

### S-14. WeightAdminService
**Use-Case**: 가중치 관리 (US-033, US-034, US-035)

**Methods**:
```typescript
class WeightAdminService {
  constructor(
    private weightConfigRepo: WeightConfigRepository,
    private weightPresetRepo: WeightPresetRepository,
    private auditLogger: AuditLogger
  ) {}
  async getActive(): Promise<WeightConfig>;
  async updateWeights(weights: CategoryWeight[], admin: AdminUser): Promise<WeightConfig>;
  async listVersions(): Promise<{ version: string; updatedAt: string }[]>;
  async listPresets(): Promise<WeightPreset[]>;
  async createPreset(preset: Omit<WeightPreset, 'id'>, admin: AdminUser): Promise<WeightPreset>;
  async updatePreset(id: string, preset: Partial<WeightPreset>, admin: AdminUser): Promise<WeightPreset>;
  async deletePreset(id: string, admin: AdminUser): Promise<void>;
}
```

**Orchestration**:
- `updateWeights`: 가중치 invariant 검증(합=1.0±0.001, 음수 없음, 6개 모두 포함) → 새 버전 저장 → 감사 로그
- 모든 변경 작업은 감사 로그 기록

**Used By**: `GET/PUT /api/admin/weights`, `GET/POST /api/admin/weights/presets`, `PATCH/DELETE /api/admin/weights/presets/:id`

---

## Service ↔ Component Interaction Matrix

| Service | Domain Components | Infra Components |
|---------|-------------------|------------------|
| SearchRegionService | SearchEngine | RegionCodeClient |
| AnalyzePriceService | PriceAnalyzer | CacheManager, MolitTradeClient, MolitRentClient |
| AnalyzeInfraService | InfraAnalyzer | CacheManager, RegionCodeClient, HiraHospitalClient |
| AnalyzeEnvironmentService | EnvironmentAnalyzer | CacheManager, RegionCodeClient, AirKoreaClient, KmaForecastClient |
| AnalyzeSafetyService | SafetyAnalyzer | CacheManager, RegionCodeClient |
| GenerateReportService | ScoreEngine, ReportComposer | (4개 Analyze Service 호출) |
| CompareCandidatesService | ComparisonEngine | (GenerateReport 반복 호출) |
| AdminLoginService | — | AuthService, AuditLogger |
| AdminAccountService | — | AdminUserRepo, AuthService, AuditLogger |
| ApiStatusService | — | ApiStatusRecorder, BaseHttpClient (각 client), AuditLogger |
| CacheAdminService | — | CacheManager, CacheMetadataRepo, AuditLogger |
| WeightAdminService | — | WeightConfigRepo, WeightPresetRepo, AuditLogger |

---

## Cross-Cutting Concerns

### Middleware Stack (Express)

```
Request
   ↓
[CORS] → [JSON parse] → [RequestLogger]
   ↓
[RateLimiter (per-route policy)]
   ↓ (Admin routes only)
[AuthMiddleware (JWT verify)]
   ↓
[Route Handler] → Service.execute()
   ↓
[ErrorHandler]
   ↓
Response
```

### Dependency Injection
- 단순 constructor 주입 (factory 함수에서 객체 생성)
- DI 컨테이너 라이브러리는 **사용하지 않음** (불필요한 복잡도 회피)
- `src/composition.ts`에서 모든 컴포넌트·Service 인스턴스 생성

### Error Hierarchy
```
AppError (base)
├── ValidationError (400)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── NotFoundError (404)
├── ConflictError (409)  // 후보지 중복 등
├── RateLimitError (429)
├── ExternalApiError (502)  // 외부 API 실패
└── InternalError (500)
```
