# Code Generation Plan — U-1 shared-types

## Unit Context
- **Unit ID**: U-1
- **Unit Name**: shared-types
- **Type**: Shared TypeScript library
- **Code Location**: `packages/shared/`
- **Build Output**: TypeScript types + 약간의 런타임 상수/가드 함수

## Stories Implemented
U-1 자체는 직접 매핑되는 user story가 없으나, 모든 다른 unit의 prerequisite입니다. 다음 story들이 본 unit의 type을 사용합니다 (전체 39개).

## Dependencies
- **Build-time deps**: 없음 (TypeScript만 사용)
- **Runtime deps**: 없음
- **Dependents**: U-2, U-3, U-4, U-5, U-6 (모든 application unit)

## Expected Interfaces
Application Design `component-methods.md`에 정의된 모든 interface와 type. Frontend와 Backend의 wire format DTO 출처.

## Database Entities
없음 (타입 정의만)

## Service Boundaries
Pure type library. 런타임 의존성 없음. 컴포넌트 import 시 zero overhead.

---

## Existing Code Status
이미 partial 코드가 존재 (`packages/shared/src/`). 이번 작업은 **정식 Application Design 산출물에 따라 검증·보완**하는 것임. 기존 파일은 유지하되 누락된 타입/상수를 추가하고 일관성 확보.

### Existing Files (검증 대상)
- `packages/shared/src/index.ts` (export aggregator)
- `packages/shared/src/types/admin.ts`
- `packages/shared/src/types/api.ts`
- `packages/shared/src/types/cache.ts`
- `packages/shared/src/types/candidate.ts`
- `packages/shared/src/types/environment.ts`
- `packages/shared/src/types/infra.ts`
- `packages/shared/src/types/price.ts`
- `packages/shared/src/types/safety.ts`
- `packages/shared/src/types/score.ts`
- `packages/shared/src/types/weight.ts`
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`

---

## Generation Steps

### Step 1: tsconfig & package.json 검증/보완
- [x] tsconfig.json: `composite: true`, strict, ES2022, declaration 활성화 확인
- [x] package.json: name, types, main 필드 검증, 빌드 스크립트 확인
- [x] Documentation: `aidlc-docs/construction/u1-shared-types/code/setup.md`

### Step 2: index.ts export 검증/보완
- [x] 모든 type 모듈 re-export 확인
- [x] Constants(`CACHE_TTL` 등) export 확인

### Step 3: Domain Type 정의 검증/보완 (per Application Design)
각 type 파일을 Application Design `component-methods.md`와 대조하여 누락 타입 추가:
- [x] `types/candidate.ts`: `Candidate`, `CreateCandidateRequest`, `UpdateCandidateAliasRequest`
- [x] `types/price.ts`: `PricePeriod`, `TradeType`, `AreaPriceGroup`, `PriceSummary`, `TradeDetail`
- [x] `types/infra.ts`: `FacilityCategory`, `FacilityItem`, `FacilityGroup`, `CategoryScore`, `InfraResult`
- [x] `types/environment.ts`: `AirQualityGrade`, `AirQualityData`, `WeatherData`, `DiscomfortSummary`, `EnvironmentResult`
- [x] `types/safety.ts`: `SafetyFacilityType`, `SafetyFacility`, `DisasterRisk`, `SafetyResult`
- [x] `types/score.ts`: `ScoreResult`, `Report`
- [x] `types/weight.ts`: `CategoryWeight`, `WeightPreset`, `WeightConfig`
- [x] `types/cache.ts`: `CacheEntry`, `CacheStatus`, `CACHE_TTL` 상수
- [x] `types/admin.ts`: `AdminRole`, `AdminUser`, `LoginRequest`, `AuthToken`, `CreateAdminRequest`, `ChangePasswordRequest`
- [x] `types/api.ts`: `ApiStatus`, `ApiStatusInfo`, `ApiResponse<T>`, `PaginationMeta`

### Step 4: 추가 타입/상수 신규 작성 (필요 시)
- [x] `types/region.ts`: `RegionSearchResult`, `SearchResponse`
- [x] `types/audit.ts`: `AuditLogEntry`, `AuditResult`
- [x] `types/api.ts`에 `ApiCallRecord`, `ApiPercentileStats`, `ApiErrorCode` 추가
- [x] `constants.ts` 파일 생성: `FACILITY_CATEGORIES`, `AREA_RANGES`, `AIR_QUALITY_GRADE_THRESHOLDS`, `SCORE_CATEGORIES`, `MAX_*`, `JWT_EXPIRES_SECONDS`, `PASSWORD_POLICY`, `LOGIN_LOCK_POLICY`, `HTTP_CLIENT_POLICY`, `RATE_LIMIT_PER_MINUTE`, `ADMIN_ROLES`, `API_NAMES`
- [x] Type guards: `isFacilityCategory`, `isAirQualityGrade`, `isAdminRole`, `isTradeType`, `isPricePeriod`, `isKoreanCoordinate`

### Step 5: 신규 export 등록
- [x] index.ts 업데이트로 모든 신규 모듈/타입 노출

### Step 6: Type Tests
- [x] `tests/types.test.ts`: 20 tests, all passed
- [x] vitest 설정 (`vitest.config.ts`)

### Step 7: Build 검증
- [x] `npx tsc --noEmit` 통과
- [x] `npx tsc` declaration 빌드 통과

### Step 8: Documentation
- [x] `aidlc-docs/construction/u1-shared-types/code/types-summary.md`
- [x] `packages/shared/README.md`

---

## Story Coverage
U-1 자체에는 매핑되는 story가 없으나, 다음 story들의 type 의존이 본 unit에서 처리됨:
- 모든 39개 story의 wire format DTO

---

## Plan Step Count
8 steps

---

## Out of Scope
- 비즈니스 로직 (다른 unit으로 위임)
- 런타임 계산 코드 (가격 포맷 등은 U-4의 utils로)
- DB schema (U-2 db/migrations)
