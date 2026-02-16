import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './VerticalNav.css';

const VerticalNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const pages = [
    { path: '/dashboard/add-file', label: 'Add File', icon: '📁' },
    { path: '/dashboard', label: 'Dashboard', icon: '📈' },
    { path: '/dashboard/data-table', label: 'Data Table', icon: '🗂️' },
  ];

  const isActive = (path) => {
    return location.pathname === path || (path === '/dashboard' && location.pathname === '/dashboard/');
  };

  const displayUser = user || { username: 'Guest', email: 'guest@bean.com' };

  return (
    <aside className="vertical-nav">
      <nav className="nav-list">
        <div className="nav-logo-vertical">
          <span className="nav-logo-icon">📊</span>
          <span className="nav-logo-text">BEAN</span>
        </div>
        {pages.map((page) => (
          <button
            key={page.path}
            className={`nav-item ${isActive(page.path) ? 'active' : ''}`}
            onClick={() => navigate(page.path)}
            title={page.label}
          >
            <span className="nav-item-icon">{page.icon}</span>
            <span className="nav-item-label">{page.label}</span>
          </button>
        ))}
      </nav>

      {/* Profile moved outside the scrolling nav-list so it's immediately visible */}
      <div className="user-profile-section">
        <div className="user-profile-avatar">👤</div>
        <div className="user-profile-info">
          <p className="user-profile-name">{displayUser.username}</p>
          <p className="user-profile-email">{displayUser.email}</p>
        </div>
        <button
          className="user-profile-logout"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          aria-label="Logout"
          title="Logout"
        >
          ⏻
        </button>
      </div>
    </aside>
  );
};

export default VerticalNav;
