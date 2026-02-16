import React from 'react';
import './Home.css';

const Features = () => {
  return (
    <div className="home-container">
      <main className="home-main">
        <section className="hero glass-card">
          <div className="hero-content">
            <h1 className="hero-title">Everything You Need for Data-Driven Decisions</h1>
            <p className="hero-subtitle">Powerful features designed specifically for e-commerce business owners who want insights without the complexity of traditional BI tools.</p>
          </div>
        </section>

        <section className="features glass-section">
          <div className="container">
            <div className="features-grid">
              <div className="feature-card glass-card">
                <div className="feature-badge">⬆️</div>
                <div className="feature-content">
                  <h3>Easy Data Upload</h3>
                  <p>Upload CSV/JSON files. Our system handles the rest automatically.</p>
                </div>
              </div>
              <div className="feature-card glass-card">
                <div className="feature-badge">✨</div>
                <div className="feature-content">
                  <h3>Automated ETL</h3>
                  <p>Smart cleaning, type standardization, duplicate removal and outlier detection.</p>
                </div>
              </div>
              <div className="feature-card glass-card">
                <div className="feature-badge">📊</div>
                <div className="feature-content">
                  <h3>Rich Visualizations</h3>
                  <p>Bar, line, pie charts and tabular summaries generated from your data.</p>
                </div>
              </div>
              <div className="feature-card glass-card">
                <div className="feature-badge">🤖</div>
                <div className="feature-content">
                  <h3>AI Insights</h3>
                  <p>Plain-language explanations of trends and actionable recommendations.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Features;
