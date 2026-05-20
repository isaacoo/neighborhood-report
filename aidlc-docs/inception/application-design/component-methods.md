# Component Methods

본 문서는 각 컴포넌트의 public 메소드 시그니처를 TypeScript interface로 정의합니다. 비즈니스 규칙 상세는 Functional Design 단계에서 다룹니다.

타입 정의는 `@neighborhood-report/shared` 패키지에 위치하며, 본 문서는 import를 가정합니다.

---

## Backend Domain Components

### C-01. SearchEngine

```typescript
interface RegionSearchResult {
  regionCode: string;       // 10자리 법정동 코드
  sggCode: string;          // 5자리 시군구 코드 (실거래가 API용)
  regionName: string;       // 동/리 이름
  parentRegionName: string; // 상위 행정구역
  fullAddress: string;
  latitude: number | null;
  longitude: number | null;
}

interface SearchEngine {
  /** 검색어로 법정동 검색 */
  search(query: string): Promise<RegionSearchResult[]>;
  /** 검색 결과 0건 시 대체 검색어 제안 */
  suggestAlternatives(query: string): string[];
}
```

---

### C-02. CandidateManager

```typescript
interface ValidatedCandidateInput {
  id: string;
  regionCode: string;
  regionName: string;
  parentRegionName: string;
  alias: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
}

interface CandidateManager {
  /** 신규 후보지 ID 발급 + 입력값 검증 */
  prepareNew(input: CreateCandidateRequest): ValidatedCandidateInput;
  /** 별칭 검증 (1~30자) */
  validateAlias(alias: string): { valid: boolean; reason?: string };
  /** 좌표 검증 (한국 영토 내) */
  validateCoordinates(lat: number, lng: number): { valid: boolean; reason?: string };
}
```

---

### C-03. PriceAnalyzer

```typescript
interface PriceAnalysisRequest {
  sggCode: string;
  period: '3m' | '6m' | '12m';
  tradeType: 'sale' | 'rent';
}

interface PriceAnalyzer {
  /** 실거래가 분석 (요약 + 상세) */
  analyze(req: PriceAnalysisRequest): Promise<PriceSummary>;
  /** 거래 상세 목록 (페이지네이션) */
  listTrades(sggCode: string, period: string, tradeType: string, page: number, pageSize: number): Promise<{ items: TradeDetail[]; total: number }>;
  /** 면적대 그룹핑 */
  groupByAreaRange(trades: TradeDetail[]): AreaPriceGroup[];
}
```

---

### C-04. InfraAnalyzer

```typescript
interface InfraAnalyzer {
  /** 후보지 좌표 기준 인프라 분석 */
  analyze(regionCode: string, latitude: number, longitude: number): Promise<InfraResult>;
  /** 카테고리별 접근성 점수 산정 */
  calculateAccessibilityScore(category: FacilityCategory, facilities: FacilityItem[]): CategoryScore;
}

interface DistanceUtil {
  /** Haversine 거리 (미터). 비음수, 대칭, 자기 자신=0 */
  haversine(lat1: number, lon1: number, lat2: number, lon2: number): number;
  /** 반경 내 시설 필터링 (좌표 누락 시설 제외) */
  filterByRadius(items: FacilityItem[], centerLat: number, centerLon: number, radiusMeters: number): FacilityItem[];
}
```

---

### C-05. EnvironmentAnalyzer

```typescript
interface EnvironmentAnalyzer {
  /** 대기질 + 기상 통합 분석 */
  analyze(regionCode: string, latitude: number, longitude: number): Promise<EnvironmentResult>;
  /** KHAI 지수 → 등급 (단조성 보장, PBT 검증) */
  classifyAirQuality(khai: number): AirQualityGrade;
  /** 생활 불편 요약 (폭염/한파/강수) */
  summarizeDiscomfort(weather: WeatherData[]): DiscomfortSummary;
}
```

---

### C-06. SafetyAnalyzer

```typescript
interface SafetyAnalyzer {
  /** 안전 시설 + 대피시설 + 재난 리스크 종합 */
  analyze(regionCode: string, latitude: number, longitude: number): Promise<SafetyResult>;
}
```

