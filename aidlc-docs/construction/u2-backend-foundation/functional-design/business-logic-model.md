# Business Logic Model — U-2 backend-foundation

본 문서는 U-2가 제공하는 핵심 비즈니스 흐름을 algorithmic하게 명세합니다.

---

## BLM-1. AuthService.login(email, password)

**입력**: email (string), password (string)
**출력**: AuthToken | throws

```
1. lockUntil = Redis.GET("auth:login-lock:" + email)
2. if lockUntil && lockUntil > now:
       throw UnauthorizedError("LOCKED", "잠시 후 다시 시도해주세요")
3. user = AdminUserRepository.findByEmail(email)
4. if !user:
       AuditLogger.log({action:'admin.login', target:email, result:'failure', details:{reason:'unknown_email'}})
       throw UnauthorizedError("INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다")
5. ok = bcrypt.compare(password, user.passwordHash)
6. if !ok:
       failCount = Redis.INCR("auth:login-fail:" + email)
       Redis.EXPIRE("auth:login-fail:" + email, 15min)
       if failCount >= 5:
           Redis.SET("auth:login-lock:" + email, now + 15min, EX=15min)
           AuditLogger.log({action:'admin.login_locked', target:email, result:'success', details:{ip}})
       AuditLogger.log({action:'admin.login', target:email, result:'failure', details:{ip, failCount}})
       throw UnauthorizedError("INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다")
7. Redis.DEL("auth:login-fail:" + email)
8. Redis.DEL("auth:login-lock:" + email)
9. AdminUserRepository.recordLogin(user.id) // last_login_at = NOW()
10. token = jwt.sign({sub:user.id, email, role:user.role}, JWT_SECRET, {expiresIn:'1h', issuer:'neighborhood-report', algorithm:'HS256'})
11. AuditLogger.log({action:'admin.login', target:email, result:'success', details:{ip}})
12. return {accessToken: token, expiresIn: 3600, tokenType: 'Bearer'}
```

**보안 주의사항**:
- 잠금 응답 사유 외부 노출 금지 (timing attack + enumeration 방어)
- 실패 메시지는 "이메일 또는 비밀번호" 두 가지 모두 가능성 표현 (enumeration 방어)
- IP 주소는 Express `req.ip` (trust proxy 설정 시 X-Forwarded-For 활용)

---

## BLM-2. AuthService.changePassword(userId, current, next)

**입력**: userId, currentPassword, newPassword
**출력**: void | throws

```
1. user = AdminUserRepository.findById(userId)  // 인증 미들웨어가 보장
2. ok = bcrypt.compare(currentPassword, user.passwordHash)
3. if !ok:
       AuditLogger.log({action:'admin.password_change', target:userId, result:'failure', details:{reason:'wrong_current_password'}})
       throw ValidationError("WRONG_CURRENT_PASSWORD", "현재 비밀번호가 일치하지 않습니다")
4. policyCheck = validatePasswordPolicy(next)
5. if !policyCheck.valid:
       AuditLogger.log({action:'admin.password_change', target:userId, result:'failure', details:{reasons:policyCheck.reasons}})
       throw ValidationError("WEAK_PASSWORD", policyCheck.reasons.join(", "))
6. if next === current:
       throw ValidationError("SAME_PASSWORD", "새 비밀번호는 현재 비밀번호와 달라야 합니다")
7. newHash = bcrypt.hash(next, 12)
8. AdminUserRepository.updatePassword(userId, newHash)
9. AuditLogger.log({action:'admin.password_change', target:userId, result:'success'})
10. // JWT 무효화는 클라이언트가 재로그인 (refresh token 미사용)
```

---

## BLM-3. AuthService.validatePasswordPolicy(password)

**Pure function. Deterministic. PBT 검증 대상 (PBT-U2-3).**

