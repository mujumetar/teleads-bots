import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, MousePointerClick, DollarSign, Pause, Play, Trash2, BarChart3, TrendingUp, Megaphone, RefreshCw, Edit3 } from 'lucide-react';
import api from '../api/axios';

const cn = (...c) => c.filter(Boolean).join(' ');

function StatusBadge({ status }) {
  const s = {
    active:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
    pending:   'bg-amber-100 text-amber-700 border border-amber-200',
    paused:    'bg-slate-100 text-slate-600 border border-slate-200',
    rejected:  'bg-rose-100 text-rose-700 border border-rose-200',
    completed: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  };
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide', s[status] || 'bg-slate-100 text-slate-500 border border-slate-200')}>{status}</span>;
}

function CampaignCard({ c, onStatus, onDelete }) {
  const pct = Math.min(((c.budgetSpent||0) / (c.budget||1)) * 100, 100);
  const ctr = c.totalImpressions > 0 ? ((c.totalClicks||0) / c.totalImpressions * 100).toFixed(1) : '0';
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all group animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <Link to={`/campaigns/${c._id}`} className="font-bold text-slate-800 hover:text-indigo-600 transition-colors text-sm">{c.name}</Link>
          <p className="text-[11px] text-slate-400 capitalize mt-0.5">{c.niche||'General'} · CPM ₹{c.cpm||100}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
          <Link to={`/campaigns/edit/${c._id}`} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-indigo-500"><Edit3 size={13}/></Link>
          {c.status==='active'
            ? <button onClick={()=>onStatus(c._id,'paused')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"><Pause size={13}/></button>
            : <button onClick={()=>onStatus(c._id,'active')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"><Play size={13}/></button>}
          <button onClick={()=>onDelete(c._id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-50 text-rose-400"><Trash2 size={13}/></button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-4">
        <StatusBadge status={c.status}/>
        {c.autoPlacement && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">Auto</span>}
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
          <span>Budget</span>
          <span>₹{(c.budgetSpent||0).toLocaleString()} / ₹{(c.budget||0).toLocaleString()}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{width:`${pct}%`, background: pct>80?'#f59e0b':'#6366f1'}}/>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          {l:'Impressions', v:(c.totalImpressions||0).toLocaleString(), Icon:Eye, col:'text-indigo-500'},
          {l:'Clicks',      v:(c.totalClicks||0).toLocaleString(),      Icon:MousePointerClick, col:'text-violet-500'},
          {l:'CTR',         v:`${ctr}%`, Icon:TrendingUp, col:'text-emerald-500'},
        ].map(m=>(
          <div key={m.l} className="bg-slate-50 rounded-xl p-2.5 text-center">
            <m.Icon size={12} className={cn('mx-auto mb-1', m.col)}/>
            <p className="text-sm font-black text-slate-800">{m.v}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase">{m.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const FILTERS = ['all','active','paused','pending','completed','rejected'];

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');

  const load = () => { setLoading(true); api.get('/campaigns').then(r=>setCampaigns(r.data)).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(load, []);

  const handleStatus = async (id, status) => { try { await api.put(`/campaigns/${id}`,{status}); load(); } catch{} };
  const handleDelete = async (id) => { if(!window.confirm('Delete?')) return; try { await api.delete(`/campaigns/${id}`); load(); } catch{} };

  const filtered = campaigns.filter(c => (filter==='all'||c.status===filter) && (!search||c.name.toLowerCase().includes(search.toLowerCase())));
  const spend = campaigns.reduce((s,c)=>s+(c.budgetSpent||0),0);
  const impr  = campaigns.reduce((s,c)=>s+(c.totalImpressions||0),0);
  const clicks= campaigns.reduce((s,c)=>s+(c.totalClicks||0),0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-0.5">{campaigns.length} total · {campaigns.filter(c=>c.status==='active').length} active</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={load} className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-all"><RefreshCw size={14}/></button>
          <Link to="/campaigns/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"><Plus size={16}/>New Campaign</Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {l:'Total Spend',  v:`₹${spend.toLocaleString()}`,    c:'#6366f1', Icon:DollarSign},
          {l:'Impressions',  v:impr.toLocaleString(),            c:'#8b5cf6', Icon:Eye},
          {l:'Total Clicks', v:clicks.toLocaleString(),          c:'#10b981', Icon:MousePointerClick},
        ].map(m=>(
          <div key={m.l} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:m.c+'18'}}>
              <m.Icon size={18} style={{color:m.c}}/>
            </div>
            <div><p className="text-xl font-black text-slate-900">{m.v}</p><p className="text-[11px] text-slate-400 font-medium">{m.l}</p></div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search campaigns…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 outline-none focus:border-indigo-400 transition-all"/>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1">
          {FILTERS.map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize', filter===f?'bg-white text-indigo-600 shadow-sm':'text-slate-500 hover:text-slate-700')}>
              {f==='all'?'All':f}
            </button>
          ))}
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button onClick={()=>setView('grid')} className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all', view==='grid'?'bg-white shadow-sm text-indigo-600':'text-slate-400')}>⊞ Grid</button>
          <button onClick={()=>setView('table')} className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all', view==='table'?'bg-white shadow-sm text-indigo-600':'text-slate-400')}>☰ Table</button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i=><div key={i} className="skeleton h-52 rounded-2xl"/>)}</div>
      ) : filtered.length===0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><Megaphone size={26}/></div>
          <p className="text-sm font-bold text-slate-700">{search||filter!=='all'?'No matches found':'No campaigns yet'}</p>
          <p className="text-xs text-slate-400">{search||filter!=='all'?'Try changing your filters.':'Create your first campaign to start running ads.'}</p>
          {!search&&filter==='all'&&<Link to="/campaigns/new" className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">Launch Campaign</Link>}
        </div>
      ) : view==='grid' ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c=><CampaignCard key={c._id} c={c} onStatus={handleStatus} onDelete={handleDelete}/>)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{['Campaign','Status','Budget','Impressions','CTR',''].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(c=>{
                  const ctr = c.totalImpressions>0 ? ((c.totalClicks||0)/c.totalImpressions*100).toFixed(1):'0';
                  return (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3"><p className="font-semibold text-slate-800">{c.name}</p><p className="text-[11px] text-slate-400 capitalize">{c.niche||'General'}</p></td>
                      <td className="px-4 py-3"><StatusBadge status={c.status}/></td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-700">₹{(c.budgetSpent||0).toLocaleString()} / ₹{(c.budget||0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{(c.totalImpressions||0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{ctr}%</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link to={`/campaigns/${c._id}`} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-indigo-400"><BarChart3 size={13}/></Link>
                          {c.status==='active'
                            ? <button onClick={()=>handleStatus(c._id,'paused')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"><Pause size={13}/></button>
                            : <button onClick={()=>handleStatus(c._id,'active')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"><Play size={13}/></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
