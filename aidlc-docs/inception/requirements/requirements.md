# Requirements Document

## 1. Intent Analysis

### 1.1 User Request
"이사갈 동네 리포트 서비스" — 정부 제공 공공 API를 활용해 사용자가 이사 후보 동네를 객관적으로 비교하고, 주거비, 생활 편의, 교통, 환경, 안전 인프라 관점에서 의사결정을 돕는 동네 분석 리포트 서비스. 사용자 입력 자료(`requirements/neighborhood-report-requirements.md`, `requirements/constraints.md`)와 명확화 답변을 기반으로 구체화.

### 1.2 Request Classification
- **Request Type**: New Project (Greenfield)
- **Scope Estimate**: System-wide (Frontend + Backend + Admin Panel + 외부 공공 API 연동 + AWS 배포)
- **Complexity**: Complex (다수 외부 API 연동, 점수 산정 로직, 캐싱 전략, 운영자 기능, AWS 인프라)
- **Depth**: Comprehensive

### 1.3 Stakeholders
| Stakeholder | Role | Primary Concerns |
|-------------|------|------------------|
| 이사 예정자 (Primary User) | 이사 후보 동네 비교 의사결정 | 객관적 정보, 빠른 비교, 신뢰 가능한 데이터 |
| 1인 가구 / 가족 (User Sub-segments) | 생활 패턴별 적합도 확인 | 의료, 교통, 학교, 공원 접근성 |
| 운영자 (Admin) | API 상태/캐시/가중치 운영 | 안정적 서비스, 데이터 품질, 비용 효율 |
| 서비스 기획자 | MVP 범위 통제, 차별화 포지셔닝 | 공공 데이터 기반, 투자 추천 배제, 거주 적합성 중심 |

---

## 2. Glossary

| 용어 | 정의 |
|------|------|
| **Report_Service** | 공공 API 데이터를 수집·정규화·점수화하여 동네 분석 리포트를 생성하는 백엔드 시스템 |
| **Web_UI** | 사용자가 후보지를 검색·등록·비교하고 리포트를 확인하는 웹 프론트엔드 |
| **Admin_Panel** | 운영자가 API 상태·캐시·가중치를 관리하는 운영자용 인터페이스 |
| **Candidate_Manager** | 후보지 등록·삭제·조회·별칭 수정을 관리하는 모듈 |
| **Search_Engine** | 주소·동·구 명으로 지역을 검색하는 모듈 (법정동코드 API 활용) |
| **Price_Analyzer** | 국토교통부 실거래가 데이터를 조회하고 면적대별 가격을 요약하는 모듈 |
| **Infra_Analyzer** | 후보지 좌표 기준 반경별 생활 시설 수와 접근성을 분석하는 모듈 |
| **Environment_Analyzer** | 대기질·기상 데이터를 조회하고 환경 리스크를 분석하는 모듈 |
| **Safety_Analyzer** | 응급의료기관·소방서·경찰서·대피시설 접근성을 분석하는 모듈 |
| **Score_Engine** | 지표별 점수 산정 + 가중치 적용 → 종합 점수 계산 모듈 |
| **Cache_Manager** | 공공 API 응답을 캐시하고 만료 정책에 따라 갱신하는 모듈 |
| **후보지** | 사용자가 이사를 고려하는 법정동 단위 지역 |
| **법정동** | 법률상 주소 체계에 사용되는 동 단위 행정구역 |
| **리포트_기준_시각** | 리포트 생성에 사용된 데이터가 수집·갱신된 시각 |
| **데이터_신뢰도** | 거래 건수, 데이터 최신성, API 응답 완성도를 반영한 참고 지표 |
| **공공_API** | 정부·공공기관·지자체가 제공하는 공개 데이터 인터페이스 |

---

## 3. Functional Requirements

### FR-1: 지역 검색

**User Story**: As a 이사 예정자, I want 주소·동 이름·구/시군구명으로 지역을 검색하고 싶다, so that 이사 후보 동네를 쉽게 찾을 수 있다.

