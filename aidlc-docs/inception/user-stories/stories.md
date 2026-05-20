# User Stories

본 문서는 이사갈 동네 리포트 서비스의 사용자 스토리를 정의합니다.

- **그룹핑**: Feature-Based (FR 카테고리별)
- **AC 형식**: EARS 패턴
- **세분화**: Standard (1~3일 구현 단위)
- **검증**: INVEST 기준 자가 검증 완료

Persona 약어:
- **P-01** 이사 예정자 (공통)
- **P-02** 1인 가구
- **P-03** 가족
- **P-04** 환경 민감
- **P-05** Superadmin
- **P-06** Admin

---

## Feature 1: 지역 검색 (FR-1)

### US-001: 동 이름으로 지역 검색
**As a** 이사 예정자(P-01),
**I want** 동 이름이나 주소로 지역을 검색하고,
**so that** 후보지로 등록할 법정동을 찾을 수 있다.

**Acceptance Criteria**:
1. WHEN 사용자가 검색창에 1자 이상 100자 이하의 검색어를 입력하고 검색 버튼을 클릭하면, THE Search_Engine SHALL 행정안전부 법정동코드 API를 호출하여 매칭되는 법정동 목록을 반환한다.
2. WHEN 검색 결과가 반환되면, THE Web_UI SHALL 각 결과에 법정동 이름, 상위 행정구역, 법정동 코드를 표시한다.
3. WHILE API 호출이 진행 중인 동안, THE Web_UI SHALL 로딩 인디케이터를 표시한다.
4. WHEN API 응답 시간이 1초를 초과하면, THE Web_UI SHALL 진행 상태 메시지("잠시만 기다려주세요...")를 표시한다.

**Personas**: P-01, P-02, P-03, P-04
**Source FR**: FR-1
**Estimate**: 2일

---

### US-002: 검색 결과 없음 처리
**As a** 이사 예정자(P-01),
**I want** 검색 결과가 없을 때 명확한 안내를 받고,
**so that** 어떻게 다시 검색할지 알 수 있다.

**Acceptance Criteria**:
1. WHEN 검색 결과가 0건이면, THE Web_UI SHALL "검색 결과가 없습니다" 메시지와 대체 검색어 안내(예: "상위 행정구역으로 검색해보세요")를 표시한다.
2. IF 검색어가 비어 있거나 100자를 초과하면, THEN THE Web_UI SHALL 입력 가이드("1~100자 이내로 입력해주세요")를 표시하고 API 호출을 차단한다.
3. IF 검색 API 호출이 실패하면, THEN THE Web_UI SHALL 일시적 오류 메시지와 재시도 버튼을 표시한다.

**Personas**: P-01, P-02, P-03, P-04
**Source FR**: FR-1
**Estimate**: 1일

---

## Feature 2: 후보지 등록 및 관리 (FR-2)

### US-003: 검색 결과를 후보지로 등록
**As a** 이사 예정자(P-01),
**I want** 검색 결과에서 마음에 드는 지역을 후보지로 등록하고,
**so that** 나중에 비교·분석할 수 있다.

**Acceptance Criteria**:
1. WHEN 사용자가 검색 결과 항목의 "후보지 등록" 버튼을 클릭하면, THE Candidate_Manager SHALL 법정동 코드, 후보지명, 상위 행정구역명, 중심 좌표, 등록 시각을 LocalStorage에 저장한다.
2. WHEN 등록이 성공하면, THE Web_UI SHALL "후보지로 등록되었습니다" 토스트 메시지와 "후보지 목록 보기" 링크를 표시한다.
3. THE Candidate_Manager SHALL 등록 시 UUID를 발급하여 후보지 식별자로 사용한다.

**Personas**: P-01, P-02, P-03, P-04
**Source FR**: FR-2
**Estimate**: 1일

---

### US-004: 후보지 별칭 입력
**As a** 이사 예정자(P-01),
**I want** 후보지에 "회사 근처", "부모님 집 근처" 같은 별칭을 입력하고,
**so that** 여러 후보지를 의미별로 구분할 수 있다.

**Acceptance Criteria**:
1. WHEN 사용자가 후보지 등록 시 별칭 입력란에 1~30자의 텍스트를 입력하면, THE Candidate_Manager SHALL 해당 별칭을 후보지 정보에 저장한다.
2. WHEN 사용자가 등록된 후보지의 별칭을 수정하면, THE Candidate_Manager SHALL 수정된 별칭을 LocalStorage에 갱신 저장한다.
3. IF 별칭이 30자를 초과하면, THEN THE Web_UI SHALL 입력을 차단하고 "별칭은 30자 이내로 입력해주세요" 안내를 표시한다.
4. IF 별칭이 비어 있으면, THEN THE Web_UI SHALL 후보지명(법정동 이름)을 기본 별칭으로 사용한다.

**Personas**: P-01, P-02, P-03, P-04
**Source FR**: FR-2
**Estimate**: 1일

---

### US-005: 최대 5개 등록 제한
**As a** 서비스 기획자(시스템 관점),
**I want** 후보지 등록을 최대 5개로 제한하고,
**so that** 사용자가 의사결정에 집중할 수 있고 시스템 부하를 통제할 수 있다.

