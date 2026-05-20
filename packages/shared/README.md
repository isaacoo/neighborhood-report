# @neighborhood-report/shared

이사 갈 동네 리포트 서비스의 공통 TypeScript 타입과 상수를 제공하는 패키지입니다.
모든 다른 unit (backend, frontend)이 본 패키지를 의존합니다.

## 사용 예시

```typescript
import {
  Candidate,
  PriceSummary,
  AirQualityGrade,
  CACHE_TTL,
  FACILITY_CATEGORIES,
  isFacilityCategory,
  MAX_CANDIDATES,
} from '@neighborhood-report/shared';
```

## 모듈 구성

### Domain types
- `types/candidate` — 후보지
- `types/region` — 지역 검색 결과
- `types/price` — 실거래가
- `types/infra` — 생활 인프라
- `types/environment` — 대기질·기상
- `types/safety` — 안전 인프라
- `types/score` — 점수·리포트

### Infrastructure types
- `types/cache` — 캐시 엔트리·TTL
- `types/weight` — 점수 가중치
- `types/admin` — 운영자 계정·인증
- `types/audit` — 감사 로그
- `types/api` — 공통 응답 wrapper, API 상태

### Constants & Guards
- `constants` — 시스템 전역 상수 (TTL, 정책, 임계값)
- `guards` — 런타임 type guard 함수

## 빌드

```bash
npm run build --workspace=packages/shared
```

본 패키지는 런타임 의존성이 없으며, TypeScript 컴파일 결과(declaration + minimal runtime constants/guards)만 다른 패키지에 노출됩니다.
