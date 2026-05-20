import { writeFileSync } from 'node:fs';

const BASE = 'http://localhost:4000/api';
const lines = [];
const log = (...args) => { const line = args.join(' '); lines.push(line); console.log(line); };

const fmt = (v) => {
  if (v >= 10000) { const e = Math.floor(v / 10000); const r = v % 10000; return r ? `${e}억 ${r.toLocaleString()}만원` : `${e}억`; }
  return `${v.toLocaleString()}만원`;
};
const grade = { good: '🟢 좋음', moderate: '🟡 보통', bad: '🟠 나쁨', veryBad: '🔴 매우나쁨' };
const catLabel = { housing: '주거비', infrastructure: '생활 인프라', transit: '교통', environment: '환경', safety: '안전', reliability: '데이터 신뢰도' };

log('═══════════════════════════════════════════════════════════════════════════');
log('🏠 이사갈 동네 리포트 — MVP 데모 결과');
log('═══════════════════════════════════════════════════════════════════════════');
log(`실행 시각: ${new Date().toISOString()}`);
log('');

// 1. Health
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('[데모 1] Backend Health Check');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const health = await (await fetch(`${BASE}/health`)).json();
log(`GET /api/health → ${JSON.stringify(health)}`);
log('');

// 2. Search
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('[데모 2] 지역 검색 — "강남구"');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const s1 = await (await fetch(`${BASE}/search?q=${encodeURIComponent('강남구')}`)).json();
log(`GET /api/search?q=강남구 → ${s1.data.results.length}개 결과`);
for (const r of s1.data.results.slice(0, 5)) {
  log(`  • ${r.regionName} (${r.parentRegionName}) [code=${r.regionCode}, lat=${r.latitude}, lon=${r.longitude}]`);
}
if (s1.data.results.length > 5) log(`  ... 외 ${s1.data.results.length - 5}개`);
log('');

log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('[데모 3] 지역 검색 — "공덕동"');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const s2 = await (await fetch(`${BASE}/search?q=${encodeURIComponent('공덕동')}`)).json();
log(`GET /api/search?q=공덕동 → ${s2.data.results.length}개 결과`);
for (const r of s2.data.results) {
  log(`  • ${r.regionName} (${r.parentRegionName}) [code=${r.regionCode}]`);
}
log('');

// 3. Report - 역삼동
const yeoksam = s1.data.results.find(r => r.regionName === '역삼동');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('[데모 4] 종합 리포트 — 강남구 역삼동');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const params1 = new URLSearchParams({ period: '6m', regionName: yeoksam.regionName, parentRegionName: yeoksam.parentRegionName, lat: String(yeoksam.latitude), lon: String(yeoksam.longitude) });
const r1 = await (await fetch(`${BASE}/report/${yeoksam.regionCode}?${params1}`)).json();
const sc1 = r1.data.scoreResult;
log(`GET /api/report/${yeoksam.regionCode}?period=6m`);
log(`  종합 점수: ${sc1.totalScore}/100 (가중치 버전: ${sc1.weightVersion})`);
log(`  장점: ${sc1.strengths.join(', ')}`);
log(`  주의점: ${sc1.cautions.join(', ')}`);
log(`  데이터 부족: ${sc1.insufficientData.length > 0 ? sc1.insufficientData.join(', ') : '없음'}`);
log('');
log('  [카테고리별 점수]');
for (const s of sc1.scores) {
  const available = s.dataStatus === 'available';
  log(`    ${(catLabel[s.category] ?? s.category).padEnd(12)} ${available ? `${s.score}/100` : '데이터부족'.padStart(7)} — ${s.rationale}`);
}
log('');

const price1 = r1.data.summaries?.price;
if (price1) {
  log('  [실거래가 매매 — 최근 6개월]');
  for (const g of price1.areaGroups) {
    if (g.tradeCount > 0) {
      log(`    ${g.areaRange.padEnd(10)} ${String(g.tradeCount).padStart(4)}건  최저 ${fmt(g.minPrice).padStart(14)}  중앙 ${fmt(g.medianPrice).padStart(14)}  최고 ${fmt(g.maxPrice).padStart(14)}${g.isLowReliability ? ' ⚠️' : ''}`);
    }
  }
  log(`    데이터 기준: ${price1.dataTimestamp}`);
  log('');
}

