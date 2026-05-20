import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { PricePeriod } from '@neighborhood-report/shared';
import { getReport, ReportWithSummaries } from '../infrastructure/apiClient';
import { formatPrice } from '../infrastructure/format';
import RadarChart from '../components/RadarChart';
import { CATEGORY_ICONS, ChevronLeft } from '../components/Icons';

const CATEGORY_LABELS: Record<string, string> = {
  housing: '주거비',
  infrastructure: '생활 인프라',
  transit: '교통',
  environment: '환경',
  safety: '안전',
  reliability: '데이터 신뢰도',
};

const VISIBLE_CATEGORIES = ['housing', 'infrastructure', 'transit', 'environment', 'safety'];

function ReportPage() {
  const { regionCode } = useParams<{ regionCode: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const regionName = searchParams.get('regionName') ?? '(미지정)';
  const parentRegionName = searchParams.get('parentRegionName') ?? '';
  const lat = parseFloat(searchParams.get('lat') ?? '') || null;
  const lon = parseFloat(searchParams.get('lon') ?? '') || null;
  const period = ((searchParams.get('period') as PricePeriod) ?? '6m') as PricePeriod;

  const [report, setReport] = useState<ReportWithSummaries | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!regionCode) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getReport(regionCode, { period, regionName, parentRegionName, lat, lon });
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '리포트 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionCode, period]);

  const setPeriod = (p: PricePeriod) => {
    const next = new URLSearchParams(searchParams);
    next.set('period', p);
    setSearchParams(next);
  };

  if (loading) {
    return (
      <div className="empty" style={{ marginTop: 40 }}>
        <div className="empty-icon">⏳</div>
        <h3>리포트를 생성하는 중입니다</h3>
        <p>외부 공공 API 데이터를 수집하고 있습니다. 잠시만 기다려주세요.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="topbar">
          <button type="button" className="topbar-back" onClick={() => navigate(-1)}>
            <ChevronLeft width={14} height={14} /> 뒤로
          </button>
        </div>
        <div className="error-box">
          <strong>리포트 생성 실패</strong>
          <div style={{ marginTop: 4 }}>{error}</div>
        </div>
        <button type="button" className="btn btn-primary" onClick={fetchReport} style={{ marginTop: 16 }}>
          재시도
        </button>
      </div>
    );
  }

  if (!report) return null;

  const score = report.scoreResult;
  const price = report.summaries?.price;
  const env = report.summaries?.environment;
  const transit = report.summaries?.transit;
  const safety = report.summaries?.safety;

  const visibleScores = score.scores.filter((s) => VISIBLE_CATEGORIES.includes(s.category));
  const reliability = score.scores.find((s) => s.category === 'reliability');

  const radarPoints = visibleScores.map((s) => ({
    label: CATEGORY_LABELS[s.category] ?? s.category,
    value: s.score,
    available: s.dataStatus === 'available',
  }));

  return (
    <div>
      <div className="topbar">
        <button type="button" className="topbar-back" onClick={() => navigate(-1)}>
          <ChevronLeft width={14} height={14} /> 뒤로
        </button>
        <div className="topbar-actions">
          <Link to="/candidates" className="btn">내 후보지</Link>
          <Link to="/compare" className="btn">비교하기</Link>
        </div>
      </div>

      <div className="report-header">
        <div className="report-hero">
          <div className="report-hero-content">
            <span className="report-hero-badge">내 후보지</span>
            <div className="report-hero-title">{regionName}</div>
            <div className="report-hero-subtitle">{parentRegionName}</div>
          </div>
        </div>
      </div>

      <div className="score-hero" style={{ marginBottom: 24 }}>
        <div className="score-hero-left">
          <div>
            <div className="score-hero-label">종합 점수</div>
            <div>
              <span className="score-hero-value">{score.totalScore}</span>
              <span className="score-hero-max">/100</span>
            </div>
          </div>
        </div>
        <div className="score-hero-rank">
          {score.strengths.length > 0 && (
            <>
              <div>강점 <strong>{score.strengths[0]?.split(':')[0] && CATEGORY_LABELS[score.strengths[0].split(':')[0]] || ''}</strong></div>
              <div style={{ marginTop: 4 }}>주의 <strong>{score.cautions[0]?.split(':')[0] && CATEGORY_LABELS[score.cautions[0].split(':')[0]] || '—'}</strong></div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>분야별 점수</h3>
        </div>

        <div className="radar-section">
          <div className="radar-wrap">
            <RadarChart points={radarPoints} size={300} />
          </div>

          <div className="category-list">
            {visibleScores.map((s) => {
              const Icon = CATEGORY_ICONS[s.category];
              const available = s.dataStatus === 'available';
              return (
                <div key={s.category} className="category-row">
                  <div className={`row-icon ${s.category}`}>
                    {Icon ? <Icon width={20} height={20} /> : null}
                  </div>
                  <div className="row-meta">
                    <div className="label">{CATEGORY_LABELS[s.category]}</div>
                    <div className="desc">{s.rationale}</div>
                  </div>
                  <div className="row-score">
                    {available ? <>{s.score}<span className="row-score-max">/100</span></> : <span style={{ color: 'var(--text-subtle)' }}>데이터 부족</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {reliability && (
          <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            ※ 데이터 신뢰도(메타): {reliability.score}/100 — {reliability.rationale}
          </div>
        )}
      </div>

      {price && (
        <>
          <div className="card-header" style={{ marginTop: 28 }}>
            <h2 style={{ margin: 0 }}>실거래가 (매매)</h2>
            <div className="tabs">
              {(['3m', '6m', '12m'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`tab ${period === p ? 'active' : ''}`}
                  onClick={() => setPeriod(p)}
                >
                  최근 {p === '3m' ? '3개월' : p === '6m' ? '6개월' : '12개월'}
                </button>
              ))}
            </div>
          </div>
          <div className="card card-flush">
            <table className="price-table">
              <thead>
                <tr>
                  <th>면적대</th>
                  <th>거래 건수</th>
                  <th>최저가</th>
                  <th>중앙값</th>
                  <th>최고가</th>
                </tr>
              </thead>
              <tbody>
                {price.areaGroups.map((g) => (
                  <tr key={g.areaRange}>
                    <td>{g.areaRange}</td>
                    <td>
                      {g.tradeCount}건{' '}
                      {g.isLowReliability && g.tradeCount > 0 && (
                        <span className="tag warn" style={{ marginLeft: 4 }}>신뢰도 낮음</span>
                      )}
                    </td>
                    <td>{g.tradeCount > 0 ? formatPrice(g.minPrice) : '—'}</td>
                    <td>{g.tradeCount > 0 ? formatPrice(g.medianPrice) : '—'}</td>
                    <td>{g.tradeCount > 0 ? formatPrice(g.maxPrice) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 8 }}>
            데이터 기준 시각: {new Date(price.dataTimestamp).toLocaleString()}
          </div>
        </>
      )}

      {transit && transit.countWithin2km > 0 && (
        <>
          <h2>교통 (지하철)</h2>
          <div className="card">
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
              <Stat label="500m 이내" value={`${transit.countWithin500m}개역`} />
              <Stat label="1km 이내" value={`${transit.countWithin1km}개역`} />
              <Stat label="2km 이내" value={`${transit.countWithin2km}개역`} />
            </div>
            <h3 style={{ marginBottom: 8 }}>가장 가까운 지하철역</h3>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {transit.nearestStations.map((s, i) => (
                <li key={`${s.name}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <strong>{s.name}</strong>
                    <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>{s.lines.join(', ')}호선</span>
                  </div>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{s.distance}m</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {env && env.airQuality.stationName !== '데이터 없음' && (
        <>
          <h2>대기질</h2>
          <div className="card">
            <div className="card-row">
              <div>
                <span className={`air-grade ${env.airQuality.grade}`}>
                  {env.airQuality.grade === 'good' && '🟢 좋음'}
                  {env.airQuality.grade === 'moderate' && '🟡 보통'}
                  {env.airQuality.grade === 'bad' && '🟠 나쁨'}
                  {env.airQuality.grade === 'veryBad' && '🔴 매우나쁨'}
                </span>
                <div style={{ marginTop: 12, fontSize: 14 }}>
                  통합대기환경지수(KHAI): <strong>{env.airQuality.overallIndex}</strong>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                  PM10 {env.airQuality.pm10}㎍/㎥ · PM2.5 {env.airQuality.pm25}㎍/㎥ · 오존 {env.airQuality.ozone}ppm
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-subtle)' }}>
                  측정소: {env.airQuality.stationName} · 측정 시각: {env.airQuality.measuredAt}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-subtle)' }}>
              ※ 단일 측정소 지표는 전체 지역 환경을 대표하지 않습니다.
            </div>
          </div>
        </>
      )}

      {safety && safety.facilities.length > 0 && (
        <>
          <h2>안전 인프라 (응급의료)</h2>
          <div className="card">
            <h3 style={{ marginBottom: 8 }}>가장 가까운 의료시설</h3>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {safety.facilities.map((f, i) => (
                <li key={`${f.name}-${i}`} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{f.name}</strong>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{f.distance}m</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>{f.address}</div>
                </li>
              ))}
            </ul>
            <div className="notice-box" style={{ marginTop: 16, fontSize: 12 }}>
              ※ 안전 정보는 절대적 판단이 아닌 참고 지표입니다.
              범죄율 등 지역 낙인을 유발할 수 있는 지표는 점수 산정에서 제외되었습니다.
            </div>
          </div>
        </>
      )}

      <h2>사용된 공공 API</h2>
      <div className="card">
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
          {report.usedApis.map((a) => (<li key={a}>{a}</li>))}
        </ul>
      </div>

      <div className="notice-box" style={{ marginTop: 24, fontSize: 13 }}>
        {report.disclaimer}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

export default ReportPage;
