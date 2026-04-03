import { useState, useEffect } from 'react';
import api from '../api/axios';
import StatsCard from '../components/StatsCard';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Users, Megaphone, LayoutGrid, DollarSign,
  CheckCircle, XCircle, Clock, Activity, Loader2, Zap, Search, ChevronRight
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingCampaigns, setPendingCampaigns] = useState([]);
  const [pendingGroups, setPendingGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, campaignsRes, groupsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/campaigns'),
        api.get('/groups'),
        api.get('/admin/users'),
      ]);
      setStats(statsRes.data);
      setPendingCampaigns(campaignsRes.data.filter(c => c.status === 'pending'));
      setPendingGroups(groupsRes.data.filter(g => g.status === 'pending'));
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Data Fetch Failure:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerAds = async () => {
    setTriggering(true);
    try {
      await api.get('/admin/trigger-ads');
      alert('Network Protocol Triggered: Ad cycles have been refreshed.');
    } catch (err) {
      alert('Trigger Failed: Matrix sync error.');
    } finally {
      setTriggering(false);
    }
  };

  const handleCampaignAction = async (id, status, reason = '') => {
    try {
      await api.put(`/admin/campaigns/${id}/status`, { status, rejectionReason: reason });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleGroupAction = async (id, status, reason = '') => {
    try {
      await api.put(`/admin/groups/${id}/status`, { status, rejectionReason: reason });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  if (loading) return <LoadingSpinner label="Loading admin data…" />;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mb-20 space-y-10 animate-fade-in">
      <PageHeader
        badge="Admin"
        title="Operations"
        description="Approve campaigns and groups, view users, and trigger ad delivery runs."
      >
        <button 
          onClick={triggerAds}
          disabled={triggering}
          className="pro-btn-primary"
        >
          {triggering ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
          {triggering ? 'Running…' : 'Run ad cycle'}
        </button>
      </PageHeader>

      {/* Main Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatsCard icon={<Users size={20} />} label="Total Entities" value={stats.totalUsers} color="indigo" />
          <StatsCard icon={<Megaphone size={20} />} label="Live Ad Paths" value={stats.activeCampaigns} color="emerald" />
          <StatsCard icon={<Clock size={20} />} label="Awaiting Audit" value={pendingCampaigns.length + pendingGroups.length} color="amber" />
          <StatsCard icon={<LayoutGrid size={20} />} label="Approved Nodes" value={stats.approvedGroups} color="indigo" />
          <StatsCard icon={<DollarSign size={20} />} label="Total Revenue" value={`₹${(stats.totalRevenue || 0).toLocaleString()}`} color="emerald" />
        </div>
      )}

      {/* Domain Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-100 overflow-x-auto no-scrollbar">
        {['overview', 'campaigns', 'groups', 'users'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
              activeTab === tab 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
            }`}
          >
            {tab}
            {(tab === 'campaigns' && pendingCampaigns.length > 0) && (
              <span className="ml-2 bg-rose-500 text-white px-1.5 py-0.5 rounded text-[10px]">{pendingCampaigns.length}</span>
            )}
            {(tab === 'groups' && pendingGroups.length > 0) && (
              <span className="ml-2 bg-amber-500 text-white px-1.5 py-0.5 rounded text-[10px]">{pendingGroups.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="pro-card bg-slate-900 text-white border-transparent">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Activity size={20} className="text-emerald-400" />
              Settlement Matrix
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Network Value</span>
                <span className="text-xl font-bold">₹{(stats.totalRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Publisher Yield (70%)</span>
                <span className="text-xl font-bold">₹{(stats.totalPublisherPayouts || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Platform Retention (30%)</span>
                <span className="text-3xl font-black text-emerald-400">₹{(stats.platformProfit || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="pro-card">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Logical Totals</h2>
            <div className="space-y-4">
              {[
                { label: 'Protocols Active', val: stats.totalCampaigns },
                { label: 'Nodes Ingested', val: stats.totalGroups },
                { label: 'Successful Broadcasts', val: stats.totalAdPosts }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
                  <span className="font-bold text-slate-900">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <section className="pro-card p-0 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Campaign Audit Queue</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="px-8 py-4">Profile</th>
                  <th className="px-6 py-4">Advertiser</th>
                  <th className="px-6 py-4">Cap (₹)</th>
                  <th className="px-6 py-4">Niche</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingCampaigns.map(c => (
                  <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 font-bold text-sm">{c.name}</td>
                    <td className="px-6 py-6 text-xs text-slate-500">{c.advertiser?.email}</td>
                    <td className="px-6 py-6 font-bold text-sm">₹{c.budget}</td>
                    <td className="px-6 py-6 text-xs font-black uppercase text-slate-400">{c.niche}</td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex gap-2 justify-end">
                          <button onClick={() => handleCampaignAction(c._id, 'active')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all">
                             <CheckCircle size={16} />
                          </button>
                          <button onClick={() => handleCampaignAction(c._id, 'rejected', 'Failed baseline')} className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 hover:bg-rose-600 hover:text-white transition-all">
                             <XCircle size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pendingCampaigns.length === 0 && <div className="py-20 text-center text-slate-400 italic text-sm">No campaigns awaiting audit.</div>}
          </div>
        </section>
      )}

      {activeTab === 'groups' && (
        <section className="pro-card p-0 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Node Ingestion Queue</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="px-8 py-4">Node Identity</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">Pop.</th>
                  <th className="px-6 py-4">Niche</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingGroups.map(g => (
                  <tr key={g._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 font-bold text-sm">{g.name}</td>
                    <td className="px-6 py-6 text-xs text-slate-500">{g.owner?.email}</td>
                    <td className="px-6 py-6 font-bold text-sm">{g.memberCount?.toLocaleString()}</td>
                    <td className="px-6 py-6 text-xs font-black uppercase text-slate-400">{g.category}</td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex gap-2 justify-end">
                          <button onClick={() => handleGroupAction(g._id, 'approved')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all">
                             <CheckCircle size={16} />
                          </button>
                          <button onClick={() => handleGroupAction(g._id, 'rejected', 'Insufficient quality')} className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 hover:bg-rose-600 hover:text-white transition-all">
                             <XCircle size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pendingGroups.length === 0 && <div className="py-20 text-center text-slate-400 italic text-sm">No group nodes awaiting ingestion.</div>}
          </div>
        </section>
      )}

      {activeTab === 'users' && (
        <section className="pro-card p-0 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Entity Directory</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="px-8 py-4">Identity</th>
                  <th className="px-6 py-4">Clearance</th>
                  <th className="px-6 py-4">Liquidity</th>
                  <th className="px-8 py-4 text-right">Sync Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 font-bold text-sm">{u.email}</td>
                    <td className="px-6 py-6">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                          u.role === 'superadmin' ? 'bg-indigo-600 text-white' :
                          u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-slate-100 text-slate-600'
                       }`}>
                          {u.role}
                       </span>
                    </td>
                    <td className="px-6 py-6 font-bold text-sm">₹{(u.walletBalance || 0).toLocaleString()}</td>
                    <td className="px-8 py-6 text-right text-[10px] font-bold text-slate-400 uppercase">
                       {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
