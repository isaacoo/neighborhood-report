# Unit of Work ↔ Story Mapping

본 문서는 39개 User Story를 7개 Unit에 매핑합니다.

## Mapping Principles
1. **하나의 story는 정확히 하나의 primary unit에 매핑**됩니다.
2. UI 측면 AC는 항상 **U-6 frontend**에서 함께 구현됩니다.
3. Foundation/Infra unit은 직접 매핑된 story가 없지만, 다른 unit의 story 검증을 위해 필요합니다.

---

## Story → Unit Mapping (전체)

| Story ID | Title | Primary Unit (Backend) | UI Unit | Foundation 의존 |
|----------|-------|------------------------|---------|----------------|
| US-001 | 동 이름으로 지역 검색 | U-4 user-features | U-6 | U-3 (RegionCodeClient) |
| US-002 | 검색 결과 없음 처리 | U-4 user-features | U-6 | — |
| US-003 | 후보지 등록 | (frontend-driven) | U-6 | — (LocalStorage) |
| US-004 | 후보지 별칭 입력 | (frontend-driven) | U-6 | — |
| US-005 | 최대 5개 등록 제한 | (frontend-driven) | U-6 | — |
| US-006 | 중복 등록 방지 | (frontend-driven) | U-6 | — |
| US-007 | 후보지 삭제 | (frontend-driven) | U-6 | — |
| US-008 | 후보지 목록 조회 | (frontend-driven) | U-6 | — |
| US-009 | 실거래가 요약 조회 | U-4 | U-6 | U-2 (Cache), U-3 (MolitClients) |
| US-010 | 조회 기간 선택 | U-4 | U-6 | U-2, U-3 |
| US-011 | 신뢰도 낮음 표시 | U-4 | U-6 | — |
| US-012 | 거래 상세 목록 조회 | U-4 | U-6 | U-2, U-3 |
| US-013 | 카테고리별 시설 수 조회 | U-4 | U-6 | U-2 (Cache), U-3 (HiraHospital, RegionCode) |
| US-014 | 카테고리별 접근성 점수 | U-4 | U-6 | — |
| US-015 | 시설 상세 목록 조회 | U-4 | U-6 | — |
| US-016 | 대기질 지표 조회 | U-4 | U-6 | U-2 (Cache), U-3 (AirKorea) |
| US-017 | 기상 예보 조회 | U-4 | U-6 | U-2 (Cache), U-3 (KmaForecast) |
| US-018 | 생활 불편 요약 | U-4 | U-6 | — |
| US-019 | 안전 시설 접근성 조회 | U-4 | U-6 | U-2 (Cache) |
| US-020 | 민감 지표 제외 보장 | U-4 | — | — |
| US-021 | 종합 점수 계산 | U-4 | U-6 | U-2 (WeightConfigRepo) |
| US-022 | 점수 산정 근거 표시 | U-4 | U-6 | — |
| US-023 | 리포트 요약 | U-4 | U-6 | — |
| US-024 | 리포트 생성 실패 처리 | U-4 | U-6 | U-2 (Cache stale fallback) |
| US-025 | 후보지 비교 테이블 | U-4 | U-6 | — |
| US-026 | 강점/약점 자동 요약 | U-4 | U-6 | — |
| US-027 | 우선순위 기반 정렬 | U-4 | U-6 | — |
| US-028 | 모바일 비교 화면 최적화 | — | U-6 | — |
| US-029 | API 상태 조회 | U-5 admin-features | U-6 (admin) | U-2 (ApiStatusRecorder) |
| US-030 | API 수동 재시도 | U-5 | U-6 (admin) | U-2 (Audit), U-3 (clients) |
| US-031 | 캐시 상태 조회 | U-5 | U-6 (admin) | U-2 (CacheMetaRepo) |
| US-032 | 캐시 수동 갱신 | U-5 | U-6 (admin) | U-2 (Cache, Audit) |
| US-033 | 가중치 조회 및 변경 | U-5 | U-6 (admin) | U-2 (WeightConfigRepo, Audit) |
| US-034 | 가중치 프리셋 관리 | U-5 | U-6 (admin) | U-2 (WeightPresetRepo, Audit) |
| US-035 | 가중치 버전 구분 표시 | U-5 / U-4 | U-6 | U-2 |
| US-036 | 운영자 로그인 | U-5 | U-6 (admin) | U-2 (AuthService, Audit) |
| US-037 | 초기 Superadmin 생성 | U-2 (seed) | — | U-2 (AdminUserRepo, AuthService) |
| US-038 | Admin 계정 생성 | U-5 | U-6 (admin) | U-2 (AuthService, AdminUserRepo, Audit) |
| US-039 | 비밀번호 변경 | U-5 | U-6 (admin) | U-2 (AuthService, Audit) |

