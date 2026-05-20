import { NavLink, Link } from 'react-router-dom';
import {
  HomeIcon,
  HeartIcon,
  CompareIcon,
  ReportIcon,
  InfoIcon,
  SettingsIcon,
} from './Icons';

function Sidebar() {
  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="sidebar-brand-mark">N</div>
        <div>
          <div>이사 갈 동네</div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 500 }}>리포트</div>
        </div>
      </Link>

      <nav className="sidebar-section">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <HomeIcon className="nav-icon" /> 홈
        </NavLink>
        <NavLink to="/candidates" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <HeartIcon className="nav-icon" /> 내 후보지
        </NavLink>
        <NavLink to="/compare" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <CompareIcon className="nav-icon" /> 리포트 비교
        </NavLink>
      </nav>

      <div className="sidebar-section">
        <div className="sidebar-section-label">서비스</div>
        <a className="nav-link" href="#" onClick={(e) => e.preventDefault()}>
          <ReportIcon className="nav-icon" /> 데이터 출처
        </a>
        <a className="nav-link" href="#" onClick={(e) => e.preventDefault()}>
          <InfoIcon className="nav-icon" /> 서비스 안내
        </a>
        <a className="nav-link" href="#" onClick={(e) => e.preventDefault()}>
          <SettingsIcon className="nav-icon" /> 설정
        </a>
      </div>

      <div className="sidebar-footer">공공 데이터 기반 분석 · 본 서비스는 참고 자료를 제공합니다.</div>
    </aside>
  );
}

export default Sidebar;
