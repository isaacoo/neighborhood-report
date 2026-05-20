import { Link } from 'react-router-dom';
import { useCandidates } from '../infrastructure/CandidatesContext';
import { getMapTileUrl } from '../infrastructure/mapTile';
import { ChevronRight, EditIcon, TrashIcon } from '../components/Icons';

function CandidateListPage() {
  const { candidates, removeCandidate, updateAlias } = useCandidates();

  const onEditAlias = (id: string, currentAlias: string | null) => {
    const next = window.prompt('별칭을 수정하세요 (30자 이내, 비우면 동 이름으로 표시).', currentAlias ?? '');
    if (next === null) return;
    updateAlias(id, next);
  };

  const onRemove = (id: string, name: string) => {
    if (window.confirm(`"${name}"을(를) 후보지 목록에서 삭제할까요?`)) {
      removeCandidate(id);
    }
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>내 후보지 ({candidates.length}/5)</h1>
          <p className="subtitle">등록된 후보지의 리포트를 확인하거나 비교해보세요.</p>
        </div>
        {candidates.length >= 2 && (
          <Link to="/compare" className="btn btn-primary">후보지 비교하기 <ChevronRight width={14} height={14} /></Link>
        )}
      </div>

      {candidates.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🏘️</div>
          <h3>등록된 후보지가 없어요</h3>
          <p>홈 화면 검색창에서 동네를 찾아 후보지로 등록해보세요.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>검색하러 가기</Link>
        </div>
      ) : (
        <div className="candidate-grid">
          {candidates.map((c) => {
            const mapUrl = getMapTileUrl(c.latitude, c.longitude);
            return (
              <div key={c.id} className="candidate-card">
                <Link
                  to={`/reports/${c.regionCode}?regionName=${encodeURIComponent(c.regionName)}&parentRegionName=${encodeURIComponent(c.parentRegionName)}${c.latitude ? `&lat=${c.latitude}` : ''}${c.longitude ? `&lon=${c.longitude}` : ''}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    className={`candidate-thumb ${mapUrl ? 'has-map' : ''}`}
                    style={mapUrl ? { backgroundImage: `url(${mapUrl})` } : undefined}
                  >
                    {c.alias && <div className="candidate-thumb-overlay">{c.alias}</div>}
                  </div>
                  <div className="candidate-card-body" style={{ paddingBottom: 0 }}>
                    <div className="name">{c.regionName}</div>
                    <div className="parent">{c.parentRegionName}</div>
                    <div className="parent" style={{ marginTop: 8, fontSize: 11 }}>
                      {new Date(c.createdAt).toLocaleDateString()} 등록
                    </div>
                  </div>
                </Link>
                <div style={{ padding: '12px 16px 14px' }}>
                  <div className="candidate-card-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => onEditAlias(c.id, c.alias)}
                    >
                      <EditIcon /> 별칭
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => onRemove(c.id, c.alias ?? c.regionName)}
                      style={{ marginLeft: 'auto' }}
                    >
                      <TrashIcon /> 삭제
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CandidateListPage;
