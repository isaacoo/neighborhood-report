function AboutPage() {
  return (
    <div>
      <h1>서비스 안내</h1>
      <p className="subtitle">이사 갈 동네 리포트는 공공 데이터 기반의 객관적인 동네 분석 서비스입니다.</p>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>🏠 서비스 소개</h3>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-muted)' }}>
          이사를 준비하면서 여러 동네를 비교하고 싶지만, 정보가 흩어져 있어 판단이 어려웠던 경험이 있으신가요?
          이사 갈 동네 리포트는 정부가 제공하는 공공 API 데이터를 수집·분석하여 후보 동네의 주거비, 생활 인프라,
          교통, 환경, 안전을 종합적으로 평가하고 비교할 수 있는 리포트를 제공합니다.
        </p>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>📊 분석 카테고리</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 12 }}>
          {[
            { icon: '💰', title: '주거비', desc: '아파트 매매 실거래가 기반 가격 수준 분석' },
            { icon: '🏥', title: '생활 인프라', desc: '병원·약국 등 의료시설 접근성' },
            { icon: '🚇', title: '교통', desc: '지하철역 접근성 및 노선 다양성' },
            { icon: '🌿', title: '환경', desc: '대기질 지수(KHAI) 기반 환경 쾌적성' },
            { icon: '🛡️', title: '안전', desc: '응급의료기관 접근성' },
          ].map((c) => (
            <div key={c.title} style={{ padding: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>⚖️ 점수 산정 방식 (v1.2.0)</h3>
        <table className="price-table" style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>카테고리</th>
              <th>가중치</th>
              <th>산정 기준</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>주거비</td><td>25%</td><td>대표 면적대 중앙값 (5억=100점, 30억=0점)</td></tr>
            <tr><td>생활 인프라</td><td>20%</td><td>500m/1km/2km 반경 의료시설 수</td></tr>
            <tr><td>교통</td><td>20%</td><td>가장 가까운 지하철역 거리 + 역 수</td></tr>
            <tr><td>환경</td><td>15%</td><td>KHAI 지수 (0=100점, 250=0점)</td></tr>
            <tr><td>안전</td><td>20%</td><td>가장 가까운 의료시설 거리 + 시설 수</td></tr>
          </tbody>
        </table>
        <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 8 }}>
          ※ 데이터 부족 카테고리는 점수 산정에서 제외되며, 가용 데이터로 정규화합니다.
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>🚫 제공하지 않는 기능</h3>
        <ul style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, paddingLeft: 20 }}>
          <li>부동산 투자 추천, 가격 예측, 수익률 계산</li>
          <li>부동산 매물 등록, 중개사 연결</li>
          <li>범죄율 기반 지역 순위화, 학교 서열화</li>
          <li>개인정보(주민등록번호, 소득, 신용점수) 수집</li>
          <li>머신러닝 기반 자동 추천</li>
        </ul>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>🔧 기술 스택</h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <div>Frontend: React 18 + TypeScript + Vite</div>
          <div>Backend: Node.js + Express + TypeScript</div>
          <div>데이터: 공공데이터포털 API 5종 + OpenStreetMap</div>
          <div>테스트: Vitest + fast-check (Property-Based Testing)</div>
          <div>개발 방법론: AI-DLC (AI-Driven Development Life Cycle)</div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