**Acceptance Criteria**:
1. WHILE 등록된 후보지가 5개인 상태에서, WHEN 사용자가 새 후보지 등록을 시도하면, THE Candidate_Manager SHALL 등록을 거부하고 "최대 5개까지 등록 가능합니다" 메시지와 함께 기존 후보지 삭제 안내를 표시한다.
2. THE Web_UI SHALL 등록된 후보지 수를 항상 화면에 표시한다 (예: "후보지 3/5").

**Personas**: P-01, P-02, P-03, P-04
**Source FR**: FR-2
**Estimate**: 0.5일

---

### US-006: 중복 등록 방지
**As a** 이사 예정자(P-01),
**I want** 동일한 지역을 두 번 등록하지 못하도록 막아주고,
**so that** 비교 결과의 혼란을 막을 수 있다.

**Acceptance Criteria**:
1. WHEN 사용자가 이미 등록된 법정동 코드를 다시 등록하려 하면, THE Candidate_Manager SHALL 등록을 거부하고 "이미 등록된 후보지입니다" 메시지를 표시한다.
2. THE Web_UI SHALL 검색 결과에서 이미 등록된 지역에 "등록됨" 배지를 표시한다.

**Personas**: P-01, P-02, P-03, P-04
**Source FR**: FR-2
**Estimate**: 0.5일

---

### US-007: 후보지 삭제
**As a** 이사 예정자(P-01),
**I want** 더 이상 고려하지 않는 후보지를 삭제하고,
**so that** 비교 화면을 깔끔하게 유지할 수 있다.

**Acceptance Criteria**:
1. WHEN 사용자가 후보지 항목의 "삭제" 버튼을 클릭하면, THE Web_UI SHALL 삭제 확인 다이얼로그를 표시한다.
2. WHEN 사용자가 삭제 확인을 클릭하면, THE Candidate_Manager SHALL LocalStorage에서 해당 후보지와 관련 캐시 데이터를 제거한다.
3. WHEN 후보지가 삭제되면, THE Web_UI SHALL 후보지 목록과 비교 결과를 즉시 갱신한다.

**Personas**: P-01, P-02, P-03, P-04
**Source FR**: FR-2
**Estimate**: 1일

---

### US-008: 후보지 목록 조회
**As a** 이사 예정자(P-01),
**I want** 등록한 후보지 목록을 한 화면에서 보고,
**so that** 어떤 후보지를 분석/비교할지 선택할 수 있다.

**Acceptance Criteria**:
1. WHEN 사용자가 후보지 목록 페이지에 진입하면, THE Web_UI SHALL LocalStorage에서 후보지 데이터를 읽어와 별칭, 법정동 이름, 상위 행정구역, 등록 시각을 카드 형식으로 표시한다.
2. WHEN 후보지 카드를 클릭하면, THE Web_UI SHALL 해당 후보지의 상세 리포트 페이지로 이동한다.
3. THE Web_UI SHALL 후보지 카드에 "별칭 수정", "리포트 보기", "삭제" 액션 버튼을 제공한다.

**Personas**: P-01, P-02, P-03, P-04
**Source FR**: FR-2
**Estimate**: 1일

---

## Feature 3: 주거비 및 실거래가 분석 (FR-3)

### US-009: 실거래가 요약 조회
**As a** 이사 예정자(P-01),
**I want** 후보지의 최근 실거래가 요약(면적대별 최저/중앙/최고가)을 보고,
**so that** 주거비 부담을 가늠할 수 있다.

**Acceptance Criteria**:
1. WHEN 사용자가 후보지 리포트 페이지에서 "실거래가 분석"을 요청하면, THE Price_Analyzer SHALL 국토교통부 매매 API와 전월세 API에서 해당 시군구 코드의 데이터를 조회하여 면적대별(~59㎡, 59~84㎡, 84~135㎡, 135㎡~) 최저가/중앙값/최고가/거래 건수를 계산한다.
2. WHEN 결과가 표시될 때, THE Web_UI SHALL 매매와 전월세를 탭으로 구분하여 표시한다.
3. THE Web_UI SHALL 가격을 1억 이상은 "X억 Y만원", 1억 미만은 "X만원" 형식으로 표시한다.
4. THE Cache_Manager SHALL 실거래가 데이터를 24시간 TTL로 캐시한다.

**Personas**: P-01, P-02 (소형 면적대 우선 관심), P-03 (중대형 면적대 우선 관심)
**Source FR**: FR-3
**Estimate**: 3일

---

### US-010: 조회 기간 선택
**As a** 이사 예정자(P-01),
**I want** 실거래가 조회 기간(3개월/6개월/12개월)을 선택하고,
**so that** 단기 추세와 장기 추세를 모두 볼 수 있다.

**Acceptance Criteria**:
1. WHEN 사용자가 조회 기간 선택 컨트롤에서 3/6/12 중 하나를 선택하면, THE Price_Analyzer SHALL 선택된 기간 내의 데이터로 요약을 재계산한다.
2. WHEN 페이지 최초 로드 시, THE Price_Analyzer SHALL 기본값으로 6개월 데이터를 조회한다.
3. THE Web_UI SHALL 현재 조회 기간과 거래 건수를 가격 요약 옆에 항상 표시한다.