```
function validatePasswordPolicy(password):
    reasons = []
    if password.length < 12:
        reasons.push("최소 12자 이상")
    if !/[A-Z]/.test(password):
        reasons.push("대문자 1개 이상 포함")
    if !/[a-z]/.test(password):
        reasons.push("소문자 1개 이상 포함")
    if !/[0-9]/.test(password):
        reasons.push("숫자 1개 이상 포함")
    if !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password):
        reasons.push("특수문자 1개 이상 포함")
    return { valid: reasons.length === 0, reasons }
```

**Property** (PBT):
- (P1) 동일 입력 → 동일 결과 (deterministic)
- (P2) password.length < 12 → reasons에 "최소 12자" 포함
- (P3) `password = "Aa1!" + "x".repeat(8)` (12자, 모든 조건 충족) → valid=true

---

## BLM-4. CacheManager.getOrFetch(key, ttlMs, fetcher)

**입력**: key (CacheKey), ttlMs, fetcher (() => Promise<T>)
**출력**: { data: T, isStale: boolean, cachedAt: string }

```
1. redisKey = buildKey(key)  // BR-4
2. raw = Redis.GET(redisKey)
3. if raw:
       parsed = JSON.parse(raw)  // {data, cachedAt}
       expiresAt = parsed.cachedAt + ttlMs (ms)
       if now <= expiresAt:
           return {data: parsed.data, isStale: false, cachedAt: parsed.cachedAt}
       // expired but exists; keep as fallback candidate
       expiredFallback = parsed
4. try:
       data = await fetcher()
       cachedAt = ISO8601(now)
       expiresAt = ISO8601(now + ttlMs)
       Redis.SET(redisKey, JSON.stringify({data, cachedAt}), EX=Math.floor(ttlMs/1000))
       CacheMetadataRepository.save({apiName, regionCode, paramsHash, request_params, cached_at: cachedAt, expires_at: expiresAt, is_stale: false})
       return {data, isStale: false, cachedAt}
5. catch (err):
       if expiredFallback:
           CacheMetadataRepository.markStale(key)
           log.warn("stale fallback used", {apiName, regionCode, error: err.message})
           return {data: expiredFallback.data, isStale: true, cachedAt: expiredFallback.cachedAt}
       throw new ExternalApiError(apiName, err)
```

**Note**: TTL이 1시간 미만인 경우에도 expiredFallback 시도 가능 (만료 후 Redis는 자동 EVICT하지만, 데이터 없음 시 throw).

---

## BLM-5. CacheManager.invalidateByRegion(regionCode)

```
1. entries = CacheMetadataRepository.findByRegionCode(regionCode)
2. invalidatedCount = 0
3. for entry in entries:
       redisKey = buildKey({apiName: entry.api_name, regionCode: entry.region_code, paramsHash: entry.params_hash})
       Redis.DEL(redisKey)
       invalidatedCount += 1
4. CacheMetadataRepository.deleteByRegionCode(regionCode)
5. return invalidatedCount
```

---

## BLM-6. CacheManager.isExpired(cachedAt, ttlMs, now)

**Pure function. PBT 검증 대상 (PBT-U2-1).**

```
function isExpired(cachedAt: string, ttlMs: number, now: Date = new Date()): boolean {
    const cachedTime = new Date(cachedAt).getTime();
    const expiresAt = cachedTime + ttlMs;
    return now.getTime() > expiresAt;
}
```

**Property**:
- (P1) `isExpired(t, ttl, t)` === false (즉시 만료 안 됨)
- (P2) `isExpired(t, ttl, t + ttl)` === false (정확히 경계 시점은 만료 아님)
- (P3) `isExpired(t, ttl, t + ttl + 1)` === true (1ms 초과 시 만료)
- (P4) `cachedAt + ttlMs == expiresAt` 일관성

---

## BLM-7. RateLimiter middleware (token bucket via express-rate-limit)