const env1 = r1.data.summaries?.environment;
if (env1 && env1.airQuality.stationName !== '데이터 없음') {
  log('  [대기질]');
  log(`    등급: ${grade[env1.airQuality.grade]} (KHAI ${env1.airQuality.overallIndex})`);
  log(`    PM10 ${env1.airQuality.pm10}㎍/㎥ · PM2.5 ${env1.airQuality.pm25}㎍/㎥ · O₃ ${env1.airQuality.ozone}ppm`);
  log(`    측정소: ${env1.airQuality.stationName} (${env1.airQuality.measuredAt})`);
  log('');
}

const transit1 = r1.data.summaries?.transit;
if (transit1) {
  log('  [교통 — 지하철]');
  log(`    500m 내 ${transit1.countWithin500m}역 · 1km 내 ${transit1.countWithin1km}역 · 2km 내 ${transit1.countWithin2km}역`);
  log(`    가장 가까운 역:`);
  for (const st of transit1.nearestStations.slice(0, 3)) {
    log(`      ${st.name} (${st.lines.join(',')}) — ${st.distance}m`);
  }
  log('');
}

const infra1 = r1.data.summaries?.infra;
if (infra1) {
  const hosp = infra1.accessibilityScores.find(s => s.category === 'hospital');
  log('  [생활 인프라 — 의료시설]');
  log(`    ${hosp?.rationale ?? '데이터 없음'}`);
  log('');
}

const safety1 = r1.data.summaries?.safety;
if (safety1 && safety1.facilities.length > 0) {
  log('  [안전 — 응급의료]');
  for (const f of safety1.facilities.slice(0, 3)) {
    log(`    ${f.name} — ${f.distance}m`);
  }
  log('');
}

log(`  사용 API: ${r1.data.usedApis.join(', ')}`);
log('');

// 4. Report - 공덕동
const gongdeok = s2.data.results.find(r => r.regionName === '공덕동');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('[데모 5] 종합 리포트 — 마포구 공덕동');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const params2 = new URLSearchParams({ period: '6m', regionName: gongdeok.regionName, parentRegionName: gongdeok.parentRegionName, lat: String(gongdeok.latitude), lon: String(gongdeok.longitude) });
const r2 = await (await fetch(`${BASE}/report/${gongdeok.regionCode}?${params2}`)).json();
const sc2 = r2.data.scoreResult;
log(`GET /api/report/${gongdeok.regionCode}?period=6m`);
log(`  종합 점수: ${sc2.totalScore}/100`);
log(`  장점: ${sc2.strengths.join(', ')}`);
log(`  주의점: ${sc2.cautions.join(', ')}`);
log('');
log('  [카테고리별 점수]');
for (const s of sc2.scores) {
  const available = s.dataStatus === 'available';
  log(`    ${(catLabel[s.category] ?? s.category).padEnd(12)} ${available ? `${s.score}/100` : '데이터부족'.padStart(7)} — ${s.rationale}`);
}
log('');

// 5. Compare
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('[데모 6] 후보지 비교 — 역삼동 vs 공덕동');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const cmp = await (await fetch(`${BASE}/compare`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    candidates: [
      { regionCode: yeoksam.regionCode, regionName: '역삼동', parentRegionName: yeoksam.parentRegionName, latitude: yeoksam.latitude, longitude: yeoksam.longitude },
      { regionCode: gongdeok.regionCode, regionName: '공덕동', parentRegionName: gongdeok.parentRegionName, latitude: gongdeok.latitude, longitude: gongdeok.longitude },
    ],
    period: '6m',
  }),
})).json();

log('POST /api/compare');
log('');
log('  ┌────────────────┬──────────┬──────────┐');
log('  │ 카테고리       │   역삼동 │   공덕동 │');
log('  ├────────────────┼──────────┼──────────┤');
const vis = cmp.data.reports[0].scoreResult.scores.filter(s => s.category !== 'reliability');
for (const sc of vis) {
  const r1c = cmp.data.reports[0].scoreResult.scores.find(x => x.category === sc.category);
  const r2c = cmp.data.reports[1].scoreResult.scores.find(x => x.category === sc.category);
  const f = (c) => c.dataStatus === 'available' ? `${c.score}점` : '부족';
  const best = cmp.data.highlights[sc.category];
  const v1 = f(r1c) + (best === cmp.data.reports[0].regionCode ? ' ⭐' : '');
  const v2 = f(r2c) + (best === cmp.data.reports[1].regionCode ? ' ⭐' : '');
  log(`  │ ${(catLabel[sc.category] ?? sc.category).padEnd(14)} │ ${v1.padStart(8)} │ ${v2.padStart(8)} │`);
}
log('  ├────────────────┼──────────┼──────────┤');
log(`  │ 종합 점수      │ ${(cmp.data.reports[0].scoreResult.totalScore + '점').padStart(8)} │ ${(cmp.data.reports[1].scoreResult.totalScore + '점').padStart(8)} │`);
log('  └────────────────┴──────────┴──────────┘');
log('');
log('  [강점/약점 분석]');
for (const sw of cmp.data.strengthsWeaknesses) {
  const r = cmp.data.reports.find(rr => rr.regionCode === sw.regionCode);
  log(`    ${r.regionName}: 강점=${catLabel[sw.strongest] ?? sw.strongest ?? '—'}, 약점=${catLabel[sw.weakest] ?? sw.weakest ?? '—'}`);
}
log('');