#### Acceptance Criteria
1. WHEN 사용자가 검색어(주소·동·구)를 입력하면, THE Search_Engine SHALL 행정안전부 법정동코드 API를 호출하여 법정동 단위 검색 결과 목록을 반환한다.
2. WHEN 검색 결과가 존재하지 않으면, THE Web_UI SHALL "검색 결과가 없습니다" 메시지와 함께 대체 검색어 안내(예: 상위 행정구역으로 재검색)를 표시한다.
3. WHEN 검색 결과가 반환되면, THE Web_UI SHALL 각 결과에 법정동 이름과 상위 행정구역명(예: "서울특별시 강남구"), 법정동 코드를 표시한다.
4. WHEN 검색어가 비어 있거나 100자를 초과하면, THE Search_Engine SHALL 입력을 거부하고 사용자에게 입력 가이드를 표시한다.
5. WHILE 검색 API 호출 중, THE Web_UI SHALL 로딩 상태를 사용자에게 표시한다.

### FR-2: 후보지 등록 및 관리

**User Story**: As a 이사 예정자, I want 검색한 지역을 후보지로 등록하고 별칭과 함께 관리하고 싶다, so that 여러 동네를 비교 대상으로 저장할 수 있다.

#### Acceptance Criteria
1. WHEN 사용자가 검색 결과에서 지역을 선택하면, THE Candidate_Manager SHALL 후보지명·법정동 코드·중심 좌표(법정동코드 API 좌표 활용)·등록 시각을 LocalStorage에 저장한다.
2. WHILE 등록된 후보지가 5개인 상태에서 사용자가 새 후보지를 등록하려 하면, THE Candidate_Manager SHALL 등록을 거부하고 "최대 5개까지 등록 가능" 메시지를 표시한다.
3. WHEN 사용자가 이미 등록된 법정동 코드를 다시 등록하려 하면, THE Candidate_Manager SHALL 중복 등록을 거부하고 "이미 등록된 후보지" 메시지를 표시한다.
4. WHEN 사용자가 후보지에 별칭을 입력하면, THE Candidate_Manager SHALL 해당 별칭(최대 30자)을 후보지 정보에 저장한다.
5. WHEN 사용자가 후보지를 삭제하면, THE Candidate_Manager SHALL 해당 후보지와 관련 리포트 캐시를 클라이언트에서 제거한다.
6. THE Local_Storage SHALL 후보지 데이터(별칭·법정동코드·좌표·등록 시각)를 브라우저 LocalStorage에 저장한다. 서버에는 익명 식별자조차 저장하지 않는다.

### FR-3: 주거비 및 실거래가 분석

**User Story**: As a 이사 예정자, I want 후보 지역의 최근 실거래가와 주거비 수준을 확인하고 싶다, so that 주거비 부담을 객관적으로 비교할 수 있다.

#### Acceptance Criteria
1. WHEN 사용자가 후보지의 실거래가 분석을 요청하면, THE Price_Analyzer SHALL 국토교통부 아파트 매매 실거래가 API와 전월세 실거래가 API에서 해당 시군구 코드의 거래 데이터를 조회한다.
2. WHEN 실거래가 데이터가 조회되면, THE Price_Analyzer SHALL 면적대별(예: ~59㎡, 59~84㎡, 84~135㎡, 135㎡~) 최저가·중앙값·최고가·거래 건수를 계산한다.
3. WHEN 사용자가 조회 기간을 선택하면, THE Price_Analyzer SHALL 최근 3개월·6개월·12개월 중 선택된 기간의 데이터를 조회한다. 기본값은 6개월이다.
4. WHEN 조회 기간 내 특정 면적대의 거래 건수가 5건 미만이면, THE Price_Analyzer SHALL 해당 면적대에 "신뢰도 낮음" 플래그를 추가한다.
5. WHEN 거래 상세 정보를 표시할 때, THE Web_UI SHALL 거래 월·건물명(단지명)·전용면적·거래 금액·층·건축연도를 포함한다.
6. THE Web_UI SHALL 가격을 1억 이상은 "X억 Y만원", 1억 미만은 "X만원" 형식으로 표시한다.
7. THE Web_UI SHALL 거래 건수와 기준 기간을 가격 요약 옆에 항상 표시한다.
8. THE Cache_Manager SHALL 실거래가 데이터를 24시간 TTL로 캐시한다.

### FR-4: 생활 인프라 분석