**Personas**: P-01, P-02, P-03
**Source FR**: FR-3
**Estimate**: 1일

---

### US-011: 신뢰도 낮음 표시
**As a** 이사 예정자(P-01),
**I want** 거래 건수가 적은 면적대에 신뢰도 낮음 표시를 보고,
**so that** 데이터의 한계를 이해하고 의사결정할 수 있다.

**Acceptance Criteria**:
1. WHEN 특정 면적대의 거래 건수가 5건 미만이면, THE Price_Analyzer SHALL 해당 면적대 데이터에 `isLowReliability=true` 플래그를 부여한다.
2. WHEN 신뢰도 낮음 플래그가 있는 면적대를 표시할 때, THE Web_UI SHALL 시각적 경고 아이콘과 "거래 N건 (신뢰도 낮음)" 라벨을 표시한다.

**Personas**: P-01, P-02, P-03
**Source FR**: FR-3
**Estimate**: 0.5일

---

### US-012: 거래 상세 목록 조회
**As a** 이사 예정자(P-01),
**I want** 개별 거래 내역(거래 월, 단지명, 면적, 금액, 층, 건축연도)을 보고,
**so that** 요약 통계를 검증하고 구체적인 매물 흐름을 파악할 수 있다.

**Acceptance Criteria**:
1. WHEN 사용자가 면적대별 요약에서 "상세 거래 보기"를 클릭하면, THE Web_UI SHALL 해당 면적대의 모든 거래 항목을 거래 월 내림차순으로 표시한다.
2. THE Web_UI SHALL 각 거래 항목에 거래 월, 건물명/단지명, 전용면적, 거래 금액(포맷팅 적용), 층, 건축연도를 표시한다.
3. THE Web_UI SHALL 페이지당 20개씩 페이지네이션을 적용한다.

**Personas**: P-01, P-02, P-03
**Source FR**: FR-3
**Estimate**: 2일

---

## Feature 4: 생활 인프라 분석 (FR-4)

### US-013: 카테고리별 시설 수 조회
**As a** 이사 예정자(P-01),
**I want** 후보지 주변 반경별(500m/1km/2km) 시설 수를 카테고리(병원/약국/학교/공원/공공기관/교통)별로 보고,
**so that** 생활 편의성을 정량적으로 비교할 수 있다.

**Acceptance Criteria**:
1. WHEN 사용자가 "생활 인프라 분석"을 요청하면, THE Infra_Analyzer SHALL 후보지 중심 좌표(법정동코드 API 좌표) 기준 500m/1km/2km 반경별 카테고리별 시설 수를 계산한다.
2. THE Infra_Analyzer SHALL 건강보험심사평가원 병원정보 API에서 병원·약국 데이터를 조회한다.
3. THE Infra_Analyzer SHALL Haversine 공식으로 좌표 간 거리를 계산하며, 거리는 비음수이고 대칭적이다.
4. WHEN 시설의 좌표 정보가 누락되면, THE Infra_Analyzer SHALL 해당 시설을 거리 계산에서 제외하고 "데이터 누락" 카운트에 기록한다.
5. THE Cache_Manager SHALL 시설 데이터를 7일 TTL로 캐시한다.
6. THE Web_UI SHALL 카테고리별 시설 수를 반경별로 그리드 형식으로 표시한다.

**Personas**: P-01, P-02 (교통·24시 편의 중요), P-03 (학교·병원·공원 중요)
**Source FR**: FR-4
**Estimate**: 4일

---

### US-014: 카테고리별 접근성 점수
**As a** 이사 예정자(P-01),
**I want** 카테고리별 접근성 점수(0~100)와 산정 근거를 보고,
**so that** 후보지 간 인프라 우열을 객관적으로 비교할 수 있다.

**Acceptance Criteria**:
1. WHEN 시설 데이터가 조회되면, THE Infra_Analyzer SHALL 각 카테고리별로 0~100 범위의 접근성 점수를 산정한다.
2. THE Infra_Analyzer SHALL 점수 산정 근거(예: "500m 내 병원 3곳, 1km 내 8곳, 가중 평균 점수")를 함께 제공한다.
3. WHEN 데이터가 부족하여 점수 산정이 불가하면, THE Infra_Analyzer SHALL 해당 카테고리를 "데이터 부족"으로 표시하고 점수를 부여하지 않는다.

**Personas**: P-01, P-02, P-03
**Source FR**: FR-4
**Estimate**: 2일

---

### US-015: 시설 상세 목록 조회
**As a** 이사 예정자(P-01),
**I want** 각 시설의 거리·이름·주소를 보고,
**so that** 어떤 구체적인 시설이 가까이 있는지 확인할 수 있다.

**Acceptance Criteria**:
1. WHEN 사용자가 카테고리 카드의 "시설 상세 보기"를 클릭하면, THE Web_UI SHALL 해당 카테고리의 시설 목록을 거리 오름차순으로 표시한다.
2. THE Web_UI SHALL 각 시설에 거리(미터 단위), 이름, 주소를 표시한다.
3. THE Web_UI SHALL 반경 외(2km 초과) 시설은 표시하지 않는다.

**Personas**: P-01, P-02, P-03
**Source FR**: FR-4
**Estimate**: 1일

---

## Feature 5: 환경 및 기상 분석 (FR-5)