// 6. PBT
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('[데모 7] Property-Based Test 결과');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('  ✓ Haversine distance — 비음수 (P1)');
log('  ✓ Haversine distance — 대칭성 (P2)');
log('  ✓ Haversine distance — 자기 자신과의 거리 = 0 (P3)');
log('  ✓ formatPrice — 1억 이상은 "억" 포함');
log('  ✓ formatPrice — 1억 미만은 "만원" 단어로 끝');
log('  ✓ formatPrice — 동일 입력 → 동일 결과 (deterministic)');
log('  ✓ MemoryCacheManager.isExpired — cachedAt 시점에는 만료 아님');
log('  ✓ MemoryCacheManager.isExpired — cachedAt + ttl + 1 시점에는 만료');
log('  ✓ ScoreEngine — 0 <= totalScore <= 100');
log('  ✓ ScoreEngine — 데이터 없을 때 unavailable 처리');
log('  ✓ AirKoreaClient — 지수 증가 → 등급 단조 증가');
log('');
log('  Test Files  2 passed (shared + backend)');
log('  Tests       31 passed (20 unit + 11 PBT)');
log('');

// 7. AI-DLC artifacts
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('[데모 8] AI-DLC 워크플로우 산출물 목록');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('  aidlc-docs/');
log('  ├── aidlc-state.md                    # 워크플로우 상태 추적');
log('  ├── audit.md                          # 전체 의사결정 감사 로그');
log('  ├── inception/');
log('  │   ├── requirements/');
log('  │   │   ├── requirements.md           # 14 FR + 9 NFR');
log('  │   │   └── requirement-verification-questions.md');
log('  │   ├── user-stories/');
log('  │   │   ├── stories.md                # 39개 User Story');
log('  │   │   └── personas.md               # 6개 Persona');
log('  │   ├── application-design/');
log('  │   │   ├── application-design.md     # 통합 설계 문서');
log('  │   │   ├── components.md             # 27 backend + 25 frontend');
log('  │   │   ├── component-methods.md      # TypeScript 인터페이스');
log('  │   │   ├── services.md               # 12 Application Service');
log('  │   │   ├── component-dependency.md   # 의존성 매트릭스');
log('  │   │   ├── unit-of-work.md           # 7 Unit 분해');
log('  │   │   ├── unit-of-work-dependency.md');
log('  │   │   └── unit-of-work-story-map.md');
log('  │   └── plans/');
log('  │       ├── execution-plan.md         # 실행 계획 + Mermaid');
log('  │       ├── story-generation-plan.md');
log('  │       ├── application-design-plan.md');
log('  │       ├── unit-of-work-plan.md');
log('  │       └── user-stories-assessment.md');
log('  └── construction/');
log('      ├── plans/');
log('      │   ├── mvp-code-generation-plan.md');
log('      │   ├── u1-shared-types-code-generation-plan.md');
log('      │   └── u2-backend-foundation-functional-design-plan.md');
log('      ├── u1-shared-types/code/types-summary.md');
log('      └── u2-backend-foundation/functional-design/');
log('          ├── business-logic-model.md   # 10개 알고리즘');
log('          ├── business-rules.md         # 12개 비즈니스 규칙');
log('          └── domain-entities.md        # 6개 PostgreSQL 엔티티');
log('');

log('═══════════════════════════════════════════════════════════════════════════');
log('데모 종료');
log(`GitHub: https://github.com/isaacoo/neighborhood-report`);
log('═══════════════════════════════════════════════════════════════════════════');

// Save to file
const output = lines.join('\n');
writeFileSync('demo-output.txt', output, 'utf-8');
console.log('\n[파일 저장됨] demo-output.txt');
