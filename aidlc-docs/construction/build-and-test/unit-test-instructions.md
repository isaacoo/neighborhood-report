# Unit Test Instructions

## Test Framework

- **Vitest** 1.6+ (Vite 기반 테스트 러너)
- **fast-check** (Property-Based Testing)

## Execution

```bash
# Shared 패키지 (타입 가드, 상수 검증)
npx vitest --run --root packages/shared

# Backend (Property-Based Tests)
npx vitest --run --root packages/backend
```

## Test Coverage

### Shared (20 tests)
| Suite | Tests | Description |
|-------|-------|-------------|
| Type guards | 12 | isFacilityCategory, isAirQualityGrade, isAdminRole, isTradeType, isPricePeriod, isKoreanCoordinate |
| Constants | 8 | FACILITY_CATEGORIES, AREA_RANGES, AIR_QUALITY_GRADE_THRESHOLDS, SCORE_CATEGORIES, 정책 상수, CACHE_TTL |

### Backend PBT (11 tests)
| Suite | Tests | Property |
|-------|-------|----------|
| Haversine distance | 3 | 비음수, 대칭성, 자기 자신=0 |
| formatPrice | 3 | 1억 이상 "억" 포함, 1억 미만 "만원" 끝, deterministic |
| MemoryCacheManager.isExpired | 2 | cachedAt 시점 미만료, cachedAt+ttl+1 만료 |
| ScoreEngine | 2 | 0≤totalScore≤100, 데이터 없을 때 unavailable |
| AirKoreaClient grade | 1 | 지수 증가 → 등급 단조 증가 |

## Expected Results

```
 Test Files  2 passed (2)
      Tests  31 passed (31)
```

## Post-MVP 추가 예정 테스트
- Integration tests (외부 API mock)
- E2E tests (Playwright)
- Security tests (npm audit, dependency scan)
