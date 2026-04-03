import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check, Megaphone, Image, Target, DollarSign, Send, Bot, Layers, Link as LinkIcon, RefreshCw } from 'lucide-react';
import api from '../api/axios';

const cn = (...c) => c.filter(Boolean).join(' ');

const STEPS = [
  { id:1, label:'Basics',    icon:Megaphone },
  { id:2, label:'Creative',  icon:Image },
  { id:3, label:'Targeting', icon:Target },
  { id:4, label:'Budget',    icon:DollarSign },
  { id:5, label:'Review',    icon:Send },
];

const NICHES = ['Technology','Crypto','Finance','Education','Entertainment','Health','Sports','News','Gaming','Lifestyle','Business','Other'];
const CATEGORIES = ['Tech News','Crypto Trading','Personal Finance','Online Courses','Movies','Fitness','Football','Politics','Mobile Games','Travel','Startups','Memes'];

function Steps({ current }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((s, i) => {
        const state = s.id < current ? 'done' : s.id === current ? 'active' : 'idle';
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn('step-dot', state)}>
                {state==='done' ? <Check size={13}/> : <s.icon size={13}/>}
              </div>
              <span className={cn('text-[10px] font-bold hidden sm:block',
                state==='active'?'text-indigo-600':state==='done'?'text-emerald-600':'text-slate-400')}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length-1 && <div className={cn('step-line mx-3', s.id < current && 'done')}/>}
          </div>
        );
      })}
    </div>
  );
}

const INIT = { 
  name:'', 
  niche:'Technology', 
  adText:'', 
  adImageUrl:'', 
  targetUrl:'', 
  buttonText:'',
  buttonUrl:'',
  cpm:100, 
  budget:500, 
  autoPlacement:true, 
  targetCategories:[], 
  startDate:'', 
  endDate:'',
  isFiller: false,
  fillerCpm: 24
};

