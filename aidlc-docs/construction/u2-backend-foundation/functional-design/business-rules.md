# Business Rules — U-2 backend-foundation

## BR-1. 비밀번호 정책

운영자 계정 비밀번호는 다음 모두 충족해야 한다:
- **최소 길이**: 12자
- **대문자 1개 이상** (A-Z)
- **소문자 1개 이상** (a-z)
- **숫자 1개 이상** (0-9)
- **특수문자 1개 이상** (`!@#$%^&*()_+-=[]{}|;:,.<>?` 중 1개)

검증 결과 형식: `{ valid: boolean, reasons: string[] }` — 미충족 사유를 모두 반환.

저장은 `bcrypt(password, cost=12)` 해시값만. 평문 저장·로그 출력 금지 (NFR-4.4).

**관련 상수**: `PASSWORD_POLICY` in `@neighborhood-report/shared/constants`.

---

## BR-2. 로그인 잠금 정책

| 조건 | 동작 |
|------|------|
| 로그인 실패 1~4회 | 다음 시도 허용 |
| 로그인 실패 5회 누적 | 계정 15분간 잠금 (lockUntil = now + 15min) |
| 잠금 상태에서 시도 | 401 + "잠시 후 다시 시도해주세요" + lockUntil 정보 미노출 (보안) |
| 로그인 성공 | 실패 카운터 즉시 리셋 (Redis key 삭제) |

저장 위치:
- 실패 카운터: `auth:login-fail:{email}` (Redis, TTL = 15분)
- 잠금 시각: `auth:login-lock:{email}` (Redis, TTL = 15분)

**Redis 장애 시 fail-open**: 잠금 미적용 (서비스 가용성 우선). CloudWatch에 경고 메트릭 발행.

**관련 상수**: `LOGIN_LOCK_POLICY = { maxFailedAttempts: 5, lockDurationMinutes: 15 }`.

---

## BR-3. JWT 발급/검증 정책

| 항목 | 값 |
|------|-----|
| 알고리즘 | HS256 |
| Secret | `process.env.JWT_SECRET` (운영은 AWS Secrets Manager) |
| 만료 | 1시간 (`JWT_EXPIRES_SECONDS = 3600`) |
| Issuer | `neighborhood-report` |
| Refresh token | **사용 안 함** (만료 시 재로그인) |
| Payload | `{ sub: userId, email, role, iat, exp, iss }` |
| Token type | Bearer |

검증 실패 사유와 응답:
- 토큰 누락/형식 오류 → 401 UNAUTHORIZED
- 서명 무효 → 401 UNAUTHORIZED (로그에 IP 기록)
- 만료 → 401 with `code: 'TOKEN_EXPIRED'`

**관련 상수**: `JWT_EXPIRES_SECONDS`.

---

## BR-4. 캐시 키 생성 규칙

```
key = `cache:${apiName}:${regionCode}:${paramsHash}`
paramsHash = SHA-256(JSON.stringify(sortedParams)).substring(0, 16)
```

- `apiName`: shared/constants의 `API_NAMES` (예: `molit.apt-trade`)
- `regionCode`: 10자리 법정동 코드 (없으면 빈 문자열)
- `sortedParams`: 키 알파벳 정렬한 순수 파라미터 객체 (apiKey, serviceKey 등 비밀 제외)
- `paramsHash`: 16자리 prefix (충돌 가능성 매우 낮음, debugging 용이)

**Property**: 동일 `(apiName, regionCode, params)` → 동일 key (deterministic).

---

## BR-5. 캐시 만료 판정 규칙

`isExpired(cachedAt: ISO8601, ttlMs: number, now = Date.now()): boolean`

```
isExpired = (now > cachedAt + ttlMs)
```

**Property** (PBT 검증):
- (P1) `cachedAt + ttlMs == expiresAt` (계산 일관성)
- (P2) `isExpired(t, ttl, t)` === false (즉시 만료 안 됨)
- (P3) `isExpired(t, ttl, t + ttl + 1)` === true (만료 직후 true)
- (P4) `ttlMs ≥ 0`을 가정

TTL 정책 (shared/constants `CACHE_TTL`):
- realEstate: 24h, facility: 7d, airQuality: 1h, weather: 1h, regionCode: 30d

---

## BR-6. Stale Fallback 규칙

CacheManager.getOrFetch:
1. `key`로 Redis에서 조회 → hit + not expired → 즉시 반환 (`isStale=false`)
2. miss → `fetcher()` 호출 → 성공 → Redis SET + 메타데이터 INSERT/UPDATE → 반환 (`isStale=false`)
3. miss + fetcher 실패 → Redis에서 expired 데이터라도 조회 시도
   - hit (만료) → 반환 (`isStale=true`) + cache_metadata.is_stale=TRUE 업데이트
   - miss → throw `ExternalApiError`

**Property**: stale 응답 시 `isStaleCache=true` 메타데이터가 사용자 응답에 포함되어야 함 (FR-13.3).

---

## BR-7. 캐시 무효화 규칙