**User Story**: As a 이사 예정자, I want 후보 지역 주변의 생활 시설 접근성을 확인하고 싶다, so that 생활 편의성을 비교할 수 있다.

#### Acceptance Criteria
1. WHEN 사용자가 후보지의 생활 인프라 분석을 요청하면, THE Infra_Analyzer SHALL 후보지 중심 좌표 기준 500m·1km·2km 반경별 시설 수를 계산한다.
2. THE Infra_Analyzer SHALL 다음 카테고리로 시설을 분류한다: 병원, 약국, 학교, 공원, 공공기관, 지하철역/주요 대중교통 거점.
3. THE Infra_Analyzer SHALL 건강보험심사평가원 병원정보 API에서 병원·약국 데이터를 조회한다.
4. WHEN 시설 목록을 표시할 때, THE Web_UI SHALL 각 시설의 거리(미터)·이름·주소를 표시한다.
5. THE Infra_Analyzer SHALL 카테고리별 접근성 점수(0~100)를 산정하며, 산정 근거(반경별 시설 수, 가중 평균 등)를 함께 제공한다.
6. WHEN 시설의 좌표 정보가 누락되면, THE Infra_Analyzer SHALL 해당 시설을 거리 계산 대상에서 제외하고 "데이터 누락" 카운트에 기록한다.
7. THE Cache_Manager SHALL 정적 시설 데이터를 7일 TTL로 캐시한다.
8. THE Infra_Analyzer SHALL Haversine 공식으로 두 좌표 간 거리를 계산하며, 거리 계산 결과는 비음수이고 대칭적이다 (PBT 검증 대상).

### FR-5: 환경 및 기상 리스크 분석

**User Story**: As a 이사 예정자, I want 후보 지역의 대기질과 기상 정보를 확인하고 싶다, so that 건강 및 외부 활동 리스크를 파악할 수 있다.

#### Acceptance Criteria
1. WHEN 사용자가 후보지의 환경 분석을 요청하면, THE Environment_Analyzer SHALL 한국환경공단 에어코리아 API에서 가장 가까운 대기측정소의 PM10·PM2.5·오존·통합대기환경지수(KHAI)를 조회한다.
2. WHEN 대기질 데이터를 표시할 때, THE Web_UI SHALL 좋음(1)·보통(2)·나쁨(3)·매우나쁨(4) 등급을 색상(녹/황/주/적)과 텍스트로 함께 표시한다.
3. WHEN 환경 데이터를 표시할 때, THE Web_UI SHALL 데이터 기준 시각(measuredAt)과 측정소명을 명확히 표시한다.
4. THE Environment_Analyzer SHALL 기상청 단기예보 API에서 최근 3일간의 기상 데이터(기온·강수·풍속·하늘 상태)를 조회한다.
5. THE Environment_Analyzer SHALL 폭염(33℃ 이상)·강수(10mm 이상)·한파(-12℃ 이하) 등 생활 불편 가능성을 요약하여 제공한다.
6. THE Web_UI SHALL "단일 측정소 지표가 전체 지역 환경을 대표하지 않습니다" 안내 문구를 표시한다.
7. THE Cache_Manager SHALL 대기질 및 기상 데이터를 1시간 TTL로 캐시한다.
8. THE Environment_Analyzer SHALL 대기질 등급 판정이 단조성을 만족한다 (지수 ↑ → 등급 ↑, PBT 검증 대상).

### FR-6: 안전 인프라 분석

**User Story**: As a 이사 예정자, I want 후보 지역의 안전 인프라 접근성을 확인하고 싶다, so that 응급 상황 대응 가능성을 파악할 수 있다.

#### Acceptance Criteria
1. WHEN 사용자가 후보지의 안전 분석을 요청하면, THE Safety_Analyzer SHALL 응급의료기관·소방서·경찰서의 위치와 가장 가까운 시설까지의 거리를 조회한다.
2. WHEN 민방위 대피소 또는 재난 대피시설 데이터가 제공되는 경우, THE Safety_Analyzer SHALL 해당 시설의 위치를 표시한다.
3. WHEN 침수·산사태 등 재난 관련 공개 데이터가 제공되는 지역이면, THE Safety_Analyzer SHALL 리스크 참고 정보로 표시한다.
4. THE Safety_Analyzer SHALL 범죄율 등 지역 낙인을 유발할 수 있는 지표를 점수 산정에서 **제외**한다.
5. THE Web_UI SHALL 안전 정보를 절대적 판단이 아닌 "참고 지표"로 명시 표시한다.
6. THE Web_UI SHALL 각 안전 지표에 데이터 출처와 기준일을 표시한다.

