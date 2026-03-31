import { useState, useEffect } from 'react';
import api from '../api/axios';
import StatsCard from '../components/StatsCard';
import { 
  ShieldCheck, 
  Users, 
  Megaphone, 
  Bot, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  ArrowUpRight, 
  Activity, 
  Settings, 
  History,
  FileText,
  AlertCircle,
  Database,
  BarChart,
  HardDrive
} from 'lucide-react';

export default function SuperadminDashboard() {
  const [stats, setStats] = useState(null);
  const [groups, setGroups] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [bots, setBots] = useState([]);
  const [settings, setSettings] = useState([]);
  const [catRequests, setCatRequests] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');
  const [showBotModal, setShowBotModal] = useState(false);
  const [newBot, setNewBot] = useState({ name: '', token: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, groupsRes, campaignsRes, botsRes, settingsRes, catRes, withdrawalsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/groups'),
        api.get('/admin/campaigns'),
        api.get('/admin/bots'),
        api.get('/admin/settings'),
        api.get('/admin/category-requests'),
        api.get('/admin/withdrawals')
      ]);
      setStats(statsRes.data);
      setGroups(groupsRes.data);
      setCampaigns(campaignsRes.data);
      setBots(botsRes.data);
      setSettings(settingsRes.data);
      setCatRequests(catRes.data);
      setWithdrawals(withdrawalsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const approveGroup = async (id) => {
    try { await api.post(`/admin/groups/${id}/approve`); fetchData(); } catch (err) { alert('Approval failed'); }
  };

  const updateSetting = async (key, value) => {
    try { await api.post('/admin/settings', { key, value }); fetchData(); } catch (err) { alert('Update failed'); }
  };

  const createBot = async (e) => {
    e.preventDefault();
    try { await api.post('/admin/bots', newBot); setShowBotModal(false); setNewBot({ name: '', token: '' }); fetchData(); } catch (err) { alert('Bot creation failed'); }
  };

  const approveWithdrawal = async (id) => {
    try { await api.post(`/admin/withdrawals/${id}/approve`); fetchData(); } catch (err) { alert('Approval failed'); }
  };

  const approveCategory = async (id) => {
    try { await api.post(`/admin/categories/approve/${id}`); fetchData(); } catch (err) { alert('Approval failed'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Dynamic Master Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-indigo-500/20 shadow-xl">
                 <ShieldCheck size={32} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mainframe Controller</h1>
           </div>
           <p className="text-slate-500 text-lg font-medium">Platform wide administrative synchronization protocols</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
           <button onClick={() => setActiveTab('inventory')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>Inventory</button>
           <button onClick={() => setActiveTab('finance')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'finance' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>Finance</button>
           <button onClick={() => setActiveTab('settings')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>Settings</button>
        </div>
      </header>

      {/* Global Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard icon={<Users size={24} />} label="Total Entities" value={stats?.totalUsers || 0} color="indigo" />
        <StatsCard icon={<Megaphone size={24} />} label="Active Matrix" value={stats?.totalCampaigns || 0} color="rose" />
        <StatsCard icon={<Activity size={24} />} label="Net Revenue" value={`₹${stats?.totalRevenue?.toFixed(2) || 0}`} color="emerald" />
        <StatsCard icon={<Bot size={24} />} label="Operational Nodes" value={bots.length} color="amber" />
      </div>

      {activeTab === 'inventory' && (
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm overflow-hidden relative group">
               <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                  <Database size={150} />
               </div>
               <div className="relative z-10">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Node Ingestion Audit</h2>
                  <div className="space-y-4">
                     {groups.filter(g => g.status === 'pending').map(group => (
                        <div key={group._id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group/item hover:bg-white hover:border-indigo-100 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">@</div>
                              <div>
                                 <span className="text-sm font-black text-slate-900 block">{group.username}</span>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.niche}</span>
                              </div>
                           </div>
                           <button onClick={() => approveGroup(group._id)} className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-all shadow-lg active:scale-95">
                              <Check size={18} />
                           </button>
                        </div>
                     ))}
                     {groups.filter(g => g.status === 'pending').length === 0 && (
                        <div className="py-10 text-center text-slate-300 font-bold italic">Identity queue is at nominal capacity</div>
                     )}
                  </div>
               </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                  <HardDrive size={150} />
               </div>
               <div className="relative z-10 flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Matrix Nodes</h2>
                  <button onClick={() => setShowBotModal(true)} className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">
                     <Plus size={20} />
                  </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bots.map(bot => (
                     <div key={bot._id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group/bot hover:bg-white hover:border-indigo-100 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                              <Bot size={16} />
                           </div>
                           <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{bot.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Channel</span>
                           </div>
                           <span className="text-[10px] font-bold text-slate-300">{bot._id.slice(-6)}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
         </div>
      )}

      {activeTab === 'finance' && (
         <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-700">
               <History size={150} />
            </div>
            <div className="relative z-10">
               <div className="flex items-center justify-between mb-10">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Liquidity Dispatch Queue</h2>
                  <div className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest tracking-widest">Pending Payouts</div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                           <th className="px-8 py-5">Dispatcher ID</th>
                           <th className="px-8 py-5">Amount (₹)</th>
                           <th className="px-8 py-5">Destination Path</th>
                           <th className="px-8 py-5">Action</th>
                        </tr>
                     </thead>
                     <tbody>
                        {withdrawals.filter(w => w.status === 'pending').map(w => (
                           <tr key={w._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="px-8 py-6 font-bold text-slate-900 text-sm italic">{w.userId?.email}</td>
                              <td className="px-8 py-6 font-black text-xl text-slate-900">₹{w.amount.toFixed(2)}</td>
                              <td className="px-8 py-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">{w.method}: {w.details}</td>
                              <td className="px-8 py-6">
                                 <button onClick={() => approveWithdrawal(w._id)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95">Release Funds</button>
                              </td>
                           </tr>
                        ))}
                        {withdrawals.filter(w => w.status === 'pending').length === 0 && (
                           <tr><td colSpan="4" className="text-center py-20 text-slate-300 font-bold italic tracking-widest uppercase">Liquidity grid is currently balanced</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </section>
      )}

      {activeTab === 'settings' && (
         <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            <section className="xl:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                  <Settings size={150} />
               </div>
               <div className="relative z-10">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8">System Logic Protocol</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {settings.filter(s => s.key !== 'maintenance_mode').map(s => (
                        <div key={s.key} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 items-start">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{s.key.replace(/_/g, ' ')}</span>
                           <input 
                             type="number" 
                             value={s.value} 
                             onChange={(e) => updateSetting(s.key, e.target.value)}
                             onBlur={(e) => updateSetting(s.key, e.target.value)}
                             className="pro-input py-2 text-lg font-black"
                           />
                        </div>
                     ))}
                  </div>
               </div>
            </section>

            <div className="xl:col-span-4 space-y-10">
               <section className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-10 -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                     <AlertCircle size={100} className="text-white" />
                  </div>
                  <div className="relative z-10 text-white">
                     <h2 className="text-2xl font-black tracking-tight mb-4">Platform Lock</h2>
                     <p className="text-slate-400 text-sm font-medium mb-10 leading-relaxed">Maintenance override. Locks platform for all sub-admin nodes.</p>
                     
                     <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10">
                        <div className="flex flex-col">
                           <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Status</span>
                           <span className={`text-xs font-bold ${settings.find(s => s.key === 'maintenance_mode')?.value ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {settings.find(s => s.key === 'maintenance_mode')?.value ? 'LOCKED' : 'NOMINAL'}
                           </span>
                        </div>
                        <button 
                          onClick={() => updateSetting('maintenance_mode', !settings.find(s => s.key === 'maintenance_mode')?.value)} 
                          className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                            settings.find(s => s.key === 'maintenance_mode')?.value 
                            ? 'bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-500/20' 
                            : 'bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20'
                          }`}
                        >
                          {settings.find(s => s.key === 'maintenance_mode')?.value ? 'Disable' : 'Enable'}
                        </button>
                     </div>
                  </div>
               </section>

               <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                     <BarChart size={100} />
                  </div>
                  <h2 className="relative z-10 text-2xl font-black text-slate-900 tracking-tight mb-8">Niche Requests</h2>
                  <div className="relative z-10 space-y-4">
                     {catRequests.filter(r => r.status === 'pending').map(req => (
                        <div key={req._id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all group/req">
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-lg font-black text-slate-900 uppercase">{req.name}</span>
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded uppercase">New</span>
                           </div>
                           <p className="text-xs font-bold text-slate-500 mb-4">{req.description}</p>
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-300 truncate max-w-[100px]">{req.requestedBy?.email}</span>
                              <button className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-emerald-600 shadow-lg transition-all" onClick={() => approveCategory(req._id)}><Check size={16} /></button>
                           </div>
                        </div>
                     ))}
                     {catRequests.filter(r => r.status === 'pending').length === 0 && (
                        <div className="text-center text-slate-300 font-bold italic uppercase text-xs">No pending niches</div>
                     )}
                  </div>
               </section>
            </div>
         </div>
      )}

      {/* Manual Bot Node Provisioning */}
      {showBotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-md" onClick={() => setShowBotModal(false)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl p-10 max-w-lg w-full border border-slate-200 animate-slide-up">
            <div className="flex justify-between items-center mb-10 text-slate-900">
               <h2 className="text-3xl font-black tracking-tight">Provision Node</h2>
               <button onClick={() => setShowBotModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={createBot} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Internal Name</label>
                <input 
                  type="text" 
                  placeholder="TELEADS_ALPHA_NODE" 
                  value={newBot.name} 
                  onChange={(e) => setNewBot({...newBot, name: e.target.value})} 
                  required 
                  className="pro-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Telegram Protocol Key</label>
                <input 
                  type="password" 
                  placeholder="Bot API Token" 
                  value={newBot.token} 
                  onChange={(e) => setNewBot({...newBot, token: e.target.value})} 
                  required 
                  className="pro-input"
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="pro-btn-primary flex-1">Generate Cluster</button>
                <button type="button" onClick={() => setShowBotModal(false)} className="pro-btn-secondary">Abort</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
