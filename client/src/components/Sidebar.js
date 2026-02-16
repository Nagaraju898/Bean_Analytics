import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/Layout.css";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <div className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
      <div className="sidebar-header">
        <button
          className="sidebar-toggle"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '<' : '>'}
        </button>

        <div className="sidebar-logo-box">
          <div className="logo-icon">📊</div>
          {sidebarOpen && <span className="logo-text">BEAN</span>}
        </div>
      </div>

      <ul className="sidebar-menu">
        <li>
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="menu-icon">🏠</span>
            <span className="menu-text">Home</span>
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/dashboard/add-file"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="menu-icon">📁</span>
            <span className="menu-text">Add File</span>
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="menu-icon">📊</span>
            <span className="menu-text">Dashboard</span>
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/dashboard/data-table"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="menu-icon">🗂️</span>
            <span className="menu-text">Data Table</span>
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
