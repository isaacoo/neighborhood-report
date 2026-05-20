# Business Logic Model — U-4 user-features

## BLM-1. ScoreEngine.calculate (v1.2.0-mvp)

**Purpose**: 5개 카테고리 점수를 가중 평균하여 종합 점수 산출.

```
Input: { price?, infra?, environment?, transit?, safety? }
Output: ScoreResult (totalScore 0~100, per-category scores, strengths, cautions)

1. 각 카테고리별 점수 산정 (scoreFor)
2. 가용 카테고리만 가중 합산:
   weighted = Σ (score_i / maxScore_i) × weight_i  (for available only)
   totalWeight = Σ weight_i (for available only)
   totalScore = round((weighted / totalWeight) × 100)
3. reliability는 메타 정보로만 표시 (종합 합산 제외)
4. strengths = 상위 2개 카테고리 (점수 내림차순)
5. cautions = 하위 2개 카테고리 (점수 오름차순)
6. insufficientData = dataStatus !== 'available'인 카테고리 목록
```

**가중치 (v1.2.0-mvp)**:
| Category | Weight |
|----------|--------|
| housing | 0.25 |
| infrastructure | 0.20 |
| transit | 0.20 |
| environment | 0.15 |
| safety | 0.20 |

**Property**: 0 ≤ totalScore ≤ 100 (PBT 검증됨)

---

## BLM-2. Housing Score (주거비)

```
Input: PriceSummary (면적대별 거래 데이터)
Output: CategoryScore (0~100)

1. 대표 면적대 선택 (우선순위: 84~135㎡ > 59~84㎡ > ~59㎡ > 135㎡~)
2. 중앙값 기반 선형 보간:
   - 5억(50,000만원) = 100점
   - 30억(300,000만원) = 0점
   - raw = 100 - ((median - 50000) / (300000 - 50000)) × 100
3. 신뢰도 페널티: 총 거래 30건 미만 → -10점
4. score = max(0, round(raw - penalty))
```

**Rationale**: 가격이 낮을수록 주거비 부담이 적어 점수 높음. 강남(29.5억 중앙) → 2점, 마포(14.8억) → 61점.

---

## BLM-3. Infrastructure Score (생활 인프라)

```
Input: InfraResult (병원 + 약국 반경별 시설 수)
Output: CategoryScore (0~100)

1. 카테고리별 접근성 점수:
   raw = (500m 내 시설 수 × 5) + (1km 초과분 × 2) + (2km 초과분 × 1)
   score = min(100, raw)
2. 병원 + 약국 평균:
   avg = round((hospital_score + pharmacy_score) / 2)
```

**Property**: 500m ⊆ 1km ⊆ 2km (반경 포함 관계)

---

## BLM-4. Transit Score (교통)

```
Input: TransitResult (정적 지하철역 좌표 기반)
Output: CategoryScore (0~100)

1. 가장 가까운 역까지 거리 기반 base score:
   ≤300m → 100, ≤500m → 90, ≤800m → 75, ≤1200m → 55, ≤2000m → 30, else → 10
2. 환승 가산점: min(15, 1km 내 역 수 × 2)
3. score = min(100, base + transferBonus)
```

---

## BLM-5. Environment Score (환경)

```
Input: EnvironmentResult (KHAI 통합대기환경지수)
Output: CategoryScore (0~100)

1. KHAI 선형 보간: 0=100점, 250=0점
   raw = 100 - (khai / 250) × 100
2. score = round(max(0, min(100, raw)))
```

**Property**: 지수 증가 → 등급 단조 증가 (PBT 검증됨)

---

## BLM-6. Safety Score (안전)

```
Input: SafetyResult (HIRA 병원 proximity 기반)
Output: CategoryScore (0~100)

1. 가장 가까운 의료시설 거리 기반 base:
   ≤500m → 100, ≤1000m → 85, ≤2000m → 65, ≤5000m → 40, else → 20
2. 2km 내 시설 수 보너스: min(10, count)
3. score = min(100, base + countBonus)
```

---

## BLM-7. PriceAnalyzer.groupByArea

```
Input: TradeDetail[] (개별 거래 목록)
Output: AreaPriceGroup[] (4개 면적대)

면적대 분류:
  ~59㎡: 0 ≤ area < 59
  59~84㎡: 59 ≤ area < 84
  84~135㎡: 84 ≤ area < 135
  135㎡~: 135 ≤ area

각 그룹:
  prices = sort(trades.map(t => t.price))
  minPrice = prices[0]
  maxPrice = prices[last]
  medianPrice = prices[mid] (홀수) or avg(prices[mid-1], prices[mid]) (짝수)
  isLowReliability = (count < 5)
```

**Property**: min ≤ median ≤ max (PBT 검증 대상)

---

## BLM-8. ComparisonEngine.sortByCategory

```
Input: Report[], category
Output: Report[] (안정 정렬)

1. 각 report에서 해당 category의 score 추출 (unavailable → -1)
2. 내림차순 정렬
3. 동점 시 원래 인덱스 유지 (안정 정렬)
```

**Property**: 정렬 후 선택 기준 내림차순, 동점 상대 순서 유지

---

## BLM-9. Haversine Distance

```
Input: (lat1, lon1, lat2, lon2)
Output: distance in meters (≥0)

R = 6371000 (지구 반지름 m)
dLat = toRad(lat2 - lat1)
dLon = toRad(lon2 - lon1)
a = sin²(dLat/2) + cos(lat1) × cos(lat2) × sin²(dLon/2)
c = 2 × atan2(√a, √(1-a))
distance = R × c
```

**Properties** (PBT 검증됨):
- P1: distance ≥ 0 (비음수)
- P2: d(A,B) = d(B,A) (대칭)
- P3: d(A,A) = 0 (자기 자신)

---

## BLM-10. formatPrice

```
Input: priceInManWon (만원 단위 정수)
Output: 한국식 가격 문자열

if price ≥ 10000:
  eok = floor(price / 10000)
  remainder = price % 10000
  return remainder > 0 ? "${eok}억 ${remainder.toLocaleString()}만원" : "${eok}억"
else:
  return "${price.toLocaleString()}만원"
```

**Properties** (PBT 검증됨):
- P1: ≥10000 → "억" 포함
- P2: <10000 → "만원"으로 끝
- P3: deterministic (동일 입력 → 동일 결과)
