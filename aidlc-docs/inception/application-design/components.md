# Components

본 문서는 시스템의 컴포넌트와 책임을 정의합니다. 컴포넌트는 Single Responsibility 원칙으로 식별되며, 외부 API별 클라이언트는 별도로 분리됩니다.

## Layered Architecture Overview

```
┌──────────────────────────────────────────────────┐
│        Frontend (React SPA)                      │
│  Pages × Components × Hooks × State              │
└──────────────────────────────────────────────────┘
                  │  REST/JSON
                  ▼
┌──────────────────────────────────────────────────┐
│        Backend HTTP Layer (Express)              │
│  Routers · Middlewares · Controllers             │
└──────────────────────────────────────────────────┘
                  │ calls
                  ▼
┌──────────────────────────────────────────────────┐
│        Application Service Layer                 │
│  Per-Use-Case Application Services               │
└──────────────────────────────────────────────────┘
                  │ orchestrates
                  ▼
┌──────────────────────────────────────────────────┐
│        Domain Components (Analyzers, Engines)    │
│  Pure logic, business rules                      │
└──────────────────────────────────────────────────┘
                  │ uses
                  ▼
┌──────────────────────────────────────────────────┐
│        Infrastructure Components                 │
│  Repositories · ApiClients · Cache · Auth · Log  │
└──────────────────────────────────────────────────┘
                  │
                  ▼
   PostgreSQL · Redis · External APIs · Secrets
```

---

## Backend Components

### Domain Components (비즈니스 로직)

#### C-01. SearchEngine
**Purpose**: 주소·동·구명으로 법정동을 검색하고 결과를 정규화한다.

**Responsibilities**:
- 검색어 유효성 검증 (1~100자)
- 법정동코드 API 호출 (RegionCodeClient)
- 결과 정규화 (법정동 코드, 시군구 코드, 좌표, 이름)
- 검색 결과 0건 시 대체 검색어 제안

**Source**: FR-1, US-001, US-002

---

#### C-02. CandidateManager
**Purpose**: 후보지 등록·삭제·조회·별칭 수정의 비즈니스 규칙 적용. 실제 영속성은 Frontend LocalStorage가 담당하므로 백엔드는 ID 발급, 검증 헬퍼만 제공.

**Responsibilities**:
- 후보지 ID(UUID) 발급
- 좌표·법정동 코드 검증
- 후보지명/별칭 정규화 및 길이 검증

**Source**: FR-2, US-003 ~ US-008

---

#### C-03. PriceAnalyzer
**Purpose**: 실거래가 데이터 조회·정규화·면적대별 통계 산출.

**Responsibilities**:
- 매매·전월세 API 호출 (MolitTradeClient, MolitRentClient)
- 거래 데이터 면적대별 그룹핑 (~59㎡, 59~84㎡, 84~135㎡, 135㎡~)
- 면적대별 최저/중앙/최고가, 거래 건수 계산
- 5건 미만 면적대에 isLowReliability 플래그 부여
- 가격 단위 정규화 (만원)

**Source**: FR-3, US-009 ~ US-012

---

#### C-04. InfraAnalyzer
**Purpose**: 후보지 좌표 기준 반경별 시설 조회 및 접근성 점수 산정.

**Responsibilities**:
- HiraHospitalClient를 통해 병원·약국 데이터 조회
- 학교·공원·공공기관·교통 데이터 조회 (확장)
- Haversine 거리 계산 (DistanceUtil)
- 반경별(500m/1km/2km) 시설 필터링
- 좌표 누락 시설 제외 및 카운팅
- 카테고리별 접근성 점수(0~100) 산정

**Source**: FR-4, US-013 ~ US-015

---

#### C-05. EnvironmentAnalyzer
**Purpose**: 대기질·기상 데이터 조회 및 등급 판정·생활 불편 요약.

**Responsibilities**:
- AirKoreaClient 호출 (PM10/PM2.5/오존/KHAI)
- KmaForecastClient 호출 (단기예보)
- 통합대기환경지수 → 좋음/보통/나쁨/매우나쁨 등급 판정
- 폭염/한파/강수 일수 카운트
- 측정소 거리 계산

**Source**: FR-5, US-016 ~ US-018

---