### US-016: 대기질 지표 조회
**As a** 환경 민감 사용자(P-04),
**I want** 후보지의 PM10·PM2.5·오존·통합대기환경지수와 등급을 보고,
**so that** 건강 리스크를 사전 평가할 수 있다.

**Acceptance Criteria**:
1. WHEN 사용자가 "환경 분석"을 요청하면, THE Environment_Analyzer SHALL 한국환경공단 에어코리아 API에서 후보지에서 가장 가까운 대기측정소의 PM10·PM2.5·오존·KHAI 값을 조회한다.
2. WHEN 대기질 데이터가 표시될 때, THE Web_UI SHALL 좋음/보통/나쁨/매우나쁨 등급을 색상(녹/황/주/적)과 텍스트 라벨로 함께 표시한다.
3. THE Web_UI SHALL 데이터 기준 시각(measuredAt)과 측정소명을 명확히 표시한다.
4. THE Web_UI SHALL "단일 측정소 지표가 전체 지역 환경을 대표하지 않습니다" 안내 문구를 표시한다.
5. THE Cache_Manager SHALL 대기질 데이터를 1시간 TTL로 캐시한다.

**Personas**: P-01, P-04 (핵심 관심)
**Source FR**: FR-5
**Estimate**: 3일

---

### US-017: 기상 예보 조회
**As a** 이사 예정자(P-01),
**I want** 후보지의 최근 기상 정보(기온/강수/풍속/하늘 상태)를 보고,
**so that** 외부 활동 환경을 파악할 수 있다.

**Acceptance Criteria**:
1. WHEN 사용자가 "환경 분석"을 요청하면, THE Environment_Analyzer SHALL 기상청 단기예보 API에서 최근 3일간의 기상 데이터를 조회한다.
2. THE Web_UI SHALL 기온, 강수량, 풍속, 하늘 상태(맑음/구름많음/흐림)를 일별 카드로 표시한다.
3. THE Cache_Manager SHALL 기상 데이터를 1시간 TTL로 캐시한다.

**Personas**: P-01, P-04
**Source FR**: FR-5
**Estimate**: 2일

---

### US-018: 생활 불편 요약
**As a** 환경 민감 사용자(P-04),
**I want** 폭염/한파/강수 등 생활 불편 가능성 요약을 보고,
**so that** 계절별 거주 적합성을 판단할 수 있다.

**Acceptance Criteria**:
1. WHEN 기상 데이터가 조회되면, THE Environment_Analyzer SHALL 폭염(33℃ 이상 일수), 한파(-12℃ 이하 일수), 강수(10mm 이상 일수)를 카운트하여 요약 텍스트를 생성한다.
2. THE Web_UI SHALL 생활 불편 요약을 "주의" 박스 형식으로 강조 표시한다.

**Personas**: P-01, P-04
**Source FR**: FR-5
**Estimate**: 1일

---

## Feature 6: 안전 인프라 분석 (FR-6)

### US-019: 안전 시설 접근성 조회
**As a** 이사 예정자(P-01),
**I want** 응급의료기관·소방서·경찰서의 위치와 가장 가까운 시설까지 거리를 보고,
**so that** 응급 상황 대응 가능성을 파악할 수 있다.

**Acceptance Criteria**:
1. WHEN 사용자가 "안전 분석"을 요청하면, THE Safety_Analyzer SHALL 응급의료기관·소방서·경찰서의 위치 정보를 조회하여 가장 가까운 각 시설까지의 거리를 계산한다.
2. WHEN 민방위 대피소·재난 대피시설 데이터가 가용하면, THE Safety_Analyzer SHALL 해당 시설 위치를 추가 표시한다.
3. THE Web_UI SHALL 안전 정보를 "참고 지표"로 명시하고 절대적 판단 자료가 아님을 안내한다.
4. THE Web_UI SHALL 각 안전 지표에 데이터 출처와 기준일을 표시한다.

**Personas**: P-01, P-02 (1인 가구 야간 안전 중요), P-03 (자녀 응급 대비)
**Source FR**: FR-6
**Estimate**: 3일

---

### US-020: 민감 지표 제외 보장
**As a** 서비스 기획자(시스템 관점),
**I want** 범죄율 등 지역 낙인 유발 지표를 점수 산정에서 제외하고,
**so that** 사회적 윤리와 서비스 가치를 지킬 수 있다.

**Acceptance Criteria**:
1. THE Safety_Analyzer SHALL 범죄율 데이터를 조회·표시·점수 산정에 사용하지 않는다.
2. WHEN 안전 점수가 산정될 때, THE Score_Engine SHALL 시설 접근성과 대피시설 가용성 지표만 사용한다.

**Personas**: 시스템 정책 (모든 페르소나에 영향)
**Source FR**: FR-6
**Estimate**: 0.5일

---

## Feature 7: 종합 점수 및 리포트 (FR-7)

### US-021: 종합 점수 계산
**As a** 이사 예정자(P-01),
**I want** 후보지의 6개 카테고리별 점수와 종합 점수를 보고,
**so that** 후보지를 한 숫자로 비교할 수 있다.

