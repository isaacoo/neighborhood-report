import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { CandidatesProvider } from './infrastructure/CandidatesContext';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import CandidateListPage from './pages/CandidateListPage';
import ReportPage from './pages/ReportPage';
import ComparisonPage from './pages/ComparisonPage';
import DataSourcesPage from './pages/DataSourcesPage';
import AboutPage from './pages/AboutPage';
import SettingsPage from './pages/SettingsPage';
import './styles.css';

function App() {
  return (
    <BrowserRouter>
      <CandidatesProvider>
        <div className="app-shell">
          <Sidebar />

          <div>
            <header className="mobile-topbar">
              <div className="sidebar-brand" style={{ padding: 0 }}>
                <div className="sidebar-brand-mark">N</div>
                <div>이사 갈 동네 리포트</div>
              </div>
              <nav>
                <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>홈</NavLink>
                <NavLink to="/candidates" className={({ isActive }) => (isActive ? 'active' : '')}>후보지</NavLink>
                <NavLink to="/compare" className={({ isActive }) => (isActive ? 'active' : '')}>비교</NavLink>
              </nav>
            </header>

            <main className="main">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/candidates" element={<CandidateListPage />} />
                <Route path="/reports/:regionCode" element={<ReportPage />} />
                <Route path="/compare" element={<ComparisonPage />} />
                <Route path="/data-sources" element={<DataSourcesPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>

              <div className="footer">
                본 리포트는 공공 데이터에 기반한 참고 자료입니다.
                부동산 투자 추천이나 절대적 판단을 제공하지 않습니다.
              </div>
            </main>
          </div>
        </div>
      </CandidatesProvider>
    </BrowserRouter>
  );
}

export default App;
