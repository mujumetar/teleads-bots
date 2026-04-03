import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BENEFITS = [
  'Start as advertiser or publisher (or both)',
  'CPM-based billing — pay only for real views',
  '1,200+ verified Telegram publisher groups',
  'Real-time analytics and impression tracking',
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', password:'', confirmPassword:'' });
  const [role, setRole] = useState('advertiser');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k,v) => setForm(p => ({...p, [k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError(''); setLoading(true);
    try {
      await register({ ...form, initialRole: role });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthColors = ['', '#f43f5e', '#f59e0b', '#10b981'];
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-900 p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-500/20 rounded-full blur-[120px] pointer-events-none"/>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"/>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-black text-lg shadow-lg">T</div>
            <p className="font-black text-white text-lg">TeleAds Pro</p>
          </div>
          <h2 className="text-3xl font-black text-white leading-tight mb-4">
            Join the network<br/>
            <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
              built for Telegram
            </span>
          </h2>
          <p className="text-indigo-200 text-sm leading-relaxed max-w-xs">
            Thousands of advertisers and publishers are already growing on TeleAds.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {BENEFITS.map(b => (
            <div key={b} className="flex items-center gap-3 text-indigo-100 text-sm">
              <CheckCircle size={16} className="text-emerald-400 shrink-0"/>
              {b}
            </div>
          ))}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-indigo-300 text-xs">Already have an account?</p>
            <Link to="/login" className="text-white font-bold text-sm hover:text-indigo-200 transition-colors">Sign in instead →</Link>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-violet-50/30 overflow-y-auto">
        <div className="w-full max-w-md py-8 animate-fade-in">
          <div className="mb-7">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create your account</h1>
            <p className="text-slate-500 text-sm mt-1">Start advertising or monetising in minutes.</p>
          </div>

          {/* Role picker */}
          <div className="mb-6 p-1 bg-slate-100 rounded-2xl flex gap-1">
            {[{v:'advertiser',l:'🎯 Advertiser'},{v:'publisher',l:'📡 Publisher'}].map(({v,l})=>(
              <button key={v} type="button" onClick={()=>setRole(v)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${role===v ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {l}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center text-xs font-black shrink-0">!</span>
              <p className="text-rose-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">First Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input value={form.firstName} onChange={e=>set('firstName',e.target.value)} placeholder="Raj" required className="pro-input pl-9 text-sm"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Last Name</label>
                <input value={form.lastName} onChange={e=>set('lastName',e.target.value)} placeholder="Kumar" className="pro-input text-sm"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@example.com" required className="pro-input pl-9 text-sm"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Min. 6 characters" required className="pro-input pl-9 pr-10 text-sm"/>
                <button type="button" onClick={()=>setShowPass(v=>!v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><EyeOff size={14}/></button>
              </div>
              {strength > 0 && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3].map(i=>(
                      <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{background: i<=strength ? strengthColors[strength] : '#e2e8f0'}}/>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold" style={{color:strengthColors[strength]}}>{strengthLabels[strength]}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Confirm Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type="password" value={form.confirmPassword} onChange={e=>set('confirmPassword',e.target.value)} placeholder="••••••••" required className="pro-input pl-9 text-sm"/>
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input type="checkbox" required className="w-4 h-4 rounded border-slate-300 accent-indigo-500 mt-0.5 shrink-0"/>
              <span className="text-xs text-slate-600 leading-relaxed">
                I agree to the{' '}
                <Link to="/terms" className="text-indigo-600 font-semibold hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-indigo-600 font-semibold hover:underline">Privacy Policy</Link>
              </span>
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm rounded-xl justify-center">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <><span>Create Account</span><ArrowRight size={16}/></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
