// End-to-end MVP flow test: search → report → compare
const BASE = 'http://localhost:4000/api';

async function main() {
  console.log('=== 1. Search "강남구" ===');
  const sRes = await fetch(`${BASE}/search?q=${encodeURIComponent('강남구')}`);
  const sJson = await sRes.json();
  console.log(`status=${sRes.status}, results=${sJson.data?.results?.length}`);
  const first = sJson.data?.results?.[0];
  console.log(`first: ${first?.regionName} (${first?.regionCode}, sgg=${first?.sggCode})`);

  console.log('\n=== 2. Generate Report (역삼동) ===');
  const target = sJson.data?.results?.find((r) => r.regionName === '역삼동') ?? first;
  const params = new URLSearchParams({
    period: '6m',
    regionName: target.regionName,
    parentRegionName: target.parentRegionName,
    lat: '37.5006',
    lon: '127.0367',
  });
  const rRes = await fetch(`${BASE}/report/${target.regionCode}?${params}`);
  const rJson = await rRes.json();
  console.log(`totalScore=${rJson.data?.scoreResult?.totalScore}`);
  console.log('strengths:', rJson.data?.scoreResult?.strengths);
  console.log('cautions:', rJson.data?.scoreResult?.cautions);
  console.log('insufficient:', rJson.data?.scoreResult?.insufficientData);
  const price = rJson.data?.summaries?.price;
  if (price) {
    console.log('Price area groups:');
    for (const g of price.areaGroups) {
      console.log(
        `  ${g.areaRange}: count=${g.tradeCount}, median=${g.medianPrice}만원 ${g.isLowReliability ? '(신뢰도 낮음)' : ''}`,
      );
    }
  }
  const env = rJson.data?.summaries?.environment;
  if (env) {
    console.log(`Air quality: ${env.airQuality.grade} (KHAI ${env.airQuality.overallIndex}), 측정소=${env.airQuality.stationName}`);
  }

  console.log('\n=== 3. Compare two candidates ===');
  const cRes = await fetch(`${BASE}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidates: [
        {
          regionCode: target.regionCode,
          regionName: target.regionName,
          parentRegionName: target.parentRegionName,
          latitude: 37.5006,
          longitude: 127.0367,
        },
        {
          regionCode: '1141010100',
          regionName: '신길동',
          parentRegionName: '서울특별시 영등포구',
          latitude: 37.5067,
          longitude: 126.9171,
        },
      ],
      period: '6m',
    }),
  });
  const cJson = await cRes.json();
  console.log(`compare status=${cRes.status}`);
  if (cJson.data) {
    for (const r of cJson.data.reports) {
      console.log(`  ${r.regionName}: total=${r.scoreResult.totalScore}`);
    }
    console.log('strengthsWeaknesses:', cJson.data.strengthsWeaknesses);
    console.log('highlights:', cJson.data.highlights);
  } else {
    console.log(JSON.stringify(cJson, null, 2));
  }
}

main().catch((err) => console.error('FAIL:', err));
