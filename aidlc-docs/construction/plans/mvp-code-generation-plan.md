# MVP Code Generation Plan (통합)

## 배경
시간 압박으로 인해 단위별 design stage(NFR Requirements/NFR Design/Infrastructure Design) 생략. 핵심 사용자 흐름 동작 우선.

## MVP Scope

### 포함 (Functional Core)
- US-001, US-002: 지역 검색 (이미 구현됨, 검증)
- US-003 ~ US-008: 후보지 등록·관리 (LocalStorage)
- US-009: 실거래가 요약 (매매)
- US-013: 인프라 분석 (병원·약국)
- US-016: 대기질
- US-021 ~ US-023: 종합 점수 + 리포트
- US-025 ~ US-027: 비교

### 연기
- Admin Panel 모두 (US-029~US-039)
- PBT 풀세트 (핵심 함수만 ~5 properties)
- DB/Redis/Docker (in-memory map 사용)
- AWS 배포

## Plan Steps

- [ ] 1. 외부 API 클라이언트 4종 작성 (RegionCode 검증, MolitTrade, AirKorea, HiraHospital)
- [ ] 2. 메모리 캐시 (Map + TTL)
- [ ] 3. Domain components: PriceAnalyzer, InfraAnalyzer, EnvironmentAnalyzer, ScoreEngine, ReportComposer, ComparisonEngine
- [ ] 4. Util: Haversine 거리, 가격 포맷, 면적대 분류
- [ ] 5. Backend routes: search/analysis/report/compare (검색 외 신규)
- [ ] 6. Backend 통합: composition root, server.ts
- [ ] 7. Frontend: ApiClient, LocalStorage 후보지, Context
- [ ] 8. Frontend pages: SearchPage, CandidateListPage, ReportPage, ComparisonPage
- [ ] 9. PBT 핵심 (Haversine, 가격 포맷, 점수 범위, 캐시 만료)
- [ ] 10. 통합 검증 (Backend 기동, Frontend 기동, end-to-end search → report)
- [ ] 11. README MVP 문서
