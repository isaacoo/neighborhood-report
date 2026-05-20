# Domain Entities — U-2 backend-foundation

본 문서는 U-2가 소유하는 PostgreSQL 엔티티의 스키마를 정의합니다. SQL은 knex 마이그레이션 작성 시 그대로 활용됩니다.

## E-1. admin_users

운영자 계정 정보. AuthService가 사용.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | 운영자 식별자 |
| email | VARCHAR(255) | UNIQUE NOT NULL | 로그인 이메일 |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 해시 (cost=12) |
| role | VARCHAR(20) | NOT NULL DEFAULT 'admin', CHECK IN ('superadmin','admin') | 운영자 역할 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 수정 시각 |
| last_login_at | TIMESTAMPTZ | NULL | 마지막 로그인 |

**Indexes**: idx_admin_users_email (UNIQUE)

**비밀번호 절대 평문 저장 금지** (NFR-4.4).

---

## E-2. weight_configs

가중치 설정의 버전별 영속화. ScoreEngine이 활성 버전 조회.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | 식별자 |
| version | VARCHAR(50) | UNIQUE NOT NULL | 버전 (예: 'v1.0.0') |
| weights | JSONB | NOT NULL | `[{category, weight, isRequired}]` |
| is_active | BOOLEAN | NOT NULL DEFAULT FALSE | 현재 활성 버전 여부 |
| created_by | UUID | NULL, FK admin_users(id) | 생성자 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 생성 시각 |

**Indexes**: idx_weight_configs_active (WHERE is_active=TRUE), idx_weight_configs_version

**Invariant**: `is_active=TRUE`인 row는 정확히 1개 존재 (partial unique index).

---

## E-3. weight_presets

운영자가 사용자에게 추천하는 가중치 프리셋.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | 식별자 |
| name | VARCHAR(100) | NOT NULL | 프리셋 이름 (예: '출퇴근 중심') |
| description | TEXT | NULL | 프리셋 설명 |
| weights | JSONB | NOT NULL | `[{category, weight, isRequired}]` |
| created_by | UUID | NULL, FK admin_users(id) | 생성자 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 수정 시각 |

**Indexes**: idx_weight_presets_name

---

## E-4. cache_metadata

Redis 캐시의 PostgreSQL 메타데이터. 운영자 캐시 조회·통계용.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | 식별자 |
| api_name | VARCHAR(100) | NOT NULL | 외부 API 식별자 (예: 'molit.apt-trade') |
| region_code | VARCHAR(20) | NOT NULL | 법정동 코드 |
| params_hash | VARCHAR(64) | NOT NULL | 요청 파라미터 SHA-256 해시 |
| request_params | JSONB | NULL | 요청 파라미터 원본 (디버깅용) |
| cached_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 캐시 시각 |
| expires_at | TIMESTAMPTZ | NOT NULL | 만료 시각 |
| is_stale | BOOLEAN | NOT NULL DEFAULT FALSE | stale 표시 (외부 API 실패 시 갱신 못 한 상태) |

**Indexes**:
- idx_cache_metadata_region (region_code)
- idx_cache_metadata_api (api_name)
- idx_cache_metadata_expires (expires_at)
- UNIQUE (api_name, region_code, params_hash)

**Note**: 실제 캐시 데이터는 Redis에 저장. 본 테이블은 운영자 가시성과 분석용.

---

## E-5. api_status_logs

외부 API 호출 결과 시계열 기록. ApiStatusRecorder가 매 호출 후 append.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PK | 식별자 |
| api_name | VARCHAR(100) | NOT NULL | 외부 API 식별자 |
| status | VARCHAR(20) | NOT NULL CHECK IN ('success','delayed','failed','quota_exceeded') | 상태 |
| response_time_ms | INTEGER | NULL | 응답 시간 (ms) |
| http_status | INTEGER | NULL | HTTP 상태 코드 |
| error_message | TEXT | NULL | 에러 메시지 (실패 시) |
| recorded_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 기록 시각 |

**Indexes**:
- idx_api_status_api_recorded (api_name, recorded_at DESC)
- idx_api_status_recorded_at (recorded_at) — retention 작업용

**Retention**: 30일. 30일 이전 row는 정기 배치로 삭제 (운영 작업, 본 unit 범위 외).

---

## E-6. audit_logs

운영자의 모든 변경 작업 감사 로그. AuditLogger가 작성.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PK | 식별자 |
| admin_id | UUID | NOT NULL, FK admin_users(id) ON DELETE SET NULL | 작업자 |
| admin_email | VARCHAR(255) | NOT NULL | 작업자 이메일 (admin 삭제 후에도 추적 가능) |
| action | VARCHAR(100) | NOT NULL | 작업 종류 (예: 'cache.refresh') |
| target | VARCHAR(255) | NOT NULL | 작업 대상 (regionCode 등) |
| details | JSONB | NULL | 작업 추가 정보 |
| result | VARCHAR(20) | NOT NULL CHECK IN ('success','failure') | 결과 |
| ip_address | INET | NULL | 요청 IP (감사 추적 강화) |
| timestamp | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 작업 시각 |

**Indexes**:
- idx_audit_logs_admin (admin_id, timestamp DESC)
- idx_audit_logs_action (action, timestamp DESC)
- idx_audit_logs_timestamp (timestamp)

**Retention**: 1년 보관 (보안 감사 요구사항).

---

## Migration Sequence

마이그레이션 파일 순서 (knex):
1. `001_create_admin_users.ts`
2. `002_create_weight_configs.ts`
3. `003_create_weight_presets.ts`
4. `004_create_cache_metadata.ts`
5. `005_create_api_status_logs.ts`
6. `006_create_audit_logs.ts`
7. `007_seed_initial_weight_config.ts` (균등 가중치 v1.0.0, is_active=TRUE)

## Out of Scope (다른 unit 소유)
- Frontend candidate 데이터 (LocalStorage, 영속 DB 없음)
- 외부 API 응답 원본 (Redis만)
- 사용자 후보지 (서버 저장 안 함, FR-2 정책)