**Acceptance Criteria**:
1. WHEN 사용자가 리포트 생성을 요청하면, THE Score_Engine SHALL 6개 카테고리(주거비/생활인프라/교통/환경/안전/데이터신뢰도) 각각의 점수(0~100)를 산정한다.
2. THE Score_Engine SHALL 초기 기본 가중치(균등 분배, 각 1/6 ≈ 0.1667)를 적용하여 종합 점수를 계산한다.
3. THE Score_Engine SHALL 종합 점수가 항상 0~100 범위 내에 있음을 보장한다.
4. WHEN 일부 카테고리 데이터가 부족하면, THE Score_Engine SHALL 해당 카테고리를 제외하고 가용 데이터로 가중치를 정규화하여 종합 점수를 계산한다.

**Personas**: P-01, P-02, P-03, P-04
**Source FR**: FR-7
**Estimate**: 3일

---

### US-022: 점수 산정 근거 표시
**As a** 이사 예정자(P-01),
**I want** 각 카테고리 점수의 산정 근거(사용된 지표·계산식·데이터 출처)를 보고,
**so that** 점수를 신뢰하고 의사결정에 활용할 수 있다.

**Acceptance Criteria**:
1. WHEN 점수가 표시될 때, THE Web_UI SHALL 각 카테고리 카드에 "산정 근거" 토글 버튼을 제공한다.
2. WHEN 사용자가 산정 근거를 펼치면, THE Web_UI SHALL 사용된 지표 목록, 계산식 요약, 데이터 출처(API명), 데이터 기준 시각을 표시한다.
3. THE Web_UI SHALL "데이터 부족" 카테고리에는 부족한 이유(예: API 실패, 거래 건수 미달)를 표시한다.

**Personas**: P-01, P-04 (데이터 신뢰도 높은 관심)
**Source FR**: FR-7
**Estimate**: 1일

---

### US-023: 리포트 요약(장점/주의점/데이터 부족)
**As a** 이사 예정자(P-01),
**I want** 후보지의 장점·주의점·데이터 부족 항목 요약을 보고,
**so that** 핵심 정보를 빠르게 파악할 수 있다.

**Acceptance Criteria**:
1. WHEN 점수가 산정되면, THE Report_Service SHALL 점수 상위 2개 카테고리를 "장점", 하위 2개를 "주의점", 데이터 부족 카테고리를 "데이터 부족"으로 자동 분류하여 요약한다.
2. THE Report_Service SHALL 리포트에 후보지 기본 정보, 데이터 기준 시각, 사용된 공공 API 목록, 지표별 원본 요약값, 점수 산정 결과, 주의사항/면책 안내를 모두 포함한다.

**Personas**: P-01, P-02, P-03, P-04
**Source FR**: FR-7
**Estimate**: 2일

---

### US-024: 리포트 생성 실패 처리
**As a** 이사 예정자(P-01),
**I want** 리포트 생성이 실패했을 때 원인과 재시도 옵션을 보고,
**so that** 다시 시도하거나 다른 후보지를 검토할 수 있다.

**Acceptance Criteria**:
1. IF 리포트 생성 중 외부 API 호출이 모두 실패하고 캐시도 없으면, THEN THE Web_UI SHALL "리포트 생성 실패: [원인]" 메시지와 "재시도" 버튼을 표시한다.
2. WHEN 사용자가 재시도 버튼을 클릭하면, THE Report_Service SHALL 외부 API를 재호출하고 결과를 반영한다.
3. IF 외부 API는 실패했지만 stale 캐시가 있으면, THEN THE Report_Service SHALL stale 캐시 데이터로 리포트를 생성하고 "오래된 데이터 사용 중" 경고를 표시한다.

**Personas**: P-01, P-02, P-03, P-04
**Source FR**: FR-7
**Estimate**: 2일

---

## Feature 8: 후보지 비교 (FR-8)

### US-025: 후보지 비교 테이블
**As a** 이사 예정자(P-01),
**I want** 등록된 후보지들의 종합 점수와 카테고리 점수를 한 화면에서 비교 테이블로 보고,
**so that** 후보지 간 우열을 쉽게 파악할 수 있다.

**Acceptance Criteria**:
1. WHEN 사용자가 비교 화면에 진입하면, THE Web_UI SHALL 등록된 모든 후보지의 종합 점수와 6개 카테고리별 점수를 테이블로 표시한다.
2. THE Web_UI SHALL 각 카테고리에서 가장 우수한 후보지의 점수를 녹색으로 강조 표시한다.
3. THE Web_UI SHALL 데이터 부족 항목을 회색으로 처리한다.

**Personas**: P-01, P-02, P-03, P-04
**Source FR**: FR-8
**Estimate**: 3일

---

### US-026: 강점/약점 자동 요약
**As a** 이사 예정자(P-01),
**I want** 후보지 간 비교 시 각 후보지의 가장 강한 카테고리와 가장 약한 카테고리를 자동 요약으로 보고,
**so that** 후보지 특성을 빠르게 이해할 수 있다.

**Acceptance Criteria**:
1. WHEN 비교 결과가 표시되면, THE Report_Service SHALL 각 후보지에서 가장 점수가 높은 카테고리(강점)와 가장 낮은 카테고리(약점)를 자동으로 식별하여 요약한다.
2. THE Web_UI SHALL 각 후보지 카드에 "강점: [카테고리]", "약점: [카테고리]" 라벨을 표시한다.