---

## Story Count per Unit

| Unit | Direct Story Count | Indirect Dependency |
|------|-------------------|---------------------|
| U-1 shared-types | 0 (모든 unit의 prerequisite) | 39/39 |
| U-2 backend-foundation | 1 (US-037 seed) | 16+ (인증/감사/캐시) |
| U-3 public-api-clients | 0 | 11+ (외부 API 사용 story) |
| U-4 user-features | 27 | (own) |
| U-5 admin-features | 10 | (own) |
| U-6 frontend | 38 (UI 측면) | (own) |
| U-7 infra-as-code | 0 (NFR 검증) | 모든 NFR-2/3/4/8 |

**Note**: US-003~US-008은 frontend-driven (LocalStorage 기반)이라 backend primary unit이 없습니다. UI 구현은 U-6에서 진행.

---

## Unit별 Story 우선순위

### U-1 shared-types
**Priority Foundation**: 모든 다른 unit 시작 전에 stable해야 함.

### U-2 backend-foundation
**Priority 1 (Foundation)**:
- DB 연결, knex setup, 마이그레이션 framework
- env loader, composition root
- errorHandler, request logger middleware
- Repository interfaces

**Priority 2 (Auth & Audit)**:
- AdminUserRepository (PG impl), AuthService, JWT, bcrypt
- AuditLogger, AuditLogRepository
- US-037 seed 스크립트

**Priority 3 (Cache & Status)**:
- CacheManager, CacheMetadataRepository
- ApiStatusRecorder, ApiStatusLogRepository

**Priority 4 (Cross-cutting)**:
- RateLimiter middleware
- CORS, Helmet, security middleware

### U-3 public-api-clients
**Priority Foundation**: U-2의 ApiStatusRecorder 인터페이스 안정화 후 시작.
- BaseHttpClient
- 6개 specific client (RegionCode → AirKorea → KmaForecast → MolitTrade → MolitRent → HiraHospital)

### U-4 user-features
**Priority 1 (Search & Foundation)**:
- US-001, US-002 (SearchEngine, S-01)

**Priority 2 (Single-domain Analyses)**:
- US-009 ~ US-012 (Price)
- US-013 ~ US-015 (Infra, including DistanceUtil)
- US-016 ~ US-018 (Environment)
- US-019, US-020 (Safety)

**Priority 3 (Aggregation)**:
- US-021, US-022, US-023, US-024 (ScoreEngine, ReportComposer, S-06)

**Priority 4 (Comparison)**:
- US-025 ~ US-027 (ComparisonEngine, S-07)

### U-5 admin-features
**Priority 1**:
- US-036 (Login - foundation 의존)

**Priority 2**:
- US-038, US-039 (Account 관리)

**Priority 3**:
- US-029, US-030 (API 상태 + 재시도)
- US-031, US-032 (Cache 관리)

**Priority 4**:
- US-033, US-034, US-035 (가중치 관리)

### U-6 frontend
**Priority 1 (Routing & Auth)**:
- AppRouter, AuthContext, AuthGuard, ApiClient
- LoadingIndicator, ErrorBoundary, ToastNotifier

**Priority 2 (Search & Candidate)**:
- US-001 ~ US-008 UI

**Priority 3 (Reports)**:
- US-009 ~ US-024 UI

**Priority 4 (Comparison)**:
- US-025 ~ US-028 UI

**Priority 5 (Admin)**:
- US-029 ~ US-039 UI (admin layout, 모든 admin pages)

### U-7 infra-as-code
**Priority 1**:
- Docker Compose 로컬 환경
- Backend Dockerfile

**Priority 2**:
- AWS CDK 골격 (VPC, ALB, ECS Task Definition)

**Priority 3**:
- RDS, ElastiCache, S3, CloudFront
- Secrets Manager
- CloudWatch Alarms

**Priority 4**:
- GitHub Actions workflows (lint/test/security/build/deploy)

---

## Validation Summary

- ✅ **39개 story 중 39개가 unit에 매핑됨**
- ✅ frontend-driven story (US-003 ~ US-008)는 backend primary unit 없이 U-6 frontend로 매핑
- ✅ Backend primary unit이 있는 story는 모두 U-4 또는 U-5에 배정
- ✅ Foundation/Infra unit은 직접 story는 없지만 다른 unit의 검증 기준으로 활용
- ✅ INVEST 검증 결과 unit 분해와 충돌 없음 (각 story는 단일 unit으로 implementable)
