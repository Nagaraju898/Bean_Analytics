import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';
import bhargaviImg from '../assets/bhargavi.png';
import eeswarImg from '../assets/eeswar.png';
import abdulImg from '../assets/abdul.png';
import nagarajuImg from '../assets/nagaraju.png';

const featureItems = [
  {
    title: 'Easy Data Upload',
    text: 'Simply upload your CSV or JSON sales data files. Our system handles the rest automatically.',
    icon: '⬆️'
  },
  {
    title: 'Automated ETL Pipeline',
    text: 'Smart data cleaning with null handling, type standardization, duplicate removal, and outlier detection.',
    icon: '✨'
  },
  {
    title: 'Rich Visualizations',
    text: 'Beautiful bar charts, pie charts, and tabular summaries generated from your actual data.',
    icon: '📊'
  },
  {
    title: 'Smart Filtering',
    text: 'Filter insights by product, region, or time period for targeted analysis.',
    icon: '🔎'
  },
  {
    title: 'AI-Powered Insights',
    text: 'Our AI explains trends in plain language, just like a data analyst would.',
    icon: '🤖'
  },
  {
    title: 'Secure & Private',
    text: 'Your business data is encrypted and protected. We never share or sell your information.',
    icon: '🔒'
  },
  {
    title: 'Real-Time Analysis',
    text: 'Get instant insights as soon as you upload your data. No waiting, no delays.',
    icon: '⚡'
  },
  {
    title: 'Cloud Deployed',
    text: 'Access your analytics dashboard from anywhere, anytime on AWS cloud infrastructure.',
    icon: '☁️'
  }
];

const steps = [
  {
    number: '01',
    title: 'Upload Your Data',
    text: 'Simply drag and drop your CSV or JSON sales data file into our platform.'
  },
  {
    number: '02',
    title: 'Automatic Processing',
    text: 'Our ETL pipeline cleans, validates, and transforms your data automatically.'
  },
  {
    number: '03',
    title: 'View Visualizations',
    text: 'Explore interactive charts, graphs, and tables generated from your data.'
  },
  {
    number: '04',
    title: 'Get AI Insights',
    text: 'Receive plain-language explanations of trends and actionable recommendations.'
  }
];

