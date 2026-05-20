function DataSourcesPage() {
  const sources = [
    {
      name: '행정안전부 행정표준코드 법정동코드',
      url: 'https://www.data.go.kr/data/15077871/openapi.do',
      usage: '지역 검색 (법정동 단위)',
      updateCycle: '수시',
    },
    {
      name: '국토교통부 아파트 매매 실거래가 자료',
      url: 'https://www.data.go.kr/data/15058747/openapi.do',
      usage: '실거래가 분석 (매매)',
      updateCycle: '월 1회 (전월 데이터)',
    },
    {
      name: '한국환경공단 에어코리아 대기오염정보',
      url: 'https://www.data.go.kr/data/15073861/openapi.do',
      usage: '대기질 분석 (PM10, PM2.5, 오존, KHAI)',
      updateCycle: '실시간 (1시간 단위)',
    },
    {
      name: '건강보험심사평가원 병원정보서비스',
      url: 'https://www.data.go.kr/data/15001698/openapi.do',
      usage: '생활 인프라 (병원·약국 위치 및 접근성)',
      updateCycle: '월 1회',
    },
    {
      name: '기상청 단기예보 조회서비스',
      url: 'https://www.data.go.kr/data/15084084/openapi.do',
      usage: '기상 분석 (Post-MVP 예정)',
      updateCycle: '3시간 단위',
    },
    {
      name: 'OpenStreetMap 타일',
      url: 'https://www.openstreetmap.org/',
      usage: '후보지 카드 지도 미리보기',
      updateCycle: '실시간',
    },
    {
      name: '서울 열린데이터광장 지하철역 위치',
      url: 'https://data.seoul.go.kr/',
      usage: '교통 분석 (지하철역 좌표)',
      updateCycle: '정적 데이터 (연 1회 갱신)',
    },
  ];

  return (
    <div>
      <h1>데이터 출처</h1>
      <p className="subtitle">
        본 서비스는 정부 및 공공기관이 제공하는 공개 데이터만을 사용합니다.
        민간 사이트 크롤링이나 유료 데이터는 사용하지 않습니다.
      </p>

      <div style={{ marginTop: 24 }}>
        {sources.map((s) => (
          <div className="card" key={s.name} style={{ marginBottom: 12 }}>
            <div className="card-row">
              <div style={{ minWidth: 0 }}>
                <h3 style={{ marginBottom: 4 }}>{s.name}</h3>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {s.usage}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
                  갱신 주기: {s.updateCycle}
                </div>
              </div>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
              >
                출처 보기
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="notice-box" style={{ marginTop: 24 }}>
        <strong>데이터 처리 원칙</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 13 }}>
          <li>공공 API 응답의 원본값과 가공값을 분리하여 처리합니다.</li>
          <li>모든 점수에 산정 기준과 사용된 지표를 함께 표시합니다.</li>
          <li>데이터가 부족한 지역은 낮은 점수를 부여하지 않고 "데이터 부족"으로 표시합니다.</li>
          <li>API 호출 실패 시 이전 캐시 데이터를 사용하며, 데이터 기준 시점을 명확히 표시합니다.</li>
        </ul>
      </div>
    </div>
  );
}

export default DataSourcesPage;