**Personas**: P-01, P-02, P-03, P-04
**Source FR**: FR-8
**Estimate**: 1일

---

### US-027: 우선순위 기반 정렬
**As a** 환경 민감 사용자(P-04),
**I want** 내가 중요시하는 카테고리(예: 환경) 기준으로 후보지를 재정렬하고,
**so that** 내 관심사에 맞는 최적 후보지를 식별할 수 있다.

**Acceptance Criteria**:
1. WHEN 사용자가 정렬 기준 카테고리를 선택하면, THE Web_UI SHALL 해당 카테고리 점수 내림차순으로 후보지를 재정렬한다.
2. WHEN 동점 후보지가 있으면, THE Web_UI SHALL 기존 등록 순서를 유지한다 (안정 정렬).

**Personas**: P-01, P-02, P-03, P-04
**Source FR**: FR-8
**Estimate**: 1일

---

### US-028: 모바일 비교 화면 최적화
**As a** 1인 가구 사용자(P-02),
**I want** 모바일 화면에서도 후보지를 원활히 비교할 수 있고,
**so that** 이동 중에도 결정을 진행할 수 있다.

**Acceptance Criteria**:
1. WHEN 후보지가 2개 이하이고 화면 폭이 360px 이상이면, THE Web_UI SHALL 가로 스크롤 없이 비교 테이블을 표시한다.
2. WHEN 후보지가 3개 이상이면, THE Web_UI SHALL 표 가로 스크롤 또는 카드 전환 방식으로 비교를 제공한다.

**Personas**: P-02 (모바일 우선 사용자)
**Source FR**: FR-8
**Estimate**: 2일

---

## Feature 9: 운영자 - API 상태 관리 (FR-9)

### US-029: API 상태 조회
**As an** Admin(P-06),
**I want** 5개 외부 공공 API의 현재 상태(정상/지연/실패/할당량 초과)와 응답 시간을 한 화면에서 보고,
**so that** 장애를 신속히 인지할 수 있다.

**Acceptance Criteria**:
1. WHEN Admin이 Admin Panel의 "API 상태" 메뉴에 진입하면, THE Admin_Panel SHALL 5개 API(법정동코드/매매실거래가/대기오염/단기예보/병원정보)의 현재 상태를 표시한다.
2. THE Admin_Panel SHALL 각 API의 마지막 호출 시각, p50/p95/p99 응답 시간, 최근 에러 메시지를 표시한다.
3. WHEN API 오류가 최근 발생했으면, THE Admin_Panel SHALL 오류 메시지·발생 시각·HTTP 상태 코드를 함께 표시한다.

**Personas**: P-06
**Source FR**: FR-9
**Estimate**: 3일

---

### US-030: API 수동 재시도
**As an** Admin(P-06),
**I want** 특정 API에 수동으로 재시도를 요청하고,
**so that** 일시적 장애를 빠르게 복구할 수 있다.

**Acceptance Criteria**:
1. WHEN Admin이 특정 API의 "재시도" 버튼을 클릭하면, THE Report_Service SHALL 해당 API에 헬스 체크 호출을 보내고 결과를 표시한다.
2. WHEN 재시도 결과가 성공이면, THE Admin_Panel SHALL 상태를 "정상"으로 갱신한다.
3. THE Admin_Panel SHALL 재시도 작업을 감사 로그에 기록한다 (Admin ID, 시각, 대상 API, 결과).

**Personas**: P-06
**Source FR**: FR-9
**Estimate**: 1일

---

## Feature 10: 운영자 - 캐시 관리 (FR-10)

### US-031: 캐시 상태 조회
**As an** Admin(P-06),
**I want** 캐시 상태(API명, 지역 코드, 적중률, 만료까지 남은 시간)를 보고,
**so that** 캐시 효율을 모니터링할 수 있다.

**Acceptance Criteria**:
1. WHEN Admin이 "캐시 관리" 메뉴에 진입하면, THE Admin_Panel SHALL 캐시 메타데이터(API명, 지역 코드, 캐시 시각, 만료 시각, stale 여부)를 테이블로 표시한다.
2. THE Admin_Panel SHALL 캐시 데이터를 API명·지역 코드·만료 시각으로 필터/정렬할 수 있는 기능을 제공한다.

**Personas**: P-06
**Source FR**: FR-10
**Estimate**: 2일

---

### US-032: 특정 지역 캐시 수동 갱신
**As an** Admin(P-06),
**I want** 특정 지역(법정동 코드)의 캐시를 수동으로 무효화하고,
**so that** 사용자 문의나 데이터 불일치 이슈를 빠르게 해결할 수 있다.

**Acceptance Criteria**:
1. WHEN Admin이 특정 지역 캐시의 "갱신" 버튼을 클릭하면, THE Cache_Manager SHALL 해당 지역의 모든 캐시 키를 즉시 무효화한다.
2. WHEN 사용자가 다음 번 해당 지역의 리포트를 조회하면, THE Report_Service SHALL 외부 API에서 새 데이터를 가져와 캐시에 저장한다.
3. THE Admin_Panel SHALL 갱신 작업을 감사 로그에 기록한다.
4. IF 외부 API 호출이 실패하면, THEN THE Cache_Manager SHALL 기존 캐시를 유지하고 갱신 실패 상태를 기록한다.