`invalidateByRegion(regionCode)`:
1. PostgreSQL `cache_metadata`에서 region_code = regionCode 조회 → 모든 (api_name, params_hash) 수집
2. 각 캐시 키 Redis DEL
3. cache_metadata에서 해당 row 삭제
4. 무효화된 키 개수 반환
5. AuditLogger.log({action: 'cache.refresh', target: regionCode, details: {invalidatedCount}, result})

원자성: 단일 트랜잭션 보장은 안 됨 (Redis와 PG 분산). 부분 실패 시 cache_metadata만 정리되고 Redis에 orphan 발생 가능 → 자동 복구는 TTL 만료에 의존.

---

## BR-8. Rate Limit 정책

`express-rate-limit` 기반, Redis store:

| Policy | Limit | Window | Key |
|--------|-------|--------|-----|
| search | 60 req | 1분 | `rl:search:{ip}` |
| report | 10 req | 1분 | `rl:report:{ip}` |
| admin | 100 req | 1분 | `rl:admin:{ip}` |

한도 초과 응답: 429 + `Retry-After` 헤더.

**Redis 장애 시 fail-open**: rate limit 미적용 (가용성 우선). CloudWatch alert.

**관련 상수**: `RATE_LIMIT_PER_MINUTE`.

---

## BR-9. 감사 로그 작성 규칙

다음 모든 admin 작업은 `AuditLogger.log` 호출 필수:

| Action | Target | Details |
|--------|--------|---------|
| `admin.login` | email | `{success, ip}` |
| `admin.login_locked` | email | `{ip, lockUntil}` |
| `admin.create` | newAdminEmail | `{role}` |
| `admin.delete` | adminId | `{}` |
| `admin.password_change` | userId (self) | `{}` |
| `cache.refresh` | regionCode | `{invalidatedCount}` |
| `weight.update` | newVersion | `{prevVersion, weights}` |
| `weight.preset.create` | presetId | `{name}` |
| `weight.preset.update` | presetId | `{changes}` |
| `weight.preset.delete` | presetId | `{name}` |
| `api.retry` | apiName | `{success, latencyMs}` |

작성 흐름:
1. PostgreSQL audit_logs INSERT
2. CloudWatch Logs (구조화 JSON, log group: `/neighborhood-report/audit`)
3. PG 실패 시 → CloudWatch만 시도 + critical alert (BR-10)
4. CloudWatch 실패 시 → console.error + DB만 (best-effort)
5. 작성 작업이 원래 작업의 결과를 차단하지 않음 (fire-and-forget but awaited within request)

---

## BR-10. AuditLog DB 실패 시 critical alert

AuditLogger가 PostgreSQL INSERT 실패하면:
1. CloudWatch Logs에 `[CRITICAL][AuditLog DB Failure]` 메시지
2. CloudWatch metric `AuditLogDbFailureCount += 1` 발행
3. 운영팀이 알람으로 인지 (CloudWatch Alarm threshold ≥ 1)
4. 원래 작업 자체는 진행 (HTTP 200 응답) — 가용성 우선

이유: 감사 로그 무결성은 별도 alert 채널로 보장. 사용자 작업 차단보다 빠른 운영 인지가 가치 큼.

---

## BR-11. API 상태 분류 규칙

ApiStatusRecorder가 호출 결과를 다음 분류:

| Status | 조건 |
|--------|------|
| `success` | HTTP 2xx 응답, 응답시간 < 2000ms |
| `delayed` | HTTP 2xx 응답, 응답시간 ≥ 2000ms |
| `failed` | HTTP 5xx, 네트워크 timeout, DNS 실패 |
| `quota_exceeded` | HTTP 429, 또는 200 + 응답 본문에 "할당량" 또는 "rate" 포함 |

집계:
- `getStatus(apiName)`: 최근 60분 중 **마지막 호출의 status** 반환
- `computePercentiles(apiName, windowMin)`: 시간 윈도우 내 success+delayed의 response_time_ms로 p50/p95/p99 계산

---

## BR-12. ApiStatusInfo 통계 윈도우

API별 `getStatus()` 시 최근 60분 데이터 사용:
- `lastResponseTime`: 가장 최근 호출의 응답 시간
- `lastError`: 60분 내 마지막 실패 호출의 error_message
- `lastErrorAt`: 위 호출의 recorded_at
- `lastSuccessAt`: 60분 내 마지막 success/delayed 호출의 recorded_at
- `status`: 가장 최근 호출의 status

---

## Property-Based Testing Properties (PBT 강제)

본 unit이 책임지는 PBT property:

| ID | Property | 검증 대상 |
|----|----------|-----------|
| PBT-U2-1 | 캐시 만료 일관성 (BR-5의 P1~P3) | `isExpired` |
| PBT-U2-2 | 가중치 invariant (sum=1.0±0.001, ≥0, 6 카테고리 포함) | WeightAdminService 검증 (U-5에서 사용, 본 unit은 헬퍼 제공) |
| PBT-U2-3 | 비밀번호 정책 결정성 (동일 입력 → 동일 결과) | `validatePasswordPolicy` |

PBT 라이브러리: `fast-check`. 테스트 코드는 Code Generation 단계에서 작성.
