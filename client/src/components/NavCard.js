import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './NavCard.css';

const NavCard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const pages = [
    { path: '/dashboard', label: 'Dashboard', icon: '📈', description: 'View analytics' },
    { path: '/dashboard/add-file', label: 'Add File', icon: '📁', description: 'Upload data' },
    { path: '/dashboard/data-table', label: 'Data Table', icon: '🗂️', description: 'View records' },
  ];

  const isActive = (path) => {
    return location.pathname === path || (path === '/dashboard' && location.pathname === '/dashboard/');
  };

  return (
    <div className="nav-card-container">
      <div 
        className="nav-card-glass"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="nav-card-header">
          <span className="nav-card-title">Navigation</span>
          <span className="nav-card-icon">≡</span>
        </div>

        <div className="nav-card-items">
          {pages.map((page) => (
            <button
              key={page.path}
              className={`nav-card-item ${isActive(page.path) ? 'active' : ''}`}
              onClick={() => navigate(page.path)}
              title={page.description}
            >
              <span className="nav-item-icon">{page.icon}</span>
              <div className="nav-item-content">
                <span className="nav-item-label">{page.label}</span>
                <span className="nav-item-desc">{page.description}</span>
              </div>
              <span className="nav-item-arrow">→</span>
            </button>
          ))}
        </div>

        <div className="nav-card-footer">
          <div className="nav-card-divider"></div>
          <p className="nav-card-hint">Click to navigate</p>
        </div>
      </div>
    </div>
  );
};

export default NavCard;
