# Functional Design Plan — U-2 backend-foundation

## Unit Context
- **Unit**: U-2 backend-foundation
- **Components**: C-17 CacheManager, C-18 AuthService, C-19 RateLimiter, C-20 AuditLogger, C-21 ApiStatusRecorder, C-22 ~ C-27 Repositories
- **Stories Implemented**:
  - US-037 (Initial Superadmin seed) — direct
  - 16+ indirect stories (모든 admin 인증, 캐시 사용, 감사 로그 사용 story)

## Methodology
Pure 비즈니스 규칙·알고리즘 명세. 인프라(AWS, Redis 구체 client API)는 NFR Design / Infrastructure Design에서 다룸.

---

## Plan Steps

### Phase 1: Domain Entities (PostgreSQL 스키마 명세)
- [ ] 1.1 admin_users 엔티티 정의 (필드, 제약, 인덱스)
- [ ] 1.2 weight_configs / weight_presets 엔티티
- [ ] 1.3 cache_metadata 엔티티
- [ ] 1.4 api_status_logs 엔티티
- [ ] 1.5 audit_logs 엔티티
- [ ] 1.6 산출물: `aidlc-docs/construction/u2-backend-foundation/functional-design/domain-entities.md`

### Phase 2: Business Rules
- [ ] 2.1 비밀번호 정책 명세 (12자, 대소문자/숫자/특수문자, bcrypt cost=12)
- [ ] 2.2 로그인 잠금 정책 (5회 실패 → 15분 잠금, Redis 카운터)
- [ ] 2.3 JWT 발급/검증 (HS256, 만료 1시간, refresh token 미사용)
- [ ] 2.4 캐시 키 생성 규칙 (apiName + regionCode + paramsHash)
- [ ] 2.5 캐시 만료 판정 규칙 (cachedAt + ttlMs vs now)
- [ ] 2.6 stale fallback 판정 규칙 (외부 API 실패 시 stale 사용 가능 시점)
- [ ] 2.7 Rate Limit 정책 (search 60/min, report 10/min, admin 100/min)
- [ ] 2.8 감사 로그 작성 규칙 (모든 admin 변경 작업, action 명명 규칙)
- [ ] 2.9 API 상태 분류 규칙 (정상/지연/실패/할당량 초과 임계값)
- [ ] 2.10 산출물: `aidlc-docs/construction/u2-backend-foundation/functional-design/business-rules.md`

### Phase 3: Business Logic Model
- [ ] 3.1 AuthService.login 흐름 (잠금 검사 → 비밀번호 검증 → JWT 발급 → 감사 로그)
- [ ] 3.2 AuthService.changePassword 흐름
- [ ] 3.3 CacheManager.getOrFetch 흐름 (read-through + stale fallback)
- [ ] 3.4 CacheManager.invalidateByRegion 흐름
- [ ] 3.5 CacheManager.isExpired (PBT 검증 대상)
- [ ] 3.6 RateLimiter.middleware 흐름 (token bucket / sliding window)
- [ ] 3.7 ApiStatusRecorder.record + computePercentiles
- [ ] 3.8 AuditLogger.log (DB + CloudWatch dual-write)
- [ ] 3.9 산출물: `aidlc-docs/construction/u2-backend-foundation/functional-design/business-logic-model.md`

### Phase 4: PBT Properties (NFR-7 충족)
- [ ] 4.1 캐시 만료 판정 일관성 (cachedAt + ttl = expiresAt, 시간 ↑ → 만료)
- [ ] 4.2 가중치 invariant (합=1.0±0.001, 음수 없음, 6 카테고리 모두)
- [ ] 4.3 비밀번호 정책 검증 invariant (정책 미충족 → invalid 결정적)
- [ ] 4.4 산출물: business-rules.md에 PBT property 명시

---

## Embedded Design Decisions

본 unit의 핵심 비즈니스 규칙은 이미 Requirements (FR-9~FR-12, NFR-4) 및 shared/constants.ts에 명시되어 있습니다. 추가 결정 사항을 명확화합니다.

### Question FD-U2-1: JWT 알고리즘
A) HS256 + 단일 secret (JWT_SECRET 환경변수, AWS Secrets Manager) — 권장 (단일 backend 서비스)
B) RS256 + 키 페어 (multi-tenant 또는 외부 검증 필요 시)
X) Other

[Answer]: A

### Question FD-U2-2: 로그인 실패 카운터 저장소
A) Redis (TTL 기반 자동 만료, 분산 환경 대응) — 권장
B) PostgreSQL (영속적, 명시적 unlock 필요)
X) Other

[Answer]: A

### Question FD-U2-3: Rate Limiter 알고리즘
A) Token bucket (burst 허용, 평균 rate 제한) — 권장 (express-rate-limit 표준)
B) Sliding window (정확한 rate 보장)
C) Fixed window (단순)
X) Other

[Answer]: A

### Question FD-U2-4: 캐시 stale fallback 정책
A) 외부 API 실패 시에만 stale 사용, stale 응답에 isStaleCache=true 표시 — 권장
B) 항상 stale 가능 (TTL 의미 약화)
C) Stale 사용 안 함 (실패 시 명시적 에러)
X) Other

[Answer]: A

### Question FD-U2-5: AuditLog dual-write 실패 처리
A) DB 실패 시에도 CloudWatch에는 기록 시도, DB 실패는 critical alert로 분류 — 권장
B) DB 우선, 실패 시 작업 자체 실패 처리
C) CloudWatch 우선, DB는 best-effort
X) Other

[Answer]: A

### Question FD-U2-6: API 상태 분류 임계값
정상/지연/실패/할당량 초과 분류 기준은?
A) 정상: 응답 200 + p95 < 2s, 지연: p95 ≥ 2s, 실패: 5xx 또는 timeout, 할당량 초과: 429 또는 특정 응답 메시지 — 권장
B) 단순 binary: 정상/실패만
X) Other

[Answer]: A
