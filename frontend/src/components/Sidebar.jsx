import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Megaphone, Users, Wallet, 
  Shield, LogOut, User, Repeat, ChevronRight, X
} from 'lucide-react';
import { useEffect } from 'react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, activeRole, toggleActiveRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onClose) onClose();
  };

  const navLinks = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Overview', roles: ['user', 'admin', 'superadmin'] },
    { to: '/campaigns', icon: <Megaphone size={20} />, label: 'My Campaigns', roles: ['user', 'admin', 'superadmin'], mode: 'advertiser' },
    { to: '/groups', icon: <Users size={20} />, label: 'My Groups', roles: ['user', 'admin', 'superadmin'], mode: 'publisher' },
    { to: '/wallet', icon: <Wallet size={20} />, label: 'Wallet', roles: ['user', 'admin', 'superadmin'] },
    { to: '/admin', icon: <Shield size={20} />, label: 'Admin Panel', roles: ['admin', 'superadmin'] },
    { to: '/superadmin', icon: <Shield size={20} />, label: 'Super Admin', roles: ['superadmin'] },
  ];

  const filteredLinks = navLinks.filter(link => {
    if (!user) return false;
    if (!link.roles.includes(user.role)) return false;
    if (link.mode && link.mode !== activeRole) return false;
    return true;
  });

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-logo">T</div>
          <span className="brand-text">TeleAds</span>
        </div>
        <button className="mobile-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="switcher-section">
        <div className="switcher-label">
          <span>Active Role</span>
          <span className={`role-badge role-badge--${activeRole}`}>{activeRole}</span>
        </div>
        <button className="switcher-btn" onClick={toggleActiveRole}>
          <Repeat size={14} />
          <span>Switch Mode</span>
          <ChevronRight size={14} className="ml-auto" />
        </button>
      </div>

      <nav className="sidebar-nav">
        {filteredLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{user?.email[0].toUpperCase()}</div>
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
            <span className="user-tier">{user?.role}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