**Personas**: P-06
**Source FR**: FR-10
**Estimate**: 2일

---

## Feature 11: 운영자 - 가중치 관리 (FR-11)

### US-033: 가중치 조회 및 변경
**As a** Superadmin(P-05),
**I want** 6개 카테고리별 가중치를 조회하고 변경하고,
**so that** 점수 산정 정책을 조정할 수 있다.

**Acceptance Criteria**:
1. WHEN Superadmin이 "가중치 관리" 메뉴에 진입하면, THE Admin_Panel SHALL 현재 활성 가중치 설정과 버전을 표시한다.
2. WHEN Superadmin이 가중치를 변경 후 저장하면, THE Admin_Panel SHALL 합계가 1.0(±0.001) 이내인지, 모든 값이 0 이상인지, 6개 카테고리가 모두 포함되었는지 검증한다.
3. IF 가중치 합계가 1.0이 아니면, THEN THE Admin_Panel SHALL 입력을 거부하고 "가중치 합계는 1.0이어야 합니다" 안내를 표시한다.
4. IF 음수 가중치가 입력되면, THEN THE Admin_Panel SHALL 입력을 거부하고 "0 이상의 값을 입력해주세요" 안내를 표시한다.
5. WHEN 가중치가 변경되면, THE Score_Engine SHALL 새 가중치 버전을 생성하고 이전 버전과 구분 저장한다.

**Personas**: P-05
**Source FR**: FR-11
**Estimate**: 3일

---

### US-034: 가중치 프리셋 관리
**As an** Admin(P-06),
**I want** 사용자 생활 유형별 가중치 프리셋(출퇴근 중심/육아 중심/1인 가구/건강 민감형)을 추가·수정·삭제하고,
**so that** 사용자가 자신에게 맞는 프리셋을 선택할 수 있다.

**Acceptance Criteria**:
1. WHEN Admin이 "프리셋 관리" 메뉴에 진입하면, THE Admin_Panel SHALL 등록된 프리셋 목록(이름, 설명, 가중치)을 표시한다.
2. WHEN Admin이 새 프리셋을 추가하면, THE Admin_Panel SHALL 이름(1~30자), 설명(0~200자), 6개 가중치를 입력받고 검증한다.
3. WHEN Admin이 프리셋을 수정/삭제하면, THE Admin_Panel SHALL 변경 사항을 저장하고 감사 로그에 기록한다.

**Personas**: P-06
**Source FR**: FR-11
**Estimate**: 2일

---

### US-035: 가중치 버전 구분 표시
**As a** 이사 예정자(P-01),
**I want** 내 리포트가 어떤 가중치 버전으로 산정되었는지 확인할 수 있고,
**so that** 가중치 정책이 바뀐 경우 혼란을 피할 수 있다.

**Acceptance Criteria**:
1. WHEN 리포트가 생성될 때, THE Score_Engine SHALL 사용된 가중치 버전을 리포트에 기록한다.
2. THE Web_UI SHALL 리포트 하단에 "점수 산정 버전: vX.Y (YYYY-MM-DD)" 정보를 표시한다.
3. WHEN 가중치가 변경된 후 사용자가 기존 리포트를 다시 보면, THE Web_UI SHALL "이 리포트는 이전 버전(vX.Y)으로 산정되었습니다. 최신 버전으로 재생성할까요?" 안내를 표시한다.

**Personas**: P-01, P-02, P-03, P-04
**Source FR**: FR-11
**Estimate**: 1일

---

## Feature 12: 운영자 - 계정 관리 (FR-12)

### US-036: 운영자 로그인
**As an** Admin(P-06),
**I want** 이메일과 비밀번호로 Admin Panel에 로그인하고,
**so that** 운영 작업을 수행할 수 있다.

**Acceptance Criteria**:
1. WHEN Admin이 로그인 페이지에서 이메일·비밀번호를 입력하고 제출하면, THE Admin_Panel SHALL bcrypt로 비밀번호를 검증하고 JWT(만료 1시간)를 발급한다.
2. WHEN JWT가 발급되면, THE Web_UI SHALL 토큰을 sessionStorage에 저장하고 Admin Panel 메인으로 이동시킨다.
3. WHEN JWT가 만료되거나 무효하면, THE Admin_Panel SHALL 401 응답으로 재로그인을 요구한다.
4. WHEN 로그인 실패가 5회 누적되면, THE Admin_Panel SHALL 해당 계정을 15분간 잠그고 "잠시 후 다시 시도해주세요" 안내를 표시한다.

**Personas**: P-05, P-06
**Source FR**: FR-12
**Estimate**: 3일

---

### US-037: 초기 Superadmin 생성
**As a** 시스템 관리자(배포 시),
**I want** CLI 시드 스크립트로 초기 superadmin 계정을 생성하고,
**so that** 최초 배포 후 시스템에 로그인할 수 있다.

**Acceptance Criteria**:
1. WHEN 배포 환경에서 시드 스크립트(`npm run seed:admin`)를 실행하면, THE 시드 스크립트 SHALL 환경변수에서 이메일·초기 비밀번호를 읽어 superadmin 계정을 생성한다.
2. THE 시드 스크립트 SHALL 초기 비밀번호 정책(최소 12자, 대소문자/숫자/특수문자)을 검증한다.
3. WHEN 동일 이메일의 superadmin이 이미 존재하면, THE 시드 스크립트 SHALL 생성을 건너뛰고 "이미 존재함" 메시지를 표시한다.