### FR-7: 종합 점수 및 리포트 생성

**User Story**: As a 이사 예정자, I want 후보 지역의 장단점을 종합 점수와 리포트로 확인하고 싶다, so that 이사 결정에 필요한 정보를 한눈에 파악할 수 있다.

#### Acceptance Criteria
1. WHEN 사용자가 리포트 생성을 요청하면, THE Score_Engine SHALL 6개 카테고리별 점수(0~100)를 산정한다: 주거비 적정성, 생활 인프라, 교통 접근성, 환경 쾌적성, 안전 인프라, 데이터 신뢰도.
2. THE Score_Engine SHALL 초기 기본 가중치로 6개 카테고리에 균등 분배(각 1/6 ≈ 0.1667)를 적용한다. 가중치 합계는 1.0이다.
3. THE Score_Engine SHALL 각 점수의 산정 근거(사용된 지표·계산식·데이터 출처)를 함께 제공한다.
4. THE Report_Service SHALL 장점·주의점·데이터 부족 항목을 요약하여 리포트에 포함한다.
5. THE Report_Service SHALL 리포트에 다음 항목을 모두 포함한다:
   - 후보지 기본 정보(법정동·상위 행정구역·중심 좌표)
   - 데이터 기준 시각
   - 사용된 공공 API 목록
   - 지표별 원본 요약값
   - 점수 산정 결과 및 근거
   - 주의사항 및 면책 안내
6. WHEN 사용자가 중요 카테고리를 선택하면, THE Score_Engine SHALL 해당 카테고리의 가중치를 종합 점수에 반영한다 (가중치 가용한 데이터로 정규화).
7. WHEN 특정 지표의 데이터가 부족하면(API 응답 실패·캐시 없음·거래 건수 미달 등), THE Score_Engine SHALL 해당 지표를 점수 산정에서 제외하고 "데이터 부족" 상태로 표시한다. 낮은 점수를 임의로 부여하지 않는다.
8. THE Score_Engine SHALL 종합 점수가 0~100 범위 내에 있음을 보장한다 (PBT 검증 대상).
9. IF 리포트 생성이 실패하면, THEN THE Web_UI SHALL 실패 원인과 재시도 버튼을 표시한다.

### FR-8: 후보지 비교

**User Story**: As a 이사 예정자, I want 여러 후보 동네를 한 화면에서 비교하고 싶다, so that 최종 후보를 좁힐 수 있다.

#### Acceptance Criteria
1. WHEN 사용자가 후보지 비교를 요청하면, THE Web_UI SHALL 후보지별 종합 점수와 6개 카테고리 지표별 비교 테이블을 표시한다.
2. THE Report_Service SHALL 후보지 간 강점(가장 높은 점수의 카테고리)과 약점(가장 낮은 점수의 카테고리)을 자동으로 요약한다.
3. WHEN 사용자가 정렬 기준 카테고리를 선택하면, THE Web_UI SHALL 해당 카테고리 점수 내림차순으로 후보지를 재정렬한다.
4. WHEN 후보지가 2개 이하이면, THE Web_UI SHALL 모바일 화면(폭 360px 이상)에서 가로 스크롤 없이 비교 가능하도록 표시한다.
5. WHEN 후보지가 3개 이상이면, THE Web_UI SHALL 표 가로 스크롤 또는 카드 전환 방식으로 비교를 제공한다.
6. THE Web_UI SHALL 가장 우수한 지표(녹색 강조)와 데이터 부족 지표(회색 처리)를 시각적으로 구분하여 표시한다.
7. THE Local_Storage SHALL 비교 결과(스냅샷)를 LocalStorage에 저장한다.
8. THE Web_UI SHALL 비교 정렬 시 동점 후보지의 상대 순서를 유지한다 (안정 정렬, PBT 검증 대상).

### FR-9: 공공 API 연동 상태 관리 (운영자)

