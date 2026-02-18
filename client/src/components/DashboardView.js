import React, { useState, useEffect } from "react";
import API from "../config/axiosConfig";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import "./DashboardView.css";

const COLORS = [
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444"
];

const DashboardView = ({ refreshTrigger = 0 }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [refreshTrigger]);

  const fetchAnalytics = async () => {
    try {
      const res = await API.get("/analytics/dashboard");
      
      if (res.data.hasData) {
        setAnalytics(res.data.analytics);
      } else {
        setAnalytics(null);
      }
    } catch (err) {
      console.error("Analytics error", err);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Analytics Dashboard</h2>

      {/* SUMMARY */}
      <div className="summary-section">
        <div className="summary-card">
          <h4>Total Rows</h4>
          <p>{analytics?.summary?.totalRows}</p>
        </div>
        <div className="summary-card">
          <h4>Total Columns</h4>
          <p>{analytics?.summary?.totalColumns}</p>
        </div>
      </div>

      {/* PIE CHARTS */}
      <div className="chart-section">
        {analytics?.pieCharts?.map((chart, i) => (
          <div key={i} className="chart-card">
            <h3>📊 {chart.title || `Distribution Analysis ${i + 1}`}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chart.data.slice(0, 7)}
                  dataKey="value"
                  nameKey="name"
                  outerRadius="75%"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {chart.data.slice(0, 7).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} items`} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* BAR CHARTS */}
      <div className="chart-section">
        {analytics?.barCharts?.map((chart, i) => (
          <div key={i} className="chart-card">
            <h3>📈 {chart.title || `Column Analysis ${i + 1}`}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chart.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fill: '#cbd5f5', fontSize: 12 }}
                />
                <YAxis tick={{ fill: '#cbd5f5', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  formatter={(value) => [`${value}`, 'Count']}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* LINE CHARTS */}
      <div className="chart-section">
        {analytics?.lineCharts?.map((chart, i) => (
          <div key={i} className="chart-card">
            <h3>📉 {chart.title || `Trend Analysis ${i + 1}`}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chart.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fill: '#cbd5f5', fontSize: 12 }}
                />
                <YAxis tick={{ fill: '#cbd5f5', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  formatter={(value) => [`${value}`, 'Value']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', r: 5 }}
                  activeDot={{ r: 7 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* AI SECTION ALWAYS VISIBLE */}
      <div className="ai-section">
        <h3>AI Insights</h3>

        {analytics?.aiInsights?.length > 0 ? (
          analytics.aiInsights.map((insight, i) => (
            <div key={i} className="ai-card">
              {insight}
            </div>
          ))
        ) : (
          <div className="ai-card empty">
            AI insights will appear here after analysis.
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
