# Shared Infrastructure

## Overview
여러 unit이 공유하는 인프라 컴포넌트와 데이터 매핑.

## 1. In-Memory Cache Manager (U-2)

**Location**: `packages/backend/src/cache/MemoryCacheManager.ts`

**Pattern**: Read-through + Stale Fallback

```
getOrFetch(key, ttlMs, fetcher):
  1. 캐시 hit + 미만료 → 즉시 반환
  2. 캐시 miss → fetcher() 호출 → 캐시 저장 → 반환
  3. fetcher 실패 + 만료된 캐시 존재 → stale 반환 (isStale=true)
  4. fetcher 실패 + 캐시 없음 → throw
```

**TTL 정책**: `@neighborhood-report/shared/constants.ts`의 `CACHE_TTL`

## 2. 시군구 좌표 + HIRA 코드 매핑 (U-4)

**Location**: `packages/backend/src/domain/sggCoordinates.ts`

**Purpose**: 행안부 sggCode → 시군구 대표 좌표 + HIRA sgguCd 변환

**Coverage**: 서울 25개 자치구 (실제 API 호출로 검증된 매핑)

**사용처**:
- InfraAnalyzer: 후보지 좌표 fallback + HIRA API 호출
- SafetyAnalyzer: 동일
- EnvironmentAnalyzer: sidoName 추출
- RegionCodeClient: 검색 결과에 좌표 부착
- Report/Compare routes: 좌표 fallback

## 3. BaseHttpClient (U-3)

**Location**: `packages/backend/src/clients/BaseHttpClient.ts`

**Features**:
- 5초 timeout
- 3회 재시도 (exponential backoff: 100ms, 500ms, 2000ms)
- 응답 시간 측정 + 로깅
- 에러 정규화 (HttpClientError)
- JSON/text 응답 자동 감지

**사용처**: 모든 외부 공공 API 클라이언트 (5종)

## 4. 서울 지하철역 정적 데이터 (U-4)

**Location**: `packages/backend/src/domain/subwayStations.ts`

**Coverage**: 서울 주요 55개역 (환승역 포함, 1~9호선 + 신분당/경의중앙/공항철도/분당/수인분당)

**사용처**: TransitAnalyzer (교통 점수 산정)

## 5. Shared Types (U-1)

**Location**: `packages/shared/src/`

**Exports**:
- Domain types (25+): Candidate, Price, Infra, Environment, Safety, Score, Report
- Infrastructure types (12+): Cache, Weight, Admin, Audit, API
- Constants (16): TTL, 정책, 임계값, API names
- Type guards (6): runtime validation

**사용처**: Backend + Frontend 양쪽에서 import (wire format 단일 출처)
