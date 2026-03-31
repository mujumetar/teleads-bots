import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, UserPlus, Loader2, Rocket } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-white animate-fade-in">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center space-y-4">
           <div className="inline-flex p-3 rounded-xl bg-slate-900 text-white mb-2">
              <Rocket size={24} />
           </div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h1>
           <p className="text-slate-500 text-sm font-medium">Join the next-generation Telegram ad network</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-xs font-semibold border border-rose-100">
             {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
           <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Work Email</label>
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
                   placeholder="At least 8 characters"
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
             {loading ? <Loader2 size={18} className="animate-spin" /> : 'Get started'}
           </button>
        </form>

        <div className="text-center pt-4">
           <p className="text-slate-500 text-sm font-medium">
              Already have an account? 
              <Link to="/login" className="ml-2 text-indigo-600 hover:text-indigo-700 font-bold">Log in</Link>
           </p>
        </div>
      </div>
    </div>
  );
}