#### C-06. SafetyAnalyzer
**Purpose**: 안전 시설(응급의료/소방서/경찰서)과 대피시설 접근성 분석. 범죄율 등 민감 지표는 명시적 제외.

**Responsibilities**:
- 안전 시설 위치 조회 및 가장 가까운 시설까지 거리 계산
- 대피시설 데이터 조회 (가용 시)
- 데이터 출처·기준일 메타데이터 수집

**Source**: FR-6, US-019, US-020

---

#### C-07. ScoreEngine
**Purpose**: 카테고리별 점수 산정 + 가중치 적용 → 종합 점수 계산.

**Responsibilities**:
- 6개 카테고리 점수 산정 (주거비/생활인프라/교통/환경/안전/데이터신뢰도)
- 가중치 적용 + 가용 데이터 정규화
- 데이터 부족 카테고리 제외 처리
- 점수 0~100 범위 보장 (PBT 검증)
- 산정 근거(rationale) 생성
- 점수 계산식 버전 기록

**Source**: FR-7, US-021, US-022

---

#### C-08. ReportComposer
**Purpose**: 점수 결과·메타데이터·요약을 하나의 리포트로 조합.

**Responsibilities**:
- 강점/주의점/데이터 부족 자동 분류 (점수 상하위 N개)
- 사용된 API 목록·데이터 기준 시각 수집
- 면책 안내·서비스 범위 제한 텍스트 부착
- 리포트 객체 직렬화

**Source**: FR-7, FR-13, US-023

---

#### C-09. ComparisonEngine
**Purpose**: 후보지 비교 및 강점/약점 자동 요약.

**Responsibilities**:
- 후보지 간 종합 점수·카테고리 점수 비교 테이블 생성
- 각 후보지의 가장 강한/약한 카테고리 식별
- 정렬 기준 카테고리 적용 시 안정 정렬 (PBT 검증)
- 카테고리별 우수 후보지 강조 정보 생성
- 데이터 부족 항목 표식

**Source**: FR-8, US-025 ~ US-027

---

### Infrastructure Components

#### C-10. BaseHttpClient
**Purpose**: 모든 외부 공공 API 클라이언트가 상속할 공통 HTTP 클라이언트. 재시도·타임아웃·로깅·에러 정규화 표준화.

**Responsibilities**:
- HTTP GET/POST 호출 (axios 기반)
- 타임아웃 5초, 3회 재시도 (exponential backoff: 100ms/500ms/2s)
- 응답 시간 측정 (p50/p95/p99 metrics)
- 에러 정규화 (HttpError 객체로 변환)
- 응답 시간 / 실패 / 할당량 초과 status를 ApiStatusRecorder에 보고

**Source**: NFR-1.4, NFR-7

---

#### C-11. RegionCodeClient
**Purpose**: 행정안전부 법정동코드 API 클라이언트.

**Responsibilities**:
- `getStanReginCdList` 호출 (검색어 기반)
- 응답 파싱 → RegionSearchResult[]
- 좌표 정보 추출 (시설 검색의 후보지 좌표 source)

**Extends**: BaseHttpClient

---

#### C-12. MolitTradeClient
**Purpose**: 국토교통부 아파트 매매 실거래가 API 클라이언트.

**Responsibilities**:
- `getRTMSDataSvcAptTrade` 호출 (LAWD_CD + DEAL_YMD 기반)
- XML 응답 파싱 → TradeDetail[]
- 다중 월 조회 지원 (3/6/12개월)

**Extends**: BaseHttpClient

---

#### C-13. MolitRentClient
**Purpose**: 국토교통부 아파트 전월세 실거래가 API 클라이언트.

**Responsibilities**:
- 매매 클라이언트와 동일 구조, 전월세 엔드포인트 호출
- 전세/월세 거래 유형 구분

**Extends**: BaseHttpClient

---

#### C-14. AirKoreaClient
**Purpose**: 한국환경공단 에어코리아 API 클라이언트.

**Responsibilities**:
- 측정소별 실시간 측정 데이터 조회
- 가장 가까운 측정소 검색 (좌표 기반 또는 시도/시군구 기반)
- PM10/PM2.5/오존/KHAI/측정 시각 추출

**Extends**: BaseHttpClient

---

#### C-15. KmaForecastClient
**Purpose**: 기상청 단기예보 API 클라이언트.

