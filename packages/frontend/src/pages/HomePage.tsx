import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import type { RegionSearchResult } from '@neighborhood-report/shared';
import { searchRegions } from '../infrastructure/apiClient';
import { useCandidates } from '../infrastructure/CandidatesContext';
import { getMapTileUrl } from '../infrastructure/mapTile';
import {
  SearchIcon,
  PlusIcon,
  ChevronRight,
} from '../components/Icons';

function HomePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RegionSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);
  const { addCandidate, candidates } = useCandidates();

  const onSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await searchRegions(query.trim());
      setResults(data.results);
      setSuggestions(data.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색에 실패했습니다.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (r: RegionSearchResult) => {
    const aliasInput = window.prompt(`별칭을 입력하세요 (선택, 30자 이내).\n예: 회사 근처`, '');
    const result = addCandidate({
      regionCode: r.regionCode,
      regionName: r.regionName,
      parentRegionName: r.parentRegionName,
      alias: aliasInput,
      latitude: r.latitude,
      longitude: r.longitude,
    });
    if ('error' in result) {
      setToast({ message: result.error, isError: true });
    } else {
      setToast({ message: `"${r.regionName}" 후보지로 등록되었습니다.` });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const isAlreadyAdded = (regionCode: string) =>
    candidates.some((c) => c.regionCode === regionCode);

  return (
    <div>
      <div className="topbar">
        <div>
          <h1 className="welcome">
            <span className="welcome-emoji">👋</span>
            안녕하세요, 이사 갈 동네를 찾아볼까요?
          </h1>
          <p className="welcome-sub">공공 데이터를 기반으로 객관적이고 투명한 동네 분석 리포트를 제공합니다.</p>
        </div>
      </div>

      <form className="search-box" onSubmit={onSearch} style={{ marginBottom: 32 }}>
        <SearchIcon />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="지역명으로 검색 (예: 마포구, 강남구, 한강대)"
          maxLength={100}
          aria-label="지역 검색"
          data-testid="search-input"
        />
        <button type="submit" className="btn btn-primary" disabled={loading} data-testid="search-submit">
          {loading ? '검색중' : '검색'}
        </button>
      </form>

      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

      {results.length === 0 && suggestions.length > 0 && (
        <div className="notice-box" style={{ marginBottom: 16 }}>
          <strong>검색 결과가 없습니다.</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            {suggestions.map((s) => (<li key={s}>{s}</li>))}
          </ul>
        </div>
      )}

      {results.length > 0 && (
        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card-header">
            <div>
              <h3>검색 결과</h3>
              <div className="subtitle">{results.length}개의 지역</div>
            </div>
            <span className="tag accent">현재 등록 {candidates.length}/5</span>
          </div>
          <ul className="result-list" data-testid="search-results">
            {results.map((r) => {
              const added = isAlreadyAdded(r.regionCode);
              return (
                <li className="result-item" key={r.regionCode}>
                  <div>
                    <div className="result-name">{r.regionName}</div>
                    <div className="result-parent">{r.parentRegionName}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {added && <span className="tag">등록됨</span>}
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => handleAdd(r)}
                      disabled={added || candidates.length >= 5}
                      data-testid={`add-candidate-${r.regionCode}`}
                    >
                      {added ? '등록됨' : '+ 후보지 등록'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="card-header" style={{ marginTop: 8 }}>
        <h2 style={{ margin: 0 }}>내 후보지</h2>
        <Link to="/candidates" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          전체 보기 <ChevronRight width={12} height={12} style={{ verticalAlign: 'middle' }} />
        </Link>
      </div>

      {candidates.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🏘️</div>
          <h3>등록된 후보지가 없어요</h3>
          <p>위 검색창에서 동네를 찾아 후보지로 등록해보세요.</p>
        </div>
      ) : (
        <>
          <div className="candidate-grid">
            {candidates.map((c) => {
              const mapUrl = getMapTileUrl(c.latitude, c.longitude);
              return (
                <Link
                  key={c.id}
                  to={`/reports/${c.regionCode}?regionName=${encodeURIComponent(c.regionName)}&parentRegionName=${encodeURIComponent(c.parentRegionName)}${c.latitude ? `&lat=${c.latitude}` : ''}${c.longitude ? `&lon=${c.longitude}` : ''}`}
                  className="candidate-card"
                >
                  <div
                    className={`candidate-thumb ${mapUrl ? 'has-map' : ''}`}
                    style={mapUrl ? { backgroundImage: `url(${mapUrl})` } : undefined}
                  >
                    {c.alias && <div className="candidate-thumb-overlay">{c.alias}</div>}
                  </div>
                  <div className="candidate-card-body">
                    <div className="name">{c.regionName}</div>
                    <div className="parent">{c.parentRegionName}</div>
                  </div>
                </Link>
              );
            })}
            {candidates.length < 5 && (
              <button
                type="button"
                className="candidate-card-add"
                onClick={() => document.querySelector<HTMLInputElement>('[data-testid=search-input]')?.focus()}
              >
                <PlusIcon />
                <span style={{ fontSize: 13, fontWeight: 500 }}>후보지 추가</span>
              </button>
            )}
          </div>

          {candidates.length >= 2 && (
            <Link to="/compare" className="compare-cta" style={{ marginTop: 24, textDecoration: 'none', color: 'inherit' }}>
              <div className="compare-cta-text">
                <h3>후보지를 비교해 보세요</h3>
                <p>등록한 후보지를 한눈에 비교하고 가장 적합한 동네를 찾아보세요.</p>
              </div>
              <div className="compare-cta-illustration">
                <div className="mini">🏙️</div>
                <div className="mini">🏞️</div>
                <div className="mini">🏘️</div>
              </div>
            </Link>
          )}
        </>
      )}

      {toast && (
        <div className={`toast ${toast.isError ? 'error' : 'success'}`} role="status">
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default HomePage;
