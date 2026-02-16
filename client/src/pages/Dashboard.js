import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardView from "../components/DashboardView";
import AddFile from "../components/AddFile";
import DataTable from "../components/DataTable";
import "../styles/Layout.css";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  // Get initial sidebar state from localStorage or window size
  const getInitialSidebarState = () => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.innerWidth > 768;
  };

  const [sidebarOpen, setSidebarOpen] = useState(getInitialSidebarState());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Persist current page on refresh
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle file upload success - refresh data
  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Get page title dynamically
  const getPageTitle = () => {
    if (location.pathname === "/dashboard" || location.pathname === "/dashboard/") {
      return "Dashboard";
    } else if (location.pathname === "/dashboard/add-file") {
      return "Add File";
    } else if (location.pathname === "/dashboard/data-table") {
      return "Data Table";
    }
    return "Dashboard";
  };

  const title = getPageTitle();

  // Update page title in browser tab
  useEffect(() => {
    document.title = `${title} | BeanAnalytics`;
  }, [title]);

  return (
    <div className="layout">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="main-content">
        <div className="topbar-glass">
          <h2 className="topbar-title-glass">{title}</h2>

          <div className="topbar-actions-glass">
            <button
              className="btn-logout-glass btn-logout-primary"
              onClick={() => {
                logout();
                navigate("/");
              }}
              aria-label="Logout"
              title="Logout"
            >
              <span className="logout-icon">⏻</span>
              <span className="logout-label">Logout</span>
            </button>
          </div>
        </div>

        <div className="content-wrapper-glass">
          <Routes>
            <Route path="/" element={<DashboardView refreshTrigger={refreshTrigger} />} />
            <Route path="/add-file" element={<AddFile onUploadSuccess={handleUploadSuccess} />} />
            <Route path="/data-table" element={<DataTable refreshTrigger={refreshTrigger} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