**Responsibilities**:
- 단기예보 격자 좌표 변환 (위경도 → nx/ny)
- 단기예보 조회 (`getVilageFcst`)
- 응답 파싱 → 일별 기온/강수/풍속/하늘 상태

**Extends**: BaseHttpClient

---

#### C-16. HiraHospitalClient
**Purpose**: 건강보험심사평가원 병원정보 API 클라이언트.

**Responsibilities**:
- 시군구 코드 기반 병원·약국 목록 조회
- 응답 파싱 → 시설 좌표·이름·주소

**Extends**: BaseHttpClient

---

#### C-17. CacheManager
**Purpose**: Redis 기반 캐시 read-through, TTL 관리, stale fallback.

**Responsibilities**:
- 캐시 키 생성 (apiName + regionCode + params hash)
- get/set with TTL
- 캐시 메타데이터 PostgreSQL 저장 (CacheMetadataRepository)
- stale 판정 및 fallback 로직
- 캐시 수동 무효화 (특정 지역)
- 캐시 만료 판정 일관성 (PBT 검증)

**Source**: FR-10, US-031, US-032, NFR-1, NFR-3.2

---

#### C-18. AuthService
**Purpose**: 운영자 인증·JWT 발급·검증·로그인 잠금.

**Responsibilities**:
- 이메일/비밀번호 검증 (bcrypt compare)
- JWT 발급 (만료 1시간) / 검증
- 로그인 실패 카운트 (Redis) → 5회 시 15분 잠금
- 비밀번호 정책 검증 (12자 이상, 대소문자/숫자/특수문자)

**Source**: FR-12, US-036, US-039, NFR-4.3, NFR-4.4

---

#### C-19. RateLimiter
**Purpose**: API 호출 rate limit 적용 (사용자 IP 기반).

**Responsibilities**:
- IP별 요청 카운트 (Redis)
- 엔드포인트별 정책: 검색 60/min, 리포트 10/min, Admin 100/min
- 한도 초과 시 429 응답

**Source**: NFR-4.6

---

#### C-20. AuditLogger
**Purpose**: Admin Panel의 모든 변경 작업을 감사 로그로 기록.

**Responsibilities**:
- 작업 정보 수집 (운영자 ID, 시각, 작업 종류, 대상, 결과)
- 구조화된 JSON 로그를 CloudWatch Logs로 전송
- 데이터베이스 audit_logs 테이블에도 영속화

**Source**: NFR-4.8, US-030, US-032, US-038

---

#### C-21. ApiStatusRecorder
**Purpose**: 외부 API 호출 결과(상태/응답시간/에러)를 기록. Admin Panel의 API 상태 조회용 데이터 source.

**Responsibilities**:
- 호출 결과 PostgreSQL `api_status_logs` 테이블에 저장
- 응답 시간 통계(p50/p95/p99) 계산 (롤링 윈도우)
- 최근 에러 메시지 보존
- 정상/지연/실패/할당량 초과 분류

**Source**: FR-9, US-029, NFR-1.4, NFR-3.2

---

### Repository Components

각 Repository는 인터페이스로 추상화되어 in-memory mock 가능. PostgreSQL 구현체는 knex 사용.

#### C-22. AdminUserRepository
**Purpose**: 운영자 계정 CRUD.

**Methods**: findByEmail, save, updatePassword, list, deleteById

#### C-23. WeightConfigRepository
**Purpose**: 가중치 설정 및 버전 관리.

**Methods**: findActive, findByVersion, saveNewVersion, listVersions

#### C-24. WeightPresetRepository
**Purpose**: 가중치 프리셋 CRUD.

**Methods**: list, findById, save, update, deleteById

#### C-25. CacheMetadataRepository
**Purpose**: 캐시 메타데이터 영속화 (Redis는 데이터, PostgreSQL은 메타데이터).

**Methods**: save, findByRegionCode, findStaleEntries, deleteByRegionCode

#### C-26. ApiStatusLogRepository
**Purpose**: API 호출 로그 저장 및 통계 조회.

**Methods**: log, findRecentByApi, computePercentiles, findRecentErrors

#### C-27. AuditLogRepository
**Purpose**: 감사 로그 영속화.

**Methods**: log, findByAdmin, findByAction, findInTimeRange

---

