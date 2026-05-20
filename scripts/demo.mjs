// 데모 시나리오: 가족 이사 예정자가 강남구 vs 마포구 비교
const BASE = 'http://localhost:4000/api';

const fmt = (v) => {
  if (v === null || v === undefined) return '—';
  if (v >= 10000) {
    const eok = Math.floor(v / 10000);
    const rem = v % 10000;
    return rem ? `${eok}억 ${rem.toLocaleString()}만원` : `${eok}억`;
  }
  return `${v.toLocaleString()}만원`;
};

const grade = { good: '🟢 좋음', moderate: '🟡 보통', bad: '🟠 나쁨', veryBad: '🔴 매우나쁨' };

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🏠 이사갈 동네 리포트 — 데모');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('시나리오: 가족 이사 예정자가 "강남구 역삼동" vs "마포구 공덕동" 비교\n');

console.log('[1/4] 🔍 검색');
const s1 = await (await fetch(`${BASE}/search?q=${encodeURIComponent('강남구')}`)).json();
console.log(`     "강남구" → ${s1.data.results.length}개 결과`);
const s2 = await (await fetch(`${BASE}/search?q=${encodeURIComponent('공덕동')}`)).json();
console.log(`     "공덕동" → ${s2.data.results.length}개 결과`);

const yeoksamdong = s1.data.results.find((r) => r.regionName === '역삼동');
const gongdeokdong = s2.data.results.find((r) => r.regionName === '공덕동');

console.log(`\n[2/4] 📋 후보지 등록`);
console.log(`     ✓ 역삼동 (lat=${yeoksamdong.latitude}, lon=${yeoksamdong.longitude})`);
console.log(`     ✓ 공덕동 (lat=${gongdeokdong.latitude}, lon=${gongdeokdong.longitude})`);

console.log('\n[3/4] 📊 단일 리포트 (역삼동)');
const params = new URLSearchParams({
  period: '6m',
  regionName: yeoksamdong.regionName,
  parentRegionName: yeoksamdong.parentRegionName,
  lat: String(yeoksamdong.latitude ?? ''),
  lon: String(yeoksamdong.longitude ?? ''),
});
const r1 = await (await fetch(`${BASE}/report/${yeoksamdong.regionCode}?${params}`)).json();
const score = r1.data.scoreResult;
console.log(`     종합 점수: ${score.totalScore}점`);
console.log(`     장점: ${score.strengths.join(', ') || '없음'}`);
console.log(`     주의점: ${score.cautions.join(', ') || '없음'}`);
console.log(`     데이터 부족: ${score.insufficientData.join(', ') || '없음'}`);

const transit = r1.data.summaries?.transit;
if (transit) {
  console.log(`\n     🚇 교통: 500m ${transit.countWithin500m}역, 1km ${transit.countWithin1km}역, 2km ${transit.countWithin2km}역`);
  console.log(`        가장 가까운 역: ${transit.nearestStations.slice(0, 3).map((s) => `${s.name}(${s.distance}m)`).join(', ')}`);
}

const infra = r1.data.summaries?.infra;
if (infra) {
  const hospitalCat = infra.accessibilityScores.find((s) => s.category === 'hospital');
  console.log(`\n     🏥 의료시설: ${hospitalCat?.rationale ?? '데이터 없음'}`);
}

const safety = r1.data.summaries?.safety;
if (safety && safety.facilities.length > 0) {
  console.log(`\n     🚨 가장 가까운 응급의료시설: ${safety.facilities[0].name} (${safety.facilities[0].distance}m)`);
}

const env = r1.data.summaries?.environment;
if (env && env.airQuality.stationName !== '데이터 없음') {
  const aq = env.airQuality;
  console.log(`\n     💨 대기질: ${grade[aq.grade]} KHAI ${aq.overallIndex} | 측정소 ${aq.stationName}`);
}

console.log('\n[4/4] 🆚 후보지 비교');
const compare = await (
  await fetch(`${BASE}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidates: [
        {
          regionCode: yeoksamdong.regionCode,
          regionName: '역삼동',
          parentRegionName: yeoksamdong.parentRegionName,
          latitude: yeoksamdong.latitude,
          longitude: yeoksamdong.longitude,
        },
        {
          regionCode: gongdeokdong.regionCode,
          regionName: '공덕동',
          parentRegionName: gongdeokdong.parentRegionName,
          latitude: gongdeokdong.latitude,
          longitude: gongdeokdong.longitude,
        },
      ],
      period: '6m',
    }),
  })
).json();

const labels = {
  housing: '주거비',
  infrastructure: '생활 인프라',
  transit: '교통',
  environment: '환경',
  safety: '안전',
  reliability: '데이터 신뢰도',
};

console.log('\n     ┌────────────────────┬─────────┬──────────┐');
console.log('     │ 카테고리           │  역삼동 │  공덕동  │');
console.log('     ├────────────────────┼─────────┼──────────┤');
const visibleScores = compare.data.reports[0].scoreResult.scores.filter((s) => s.category !== 'reliability');
for (const sc of visibleScores) {
  const r1c = compare.data.reports[0].scoreResult.scores.find((x) => x.category === sc.category);
  const r2c = compare.data.reports[1].scoreResult.scores.find((x) => x.category === sc.category);
  const fmt2 = (c) => (c.dataStatus === 'available' ? `${c.score}점` : '데이터부족');
  const lbl = labels[sc.category] ?? sc.category;
  const winner = compare.data.highlights[sc.category];
  const v1 = fmt2(r1c) + (winner === compare.data.reports[0].regionCode ? ' ⭐' : '');
  const v2 = fmt2(r2c) + (winner === compare.data.reports[1].regionCode ? ' ⭐' : '');
  console.log(`     │ ${lbl.padEnd(18)} │ ${v1.padStart(7)} │ ${v2.padStart(8)} │`);
}
console.log('     ├────────────────────┼─────────┼──────────┤');
console.log(`     │ 종합 점수          │ ${(compare.data.reports[0].scoreResult.totalScore + '점').padStart(7)} │ ${(compare.data.reports[1].scoreResult.totalScore + '점').padStart(8)} │`);
console.log('     └────────────────────┴─────────┴──────────┘');

const r1Rel = compare.data.reports[0].scoreResult.scores.find((s) => s.category === 'reliability');
const r2Rel = compare.data.reports[1].scoreResult.scores.find((s) => s.category === 'reliability');
console.log(`     (메타) 데이터 신뢰도  역삼동 ${r1Rel?.score ?? '—'}점 · 공덕동 ${r2Rel?.score ?? '—'}점`);

console.log('\n     강점/약점 분석:');
for (const sw of compare.data.strengthsWeaknesses) {
  const r = compare.data.reports.find((rr) => rr.regionCode === sw.regionCode);
  console.log(
    `        ${r.regionName}: 강점=${labels[sw.strongest] ?? sw.strongest ?? '—'}, 약점=${labels[sw.weakest] ?? sw.weakest ?? '—'}`,
  );
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('데모 종료. 브라우저에서 http://localhost:3000 접속 시 동일한 흐름을 UI로 사용 가능');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