const team = [
  {
    name: 'Bhargavi',
    role: 'Full Stack Developer',
    img: bhargaviImg
  },
  {
    name: 'Eeswar',
    role: 'Full Stack Developer',
    img: eeswarImg
  },
  {
    name: 'Abdul',
    role: 'Full Stack Developer',
    img: abdulImg
  },
  {
    name: 'Nagaraju',
    role: 'Full Stack Developer',
    img: nagarajuImg
  }
];

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="brand">
            <div className="brand-logo-box">
              <span className="brand-logo-text">BEAN</span>
            </div>
            <span className="brand-name">BEAN Analytics</span>
          </Link>

          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/features" className="nav-link">Features</Link>
            <Link to="/pricing" className="nav-link">Pricing</Link>
            <Link to="/demo" className="nav-link">Demo</Link>
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="nav-link">
              {isAuthenticated ? 'Dashboard' : 'Login'}
            </Link>
            <button onClick={handleGetStarted} className="nav-cta">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="container hero-inner">
            <div className="hero-content">
              <div className="hero-badge">
                <span className="badge-dot"></span>
                AI-Powered Analytics Platform
              </div>
              <h1 className="hero-title">Transform Your E-commerce Data Into <span className="gradient-text">Actionable Insights</span></h1>
              <p className="hero-subtitle">
                Upload your sales data and let our AI-powered platform automatically generate actionable insights,
                beautiful visualizations, and trend analysis — no BI tools required. Experience the future of data analytics.
              </p>
              <div className="hero-actions">
                <button onClick={handleGetStarted} className="btn btn-primary">
                  <span>Get Started</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <Link to="/features" className="btn btn-secondary">
                  <span>See How It Works</span>
                </Link>
              </div>
              <div className="hero-stats">
                <div className="stat">
                  <span className="stat-number">10K+</span>
                  <span className="stat-label">Data Points Analyzed</span>
                </div>
                <div className="stat">
                  <span className="stat-number">500+</span>
                  <span className="stat-label">Business Owners</span>
                </div>
                <div className="stat">
                  <span className="stat-number">99%</span>
                  <span className="stat-label">Accuracy Rate</span>
                </div>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-card">
                <div className="hero-card-header">
                  <span className="dot dot-blue"></span>
                  <span className="dot dot-cyan"></span>
                  <span className="dot dot-indigo"></span>
                  <span className="hero-card-title">Revenue Overview</span>
                </div>
                <div className="hero-chart">
                  <div className="hero-bar" style={{ height: '64%' }}></div>
                  <div className="hero-bar" style={{ height: '82%' }}></div>
                  <div className="hero-bar" style={{ height: '56%' }}></div>
                  <div className="hero-bar" style={{ height: '92%' }}></div>
                  <div className="hero-bar" style={{ height: '68%' }}></div>
                </div>
                <div className="hero-metrics">
                  <div>
                    <p className="metric-label">Monthly Growth</p>
                    <p className="metric-value">+28%</p>
                  </div>
                  <div>
                    <p className="metric-label">Orders Processed</p>
                    <p className="metric-value">12,480</p>
                  </div>
                </div>
              </div>
              <div className="hero-chip hero-chip-top">AI Insights</div>
              <div className="hero-chip hero-chip-bottom">Live Dashboard</div>
            </div>
          </div>
        </section>

        <section className="features" id="features">
          <div className="container">
            <h2 className="section-title">Everything You Need for Data-Driven Decisions</h2>
            <p className="section-subtitle">
              Powerful features designed specifically for e-commerce business owners who want insights without the
              complexity of traditional BI tools.
            </p>
            <div className="features-grid">
              {featureItems.map((item) => (
                <div key={item.title} className="feature-card">
                  <div className="feature-icon">{item.icon}</div>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="how" id="how">
          <div className="container">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              From data upload to actionable insights in four simple steps. No technical expertise required.
            </p>
            <div className="how-grid">
              {steps.map((step) => (
                <div key={step.number} className="how-card">
                  <div className="how-number">{step.number}</div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="team" className="team">
          <div className="container">
            <h2 className="section-title">Meet Our Team</h2>
            <p className="section-subtitle">
              A dedicated group of developers, engineers, and designers passionate about making data analytics
              accessible to everyone.
            </p>
            <div className="team-grid">
              {team.map((member) => (
                <div key={member.name} className="team-card">
                  <img src={member.img} alt={member.name} className="team-avatar" />
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cta">
          <div className="container cta-inner">
            <h2>Ready to Transform Your Business Analytics?</h2>
            <p>
              Join hundreds of e-commerce owners who have already discovered the power of AI-driven insights.
              Start your journey today.
            </p>
            <div className="cta-bullets">
              <span>No credit card required</span>
              <span>Free data analysis up to 1000 rows</span>
              <span>AI-powered insights included</span>
              <span>Export reports in multiple formats</span>
            </div>
            <Link to="/register" className="btn btn-primary">Get Started for Free</Link>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <div className="footer-brand">BEAN Analytics</div>
            <p>AI-powered analytics platform for e-commerce business owners.</p>
          </div>
          <div>
            <h4>Product</h4>
            <a href="/features">Features</a>
            <a href="/pricing">Pricing</a>
            <a href="/demo">Demo</a>
            <a href="/changelog">Changelog</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="/about">About Us</a>
            <a href="#team" onClick={(e) => { e.preventDefault(); document.getElementById('team').scrollIntoView({ behavior: 'smooth' }); }}>Team</a>
            <a href="/careers">Careers</a>
            <a href="/contact">Contact</a>
          </div>
          <div>
            <h4>Legal</h4>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/security">Security</a>
            <a href="/gdpr">GDPR</a>
          </div>
        </div>
        <div className="container footer-bottom">
          <p>© 2024 BEAN Analytics. All rights reserved.</p>
          <p>Made with love for e-commerce entrepreneurs</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;

