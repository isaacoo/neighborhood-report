import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { PricePeriod } from '@neighborhood-report/shared';
import { compareCandidates, CompareData } from '../infrastructure/apiClient';
import { useCandidates } from '../infrastructure/CandidatesContext';
import { getMapTileUrl } from '../infrastructure/mapTile';
import { ChevronLeft, EditIcon } from '../components/Icons';

const CATEGORY_LABEL: Record<string, string> = {
  housing: '주거비',
  infrastructure: '생활 인프라',
  transit: '교통',
  environment: '환경',
  safety: '안전',
};

const VISIBLE_CATEGORIES = ['housing', 'infrastructure', 'transit', 'environment', 'safety'];

function ComparisonPage() {
  const { candidates, removeCandidate } = useCandidates();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PricePeriod>('6m');
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const refresh = async () => {
    if (candidates.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await compareCandidates(
        candidates.map((c) => ({
          regionCode: c.regionCode,
          regionName: c.alias ?? c.regionName,
          parentRegionName: c.parentRegionName,
          latitude: c.latitude,
          longitude: c.longitude,
        })),
        period,
        sortBy,
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '비교에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, sortBy, candidates.length]);

  if (candidates.length < 2) {
    return (
      <div>
        <div className="topbar">
          <button type="button" className="topbar-back" onClick={() => navigate(-1)}>
            <ChevronLeft width={14} height={14} /> 뒤로
          </button>
        </div>
        <div className="empty">
          <div className="empty-icon">⚖️</div>
          <h3>비교할 후보지가 부족해요</h3>
          <p>비교를 위해 최소 2개의 후보지를 등록해주세요.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>검색하러 가기</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="topbar">
        <button type="button" className="topbar-back" onClick={() => navigate(-1)}>
          <ChevronLeft width={14} height={14} /> 뒤로
        </button>
        <div className="topbar-actions">
          <button
            type="button"
            className={`btn btn-sm ${editing ? 'btn-primary' : ''}`}
            onClick={() => setEditing(!editing)}
          >
            <EditIcon /> {editing ? '완료' : '편집'}
          </button>
        </div>
      </div>

      <h1>리포트 비교</h1>
      <p className="subtitle" style={{ marginBottom: 24 }}>
        최대 5개 지역을 동시에 비교할 수 있습니다.
      </p>

      <div className="compare-cards" style={{ gridTemplateColumns: `repeat(${candidates.length}, 1fr)` }}>
        {candidates.map((c) => {
          const r = data?.reports.find((x) => x.regionCode === c.regionCode);
          const mapUrl = getMapTileUrl(c.latitude, c.longitude);
          return (
            <div className="compare-card" key={c.id}>
              {editing && (
                <button
                  type="button"
                  className="remove"
                  onClick={() => removeCandidate(c.id)}
                  aria-label="삭제"
                >
                  ✕
                </button>
              )}
              <div
                className="thumb"
                style={mapUrl ? {
                  backgroundImage: `url(${mapUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                } : undefined}
              />
              <div style={{ minWidth: 0 }}>
                <div className="name">{c.alias ?? c.regionName}</div>
                <div className="parent">{c.parentRegionName}</div>
                <div className="total" style={{ marginTop: 6 }}>
                  {r ? r.scoreResult.totalScore : '—'}
                  <span style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 500, marginLeft: 2 }}>/100</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>기간:</span>
        <div className="tabs">
          {(['3m', '6m', '12m'] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`tab ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === '3m' ? '3개월' : p === '6m' ? '6개월' : '12개월'}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--text-muted)' }}>정렬:</span>
        <select
          value={sortBy ?? ''}
          onChange={(e) => setSortBy(e.target.value || undefined)}
          style={{ padding: '8px 12px', fontSize: 13 }}
        >
          <option value="">기본 (등록순)</option>
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v} 점수 높은 순</option>
          ))}
        </select>
      </div>

      {loading && <p>비교 결과를 생성하는 중입니다...</p>}
      {error && (
        <div className="error-box">
          {error}
          <button type="button" className="btn btn-sm" onClick={refresh} style={{ marginLeft: 8 }}>재시도</button>
        </div>
      )}

      {data && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="compare-table" data-testid="compare-table">
              <thead>
                <tr>
                  <th></th>
                  {data.reports.map((r) => (
                    <th key={r.regionCode}>{r.regionName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="row-total">
                  <td><strong>종합 점수</strong></td>
                  {data.reports.map((r) => (
                    <td key={r.regionCode}>
                      <span className="val">{r.scoreResult.totalScore}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-subtle)', marginLeft: 2 }}>/100</span>
                    </td>
                  ))}
                </tr>
                {VISIBLE_CATEGORIES.map((cat) => (
                  <tr key={cat}>
                    <td>{CATEGORY_LABEL[cat] ?? cat}</td>
                    {data.reports.map((r) => {
                      const cell = r.scoreResult.scores.find((x) => x.category === cat);
                      const isBest = data.highlights[cat] === r.regionCode;
                      const isAvailable = cell?.dataStatus === 'available';
                      return (
                        <td
                          key={r.regionCode}
                          className={`${isBest && isAvailable ? 'cell-best' : ''} ${!isAvailable ? 'cell-na' : ''}`.trim()}
                        >
                          {isAvailable ? <span className="val">{cell!.score}</span> : '데이터 부족'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="row-meta">
                  <td>데이터 신뢰도 (메타)</td>
                  {data.reports.map((r) => {
                    const cell = r.scoreResult.scores.find((x) => x.category === 'reliability');
                    return (
                      <td key={r.regionCode}>{cell?.score ?? '—'}</td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card" style={{ marginTop: 24, background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)', border: '1px solid #dbeafe' }}>
            <div className="card-row">
              <div>
                <h3>비교 인사이트</h3>
                <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                  각 후보지의 강점과 약점을 한눈에 확인해보세요.
                </p>
              </div>
            </div>
            <div className="candidate-grid" style={{ marginTop: 16 }}>
              {data.reports.map((r) => {
                const sw = data.strengthsWeaknesses.find((x) => x.regionCode === r.regionCode);
                return (
                  <div key={r.regionCode} className="card" style={{ padding: 16, background: 'white' }}>
                    <h3 style={{ fontSize: 14 }}>{r.regionName}</h3>
                    <div style={{ marginTop: 8, fontSize: 13 }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>강점</span>
                        <strong style={{ color: 'var(--accent)' }}>
                          {sw?.strongest ? CATEGORY_LABEL[sw.strongest] ?? sw.strongest : '—'}
                        </strong>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>약점</span>
                        <strong style={{ color: 'var(--bad)' }}>
                          {sw?.weakest ? CATEGORY_LABEL[sw.weakest] ?? sw.weakest : '—'}
                        </strong>
                      </div>
                    </div>
                    <Link
                      to={`/reports/${r.regionCode}?regionName=${encodeURIComponent(r.regionName)}&parentRegionName=${encodeURIComponent(r.parentRegionName)}`}
                      className="btn btn-sm"
                      style={{ marginTop: 12, width: '100%' }}
                    >
                      상세 리포트 보기
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ComparisonPage;