---

### C-07. ScoreEngine

```typescript
interface CategoryDataInput {
  category: 'housing' | 'infrastructure' | 'transit' | 'environment' | 'safety' | 'reliability';
  rawValue: number | null;       // null = 데이터 부족
  rawSource: string;             // 데이터 출처 설명
}

interface ScoreEngine {
  /** 종합 점수 계산. 데이터 부족 카테고리 정규화 처리. 결과는 0~100 범위 보장 (PBT 검증) */
  calculate(inputs: CategoryDataInput[], weights?: WeightConfig): ScoreResult;
  /** 카테고리별 점수 산정 (rawValue → 0~100) */
  scoreCategory(input: CategoryDataInput): CategoryScore;
  /** 가중 합산 (데이터 부족 제외 + 정규화) */
  weightedAverage(scores: CategoryScore[], weights: CategoryWeight[]): number;
  /** 현재 활성 가중치 버전 조회 */
  getActiveWeightVersion(): Promise<string>;
}
```

---

### C-08. ReportComposer

```typescript
interface ReportComposer {
  /** 리포트 조립 (메타데이터·점수·요약 통합) */
  compose(
    regionInfo: { regionCode: string; regionName: string; parentRegionName: string },
    scoreResult: ScoreResult,
    usedApis: string[],
    rawSummaries: Record<string, unknown>
  ): Report;
  /** 강점/주의점/데이터 부족 자동 분류 */
  summarizeStrengthsAndCautions(scores: CategoryScore[]): { strengths: string[]; cautions: string[]; insufficient: string[] };
}
```

---

### C-09. ComparisonEngine

```typescript
interface ComparisonResult {
  candidates: { regionCode: string; report: Report }[];
  highlights: Record<string, string>;        // category → bestRegionCode
  insufficientCells: { regionCode: string; category: string }[];
}

interface ComparisonEngine {
  /** 다수 후보지 비교 */
  compare(reports: Report[]): ComparisonResult;
  /** 정렬 (안정 정렬, PBT 검증) */
  sortByCategory(reports: Report[], category: string): Report[];
  /** 강점/약점 식별 */
  identifyStrengthWeakness(report: Report): { strongest: string; weakest: string };
}
```

---

## Backend Infrastructure Components

### C-10. BaseHttpClient

```typescript
interface RequestOptions {
  params?: Record<string, string | number>;
  timeout?: number;       // default 5000
  retries?: number;       // default 3
  apiName: string;        // ApiStatusRecorder용
}

abstract class BaseHttpClient {
  protected abstract baseUrl: string;
  /** GET 요청 (재시도/타임아웃/응답시간 측정/상태 기록) */
  async get<T>(path: string, options: RequestOptions): Promise<T>;
  protected async withRetry<T>(fn: () => Promise<T>, retries: number): Promise<T>;
  protected normalizeError(err: unknown, apiName: string): HttpError;
}
```

---

### C-11. RegionCodeClient

```typescript
interface RegionCodeClient {
  /** 검색어로 법정동 목록 조회 */
  search(keyword: string, pageNo?: number, numOfRows?: number): Promise<StanReginRow[]>;
  /** 법정동 코드로 단일 항목 조회 */
  findByCode(regionCode: string): Promise<StanReginRow | null>;
}
```

---

### C-12. MolitTradeClient

```typescript
interface MolitTradeClient {
  /** 단일 월 매매 실거래가 조회 */
  fetch(sggCode: string, dealYmd: string, pageNo?: number): Promise<RawTradeItem[]>;
  /** 다중 월 일괄 조회 (병렬) */
  fetchRange(sggCode: string, fromYmd: string, toYmd: string): Promise<RawTradeItem[]>;
}
```

---

### C-13. MolitRentClient

```typescript
interface MolitRentClient {
  fetch(sggCode: string, dealYmd: string, pageNo?: number): Promise<RawRentItem[]>;
  fetchRange(sggCode: string, fromYmd: string, toYmd: string): Promise<RawRentItem[]>;
}
```