## Frontend Components

### Frontend Pages

#### F-01. SearchPage
**Path**: `/`
**Purpose**: 지역 검색 + 후보지 등록 진입점.
**Source**: US-001, US-002, US-003

#### F-02. CandidateListPage
**Path**: `/candidates`
**Purpose**: 등록된 후보지 카드 목록 + 액션(삭제/별칭 수정).
**Source**: US-008

#### F-03. ReportPage
**Path**: `/reports/:regionCode`
**Purpose**: 단일 후보지 종합 리포트.
**Source**: US-009 ~ US-024

#### F-04. ComparisonPage
**Path**: `/compare`
**Purpose**: 후보지 비교 테이블 + 정렬 + 강점/약점 요약.
**Source**: US-025 ~ US-028

#### F-05. AdminLoginPage
**Path**: `/admin/login`
**Purpose**: 운영자 로그인.
**Source**: US-036

#### F-06. AdminDashboard
**Path**: `/admin`
**Purpose**: API 상태·캐시·가중치·계정 관리 진입점 (인증 보호).
**Source**: US-029 ~ US-039

#### F-07. AdminApiStatusPage
**Path**: `/admin/apis`
**Source**: US-029, US-030

#### F-08. AdminCachePage
**Path**: `/admin/cache`
**Source**: US-031, US-032

#### F-09. AdminWeightsPage
**Path**: `/admin/weights`
**Source**: US-033, US-034, US-035

#### F-10. AdminAccountsPage
**Path**: `/admin/accounts`
**Source**: US-038, US-039

---

### Reusable Frontend Components

#### F-20. SearchInput, SearchResults, RegionResultCard
지역 검색 UI 단위 컴포넌트.

#### F-21. CandidateCard, AliasInput, DeleteConfirmDialog
후보지 카드 및 액션 UI.

#### F-22. PriceSummaryTable, PriceFormatLabel, AreaGroupSelector, PeriodSelector
실거래가 표시 컴포넌트.

#### F-23. InfraGrid, FacilityList, AccessibilityScoreCard
생활 인프라 컴포넌트.

#### F-24. AirQualityBadge, WeatherForecastCard, DiscomfortNotice
환경 표시 컴포넌트.

#### F-25. SafetyFacilityList, DataSourceTag
안전 인프라 컴포넌트.

#### F-26. ScoreCard, ScoreRationaleToggle, ReportSummary
종합 리포트 컴포넌트.

#### F-27. ComparisonTable, StrengthWeaknessBadge, SortByCategoryControl
비교 컴포넌트.

#### F-28. AdminLayout, AuthGuard, AdminNav, ApiStatusBadge
Admin 공통 컴포넌트.

#### F-29. LoadingIndicator, ErrorBoundary, ToastNotifier
공통 UX 컴포넌트.

---

### Frontend Infrastructure

#### F-30. ApiClient (axios wrapper)
**Purpose**: Backend REST API 호출, 에러 정규화, JWT 헤더 자동 부착.

#### F-31. CandidateLocalStorage
**Purpose**: LocalStorage 기반 후보지 영속성. JSON 직렬화/역직렬화, 5개 제한 검증, 중복 검증.
**Source**: US-003, US-005, US-006, US-007 (LocalStorage 부분)

#### F-32. AuthContext / AuthProvider
**Purpose**: 운영자 JWT 상태 관리, 로그인/로그아웃, 401 인터셉트.

#### F-33. CandidatesContext / CandidatesProvider
**Purpose**: 후보지 목록 React Context (LocalStorage와 동기화).

#### F-34. AppRouter
**Purpose**: React Router 설정, AuthGuard 적용, 페이지 라우팅.

---

## Component Count Summary

| Layer | Component Count |
|-------|-----------------|
| Backend Domain | 9 (C-01 ~ C-09) |
| Backend Infra | 12 (C-10 ~ C-21) |
| Backend Repository | 6 (C-22 ~ C-27) |
| Frontend Pages | 10 (F-01 ~ F-10) |
| Frontend Reusable | 10 그룹 (F-20 ~ F-29) |
| Frontend Infra | 5 (F-30 ~ F-34) |
| **Total Backend** | **27** |
| **Total Frontend** | **25** |

상세한 메소드 시그니처는 `component-methods.md` 참조.
