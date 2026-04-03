import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Plus, Eye, MousePointerClick,
  DollarSign, Megaphone, ChevronRight, Wallet,
  Globe, Bot, Inbox, BarChart3, Zap, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const cn = (...c) => c.filter(Boolean).join(' ');

function SparkBars({ data = [], color }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-8 mt-2">
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all"
          style={{ height: `${Math.max((v / max) * 100, 8)}%`, background: color, opacity: 0.4 + (i / data.length) * 0.6 }} />
      ))}
    </div>
  );
}

function KpiCard({ title, value, sub, trend, icon: Icon, color, sparkData }) {
  const up = trend >= 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className={cn('flex items-center gap-1 text-xs font-bold', up ? 'text-emerald-600' : 'text-rose-500')}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-0.5">{title}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      {sparkData && <SparkBars data={sparkData} color={color} />}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active:    'bg-emerald-100 text-emerald-700 border-emerald-200',
    approved:  'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending:   'bg-amber-100 text-amber-700 border-amber-200',
    paused:    'bg-slate-100 text-slate-600 border-slate-200',
    rejected:  'bg-rose-100 text-rose-700 border-rose-200',
    completed: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide', styles[status] || 'bg-slate-100 text-slate-500 border-slate-200')}>
      {status}
    </span>
  );
}

function QuickBtn({ icon: Icon, label, to, bg }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2 p-4 rounded-2xl text-white transition-all hover:-translate-y-0.5 active:scale-95"
      style={{ background: bg, boxShadow: `0 4px 14px ${bg}55` }}>
      <Icon size={20} />
      <span className="text-[11px] font-bold">{label}</span>
    </Link>
  );
}