---

### C-14. AirKoreaClient

```typescript
interface AirKoreaClient {
  /** 시도/시군구별 실시간 측정 */
  fetchByRegion(sidoName: string, sggName?: string): Promise<RawAirData[]>;
  /** 좌표 기준 가장 가까운 측정소 데이터 */
  fetchNearest(latitude: number, longitude: number): Promise<RawAirData | null>;
}
```

---

### C-15. KmaForecastClient

```typescript
interface KmaForecastClient {
  /** 위경도 → 격자 좌표 변환 */
  toGridXY(latitude: number, longitude: number): { nx: number; ny: number };
  /** 단기예보 조회 (최근 3일) */
  fetchVilageForecast(nx: number, ny: number, baseDate: string, baseTime: string): Promise<RawForecastItem[]>;
}
```

---

### C-16. HiraHospitalClient

```typescript
interface HiraHospitalClient {
  /** 시군구 코드로 병원 목록 */
  fetchHospitals(sggCode: string, pageNo?: number, numOfRows?: number): Promise<RawHospitalItem[]>;
  /** 약국 목록 */
  fetchPharmacies(sggCode: string, pageNo?: number, numOfRows?: number): Promise<RawPharmacyItem[]>;
}
```

---

### C-17. CacheManager

```typescript
interface CacheKey {
  apiName: string;
  regionCode: string;
  paramsHash: string;
}

interface CacheManager {
  /** Read-through 패턴 (캐시 우선, 만료 시 fetcher 호출) */
  getOrFetch<T>(key: CacheKey, ttlMs: number, fetcher: () => Promise<T>): Promise<{ data: T; isStale: boolean; cachedAt: string }>;
  /** 단순 get */
  get<T>(key: CacheKey): Promise<{ data: T; cachedAt: string; isStale: boolean } | null>;
  /** set */
  set<T>(key: CacheKey, data: T, ttlMs: number): Promise<void>;
  /** 특정 지역 캐시 무효화 */
  invalidateByRegion(regionCode: string): Promise<number>;
  /** 만료 판정 (PBT 검증) */
  isExpired(cachedAt: string, ttlMs: number, now?: Date): boolean;
}
```

---

### C-18. AuthService

```typescript
interface AuthService {
  /** 로그인 (성공 시 JWT 발급) */
  login(email: string, password: string): Promise<AuthToken>;
  /** JWT 검증 */
  verifyToken(token: string): Promise<{ userId: string; role: AdminRole; email: string }>;
  /** 비밀번호 변경 */
  changePassword(userId: string, current: string, next: string): Promise<void>;
  /** 비밀번호 정책 검증 */
  validatePasswordPolicy(password: string): { valid: boolean; reasons: string[] };
  /** 로그인 실패 카운트 증가 + 잠금 판정 */
  recordFailedLogin(email: string): Promise<{ locked: boolean; remainingAttempts: number }>;
  /** 잠금 해제 시각 조회 */
  getLockUntil(email: string): Promise<Date | null>;
}
```

---

### C-19. RateLimiter

```typescript
type RateLimitPolicy = 'search' | 'report' | 'admin';

interface RateLimiter {
  /** Express middleware factory */
  middleware(policy: RateLimitPolicy): RequestHandler;
  /** 직접 검사 */
  check(key: string, policy: RateLimitPolicy): Promise<{ allowed: boolean; resetAt: Date }>;
}
```

---

### C-20. AuditLogger

```typescript
interface AuditLogEntry {
  adminId: string;
  adminEmail: string;
  action: string;          // e.g. 'cache.refresh', 'weight.update', 'admin.create'
  target: string;          // e.g. regionCode or adminId
  details: Record<string, unknown>;
  result: 'success' | 'failure';
  timestamp: string;
}

interface AuditLogger {
  /** 감사 로그 기록 (DB + CloudWatch) */
  log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void>;
}
```

---

### C-21. ApiStatusRecorder

