import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Bot, Users, Eye, DollarSign, BarChart3, RefreshCw, Trash2, CheckCircle, XCircle, Layers, Edit3 } from 'lucide-react';
import api from '../api/axios';

const cn = (...c) => c.filter(Boolean).join(' ');
const STATUS = {
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending:  'bg-amber-100 text-amber-700 border-amber-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
};

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = () => { setLoading(true); api.get('/groups').then(r=>setGroups(r.data)).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(load, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this channel?')) return;
    try { await api.delete(`/groups/${id}`); load(); } catch {}
  };

  const filtered = filter==='all' ? groups : groups.filter(g=>g.status===filter);
  const earned   = groups.reduce((s,g)=>s+(g.revenueEarned||0),0);
  const members  = groups.reduce((s,g)=>s+(g.memberCount||0),0);
  const approved = groups.filter(g=>g.status==='approved').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Channels</h1>
          <p className="text-sm text-slate-500 mt-0.5">{groups.length} registered · {approved} approved</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={load} className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-all"><RefreshCw size={14}/></button>
          <Link to="/groups/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/25">
            <Plus size={16}/> Add Channel
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {l:'Total Earned', v:`₹${earned.toFixed(2)}`, c:'text-emerald-600', bg:'bg-emerald-50 border-emerald-100', icon:DollarSign},
          {l:'Total Reach',  v:`${members.toLocaleString()} members`, c:'text-indigo-600', bg:'bg-indigo-50 border-indigo-100', icon:Users},
          {l:'Active Channels', v:approved, c:'text-violet-600', bg:'bg-violet-50 border-violet-100', icon:Bot},
        ].map(m=>(
          <div key={m.l} className={cn('rounded-2xl border p-4 flex items-center gap-4', m.bg)}>
            <m.icon size={20} className={m.c}/>
            <div><p className={cn('text-xl font-black', m.c)}>{m.v}</p><p className="text-xs text-slate-400 font-medium">{m.l}</p></div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex bg-slate-100 rounded-xl p-1 w-fit">
        {['all','approved','pending','rejected'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize', filter===f?'bg-white text-indigo-600 shadow-sm':'text-slate-500 hover:text-slate-700')}>
            {f==='all'?'All':f} ({f==='all'?groups.length:groups.filter(g=>g.status===f).length})
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[1,2,3,4].map(i=><div key={i} className="skeleton h-48 rounded-2xl"/>)}</div>
      ) : filtered.length===0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><Layers size={26}/></div>
          <p className="text-sm font-bold text-slate-700">{filter==='all'?'No channels yet':'No '+filter+' channels'}</p>
          {filter==='all'&&<Link to="/groups/new" className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors">Add Your First Channel</Link>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(g=>(
            <div key={g._id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all group animate-fade-in">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-500 shrink-0">
                    <Bot size={18}/>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{g.name}</p>
                    <p className="text-[11px] text-slate-400">{g.telegramGroupId||'—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2">
                  <Link to={`/groups/edit/${g._id}`} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-indigo-500"><Edit3 size={13}/></Link>
                  <button onClick={()=>handleDelete(g._id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-50 text-rose-400">
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>

              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase mb-4', STATUS[g.status]||'bg-slate-100 text-slate-500 border-slate-200')}>
                {g.status}
              </span>

              {g.status==='pending' && (
                <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-[11px] text-amber-700 font-semibold">⏳ Under review — usually takes 24h</p>
                </div>
              )}
              {g.status==='rejected' && (
                <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                  <p className="text-[11px] text-rose-700 font-semibold">❌ {g.rejectionReason||'Does not meet requirements'}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {[
                  {l:'Members', v:(g.memberCount||0).toLocaleString(), Icon:Users, c:'text-indigo-500'},
                  {l:'Avg Views', v:(g.avgViews||0).toLocaleString(), Icon:Eye, c:'text-violet-500'},
                  {l:'Earned', v:`₹${(g.revenueEarned||0).toFixed(0)}`, Icon:DollarSign, c:'text-emerald-500'},
                ].map(m=>(
                  <div key={m.l} className="bg-slate-50 rounded-xl p-2.5 text-center">
                    <m.Icon size={12} className={cn('mx-auto mb-1', m.c)}/>
                    <p className="text-sm font-black text-slate-800">{m.v}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{m.l}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-50">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">CPM Rate</p>
                  <p className="text-sm font-black text-indigo-600">₹{g.dynamicCpm||80}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">Score</p>
                  <p className={cn('text-sm font-black', (g.performanceScore||0)>=10?'text-emerald-600':(g.performanceScore||0)>=5?'text-amber-600':'text-rose-600')}>
                    {g.performanceScore||0}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">Ads Posted</p>
                  <p className="text-sm font-black text-slate-700">{g.totalAdsPosted||0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
