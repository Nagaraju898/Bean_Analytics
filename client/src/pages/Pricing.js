import React from 'react';
import './Home.css';

const Pricing = () => {
  return (
    <div className="home-container">
      <main className="home-main">
        <section className="hero glass-card">
          <div className="hero-content">
            <h1 className="hero-title">Simple, Transparent Pricing</h1>
            <p className="hero-subtitle">Choose a plan that fits your business — free tier for small datasets and scalable plans for growing stores.</p>
          </div>
        </section>

        <section className="features glass-section">
          <div className="container">
            <div className="features-grid">
              <div className="feature-card glass-card">
                <div className="feature-content">
                  <h3>Free</h3>
                  <p>Analyze up to 1,000 rows — perfect to evaluate the product.</p>
                </div>
              </div>
              <div className="feature-card glass-card">
                <div className="feature-content">
                  <h3>Growth</h3>
                  <p>Higher limits, export, and premium support.</p>
                </div>
              </div>
              <div className="feature-card glass-card">
                <div className="feature-content">
                  <h3>Enterprise</h3>
                  <p>Custom plans, SSO, and dedicated support.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Pricing;
