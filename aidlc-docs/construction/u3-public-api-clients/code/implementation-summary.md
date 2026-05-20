# Code Implementation Summary — U-3 public-api-clients

## Overview
5개 외부 공공 API와의 통신을 담당하는 클라이언트 레이어. 공통 BaseHttpClient를 상속하여 재시도/타임아웃/응답시간 측정/에러 정규화를 표준화.

## Architecture

```
BaseHttpClient (abstract)
├── RegionCodeClient      → 행정안전부 법정동코드 API
├── MolitTradeClient      → 국토교통부 아파트 매매 실거래가 API
├── AirKoreaClient        → 한국환경공단 에어코리아 대기오염 API
├── HiraHospitalClient    → 건강보험심사평가원 병원/약국 정보 API
└── (KmaForecastClient)   → 기상청 단기예보 API (Post-MVP)
```

## Implemented Files

| File | API | Endpoint | Response Format |
|------|-----|----------|-----------------|
| `clients/BaseHttpClient.ts` | (공통) | — | — |
| `clients/RegionCodeClient.ts` | 행정안전부 | `/getStanReginCdList` | JSON |
| `clients/MolitTradeClient.ts` | 국토교통부 | `/getRTMSDataSvcAptTrade` | JSON (자동 감지, XML fallback) |
| `clients/AirKoreaClient.ts` | 한국환경공단 | `/getCtprvnRltmMesureDnsty` | JSON |
| `clients/HiraHospitalClient.ts` | 건강보험심사평가원 | `/getHospBasisList`, `/getParmBasisList` | JSON (자동 감지, XML fallback) |

## BaseHttpClient 공통 기능

| Feature | Implementation |
|---------|----------------|
| Timeout | 5,000ms (`HTTP_CLIENT_POLICY.timeoutMs`) |
| Retry | 3회, exponential backoff (100ms, 500ms, 2000ms) |
| Response time logging | `[apiName] OK/FAIL status elapsed` |
| Error normalization | `HttpClientError(apiName, httpStatus, message)` |
| Response type | JSON 우선, text fallback (XML 자동 감지) |
| Validate status | 200~299만 성공 |

## API별 특이사항

### RegionCodeClient
- 검색어(`locatadd_nm`) 기반 법정동 목록 조회
- 응답 구조: `{StanReginCd: [{head}, {row: [...]}]}`
- 시군구 대표 좌표를 `sggCoordinates.ts` 매핑 테이블에서 부착

### MolitTradeClient
- 공공데이터포털이 Accept 헤더에 따라 JSON 또는 XML 반환
- `responseType: 'text'`로 받아서 JSON/XML 자동 감지 파싱
- 다중 월 병렬 조회 (`fetchRange`) — `Promise.allSettled`로 부분 실패 허용
- 1개월 lag 적용 (공공 데이터 반영 지연 고려)

### AirKoreaClient
- 시도 단위 전체 측정소 조회 후 시군구명 매칭
- 매칭 로직: 측정소명에 시군구명(구/시/군 제거) 포함 여부
- Fallback: 첫 번째 측정소
- KHAI → 등급 변환 (단조성 보장, PBT 검증)

### HiraHospitalClient
- 행안부 sggCode와 HIRA sgguCd는 별도 코드 체계
- `sggCoordinates.ts`의 검증된 매핑 테이블 사용
- 병원(`getHospBasisList`) + 약국(`getParmBasisList`) 두 엔드포인트
- JSON/XML 자동 감지 파싱 (MolitTradeClient와 동일 패턴)

## External API Specifications

| API | Base URL | Auth | Rate Limit |
|-----|----------|------|------------|
| 법정동코드 | `apis.data.go.kr/1741000/StanReginCd` | serviceKey (query) | 일 1,000회 |
| 매매 실거래가 | `apis.data.go.kr/1613000/RTMSDataSvcAptTrade` | serviceKey (query) | 일 1,000회 |
| 에어코리아 | `apis.data.go.kr/B552584/ArpltnInforInqireSvc` | serviceKey (query) | 일 500회 |
| 병원정보 | `apis.data.go.kr/B551182/hospInfoServicev2` | serviceKey (query) | 일 1,000회 |
| 기상청 단기예보 | `apis.data.go.kr/1360000/VilageFcstInfoService_2.0` | serviceKey (query) | 일 10,000회 |

## Caching Integration

모든 클라이언트는 직접 캐시를 관리하지 않음. 호출하는 Service/Analyzer가 `MemoryCacheManager.getOrFetch()`를 통해 캐시 레이어를 적용.

| API | Cache TTL |
|-----|-----------|
| 법정동코드 | 30일 |
| 매매 실거래가 | 24시간 |
| 에어코리아 | 1시간 |
| 병원/약국 정보 | 7일 |

## Error Handling

```
BaseHttpClient.get()
  → 성공: T 반환
  → 실패 (3회 재시도 후): throw HttpClientError
    → 호출자(Service/Analyzer): catch → stale fallback 또는 "데이터 부족" 처리
    → 최종 route handler: errorHandler middleware → 502 EXTERNAL_API_ERROR
```

## Testing

- BaseHttpClient 자체는 abstract class라 직접 테스트 불가
- 각 specific client는 실제 공공 API 호출로 통합 검증 (demo-output.txt 참조)
- AirKoreaClient.classifyGrade: PBT 검증 (등급 단조성)
- Post-MVP: nock/msw 기반 mock 테스트 추가 예정
