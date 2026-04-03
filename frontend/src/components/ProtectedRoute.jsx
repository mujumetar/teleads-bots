import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen app-shell-bg flex flex-col items-center justify-center gap-4">
        <div className="h-9 w-9 rounded-full border-2 border-primary/20 border-t-primary animate-spin" aria-hidden />
        <p className="text-sm font-semibold text-slate-500">Loading workspace…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  
  // Check roles using new multi-role system
  if (roles) {
    const hasRequiredRole = roles.some(role => {
      if (role === 'admin') return user.roles?.isAdmin;
      if (role === 'superadmin') return user.roles?.isSuperAdmin;
      if (role === 'advertiser') return user.roles?.advertiser;
      if (role === 'publisher') return user.roles?.publisher;
      return false;
    });
    
    if (!hasRequiredRole) return <Navigate to="/dashboard" replace />;
  }

  return children;
}