/* ── Advertiser ─────────────────────────────────────────────── */
function AdvertiserDashboard({ user }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/campaigns').then(r => setCampaigns(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  const spend  = campaigns.reduce((s, c) => s + (c.budgetSpent || 0), 0);
  const impr   = campaigns.reduce((s, c) => s + (c.totalImpressions || 0), 0);
  const clicks = campaigns.reduce((s, c) => s + (c.totalClicks || 0), 0);
  const active = campaigns.filter(c => c.status === 'active').length;
  const ctr    = impr > 0 ? ((clicks / impr) * 100).toFixed(2) : '0.00';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Advertiser Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back, <strong className="text-slate-700">{user?.email?.split('@')[0]}</strong></p>
        </div>
        <Link to="/campaigns/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25 self-start sm:self-auto">
          <Plus size={16} /> New Campaign
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <QuickBtn icon={Plus}       label="New Campaign" to="/campaigns/new" bg="#6366f1" />
        <QuickBtn icon={BarChart3}  label="Analytics"    to="/analytics"     bg="#8b5cf6" />
        <QuickBtn icon={Wallet}     label="Add Budget"   to="/wallet"        bg="#10b981" />
        <QuickBtn icon={Megaphone}  label="Campaigns"    to="/campaigns"     bg="#f59e0b" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Spend"      value={`₹${spend.toLocaleString()}`} sub={`${active} active`} trend={12.4} icon={DollarSign} color="#6366f1" sparkData={[20,35,28,45,60,52,75,80,65,90]} />
        <KpiCard title="Impressions"      value={impr.toLocaleString()} sub="All-time views"   trend={8.1}  icon={Eye}              color="#8b5cf6" sparkData={[30,50,40,60,55,70,80,65,90,95]} />
        <KpiCard title="Click Rate"       value={`${ctr}%`} sub={`${clicks.toLocaleString()} clicks`} trend={-2.3} icon={MousePointerClick} color="#f59e0b" sparkData={[60,65,58,70,62,73,68,72,75,70]} />
        <KpiCard title="Active Campaigns" value={active} sub={`of ${campaigns.length} total`} icon={Megaphone} color="#10b981" sparkData={[1,2,2,3,2,3,4,3,4,active]} />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-sm">Recent Campaigns</h2>
            <Link to="/campaigns" className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-11" />)}</div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><Megaphone size={24} /></div>
              <p className="text-sm font-bold text-slate-700">No campaigns yet</p>
              <p className="text-xs text-slate-400 text-center max-w-xs">Launch your first campaign to start reaching Telegram audiences.</p>
              <Link to="/campaigns/new" className="mt-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
                Launch Campaign
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{['Campaign','Status','Spend / Budget','Impressions'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {campaigns.slice(0, 6).map(c => (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/campaigns/${c._id}`} className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors">{c.name}</Link>
                        <p className="text-[11px] text-slate-400 capitalize">{c.niche || 'General'}</p>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-slate-700">₹{(c.budgetSpent||0).toLocaleString()} / ₹{(c.budget||0).toLocaleString()}</p>
                        <div className="progress-track mt-1.5"><div className="progress-fill bg-indigo-500" style={{ width: `${Math.min(((c.budgetSpent||0)/(c.budget||1))*100,100)}%` }} /></div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{(c.totalImpressions||0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Advertiser Wallet</p>
            <p className="text-3xl font-black text-slate-900">₹{(user?.advertiserWallet || 0).toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Available balance</p>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/wallet" className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold text-center hover:bg-indigo-700 transition-colors">Add Funds</Link>
              <Link to="/wallet" className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold text-center hover:bg-slate-200 transition-colors">History</Link>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Network Reach</p>
            {[['Publisher Groups','1,240+','#6366f1'],['Total Members','8.4M+','#10b981'],['Avg CTR','2.8%','#8b5cf6'],['CPM Range','₹80–₹150','#f59e0b']].map(([l,v,c]) => (
              <div key={l} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-500">{l}</span>
                <span className="text-xs font-black" style={{ color: c }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Publisher ──────────────────────────────────────────────── */
function PublisherDashboard({ user }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/groups').then(r => setGroups(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  const earned   = groups.reduce((s, g) => s + (g.revenueEarned || 0), 0);
  const adsPosted= groups.reduce((s, g) => s + (g.totalAdsPosted || 0), 0);
  const impr     = groups.reduce((s, g) => s + ((g.avgViews || 0) * (g.totalAdsPosted || 0)), 0);
  const approved = groups.filter(g => g.status === 'approved').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Publisher Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monetise your Telegram audience with CPM ads.</p>
        </div>
        <Link to="/groups/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/25 self-start sm:self-auto">
          <Plus size={16} /> Add Channel
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <QuickBtn icon={Plus}     label="Add Channel" to="/groups/new" bg="#10b981" />
        <QuickBtn icon={Inbox}    label="Ad Inbox"    to="/ad-inbox"   bg="#6366f1" />
        <QuickBtn icon={Wallet}   label="Withdraw"    to="/wallet"     bg="#8b5cf6" />
        <QuickBtn icon={BarChart3} label="Analytics"  to="/analytics"  bg="#f59e0b" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Earnings"  value={`₹${earned.toFixed(2)}`} sub="Publisher wallet" trend={18.2} icon={DollarSign} color="#10b981" sparkData={[10,25,20,35,40,30,55,60,50,70]} />
        <KpiCard title="Impressions"     value={impr.toLocaleString()} sub="All channels" trend={11.5} icon={Eye} color="#6366f1" sparkData={[20,40,35,55,50,65,70,60,80,85]} />
        <KpiCard title="Ads Posted"      value={adsPosted} sub="All time" trend={5.8} icon={Megaphone} color="#8b5cf6" sparkData={[1,3,2,4,5,4,6,7,6,8]} />
        <KpiCard title="Active Channels" value={approved} sub={`${groups.length} registered`} icon={Bot} color="#f59e0b" sparkData={[0,1,1,2,2,2,3,3,3,approved]} />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-sm">My Channels</h2>
            <Link to="/groups" className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">Manage <ChevronRight size={12} /></Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-11" />)}</div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><Layers size={24} /></div>
              <p className="text-sm font-bold text-slate-700">No channels yet</p>
              <p className="text-xs text-slate-400">Add your Telegram channel to start earning.</p>
              <Link to="/groups/new" className="mt-1 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors">Add Channel</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{['Channel','Status','Members','CPM','Earned'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {groups.map(g => (
                    <tr key={g._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3"><p className="font-semibold text-slate-800">{g.name}</p><p className="text-[11px] text-slate-400">Score: {g.performanceScore||0}%</p></td>
                      <td className="px-4 py-3"><StatusBadge status={g.status} /></td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{(g.memberCount||0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-black text-purple-600">₹{g.dynamicCpm||80}</td>
                      <td className="px-4 py-3 font-black text-emerald-600">₹{(g.revenueEarned||0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Publisher Wallet</p>
            <p className="text-3xl font-black text-slate-900">₹{(user?.publisherWallet || 0).toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">Available for withdrawal</p>
            <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-100 mb-4">
              <p className="text-[11px] text-amber-700 font-semibold">Min withdrawal ₹1,000 · ETA 24–48h</p>
            </div>
            <Link to="/wallet" className="block w-full px-3 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold text-center hover:bg-emerald-700 transition-colors">Request Withdrawal</Link>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">CPM Tiers</p>
            {[['🥇 Gold','Score > 20%','₹150'],['🥈 Silver','Score > 10%','₹120'],['🥉 Bronze','Score ≤ 10%','₹80']].map(([t,r,c]) => (
              <div key={t} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-2 last:mb-0">
                <div><p className="text-xs font-bold text-slate-700">{t}</p><p className="text-[10px] text-slate-400">{r}</p></div>
                <p className="text-sm font-black text-indigo-600">{c}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, activeRole } = useAuth();
  return activeRole === 'publisher' ? <PublisherDashboard user={user} /> : <AdvertiserDashboard user={user} />;
}