export default function CampaignCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INIT);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      setInitialLoading(true);
      api.get(`/campaigns/${id}`)
        .then(res => {
          const data = res.data;
          setForm({
            name: data.name || '',
            niche: data.niche || 'Technology',
            adText: data.adText || '',
            adImageUrl: data.adImageUrl || '',
            targetUrl: data.targetUrl || '',
            cpm: data.cpm || 100,
            budget: data.budget || 500,
            autoPlacement: data.autoPlacement !== undefined ? data.autoPlacement : true,
            targetCategories: data.targetCategories || [],
            startDate: data.startDate ? data.startDate.split('T')[0] : '',
            endDate: data.endDate ? data.endDate.split('T')[0] : '',
            buttonText: data.buttonText || '',
            buttonUrl: data.buttonUrl || '',
            isFiller: data.isFiller || false,
            fillerCpm: data.fillerCpm || 24
          });
        })
        .catch(err => {
          setError('Failed to load campaign data.');
          console.error(err);
        })
        .finally(() => setInitialLoading(false));
    }
    api.get('/auth/me').then(res => setUser(res.data)).catch(() => {});
  }, [id]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleCat = (cat) => set('targetCategories', form.targetCategories.includes(cat) ? form.targetCategories.filter(c=>c!==cat) : [...form.targetCategories,cat]);

  const validate = () => {
    if (step===1 && !form.name.trim()) { setError('Campaign name required.'); return false; }
    if (step===2 && !form.adText.trim()) { setError('Ad copy required.'); return false; }
    if (step===4 && form.budget < 100) { setError('Min budget ₹100.'); return false; }
    return true;
  };

  const next = () => { setError(''); if (validate()) setStep(s => Math.min(s+1, 5)); };
  const back = () => setStep(s => Math.max(s-1, 1));

  const submit = async () => {
    setLoading(true); setError('');
    try { 
      if (isEdit) {
        await api.put(`/campaigns/${id}`, form);
      } else {
        await api.post('/campaigns', form); 
      }
      navigate('/campaigns'); 
    }
    catch (err) { setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} campaign.`); }
    finally { setLoading(false); }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <RefreshCw size={40} className="text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading campaign details...</p>
      </div>
    );
  }

  const inp = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 transition-all";
  const chip = (active) => cn('px-3 py-2 rounded-xl text-xs font-bold border-2 cursor-pointer transition-all', active ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300');
  const est = Math.round((form.budget / form.cpm) * 1000);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Create Campaign</h1>
        <p className="text-sm text-slate-500 mt-1">Step {step} of {STEPS.length}</p>
      </div>

      <Steps current={step} />

      <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3">
            <span className="text-rose-600 font-black">!</span>
            <p className="text-rose-700 text-sm">{error}</p>
          </div>
        )}

        {/* Step 1 */}
        {step===1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Campaign Name *</label>
              <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Q2 Product Launch" className={inp}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Niche *</label>
              <div className="grid grid-cols-3 gap-2">
                {NICHES.map(n=><button key={n} type="button" onClick={()=>set('niche',n)} className={chip(form.niche===n)}>{n}</button>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Start Date</p><input type="date" value={form.startDate} onChange={e=>set('startDate',e.target.value)} className={inp}/></div>
              <div><p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">End Date</p><input type="date" value={form.endDate} onChange={e=>set('endDate',e.target.value)} className={inp}/></div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step===2 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ad Copy *</label>
                <span className={cn('text-[11px] font-bold', form.adText.length>900?'text-rose-500':'text-slate-400')}>{form.adText.length}/1024</span>
              </div>
              <textarea value={form.adText} onChange={e=>set('adText',e.target.value)} rows={5} maxLength={1024}
                placeholder="Write your compelling ad message…"
                className={cn(inp, 'resize-none')}/>
              <p className="text-[11px] text-slate-400 mt-1">Use bold **text** and emojis for higher CTR.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Image URL (optional)</label>
              <div className="relative">
                <Image size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input value={form.adImageUrl} onChange={e=>set('adImageUrl',e.target.value)} placeholder="https://…" className={cn(inp,'pl-9')}/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Custom Button (optional)</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                   <Megaphone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                   <input value={form.buttonText} onChange={e=>set('buttonText',e.target.value)} placeholder="e.g. Join Channel" className={cn(inp,'pl-9')}/>
                </div>
                <div className="relative">
                   <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                   <input value={form.buttonUrl} onChange={e=>set('buttonUrl',e.target.value)} placeholder="https://t.me/…" className={cn(inp,'pl-9')}/>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">This adds a high-converting button to your ad post.</p>
            </div>
            {form.adText && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Live Ad Preview</p>
                <div className="tg-preview-container shadow-2xl">
                  <div className="tg-message">
                    <div className="tg-avatar shadow-lg">TN</div>
                    <div className="tg-bubble">
                      {form.adImageUrl && (
                        <div className="tg-image-wrap">
                           <img src={form.adImageUrl} alt="Ad" className="tg-image" onError={(e) => e.target.parentElement.style.display = 'none'} />
                        </div>
                      )}
                      <div className="tg-content">
                        <span className="tg-sender">TeleAds Network</span>
                        <p className="tg-text whitespace-pre-wrap">{form.adText}</p>
                        <div className="tg-footer">
                          <span className="tg-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <div className="tg-check">
                            <Check size={10} strokeWidth={4} />
                            <Check size={10} strokeWidth={4} style={{ marginLeft: -6 }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {(form.buttonText || form.targetUrl) && (
                    <div className="tg-button-container">
                       <div className="tg-inline-button shadow-sm">
                         {form.buttonText ? form.buttonText : '🔗 Learn More'}
                       </div>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-4 italic font-medium">* Premium Dark Theme Preview (Official Telegram Look)</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3 */}
        {step===3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Placement Mode</label>
              <div className="grid grid-cols-2 gap-3">
                {[{v:true,title:'Auto Placement',desc:'AI picks best matching groups',icon:Bot},{v:false,title:'Manual Select',desc:'Choose groups yourself',icon:Layers}].map(opt=>(
                  <button key={String(opt.v)} type="button" onClick={()=>set('autoPlacement',opt.v)}
                    className={cn('p-4 rounded-2xl text-left border-2 transition-all', form.autoPlacement===opt.v?'border-indigo-400 bg-indigo-50':'border-slate-200 hover:border-slate-300 bg-white')}>
                    <opt.icon size={18} className={cn('mb-2', form.autoPlacement===opt.v?'text-indigo-600':'text-slate-400')}/>
                    <p className={cn('text-sm font-bold', form.autoPlacement===opt.v?'text-indigo-700':'text-slate-700')}>{opt.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Target Categories</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat=>(
                  <button key={cat} type="button" onClick={()=>toggleCat(cat)}
                    className={cn('px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all', form.targetCategories.includes(cat)?'bg-indigo-100 border-indigo-300 text-indigo-700':'border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600')}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step===4 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">CPM Rate (₹)</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[80,100,120,150].map(v=>(
                    <button key={v} type="button" onClick={()=>set('cpm',v)}
                      className={cn('py-2.5 rounded-xl text-sm font-black border-2 transition-all', form.cpm===v?'border-indigo-400 bg-indigo-50 text-indigo-700':'border-slate-200 text-slate-600 hover:border-slate-300')}>
                      ₹{v}
                    </button>
                  ))}
                </div>
                <input type="number" value={form.cpm} onChange={e=>set('cpm',Number(e.target.value))} min={80} placeholder="Custom" className={inp}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Budget (₹)</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[500,1000,5000,10000].map(v=>(
                    <button key={v} type="button" onClick={()=>set('budget',v)}
                      className={cn('py-2.5 rounded-xl text-xs font-black border-2 transition-all', form.budget===v?'border-emerald-400 bg-emerald-50 text-emerald-700':'border-slate-200 text-slate-600 hover:border-slate-300')}>
                      ₹{v>=1000?`${v/1000}K`:v}
                    </button>
                  ))}
                </div>
                <input type="number" value={form.budget} onChange={e=>set('budget',Number(e.target.value))} min={100} placeholder="Custom" className={inp}/>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Your Advertiser Wallet</p>
                    <p className="text-2xl font-black text-indigo-900">₹{(user?.advertiserWallet || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Est. Reach</p>
                    <p className="text-xl font-black text-slate-800">{est.toLocaleString()}</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-3 text-center mb-1">
                 <div className="bg-white/60 p-2 rounded-xl border border-white">
                    <p className="text-lg font-black text-indigo-700">{Math.round(est*0.028).toLocaleString()}</p>
                    <p className="text-[9px] text-indigo-500 font-bold uppercase">Est. Clicks</p>
                 </div>
                 <div className="bg-white/60 p-2 rounded-xl border border-white">
                    <p className="text-lg font-black text-indigo-700">₹{form.cpm}</p>
                    <p className="text-[9px] text-indigo-500 font-bold uppercase">Per 1K Views</p>
                 </div>
               </div>

               {user && user.advertiserWallet < form.budget && (
                 <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <p className="text-[10px] text-rose-600 font-bold">Insufficient balance. Please top up ₹{(form.budget - user.advertiserWallet).toLocaleString()} more.</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* Step 5 */}
        {step===5 && (
          <div className="space-y-6">
            <p className="text-sm font-bold text-slate-700 mb-4">Review before submitting for approval.</p>
            <div className="space-y-2">
              {[
                ['Name', form.name], ['Niche', form.niche], ['CPM', `₹${form.cpm}`],
                ['Budget', `₹${form.budget}`], ['Est. Impressions', est.toLocaleString()],
                ['Placement', form.autoPlacement?'Auto (AI)':'Manual'],
                ['Categories', form.targetCategories.join(', ')||'None'],
              ].map(([l,v])=>(
                <div key={l} className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide w-32 shrink-0">{l}</span>
                  <span className="text-sm font-semibold text-slate-800 text-right">{v}</span>
                </div>
              ))}
            </div>

            {/* Superadmin Controls */}
            {user?.role === 'superadmin' && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Zap size={14} /> Superadmin Controls
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-amber-500/50 transition-all">
                    <input 
                      type="checkbox" 
                      checked={form.isFiller} 
                      onChange={e => setForm({...form, isFiller: e.target.checked})}
                      className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Mark as Filler Ad</p>
                      <p className="text-[10px] text-slate-500">Runs as fallback when no paid ads are active</p>
                    </div>
                  </label>
                  
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Publisher CPM (₹)</p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input 
                        type="number" 
                        value={form.fillerCpm}
                        onChange={e => setForm({...form, fillerCpm: parseFloat(e.target.value)})}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-sm text-slate-800 font-bold focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nav */}

        {/* Nav */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
          <button onClick={back} disabled={step===1}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft size={15}/> Back
          </button>
          {step < 5
            ? <button onClick={next} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25">
                Next <ChevronRight size={15}/>
              </button>
            : <button onClick={submit} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25 disabled:opacity-60">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><Send size={14}/> Submit Campaign</>}
              </button>
          }
        </div>
      </div>
    </div>
  );
}