**User Story**: As a 운영자, I want 외부 공공 API의 연결 상태와 오류를 관리하고 싶다, so that 서비스 안정성을 유지할 수 있다.

#### Acceptance Criteria
1. THE Admin_Panel SHALL API별 상태를 정상·지연·실패·할당량 초과로 구분하여 표시한다.
2. WHEN API 오류가 발생하면, THE Admin_Panel SHALL 최근 오류 메시지·발생 시각·HTTP 상태 코드를 표시한다.
3. WHEN 운영자가 수동 재시도를 요청하면, THE Report_Service SHALL 해당 API에 재연결을 시도하고 결과를 반환한다.
4. THE Report_Service SHALL API별 응답 시간(p50/p95/p99)을 기록한다.
5. THE Report_Service SHALL API 키를 AWS Secrets Manager(또는 환경변수)에 보관하고 클라이언트 화면·로그·에러 메시지에 노출하지 않는다.
6. WHEN 운영자가 Admin_Panel에 접근하려 하면, THE Admin_Panel SHALL JWT 기반 관리자 인증을 요구한다.

### FR-10: 데이터 캐시 및 갱신 관리 (운영자)

**User Story**: As a 운영자, I want 공공 API 응답 캐시를 관리하고 싶다, so that API 호출 비용을 줄이고 안정적인 리포트 생성을 지원할 수 있다.

#### Acceptance Criteria
1. THE Cache_Manager SHALL 공공 API 응답을 ElastiCache Redis에 저장하며, 함께 API명·요청 파라미터·기준 시각·만료 시각 메타데이터를 PostgreSQL에 저장한다.
2. THE Cache_Manager SHALL 데이터 유형별 캐시 TTL을 적용한다: 실거래가 24시간, 시설 정보 7일, 대기질 1시간, 기상 1시간, 행정구역 코드 30일.
3. WHEN 운영자가 특정 지역(법정동 코드)의 캐시 수동 갱신을 요청하면, THE Cache_Manager SHALL 해당 지역의 캐시 키를 즉시 무효화하고 다음 조회 시 외부 API에서 재조회한다.
4. WHEN 캐시 데이터가 만료 시간을 초과한 상태로 사용되면 (외부 API 실패 시 stale fallback), THE Web_UI SHALL "오래된 데이터 사용 중" 경고와 함께 데이터 기준 시각을 표시한다.
5. IF 캐시 갱신이 실패하면, THEN THE Cache_Manager SHALL 기존 캐시를 유지하고 갱신 실패 상태를 기록한다.
6. WHEN 캐시가 삭제되면, THE Cache_Manager SHALL 관련 리포트를 "재생성 필요" 상태로 변경한다.

### FR-11: 점수 가중치 관리 (운영자)

**User Story**: As a 운영자, I want 동네 종합 점수 산정 방식을 조정하고 싶다, so that 서비스 정책에 따라 점수 체계를 개선할 수 있다.

#### Acceptance Criteria
1. THE Admin_Panel SHALL 6개 카테고리별 가중치를 0~1 범위 내에서 설정할 수 있는 인터페이스를 제공한다.
2. THE Admin_Panel SHALL 사용자 생활 유형별 가중치 프리셋(예: 출퇴근 중심, 육아 중심, 1인 가구 중심, 건강 민감형)을 관리할 수 있는 기능을 제공한다.
3. THE Score_Engine SHALL 점수 계산식의 버전(예: v1.0, v1.1)을 관리하며 모든 리포트에 사용된 버전을 기록한다.
4. WHEN 가중치가 변경되면, THE Web_UI SHALL 기존 리포트(이전 버전)와 신규 리포트(신규 버전)를 구분하여 표시한다.
5. WHEN 운영자가 가중치를 입력할 때, THE Admin_Panel SHALL 전체 가중치 합계가 1.0(부동소수점 허용 오차 ±0.001 내)인지 검증한다.
6. THE Admin_Panel SHALL 6개 카테고리 모두 0 이상의 가중치를 갖도록 강제한다 (필수 지표 누락 방지).
7. WHEN 운영자가 음수 가중치를 입력하면, THE Admin_Panel SHALL 입력을 거부하고 "0 이상의 값 입력" 안내를 표시한다.
8. THE Score_Engine SHALL 가중치 검증 invariant(합계=1.0, 음수 없음, 6개 모두 포함)를 만족한다 (PBT 검증 대상).

