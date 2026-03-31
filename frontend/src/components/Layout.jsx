import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { HelpCircle, Plus, Search, Menu, X } from 'lucide-react';

export default function Layout() {
  const { user, activeRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useState(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleAction = () => {
    if (activeRole === 'advertiser') {
      navigate('/campaigns/new');
    } else {
      navigate('/groups/new');
    }
    setSidebarOpen(false);
  };

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile Backdrop */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>}
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="main-content">
        <header className="main-header">
          <div className="header-left" style={{ display: 'flex', alignItems: 'center' }}>
            <button className="mobile-toggle" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="search-bar hide-mobile">
              <Search size={18} className="text-muted" />
              <input type="text" placeholder="Search analytics..." />
            </div>
          </div>
          
          <div className="header-actions">
            <button className="btn btn--ghost btn--sm hide-mobile">
              <HelpCircle size={18} /> Support
            </button>
            <button onClick={handleAction} className="btn btn--primary btn--sm">
              <Plus size={18} /> <span className="hide-mobile">{activeRole === 'advertiser' ? 'New Campaign' : 'Register Group'}</span>
              <span className="show-mobile">New</span>
            </button>
          </div>
        </header>

        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
