import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Zap, BarChart3, Bot, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(email, password);
      if (user?.roles?.isSuperAdmin) navigate('/superadmin');
      else if (user?.roles?.isAdmin) navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 p-12 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-20">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-black text-lg shadow-lg">T</div>
            <div>
              <p className="font-black text-white text-lg">TeleAds Pro</p>
              <p className="text-indigo-300 text-[10px] font-semibold uppercase tracking-widest">CPM Ad Network</p>
            </div>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            The smartest way to<br/>
            <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">run Telegram ads</span>
          </h2>
          <p className="text-indigo-200 leading-relaxed max-w-sm">
            Connect advertisers with niche Telegram audiences at scale. CPM-based billing with real impression tracking.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {[
            { icon: Zap,       title: 'CPM Ad Network',     desc: 'Precision-targeted ads across 1,200+ Telegram groups' },
            { icon: BarChart3, title: 'Real-time Analytics', desc: 'Track impressions, CTR, and conversions live' },
            { icon: Bot,       title: 'Bot Integration',    desc: 'Connect your bot in under 2 minutes' },
            { icon: Shield,    title: 'Anti-Fraud Engine',  desc: 'ML-powered protection against fake impressions' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/8 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center text-indigo-300 shrink-0">
                <Icon size={16} />
              </div>
              <div>
                <p className="text-white font-bold text-sm">{title}</p>
                <p className="text-indigo-300 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-[400px] animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black">T</div>
            <p className="font-black text-slate-900 text-lg">TeleAds Pro</p>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-900">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your TeleAds account</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">!</span>
              <p className="text-rose-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 transition-all" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Password</label>
                <Link to="/forgot-password" className="text-xs text-indigo-500 font-semibold hover:text-indigo-700">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 transition-all" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Sign in</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            No account?{' '}
            <Link to="/register" className="text-indigo-600 font-bold hover:text-indigo-800">Sign up free →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