**Personas**: P-05 (배포 시)
**Source FR**: FR-12
**Estimate**: 1일

---

### US-038: Admin 계정 생성 (Superadmin 권한)
**As a** Superadmin(P-05),
**I want** 새 admin 계정을 생성하고,
**so that** 운영 인원을 확장할 수 있다.

**Acceptance Criteria**:
1. WHEN Superadmin이 "운영자 관리" 메뉴에서 "신규 계정"을 클릭하고 이메일·비밀번호·역할을 입력하면, THE Admin_Panel SHALL 이메일 형식과 비밀번호 정책을 검증한다.
2. THE Admin_Panel SHALL 비밀번호를 bcrypt(cost=12)로 해시하여 저장한다.
3. IF 동일 이메일이 이미 존재하면, THEN THE Admin_Panel SHALL "이미 등록된 이메일입니다" 안내를 표시한다.
4. THE Admin_Panel SHALL 계정 생성 작업을 감사 로그에 기록한다 (작업자, 시각, 대상 이메일, 역할).

**Personas**: P-05
**Source FR**: FR-12
**Estimate**: 2일

---

### US-039: 비밀번호 변경
**As an** Admin(P-06),
**I want** 내 비밀번호를 변경하고,
**so that** 보안을 유지할 수 있다.

**Acceptance Criteria**:
1. WHEN Admin이 "비밀번호 변경" 페이지에서 현재 비밀번호와 새 비밀번호를 입력하면, THE Admin_Panel SHALL 현재 비밀번호의 해시를 검증한다.
2. WHEN 검증이 성공하고 새 비밀번호가 정책을 만족하면, THE Admin_Panel SHALL 새 비밀번호를 bcrypt 해시로 저장한다.
3. WHEN 비밀번호가 변경되면, THE Admin_Panel SHALL 기존 JWT를 무효화하고 재로그인을 요구한다.
4. THE Admin_Panel SHALL 비밀번호 변경을 감사 로그에 기록한다.

**Personas**: P-05, P-06
**Source FR**: FR-12
**Estimate**: 2일

---

# Story Mapping

## FR ↔ Story 추적성 매트릭스

| FR | User Stories |
|----|--------------|
| FR-1 지역 검색 | US-001, US-002 |
| FR-2 후보지 등록 및 관리 | US-003, US-004, US-005, US-006, US-007, US-008 |
| FR-3 실거래가 분석 | US-009, US-010, US-011, US-012 |
| FR-4 생활 인프라 분석 | US-013, US-014, US-015 |
| FR-5 환경 및 기상 분석 | US-016, US-017, US-018 |
| FR-6 안전 인프라 분석 | US-019, US-020 |
| FR-7 종합 점수 및 리포트 | US-021, US-022, US-023, US-024 |
| FR-8 후보지 비교 | US-025, US-026, US-027, US-028 |
| FR-9 API 상태 관리 | US-029, US-030 |
| FR-10 캐시 관리 | US-031, US-032 |
| FR-11 가중치 관리 | US-033, US-034, US-035 |
| FR-12 운영자 계정 관리 | US-036, US-037, US-038, US-039 |
| FR-13 데이터 처리 원칙 | (모든 사용자 측 스토리에 횡단 적용) |
| FR-14 서비스 범위 제한 | (Out-of-Scope, 스토리 없음) |

## Persona ↔ Story 매핑

| Persona | 매핑 Story |
|---------|------------|
| P-01 이사 예정자 (공통) | US-001~028 (사용자 측 모든 스토리), US-035 |
| P-02 1인 가구 | US-001~028 (특히 US-013(교통), US-019(야간 안전), US-028(모바일)) |
| P-03 가족 | US-001~028 (특히 US-013(학교/병원), US-019(응급의료)) |
| P-04 환경 민감 | US-001~028 (특히 US-016, US-017, US-018, US-027) |
| P-05 Superadmin | US-033, US-036, US-037, US-038, US-039 |
| P-06 Admin | US-029, US-030, US-031, US-032, US-034, US-036, US-039 |

## INVEST 자가 검증 결과

| 기준 | 검증 결과 |
|------|----------|
| **Independent** | 모든 스토리는 다른 스토리 없이 단독 구현 가능. 의존성은 데이터 모델/공통 모듈 수준. |
| **Negotiable** | AC는 행동 수준이며 기술 구현 세부를 강제하지 않음. |
| **Valuable** | 모든 스토리는 사용자/운영자에게 명확한 가치 제공. |
| **Estimable** | 모든 스토리에 0.5~4일 추정치 부여. |
| **Small** | 모든 스토리는 4일 이내 (대부분 1~2일). |
| **Testable** | 모든 AC는 EARS 패턴으로 테스트 가능. |

## 통계

- **총 User Story 수**: 39개
- **사용자 측 Story**: 28개 (FR-1 ~ FR-8)
- **운영자 측 Story**: 11개 (FR-9 ~ FR-12)
- **총 추정 공수**: 약 70 person-days