### FR-12: 운영자 계정 관리

**User Story**: As a 운영자, I want 관리자 계정을 생성하고 관리하고 싶다, so that Admin Panel 접근을 안전하게 통제할 수 있다.

#### Acceptance Criteria
1. WHEN 최초 배포 시, THE Admin_Panel SHALL CLI 시드 스크립트를 통해 superadmin 초기 계정을 생성한다.
2. WHEN 운영자가 로그인하면, THE Admin_Panel SHALL 이메일·비밀번호 검증 후 JWT(만료 1시간)를 발급한다.
3. WHEN superadmin이 새 admin 계정을 생성하면, THE Admin_Panel SHALL 이메일 형식·비밀번호 정책(최소 12자, 대소문자·숫자·특수문자 포함)을 검증하고 계정을 생성한다.
4. WHEN 운영자가 비밀번호 변경을 요청하면, THE Admin_Panel SHALL 현재 비밀번호 확인 후 새 비밀번호 정책 검증을 거쳐 변경한다.
5. THE Admin_Panel SHALL 비밀번호를 bcrypt(cost=12 이상) 해시로 저장한다.
6. WHEN JWT가 만료되면, THE Admin_Panel SHALL 401 응답으로 재로그인을 요구한다.
7. THE Admin_Panel SHALL 로그인 실패 5회 이상 시 해당 계정을 15분간 잠금 처리한다 (브루트포스 방어).

### FR-13: 데이터 처리 원칙 (전역)

**User Story**: As a 이사 예정자, I want 리포트의 데이터 출처와 산정 근거를 투명하게 확인하고 싶다, so that 정보를 신뢰하고 의사결정에 활용할 수 있다.

#### Acceptance Criteria
1. THE Report_Service SHALL 공공 API 응답의 원본값(rawResponse)과 가공값(processedData)을 분리하여 저장한다.
2. THE Web_UI SHALL 모든 점수에 산정 기준·사용된 지표·데이터 출처·기준 시각을 함께 표시한다.
3. IF 외부 API 호출이 실패하면, THEN THE Report_Service SHALL 캐시된 데이터(stale 포함)를 사용하고 "데이터 기준 시점"을 명확히 표시한다.
4. WHEN 특정 지역의 데이터가 부족하면, THE Report_Service SHALL 해당 항목을 "데이터 부족" 상태로 표시하고 임의의 낮은 점수를 부여하지 않는다.

### FR-14: 서비스 범위 제한 (Out-of-Scope)

`requirements/constraints.md`에 정의된 모든 제외 기능을 본 시스템은 **제공하지 않는다**. 핵심 항목:
- 부동산 투자 추천·가격 예측·수익률 계산
- 부동산 매물 등록·중개사 연결·전자계약
- 주민등록번호·소득·신용점수 등 민감 개인정보 수집
- 상용 지도 API 기반 상세 지도·실시간 길찾기·3D 지도
- 머신러닝 기반 가격 예측·자동 추천 엔진·민간 사이트 크롤링
- 범죄율 기반 지역 순위화·학교 서열화
- PDF·엑셀 다운로드, 외부 공유 링크
- 푸시 알림·SMS·이메일·메신저 알림

---

## 4. Non-Functional Requirements

### NFR-1: Performance
- **NFR-1.1**: 후보지 검색 API 응답 시간 ≤ 1초 (p95).
- **NFR-1.2**: 단일 후보지 리포트 생성 응답 시간 ≤ 1초 (캐시 히트 기준), ≤ 5초 (캐시 미스 시).
- **NFR-1.3**: 후보지 비교 화면 렌더링 ≤ 2초 (5개 후보지 기준).
- **NFR-1.4**: 외부 공공 API 호출은 5초 timeout, 3회 재시도(exponential backoff: 100ms, 500ms, 2s).

### NFR-2: Scalability
- **NFR-2.1**: 동시 사용자 100명까지 응답 시간 SLO 유지.
- **NFR-2.2**: ECS Fargate Auto Scaling으로 CPU 70% 초과 시 인스턴스 추가, 30% 미만 5분 지속 시 축소.
- **NFR-2.3**: ElastiCache Redis는 단일 노드 구성으로 시작하되, 클러스터 모드 확장 가능한 구조 유지.

