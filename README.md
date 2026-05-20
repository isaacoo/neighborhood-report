# 이사 갈 동네 리포트

공공 API를 활용해 이사 후보 동네를 객관적으로 비교할 수 있는 웹 서비스입니다.

## 현재 상태 (MVP)

✅ **동작하는 기능**
- 지역 검색 (행정안전부 법정동코드 API)
- 후보지 등록·삭제·별칭 수정 (브라우저 LocalStorage, 최대 5개)
- 후보지 카드에 OpenStreetMap 지도 타일 미리보기
- 실거래가 분석 매매 (국토교통부 아파트 매매 실거래가 API) — 면적대별 최저/중앙/최고가
- 대기질 분석 (한국환경공단 에어코리아 API) — KHAI/PM10/PM2.5/오존, 시군구별 측정소 매칭
- 생활 인프라 분석 (건강보험심사평가원 병원정보 API) — 500m/1km/2km 반경별 의료시설
- 교통 분석 (서울 지하철역 정적 좌표 데이터) — 가장 가까운 역, 반경별 역 수
- 안전 인프라 분석 (건강보험심사평가원 병원정보 API 기반 응급의료 proxy) — 가장 가까운 의료시설
- 종합 점수 (5개 카테고리 가중 평균) + 강점/주의점 자동 요약
- 후보지 비교 (정렬·강점/약점 자동 식별·비교 테이블)
- 레이더 차트 시각화
- Apple/Linear 스타일 프리미엄 UI (사이드바, 카드, 반응형)
- Property-based test 11/11 (Haversine, 가격 포맷, 캐시 만료, 점수 범위, 등급 단조성)

⏸️ **Post-MVP로 연기된 항목**
- Admin Panel (인증·가중치 관리·캐시 관리·API 상태)
- 기상 예보 분석 (기상청 단기예보 API)
- 약국·학교·공원·공공기관·대중교통 인프라 (현재 병원만)
- PostgreSQL + Redis (현재 in-memory 캐시)
- AWS ECS Fargate + RDS + ElastiCache 배포
- E2E 테스트 (Playwright)
- CI/CD (GitHub Actions)

## 아키텍처

```
neighborhood-report/
├── packages/
│   ├── shared/        # 공통 TypeScript 타입 + 상수 + type guards
│   ├── backend/       # Node.js + Express + TypeScript
│   └── frontend/      # React + Vite + TypeScript SPA
├── aidlc-docs/        # AI-DLC 워크플로우 산출물
└── requirements/      # 사용자 입력 자료
```

기술 스택:
- Backend: Node.js 20+, Express 4, TypeScript 5, axios, in-memory 캐시
- Frontend: React 18, React Router DOM 6, Vite 5, TypeScript 5
- Test: Vitest + fast-check (PBT)
- 외부 API: 공공데이터포털 5종 + OpenStreetMap 타일

## 빌드/실행

### 사전 준비

1. Node.js 20 이상
2. `.env` 파일 (루트에 위치)

```env
DATA_GO_KR_API_KEY=your_key
MOLIT_APT_TRADE_URL=https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade
MOLIT_APT_RENT_URL=https://apis.data.go.kr/1613000/RTMSDataSvcAptRent
AIRKOREA_URL=https://apis.data.go.kr/B552584/ArpltnInforInqireSvc
KMA_SHORT_FORECAST_URL=https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0
HIRA_HOSPITAL_URL=https://apis.data.go.kr/B551182/hospInfoServicev2
MOIS_REGION_CODE_URL=https://apis.data.go.kr/1741000/StanReginCd
PORT=4000
NODE_ENV=development
```

### 의존성 설치 + 실행

```bash
npm install

# Backend (포트 4000)
npm run dev:backend

# Frontend (포트 3000, 별도 터미널)
npm run dev:frontend
```

브라우저에서 http://localhost:3000 접속.

### 테스트

```bash
# Shared 타입/상수/가드 테스트 (20개)
npx vitest --run --root packages/shared

# Backend PBT (11개)
npx vitest --run --root packages/backend
```

## 사용자 흐름

1. **검색**: "강남구" 또는 "공덕동" 입력 → 법정동 목록 반환
2. **등록**: "후보지 등록" 클릭 → 별칭 입력 → LocalStorage 저장 (지도 미리보기 표시)
3. **리포트**: 후보지 클릭 → 5개 카테고리 점수 + 레이더 차트 + 실거래가/대기질/교통/안전 상세
4. **비교**: 2개 이상 등록 후 비교 화면 → 테이블 + 강점/약점 인사이트

## 점수 산정 방식 (v1.2.0-mvp)

| 카테고리 | 가중치 | 산정 기준 |
|----------|--------|-----------|
| 주거비 | 25% | 대표 면적대 중앙값 (5억=100점, 30억=0점 선형) |
| 생활 인프라 | 20% | 500m/1km/2km 반경 의료시설 수 (가중 합산) |
| 교통 | 20% | 가장 가까운 지하철역 거리 + 1km 내 역 수 |
| 환경 | 15% | KHAI 지수 (0=100점, 250=0점 선형) |
| 안전 | 20% | 가장 가까운 의료시설 거리 + 2km 내 시설 수 |

- `reliability`(데이터 신뢰도)는 메타 정보로 표시되며 종합 점수에 합산되지 않음
- 데이터 부족 카테고리는 점수 산정에서 제외 (가용 데이터로 정규화)
- 임의의 낮은 점수를 부여하지 않음

## REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/search?q={query}` | 지역 검색 |
| GET | `/api/report/:regionCode` | 종합 리포트 |
| POST | `/api/compare` | 후보지 비교 |

## AI-DLC 워크플로우 산출물

`aidlc-docs/` 디렉토리에 정식 AI-DLC 단계별 산출물이 있습니다:

- `inception/requirements/` — 14개 FR + 9개 NFR 영역
- `inception/user-stories/` — 39개 User Story + 6개 Persona
- `inception/application-design/` — 27 backend + 25 frontend 컴포넌트, 12 서비스, 7 Unit
- `inception/plans/` — 실행 계획, 스토리 계획, 디자인 계획, Unit 계획
- `construction/` — U-1 shared-types 코드 요약, U-2 functional design 명세
- `audit.md` — 모든 사용자 입력·결정 감사 로그
