import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Use user's currentMode from backend, fallback to localStorage
  const [activeRole, setActiveRole] = useState(() => {
    return localStorage.getItem('activeRole') || 'advertiser';
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
        // Set active role from backend if available
        if (res.data.currentMode) {
          setActiveRole(res.data.currentMode);
          localStorage.setItem('activeRole', res.data.currentMode);
        }
      } catch (err) {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const switchRole = async (role) => {
    // Map display roles to actual role keys
    const roleMap = {
      'advertiser': 'advertiser',
      'publisher': 'publisher',
      'admin': 'isAdmin',
      'superadmin': 'isSuperAdmin'
    };
    
    const actualRole = roleMap[role] || role;
    
    // Check if it's a core user role (advertiser/publisher)
    const isCoreRole = role === 'advertiser' || role === 'publisher';
    
    if (!user) throw new Error('Not authenticated');
    
    // If it's a core role, we allow switching even if not explicitly in user.roles 
    // (or we can assume every user has both enabled in a dual-role SaaS)
    if (!isCoreRole && !user.roles?.[actualRole]) {
      throw new Error(`You don't have ${role} role enabled`);
    }
    
    // Update backend
    try {
      await api.put('/auth/profile', { currentMode: role });
      setActiveRole(role);
      localStorage.setItem('activeRole', role);
      
      // Update local user state
      setUser(prev => ({ 
        ...prev, 
        currentMode: role,
        roles: isCoreRole ? { ...prev.roles, [role]: true } : prev.roles
      }));
    } catch (error) {
      // If backend fails, we still try to set it locally for UI consistency in many cases,
      // but here we'll throw to be safe.
      throw new Error('Failed to switch role');
    }
  };

  const toggleActiveRole = async () => {
    const nextRole = activeRole === 'advertiser' ? 'publisher' : 'advertiser';
    try {
      await switchRole(nextRole);
    } catch (error) {
      console.error('Failed to toggle role:', error);
    }
  };

  const enablePublisherRole = async () => {
    try {
      const res = await api.post('/auth/enable-publisher');
      setUser(prev => ({
        ...prev,
        roles: { ...prev.roles, publisher: true }
      }));
      return res.data;
    } catch (error) {
      throw new Error('Failed to enable publisher role');
    }
  };

  const hasRole = (role) => {
    return user?.roles?.[role] || false;
  };

  const hasPermission = (permission) => {
    return user?.permissions?.includes(permission) || false;
  };

  const isAdvertiser = () => hasRole('advertiser');
  const isPublisher = () => hasRole('publisher');
  const isAdmin = () => hasRole('isAdmin');
  const isSuperAdmin = () => hasRole('isSuperAdmin');

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    if (res.data.user.currentMode) {
      setActiveRole(res.data.user.currentMode);
      localStorage.setItem('activeRole', res.data.user.currentMode);
    }
    return res.data.user;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    if (res.data.user.currentMode) {
      setActiveRole(res.data.user.currentMode);
      localStorage.setItem('activeRole', res.data.user.currentMode);
    }
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeRole');
    setUser(null);
    setActiveRole('advertiser');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      activeRole, 
      switchRole, 
      toggleActiveRole,
      enablePublisherRole,
      hasRole,
      hasPermission,
      isAdvertiser,
      isPublisher,
      isAdmin,
      isSuperAdmin,
      login, 
      register, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