### NFR-3: Availability
- **NFR-3.1**: 서비스 가용성 SLA 99% (월 7시간 다운타임 허용).
- **NFR-3.2**: 외부 공공 API 장애 시에도 캐시(stale 포함) 기반 부분 응답 제공.
- **NFR-3.3**: RDS는 자동 백업(7일 보관), 일일 스냅샷.

### NFR-4: Security (Security Baseline 강제 적용)
- **NFR-4.1**: 모든 외부 API 통신은 HTTPS/TLS 1.2 이상.
- **NFR-4.2**: 공공 API 키는 AWS Secrets Manager에 저장, 코드/로그/응답에 노출 금지.
- **NFR-4.3**: Admin Panel은 JWT 인증 필수, 토큰 만료 1시간, refresh token 미사용(재로그인).
- **NFR-4.4**: 비밀번호는 bcrypt(cost ≥12) 해시 저장.
- **NFR-4.5**: 모든 사용자 입력은 서버 사이드에서 sanitize (SQL injection·XSS 방어).
- **NFR-4.6**: Rate limiting: 사용자 IP당 검색 60회/분, 리포트 생성 10회/분, Admin API 100회/분.
- **NFR-4.7**: CORS는 운영 환경 도메인만 허용 (whitelist 방식).
- **NFR-4.8**: 감사 로그: Admin Panel의 모든 변경 작업(가중치·캐시·계정)은 운영자 ID·시각·작업 내용을 CloudWatch Logs에 기록.
- **NFR-4.9**: 의존성 취약점 스캔: GitHub Actions CI에서 매 PR마다 npm audit 또는 Grype 실행, HIGH/CRITICAL 발견 시 빌드 실패.

### NFR-5: Usability & Accessibility
- **NFR-5.1**: WCAG 2.1 AA 준수 (색상 대비, 키보드 네비게이션, 스크린리더 호환, ARIA 라벨).
- **NFR-5.2**: 모바일 반응형 디자인 (최소 폭 360px 지원).
- **NFR-5.3**: 한국어 UI/콘텐츠.
- **NFR-5.4**: 로딩 상태·에러 상태 명확히 표시.
- **NFR-5.5**: 색상에만 의존하지 않는 상태 표시 (대기질 등급은 색상+텍스트 동시 사용).

### NFR-6: Maintainability
- **NFR-6.1**: TypeScript strict 모드, ESLint + Prettier 적용.
- **NFR-6.2**: 모듈별 단위 테스트 커버리지 ≥ 70%.
- **NFR-6.3**: 모든 외부 API 클라이언트는 인터페이스 추상화로 mockable.
- **NFR-6.4**: API 응답 형식 표준화 (`{success, data, error, meta}`).

### NFR-7: Testability (Property-Based Testing 강제 적용)
- **NFR-7.1**: 다음 영역에 PBT 강제 적용:
  - Haversine 거리 계산 (비음수성, 대칭성, 자기 자신과의 거리=0)
  - 가격 요약 통계 (min ≤ median ≤ max, 거래 건수 정확성)
  - 가격 포맷팅 (1억 이상 → "억", 1억 미만 → "만원")
  - 종합 점수 범위 (0 ≤ score ≤ 100)
  - 가중치 invariant (합계=1.0±0.001, 음수 없음, 필수 카테고리 포함)
  - 대기질 등급 단조성 (지수 ↑ → 등급 ↑)
  - 캐시 만료 판정 일관성 (cachedAt + TTL = expiresAt)
  - 후보지 등록 idempotence (동일 코드 N회 등록 = 1회 등록)
  - 반경 필터링 포함 관계 (500m ⊆ 1km ⊆ 2km)
  - 비교 정렬 안정성 (동점 시 상대 순서 유지)
- **NFR-7.2**: Unit + Integration + E2E 테스트 모두 자동화 (Playwright for E2E).
- **NFR-7.3**: 외부 API 호출은 통합 테스트에서 mock 또는 sandbox 환경 사용.