```
function createRateLimitMiddleware(policy) {
    const config = {
        search: {windowMs: 60_000, max: 60},
        report: {windowMs: 60_000, max: 10},
        admin:  {windowMs: 60_000, max: 100},
    }[policy]

    return rateLimit({
        windowMs: config.windowMs,
        max: config.max,
        store: new RedisStore({client: redis, prefix: `rl:${policy}:`}),
        keyGenerator: (req) => req.ip,
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                error: { code: 'RATE_LIMIT_EXCEEDED', message: '요청 빈도를 초과했습니다. 잠시 후 다시 시도해주세요.' }
            })
        },
        skip: () => isRedisDown(),  // fail-open
        standardHeaders: true,
        legacyHeaders: false,
    })
}
```

`isRedisDown()`: Redis ping 결과 캐시 (5초 캐시, 장애 시 fail-open).

---

## BLM-8. ApiStatusRecorder.record(record)

```
1. ApiStatusLogRepository.log({
       api_name: record.apiName,
       status: record.status,
       response_time_ms: record.responseTimeMs,
       http_status: record.httpStatus,
       error_message: record.errorMessage,
       recorded_at: ISO8601(now)
   })
2. CloudWatch.putMetricData({
       Namespace: 'NeighborhoodReport/ExternalApi',
       MetricData: [
           { MetricName: 'CallCount', Dimensions: [{Name:'ApiName', Value:apiName}, {Name:'Status', Value:status}], Value: 1 },
           ...(responseTimeMs !== null ? [{ MetricName: 'ResponseTime', Dimensions: [{Name:'ApiName', Value:apiName}], Value: responseTimeMs, Unit: 'Milliseconds' }] : [])
       ]
   })  // best-effort, 실패 무시
```

DB 실패와 CloudWatch 실패 모두 로깅하되, 호출자에게 throw하지 않음 (BR-9의 fire-and-forget 원칙).

---

## BLM-9. ApiStatusRecorder.computePercentiles(apiName, windowMin)

```
1. records = ApiStatusLogRepository.findRecentByApi(apiName, windowMin*60 records)
   // 또는 SELECT * FROM api_status_logs WHERE api_name=? AND recorded_at > NOW() - INTERVAL '{windowMin} minutes' AND status IN ('success','delayed') AND response_time_ms IS NOT NULL
2. times = records.map(r => r.response_time_ms).sort((a,b) => a-b)
3. p50 = percentile(times, 0.5)
4. p95 = percentile(times, 0.95)
5. p99 = percentile(times, 0.99)
6. return {p50, p95, p99, windowMinutes: windowMin}
```

기본 windowMin=60. 데이터 부족 (records.length < 5) 시 모든 percentile = null.

---

## BLM-10. AuditLogger.log(entry)

```
1. fullEntry = {
       admin_id: entry.adminId,
       admin_email: entry.adminEmail,
       action: entry.action,
       target: entry.target,
       details: entry.details,
       result: entry.result,
       ip_address: entry.ipAddress ?? null,
       timestamp: ISO8601(now)
   }
2. dbResult = await AuditLogRepository.log(fullEntry).catch(err => err)
3. if dbResult instanceof Error:
       console.error('[CRITICAL] audit_logs DB INSERT failed', dbResult)
       CloudWatch.putMetricData({MetricName: 'AuditLogDbFailureCount', Value: 1})
4. cwResult = await CloudWatch.putLogEvents({
       logGroupName: '/neighborhood-report/audit',
       logStreamName: today_iso_date,
       logEvents: [{message: JSON.stringify(fullEntry), timestamp: now}]
   }).catch(err => err)
5. if cwResult instanceof Error:
       console.error('CloudWatch audit failed', cwResult)
6. // 본 함수는 throw 하지 않음
```

---

## Algorithmic Helpers

### Percentile calculation (interpolated)
```
function percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return null
    const rank = p * (sorted.length - 1)
    const lower = Math.floor(rank)
    const upper = Math.ceil(rank)
    if (lower === upper) return sorted[lower]
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (rank - lower)
}
```

### params hash
```
function buildParamsHash(params: Record<string, string>): string {
    const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&')
    return crypto.createHash('sha256').update(sorted).digest('hex').substring(0, 16)
}
```
