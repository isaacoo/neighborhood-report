import { useCandidates } from '../infrastructure/CandidatesContext';

function SettingsPage() {
  const { candidates, refresh } = useCandidates();

  const handleClearAll = () => {
    if (window.confirm('모든 후보지 데이터를 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) {
      window.localStorage.removeItem('neighborhood-report:candidates:v1');
      refresh();
    }
  };

  return (
    <div>
      <h1>설정</h1>
      <p className="subtitle">서비스 설정 및 데이터 관리</p>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>📦 로컬 데이터</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
          본 서비스는 서버에 개인 데이터를 저장하지 않습니다.
          모든 후보지 정보는 브라우저의 LocalStorage에만 저장됩니다.
        </p>
        <div style={{ marginTop: 12, padding: 12, background: 'var(--bg)', borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>저장된 후보지</div>
              <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>
                {candidates.length}개 / 최대 5개
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={handleClearAll}
              disabled={candidates.length === 0}
            >
              전체 삭제
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>🔒 개인정보 보호</h3>
        <ul style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, paddingLeft: 20, marginTop: 8 }}>
          <li>회원가입·로그인 없이 사용 가능합니다.</li>
          <li>주민등록번호, 소득, 신용점수 등 민감 정보를 수집하지 않습니다.</li>
          <li>후보지 데이터는 브라우저 LocalStorage에만 저장되며, 서버로 전송되지 않습니다.</li>
          <li>브라우저 데이터를 삭제하면 모든 후보지 정보가 사라집니다.</li>
          <li>외부 공공 API 호출 시 사용자 식별 정보를 전송하지 않습니다.</li>
        </ul>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>ℹ️ 버전 정보</h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
          <div>서비스 버전: <strong>MVP v1.2.0</strong></div>
          <div>점수 산정 버전: <strong>v1.2.0-mvp</strong></div>
          <div>지원 지역: <strong>서울특별시 25개 자치구</strong></div>
          <div>개발 방법론: <strong>AI-DLC (AI-Driven Development Life Cycle)</strong></div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>📬 문의</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
          서비스 관련 문의나 피드백은 GitHub Issues를 통해 남겨주세요.
        </p>
        <a
          href="https://github.com/isaacoo/neighborhood-report/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm"
          style={{ marginTop: 8 }}
        >
          GitHub Issues →
        </a>
      </div>
    </div>
  );
}

export default SettingsPage;
