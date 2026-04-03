import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Eye, MousePointerClick, DollarSign,
  BarChart3, Megaphone, Bot, ChevronDown, Download
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const cn = (...c) => c.filter(Boolean).join(' ');

function MiniBar({ pct, color }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function MetricBox({ label, value, sub, up, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
        {up !== undefined && (
          <span className={cn('flex items-center gap-1 text-xs font-bold', up ? 'text-emerald-600' : 'text-rose-500')}>
            {up ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
          </span>
        )}
      </div>
      <p className="text-2xl font-black tabular-nums" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

/* Simple inline SVG bar chart */
function BarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.v), 1);
  const W = 600, H = 120, pad = 8, barW = (W - pad * 2) / data.length - 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
      {data.map((d, i) => {
        const h = Math.max((d.v / max) * (H - 20), 2);
        const x = pad + i * ((W - pad * 2) / data.length) + 2;
        return (
          <g key={i}>
            <rect x={x} y={H - h - 16} width={barW} height={h} rx={3} fill={color} opacity={0.8} />
            <text x={x + barW / 2} y={H - 2} textAnchor="middle" fontSize={9} fill="#94a3b8">{d.l}</text>
          </g>
        );
      })}
    </svg>
  );
}

const RANGES = ['7d','30d','90d'];

export default function Analytics() {
  const { activeRole } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [groups, setGroups] = useState([]);
  const [range, setRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/campaigns').catch(() => ({ data: [] })),
      api.get('/groups').catch(() => ({ data: [] })),
    ]).then(([c, g]) => { setCampaigns(c.data); setGroups(g.data); }).finally(() => setLoading(false));
  }, []);

  const spend  = campaigns.reduce((s, c) => s + (c.budgetSpent || 0), 0);
  const impr   = campaigns.reduce((s, c) => s + (c.totalImpressions || 0), 0);
  const clicks = campaigns.reduce((s, c) => s + (c.totalClicks || 0), 0);
  const earned = groups.reduce((s, g) => s + (g.revenueEarned || 0), 0);
  const ctr    = impr > 0 ? ((clicks / impr) * 100).toFixed(2) : '0.00';
  const avgCpm = campaigns.length > 0
    ? (campaigns.reduce((s, c) => s + (c.cpm || 100), 0) / campaigns.length).toFixed(0) : 100;

  // Mock bar data (7 days)
  const barData = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((l, i) => ({
    l, v: Math.round(((impr || 1000) / 7) * (0.7 + Math.sin(i) * 0.3))
  }));

  const isPublisher = activeRole === 'publisher';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">{isPublisher ? 'Publisher performance metrics' : 'Campaign performance overview'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-xl p-1">
            {RANGES.map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all', range === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                {r}
              </button>
            ))}
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-all">
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* KPI grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="skeleton h-32 rounded-2xl"/>)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isPublisher ? (
            <>
              <MetricBox label="Total Earned"    value={`₹${earned.toFixed(2)}`}   up={true}  color="#10b981" />
              <MetricBox label="Ad Impressions"  value={impr.toLocaleString()}      up={true}  color="#6366f1" sub="All channels" />
              <MetricBox label="Ads Posted"      value={groups.reduce((s,g)=>s+(g.totalAdsPosted||0),0)} color="#8b5cf6" sub="All-time" />
              <MetricBox label="Active Channels" value={groups.filter(g=>g.status==='approved').length} color="#f59e0b" sub={`of ${groups.length}`} />
            </>
          ) : (
            <>
              <MetricBox label="Total Spend"     value={`₹${spend.toLocaleString()}`}  up={true}  color="#6366f1" sub={`Avg CPM ₹${avgCpm}`} />
              <MetricBox label="Impressions"     value={impr.toLocaleString()}          up={true}  color="#8b5cf6" sub="Total views" />
              <MetricBox label="Clicks"          value={clicks.toLocaleString()}        up={false} color="#f59e0b" sub={`${ctr}% CTR`} />
              <MetricBox label="Campaigns"       value={campaigns.length}                           color="#10b981" sub={`${campaigns.filter(c=>c.status==='active').length} active`} />
            </>
          )}
        </div>
      )}

      {/* Charts grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Impressions bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800">Impressions Over Time</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 7 days</p>
            </div>
            <div className="px-3 py-1 bg-indigo-50 rounded-xl text-xs font-bold text-indigo-600">
              {impr.toLocaleString()} total
            </div>
          </div>
          <BarChart data={barData} color="#6366f1" />
        </div>

        {/* Campaign breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-800 mb-4">{isPublisher ? 'Channel Performance' : 'Campaign Split'}</h3>
          <div className="space-y-4">
            {(isPublisher ? groups : campaigns).slice(0, 5).map((item, i) => {
              const colors = ['#6366f1','#10b981','#f59e0b','#8b5cf6','#f43f5e'];
              const max = isPublisher
                ? Math.max(...groups.map(g=>g.revenueEarned||0), 1)
                : Math.max(...campaigns.map(c=>c.totalImpressions||0), 1);
              const val = isPublisher ? (item.revenueEarned||0) : (item.totalImpressions||0);
              const pct = Math.round((val / max) * 100);
              return (
                <div key={item._id || i}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">{item.name}</p>
                    <p className="text-xs font-black" style={{ color: colors[i] }}>
                      {isPublisher ? `₹${(item.revenueEarned||0).toFixed(0)}` : (item.totalImpressions||0).toLocaleString()}
                    </p>
                  </div>
                  <MiniBar pct={pct} color={colors[i]} />
                </div>
              );
            })}
            {(isPublisher ? groups : campaigns).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Performance table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{isPublisher ? 'Channel Performance Table' : 'Campaign Performance Table'}</h3>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-11"/>)}</div>
        ) : (isPublisher ? groups : campaigns).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
              {isPublisher ? <Bot size={22}/> : <Megaphone size={22}/>}
            </div>
            <p className="text-sm font-bold text-slate-700">No data yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {isPublisher
                    ? ['Channel','Status','Members','Avg Views','Ads Posted','Earned'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{h}</th>)
                    : ['Campaign','Status','Spend','Impressions','Clicks','CTR'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isPublisher ? groups.map(g=>(
                  <tr key={g._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{g.name}</td>
                    <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', g.status==='approved'?'bg-emerald-100 text-emerald-700 border-emerald-200':'bg-amber-100 text-amber-700 border-amber-200')}>{g.status}</span></td>
                    <td className="px-4 py-3 font-medium text-slate-700">{(g.memberCount||0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{(g.avgViews||0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{g.totalAdsPosted||0}</td>
                    <td className="px-4 py-3 font-black text-emerald-600">₹{(g.revenueEarned||0).toFixed(2)}</td>
                  </tr>
                )) : campaigns.map(c=>{
                  const c_ctr = c.totalImpressions>0 ? ((c.totalClicks||0)/c.totalImpressions*100).toFixed(1):'0';
                  return (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3"><Link to={`/campaigns/${c._id}`} className="font-semibold text-slate-800 hover:text-indigo-600">{c.name}</Link></td>
                      <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', c.status==='active'?'bg-emerald-100 text-emerald-700 border-emerald-200':'bg-slate-100 text-slate-600 border-slate-200')}>{c.status}</span></td>
                      <td className="px-4 py-3 font-bold text-slate-700">₹{(c.budgetSpent||0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{(c.totalImpressions||0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{(c.totalClicks||0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-violet-600">{c_ctr}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
