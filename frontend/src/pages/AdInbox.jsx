import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Inbox, Bot, Users, Eye, RefreshCw, Filter, ChevronRight } from 'lucide-react';
import api from '../api/axios';

function TimeAgo({ date }) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0)  return `${hrs}h ago`;
  return `${mins}m ago`;
}

function AdCard({ adPost, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const c = adPost.campaign || {};
  const g = adPost.group || {};

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
            <Inbox size={18}/>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm">{c.name || 'Unnamed Campaign'}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              For: <span className="font-semibold text-slate-600">{g.name || 'Your Channel'}</span> · <TimeAgo date={adPost.createdAt || new Date()}/>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {adPost.status === 'pending' ? (
            <>
              <button onClick={()=>onApprove(adPost._id)} className="btn-sm px-3 py-2 rounded-xl text-white font-bold text-xs transition-all" style={{background:'#10b981'}}>
                <CheckCircle size={13} className="inline mr-1"/>Accept
              </button>
              <button onClick={()=>onReject(adPost._id)} className="btn-sm px-3 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs hover:bg-rose-100 transition-all">
                <XCircle size={13} className="inline mr-1"/>Reject
              </button>
            </>
          ) : (
            <span className={`badge ${adPost.status==='sent'||adPost.status==='approved'?'badge-emerald':'badge-rose'}`}>
              {adPost.status}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-indigo-50 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-indigo-700">₹{c.cpm || 100}</p>
            <p className="text-[10px] text-indigo-500 font-bold uppercase">CPM Rate</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-emerald-700">
              ₹{((c.cpm||100) / 1000 * (g.avgViews || g.memberCount * 0.15 || 0) * 0.65).toFixed(2)}
            </p>
            <p className="text-[10px] text-emerald-500 font-bold uppercase">Est. Earning</p>
          </div>
          <div className="bg-violet-50 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-violet-700">{(g.avgViews || 0).toLocaleString()}</p>
            <p className="text-[10px] text-violet-500 font-bold uppercase">Avg Views</p>
          </div>
        </div>

        {/* Ad preview */}
        {c.adText && (
          <div>
            <button onClick={()=>setExpanded(v=>!v)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 mb-2 transition-colors">
              {expanded ? 'Hide' : 'Preview'} Ad Copy <ChevronRight size={12} className={`transition-transform ${expanded?'rotate-90':''}`}/>
            </button>
            {expanded && (
              <div className="tg-preview max-w-xs">
                <div className="tg-header">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">T</div>
                  <div>
                    <p className="font-bold text-xs">Sponsored</p>
                    <p className="text-blue-100 text-[10px]">TeleAds Pro</p>
                  </div>
                </div>
                <div className="tg-body">
                  <div className="tg-sponsored">Ad</div>
                  <p className="text-xs">{c.adText.slice(0,200)}{c.adText.length>200&&'…'}</p>
                </div>
                {c.targetUrl && <div className="tg-cta-btn text-xs">🔗 Learn More</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const FILTERS = ['all', 'pending', 'sent', 'rejected'];

export default function AdInbox() {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/ad-posts/my').then(r => setPosts(r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleApprove = async (id) => {
    try { await api.put(`/ad-posts/${id}/status`, { status: 'approved' }); load(); } catch {}
  };
  const handleReject = async (id) => {
    try { await api.put(`/ad-posts/${id}/status`, { status: 'rejected' }); load(); } catch {}
  };

  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter);
  const pendingCount = posts.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Ad Inbox
            {pendingCount > 0 && (
              <span className="badge badge-amber">{pendingCount} pending</span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Review and manage incoming ad requests for your channels.</p>
        </div>
        <button onClick={load} className="btn-icon" title="Refresh"><RefreshCw size={15}/></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { l:'Pending Review', v:pendingCount, c:'#f59e0b' },
          { l:'Ads Accepted',   v:posts.filter(p=>p.status==='sent'||p.status==='approved').length, c:'#10b981' },
          { l:'Ads Rejected',   v:posts.filter(p=>p.status==='rejected').length, c:'#f43f5e' },
        ].map(m=>(
          <div key={m.l} className="glass-card p-4 text-center">
            <p className="text-2xl font-black" style={{color:m.c}}>{m.v}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">{m.l}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {FILTERS.map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${filter===f?'bg-white text-indigo-600 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
            {f==='all'?'All':f} {f!=='all'&&`(${posts.filter(p=>p.status===f).length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i=><div key={i} className="skeleton h-44 rounded-2xl"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-icon"><Inbox size={28}/></div>
            <p className="text-sm font-bold text-slate-700">
              {filter==='pending' ? 'No pending ad requests' : filter==='all' ? 'Your inbox is empty' : `No ${filter} ads`}
            </p>
            <p className="text-xs text-slate-400 max-w-xs text-center">
              Ads will appear here once your channel is approved and advertisers target your niche.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(p=><AdCard key={p._id} adPost={p} onApprove={handleApprove} onReject={handleReject}/>)}
        </div>
      )}
    </div>
  );
}
