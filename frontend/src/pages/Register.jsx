import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, UserPlus, Bot, Shield, Sparkles, Activity } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.03),transparent_100%)]"></div>
      
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-2xl shadow-emerald-500/5 space-y-8">
           <div className="text-center space-y-3">
              <div className="inline-flex p-4 rounded-3xl bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 mb-4 transform hover:scale-105 transition-all">
                 <Bot size={32} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Access Protocol</h1>
              <p className="text-slate-500 font-medium tracking-tight">Create your platform-wide identity cluster</p>
           </div>

           {error && (
             <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold border border-rose-100 animate-shake">
                {error}
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Secure Email</label>
                 <div className="relative group/input">
                    <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-emerald-600 transition-colors" />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full bg-slate-50 border-none rounded-2xl px-14 py-4 font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-200"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Define Access Key</label>
                 <div className="relative group/input">
                    <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-emerald-600 transition-colors" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border-none rounded-2xl px-14 py-4 font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-200"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Confirm Key</label>
                 <div className="relative group/input">
                    <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-emerald-600 transition-colors" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border-none rounded-2xl px-14 py-4 font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-200"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                 </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Initialize Hub</span>
                    <UserPlus size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
           </form>

           <div className="text-center pt-4">
              <p className="text-slate-400 font-bold text-sm">
                 Already registered? 
                 <Link to="/login" className="ml-2 text-indigo-600 hover:text-indigo-700 underline underline-offset-4 decoration-indigo-600/10 transition-all">Sign In</Link>
              </p>
           </div>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-8 text-slate-400 opacity-60">
           <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Shield size={12} /> SECURE PROTOCOL</span>
           <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Activity size={12} /> CLUSTER: IND-01</span>
        </div>
      </div>
    </div>
  );
}