```typescript
interface ApiCallRecord {
  apiName: string;
  status: 'success' | 'delayed' | 'failed' | 'quota_exceeded';
  responseTimeMs: number | null;
  errorMessage: string | null;
  httpStatus: number | null;
  recordedAt: string;
}

interface ApiStatusRecorder {
  /** 호출 결과 기록 */
  record(record: Omit<ApiCallRecord, 'recordedAt'>): Promise<void>;
  /** API별 현재 상태 + 통계 */
  getStatus(apiName: string): Promise<ApiStatusInfo & { p50: number; p95: number; p99: number }>;
  /** 모든 API 상태 */
  getAllStatuses(): Promise<ApiStatusInfo[]>;
}
```

---

## Repository Components

### C-22. AdminUserRepository

```typescript
interface AdminUserRepository {
  findByEmail(email: string): Promise<(AdminUser & { passwordHash: string }) | null>;
  findById(id: string): Promise<AdminUser | null>;
  save(user: AdminUser & { passwordHash: string }): Promise<AdminUser>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  list(): Promise<AdminUser[]>;
  deleteById(id: string): Promise<void>;
  recordLogin(id: string): Promise<void>;
}
```

### C-23. WeightConfigRepository

```typescript
interface WeightConfigRepository {
  findActive(): Promise<WeightConfig>;
  findByVersion(version: string): Promise<WeightConfig | null>;
  saveNewVersion(config: WeightConfig): Promise<string>;  // returns new version
  listVersions(): Promise<{ version: string; updatedAt: string }[]>;
}
```

### C-24. WeightPresetRepository

```typescript
interface WeightPresetRepository {
  list(): Promise<WeightPreset[]>;
  findById(id: string): Promise<WeightPreset | null>;
  save(preset: WeightPreset): Promise<WeightPreset>;
  update(id: string, preset: Partial<WeightPreset>): Promise<WeightPreset>;
  deleteById(id: string): Promise<void>;
}
```

### C-25. CacheMetadataRepository

```typescript
interface CacheMetadataRepository {
  save(meta: CacheEntry): Promise<void>;
  findByRegionCode(regionCode: string): Promise<CacheEntry[]>;
  findStaleEntries(): Promise<CacheEntry[]>;
  deleteByRegionCode(regionCode: string): Promise<number>;
  list(filters: { apiName?: string; regionCode?: string }): Promise<CacheEntry[]>;
}
```

### C-26. ApiStatusLogRepository

```typescript
interface ApiStatusLogRepository {
  log(record: ApiCallRecord): Promise<void>;
  findRecentByApi(apiName: string, limit: number): Promise<ApiCallRecord[]>;
  computePercentiles(apiName: string, windowMinutes: number): Promise<{ p50: number; p95: number; p99: number }>;
  findRecentErrors(apiName: string, limit: number): Promise<ApiCallRecord[]>;
}
```

### C-27. AuditLogRepository

```typescript
interface AuditLogRepository {
  log(entry: AuditLogEntry): Promise<void>;
  findByAdmin(adminId: string, limit?: number): Promise<AuditLogEntry[]>;
  findByAction(action: string, limit?: number): Promise<AuditLogEntry[]>;
  findInTimeRange(from: Date, to: Date): Promise<AuditLogEntry[]>;
}
```

---

## Frontend Component Hooks (선택적 noteworthy hooks)

```typescript
// F-31 LocalStorage 인터페이스
interface CandidateLocalStorage {
  list(): Candidate[];
  add(candidate: CreateCandidateRequest): Candidate | { error: string };  // 5개 제한 + 중복 검증
  remove(id: string): void;
  updateAlias(id: string, alias: string): void;
  clear(): void;
}

// F-32 Auth Context API
interface AuthContextValue {
  isAuthenticated: boolean;
  user: AdminUser | null;
  login(email: string, password: string): Promise<void>;
  logout(): void;
}

// F-30 ApiClient
interface ApiClient {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
  setAuthToken(token: string | null): void;
}
```

---

**Note**: 비즈니스 규칙 상세(예: 점수 산정 공식, 등급 임계값, 별칭 정규화 규칙 등)는 Functional Design 단계에서 명시합니다.
