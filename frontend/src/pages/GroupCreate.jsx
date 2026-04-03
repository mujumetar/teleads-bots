import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bot, Hash, Users, Info, CheckCircle, AlertCircle, Send, Link as LinkIcon, RefreshCw, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const cn = (...c) => c.filter(Boolean).join(' ');

const REQUIREMENTS = [
  'Minimum 1,000 members',
  'Must be a Telegram group, channel, or supergroup',
  'Not in restricted/spammy categories',
  'Bot must be added as admin',
  'Active for at least 30 days',
];

export default function GroupCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({ 
    name:'', 
    telegramGroupId:'', 
    botToken:'', 
    description:'', 
    category:'Technology', 
    pricingMode:'auto',
    memberCount: 0,
    dynamicCpm: 0,
    performanceScore: 0
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      setInitialLoading(true);
      api.get(`/groups/${id}`)
        .then(res => {
          const data = res.data;
          setForm({
            name: data.name || '',
            telegramGroupId: data.telegramGroupId || '',
            botToken: data.botToken || '',
            description: data.description || '',
            category: data.category || 'Technology',
            pricingMode: data.pricingMode || 'auto',
            memberCount: data.memberCount || 0,
            dynamicCpm: data.dynamicCpm || 0,
            performanceScore: data.performanceScore || 0
          });
          setVerified(true); // Assuming already verified if it exists
        })
        .catch(err => {
          setError('Failed to load group data.');
        })
        .finally(() => setInitialLoading(false));
    }
  }, [id]);

  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleVerify = async () => {
    if (!form.telegramGroupId) { setError('Enter a Group/Channel ID first.'); return; }
    setVerifying(true); setError('');
    try {
      await api.post('/groups/verify', { telegramGroupId: form.telegramGroupId, botToken: form.botToken });
      setVerified(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Check your Group ID.');
      setVerified(false);
    } finally { setVerifying(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Channel name required.'); return; }
    if (!form.telegramGroupId.trim()) { setError('Group/Channel ID required.'); return; }
    setLoading(true); setError('');
    try {
      if (isEdit) {
        await api.put(`/groups/${id}`, form);
      } else {
        await api.post('/groups', form);
      }
      navigate('/groups');
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'register'} channel.`);
    } finally { setLoading(false); }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <RefreshCw size={40} className="text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading channel details...</p>
      </div>
    );
  }

  const CATEGORIES = ['Technology','Crypto','Finance','Education','Entertainment','Health','Sports','News','Gaming','Other'];
  const inp = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 transition-all";

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Add Telegram Channel</h1>
        <p className="text-sm text-slate-500 mt-1">Register your channel to start earning from CPM ads.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3">
                <AlertCircle size={16} className="text-rose-500 shrink-0"/>
                <p className="text-rose-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Channel / Group Name *</label>
                <div className="relative">
                  <Bot size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="My Tech Channel" required className={cn(inp,'pl-9')}/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Telegram Group / Channel ID *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input value={form.telegramGroupId} onChange={e=>set('telegramGroupId',e.target.value.replace('@',''))} placeholder="-1001234567890 or @mychannel" required className={cn(inp,'pl-9')}/>
                  </div>
                  <button type="button" onClick={handleVerify} disabled={verifying}
                    className={cn('px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap',
                      verified ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200')}>
                    {verifying ? <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin"/> : verified ? '✓ Verified' : 'Verify'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Copy from group info → right-click → Copy ID, or use @username</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Bot Token (optional)</label>
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input value={form.botToken} onChange={e=>set('botToken',e.target.value)} placeholder="1234567890:AAAABBBB..." className={cn(inp,'pl-9')}/>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Required if you want us to post ads via your bot. Get it from @BotFather.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={3}
                  placeholder="Brief description of your audience and content…"
                  className={cn(inp,'resize-none')}/>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat=>(
                    <button key={cat} type="button" onClick={()=>set('category',cat)}
                      className={cn('px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all', form.category===cat?'border-indigo-400 bg-indigo-50 text-indigo-700':'border-slate-200 text-slate-500 hover:border-slate-300')}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Pricing Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{v:'auto',l:'Auto CPM',d:'Platform sets dynamic CPM based on score'},{v:'manual',l:'Custom Price',d:'Set your own CPM rate'}].map(opt=>(
                    <button key={opt.v} type="button" onClick={()=>set('pricingMode',opt.v)}
                      className={cn('p-3 rounded-xl text-left border-2 transition-all', form.pricingMode===opt.v?'border-indigo-400 bg-indigo-50':'border-slate-200 hover:border-slate-300')}>
                      <p className={cn('text-xs font-bold', form.pricingMode===opt.v?'text-indigo-700':'text-slate-700')}>{opt.l}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{opt.d}</p>
                    </button>
                  ))}
                </div>
              </div>

              {user?.role === 'superadmin' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={16} className="text-violet-500" />
                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Superadmin Override</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Member Count</label>
                      <input type="number" value={form.memberCount} onChange={e=>set('memberCount', parseInt(e.target.value))} className={inp} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dynamic CPM (₹)</label>
                      <input type="number" value={form.dynamicCpm} onChange={e=>set('dynamicCpm', parseFloat(e.target.value))} className={inp} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Performance Score (0-100)</label>
                    <input type="range" min="0" max="100" value={form.performanceScore} onChange={e=>set('performanceScore', parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-500" />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                      <span>0%</span>
                      <span>{form.performanceScore}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/25 disabled:opacity-60 mt-2">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><Send size={15}/>Submit for Approval</>}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <CheckCircle size={15} className="text-emerald-500"/>Requirements
            </h3>
            <ul className="space-y-2">
              {REQUIREMENTS.map(r=>(
                <li key={r} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>{r}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5">
            <h3 className="font-bold text-indigo-800 text-sm mb-2">💡 Earnings Estimate</h3>
            <p className="text-xs text-indigo-600 leading-relaxed">
              A group with <strong>10,000 members</strong> and <strong>15% engagement</strong> can earn approximately <strong>₹1,500–₹2,000/month</strong> with 3–4 ad posts daily.
            </p>
          </div>

          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
            <h3 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-1.5">
              <Info size={14}/>Review Process
            </h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              All channels are manually reviewed within <strong>24 hours</strong>. You'll receive a Telegram notification once approved or rejected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
