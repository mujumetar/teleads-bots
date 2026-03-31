import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, Shield, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-white animate-fade-in">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center space-y-4">
           <div className="inline-flex p-3 rounded-xl bg-slate-900 text-white mb-2">
              <Shield size={24} />
           </div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
           <p className="text-slate-500 text-sm font-medium">Log in to your TeleAds account to continue</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-xs font-semibold border border-rose-100">
             {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
           <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group/input">
                 <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input
                   type="email"
                   placeholder="name@company.com"
                   className="pro-input pl-12"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group/input">
                 <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input
                   type="password"
                   placeholder="••••••••"
                   className="pro-input pl-12"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required
                 />
              </div>
           </div>

           <button 
             type="submit" 
             className="pro-btn-primary w-full py-3.5 mt-2"
             disabled={loading}
           >
             {loading ? <Loader2 size={18} className="animate-spin" /> : 'Log in'}
           </button>
        </form>

        <div className="text-center pt-4">
           <p className="text-slate-500 text-sm font-medium">
              Don't have an account? 
              <Link to="/register" className="ml-2 text-indigo-600 hover:text-indigo-700 font-bold">Sign up</Link>
           </p>
        </div>

        <div className="pt-10 flex items-center justify-center gap-4 text-slate-300">
           <div className="h-px w-8 bg-slate-100"></div>
           <span className="text-[10px] font-bold uppercase tracking-widest">Autonomous Ad Network</span>
           <div className="h-px w-8 bg-slate-100"></div>
        </div>
      </div>
    </div>
  );
}
