import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const closeSidebar = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button 
        className="mobile-menu-toggle" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          📊 BEAN Analytics
        </div>

        <ul className="sidebar-menu">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={closeSidebar}
            >
              🏠 Home
            </NavLink>
          </li>

          <li>
            <NavLink
              to="add-file"
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={closeSidebar}
            >
              📁 Add File
            </NavLink>
          </li>

          <li>
            <NavLink
              to="."
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={closeSidebar}
              end
            >
              📊 Dashboard
            </NavLink>
          </li>

          <li>
            <NavLink
              to="data-table"
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={closeSidebar}
            >
              🗂️ Data Table
            </NavLink>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
