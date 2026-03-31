import { Link } from 'react-router-dom';
import { Megaphone, Users, Shield, ArrowRight, CheckCircle, TrendingUp, Zap, Globe } from 'lucide-react';

export default function Home() {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="container landing-nav-inner">
          <div className="brand">
            <div className="brand-logo">T</div>
            <span className="brand-text">TeleAds</span>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="btn btn--ghost btn--sm">Log In</Link>
            <Link to="/register" className="btn btn--primary btn--sm">Sign Up Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="container hero-content">
          <div className="badge badge--pending" style={{ padding: '8px 16px', borderRadius: '50px', marginBottom: '24px' }}>
            🎉 TeleAds 2.0 is now live!
          </div>
          <h1>The Professional Ad Network for <span>Telegram</span></h1>
          <p>
            Join more than 5,000+ advertisers and publishers who scale their business 
            on the world's most innovative messaging platform. Target by niche, 
            track performance in real-time, and get paid in ₹ INR.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn--primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
              Start Growing Now <ArrowRight size={20} />
            </Link>
            <div className="hero-trust">
              <div className="trust-item">
                <Users size={16} /> 5,000+ Users
              </div>
              <div className="trust-divider"></div>
              <div className="trust-item">
                <Globe size={16} /> 100+ Countries
              </div>
            </div>
          </div>
        </div>
        
        <div className="hero-preview">
          <div className="preview-card card">
            <div className="card-header">
              <h2>Analytics Overview</h2>
              <span className="badge badge--active">Live Now</span>
            </div>
            <div className="card-body">
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '0' }}>
                <div className="stats-card" style={{ padding: '16px', gap: '12px' }}>
                  <div className="stats-icon stats-icon--blue" style={{ width: '40px', height: '40px' }}><TrendingUp size={20} /></div>
                  <div className="stats-info">
                    <span className="stats-label" style={{ fontSize: '0.7rem' }}>Impressions</span>
                    <span className="stats-value" style={{ fontSize: '1.2rem' }}>1.2M</span>
                  </div>
                </div>
                <div className="stats-card" style={{ padding: '16px', gap: '12px' }}>
                  <div className="stats-icon stats-icon--green" style={{ width: '40px', height: '40px' }}><Zap size={20} /></div>
                  <div className="stats-info">
                    <span className="stats-label" style={{ fontSize: '0.7rem' }}>Ads Sent</span>
                    <span className="stats-value" style={{ fontSize: '1.2rem' }}>850K</span>
                  </div>
                </div>
                <div className="stats-card" style={{ padding: '16px', gap: '12px' }}>
                  <div className="stats-icon stats-icon--purple" style={{ width: '40px', height: '40px' }}><Shield size={20} /></div>
                  <div className="stats-info">
                    <span className="stats-label" style={{ fontSize: '0.7rem' }}>Payouts</span>
                    <span className="stats-value" style={{ fontSize: '1.2rem' }}>₹4.5M</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="badge badge--completed" style={{ marginBottom: '16px' }}>Features</span>
            <h2>Everything you need to succeed</h2>
            <p>Built with modern scalability and professional control in mind.</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card card">
              <div className="stats-icon stats-icon--blue"><Megaphone size={28} /></div>
              <h3>Precision Targeting</h3>
              <p>Target telegram channels by niche, member count, and location. Reach the users who actually care about your product.</p>
            </div>
            <div className="feature-card card">
              <div className="stats-icon stats-icon--green"><CheckCircle size={28} /></div>
              <h3>Real-time Tracking</h3>
              <p>Detailed attribution for every single ad post. Track clicks, impressions, and ROI with our proprietary tracking system.</p>
            </div>
            <div className="feature-card card">
              <div className="stats-icon stats-icon--purple"><Shield size={28} /></div>
              <h3>Verified Publishers</h3>
              <p>All groups are manually approved by our team to ensure zero-bot traffic and high-quality human engagement.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container footer-inner">
          <div className="brand">
            <div className="brand-logo">T</div>
            <span className="brand-text">TeleAds</span>
          </div>
          <div className="footer-links">
            <span className="text-muted">© 2026 TeleAds Platform. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