### NFR-8: Deployability & Operability
- **NFR-8.1**: 운영 환경: AWS ECS Fargate (backend) + S3+CloudFront (frontend) + RDS PostgreSQL + ElastiCache Redis + ALB.
- **NFR-8.2**: 로컬 개발: Docker Compose (PostgreSQL + Redis + backend + frontend).
- **NFR-8.3**: 모니터링: CloudWatch Logs (구조화된 JSON 로그) + CloudWatch Metrics + CloudWatch Alarms.
- **NFR-8.4**: CI/CD: GitHub Actions
  - PR 시: lint + unit test + integration test + 보안 스캔
  - main push 시: staging 자동 배포
  - tag push 시: production 배포 (수동 승인 게이트)
- **NFR-8.5**: Infrastructure as Code: AWS CDK 또는 Terraform 사용.
- **NFR-8.6**: 환경 분리: development / staging / production (별도 AWS 계정 또는 별도 stack).

### NFR-9: Compliance & Privacy
- **NFR-9.1**: 사용자 개인정보(이름·주민등록번호·연락처·소득·신용점수 등) 일체 수집 금지.
- **NFR-9.2**: LocalStorage에 저장되는 데이터는 후보지 정보(법정동코드·별칭·등록 시각)만 포함.
- **NFR-9.3**: 운영자 계정은 이메일·비밀번호 해시·역할만 저장. 추가 PII 수집 금지.
- **NFR-9.4**: 외부 공공 API 이용 약관 준수 (호출 빈도 제한, 표시 의무 등).

---

## 5. Constraints & Assumptions

### 5.1 Constraints
- **C-1**: 공공 데이터 기반만 사용. 민간 사이트 크롤링·유료 데이터 구매 금지.
- **C-2**: 사용자 PII 수집 금지.
- **C-3**: 부동산 투자·중개·계약 기능 일체 제공 금지.
- **C-4**: 상용 지도 API(카카오맵·네이버맵 등) 사용 금지 (비용·정책상 이유).
- **C-5**: 후보지 최대 5개 등록.
- **C-6**: 비로그인 환경에서 사용자 데이터는 LocalStorage만 사용.

### 5.2 Assumptions
- **A-1**: 발급받은 공공 API 키는 일일 호출 한도 내에서 운영 가능 (캐싱으로 효율화).
- **A-2**: 법정동코드 API의 좌표 정보가 시설 검색에 충분한 정확도를 제공한다.
- **A-3**: 사용자는 한국 거주자이며 한국 내 동네를 검색한다.
- **A-4**: 운영자는 1~3명 수준의 소규모 팀.
- **A-5**: AWS 비용은 월 $100 이내로 통제 (소규모 트래픽 가정).

---

## 6. Key Requirements Summary

### 6.1 Critical Functional
- 법정동 단위 검색 → 후보지 등록(최대 5개) → 종합 리포트 생성 → 후보지 비교
- 6개 카테고리 점수 산정 (주거비/생활인프라/교통/환경/안전/데이터신뢰도)
- 운영자 패널 (API 상태·캐시·가중치·계정 관리)

### 6.2 Critical Non-Functional
- AWS ECS Fargate + RDS + ElastiCache + S3/CloudFront 배포
- WCAG 2.1 AA 준수
- Security Baseline 강제 (HTTPS, JWT, bcrypt, Rate Limit, Audit Log)
- PBT 강제 (10개 영역)
- CI/CD 자동화 (GitHub Actions)

### 6.3 Critical Constraints
- 비로그인 사용자, JWT 운영자
- LocalStorage만 사용 (서버 사용자 데이터 저장 금지)
- 공공 데이터 기반 (민간 데이터 금지)
- 부동산 투자·매물 기능 제외

---

## 7. Traceability

각 요구사항은 향후 단계에서 다음과 같이 추적된다:
- **User Stories**: FR/NFR 기반 사용자 스토리 작성
- **Application Design**: FR을 컴포넌트에 매핑
- **Units Generation**: 컴포넌트 그룹을 작업 단위로 분해
- **Functional Design**: 단위별 비즈니스 로직 상세화
- **NFR Design**: NFR을 패턴(Cache, Retry, Circuit Breaker 등)으로 매핑
- **Infrastructure Design**: NFR-8을 AWS 서비스에 매핑
- **Code Generation**: 모든 AC를 테스트로 검증
