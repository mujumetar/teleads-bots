import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  PlusCircle, 
  Megaphone, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Trash2, 
  BarChart2, 
  ChevronRight, 
  Zap, 
  Activity,
  Search,
  ExternalLink,
  Bot,
  Filter,
  Layers,
  MousePointerClick
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', adText: '', budget: '', niche: 'technology', trackingUrl: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns');
      setCampaigns(res.data);
    } catch (err) {
      console.error('Campaign Retrieval Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/campaigns', newCampaign);
      setShowCreate(false);
      setNewCampaign({ name: '', adText: '', budget: '', niche: 'technology', trackingUrl: '' });
      fetchCampaigns();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating campaign');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in mb-20 max-w-7xl mx-auto px-4 sm:px-6">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-8 border-b border-slate-100">
        <div className="space-y-1">
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Campaign Analytics</h1>
           <p className="text-slate-500 text-sm font-medium">Coordinate your advertising logic across the ad matrix.</p>
        </div>

        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="pro-btn-primary"
        >
          <PlusCircle size={16} />
          {showCreate ? 'Close Protocol' : 'New Campaign'}
        </button>
      </section>

      {/* Campaigns Matrix Table */}
      <section className="pro-card p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Active Matrix</h2>
           </div>
           <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                 <Search size={14} className="text-slate-400" />
                 <input type="text" placeholder="Search..." className="bg-transparent border-none text-xs font-semibold text-slate-500 outline-none w-40 placeholder:text-slate-300" />
              </div>
           </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                    <th className="px-8 py-4">Campaign Profile</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Niche Target</th>
                    <th className="px-6 py-4">Budget Cycle</th>
                    <th className="px-6 py-4 text-right">Yield Metrics</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody>
                 {campaigns.map((camp) => (
                    <tr key={camp._id} className="border-b border-slate-50 group hover:bg-slate-50/20 transition-colors">
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-slate-50 text-indigo-600 flex items-center justify-center border border-slate-100">
                                <Megaphone size={18} />
                             </div>
                             <div>
                                <h4 className="text-sm font-bold text-slate-900 leading-tight mb-0.5">{camp.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{camp.trackingUrl ? 'Trackable Link' : 'Direct Logic'}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-6">
                          <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
                             camp.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                             camp.status === 'completed' ? 'bg-slate-100 text-slate-500' :
                             'bg-amber-50 text-amber-600'
                          }`}>
                             {camp.status}
                          </div>
                       </td>
                       <td className="px-6 py-6 font-semibold text-xs text-slate-600 capitalize">{camp.niche}</td>
                       <td className="px-6 py-6 min-w-[200px]">
                          <div className="space-y-1.5">
                             <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-slate-400">Used: ₹{camp.budgetSpent}</span>
                                <span className="text-slate-900">Total: ₹{camp.budget}</span>
                             </div>
                             <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-slate-900 rounded-full transition-all duration-1000 ease-out"
                                  style={{ width: `${Math.min((camp.budgetSpent / camp.budget) * 100, 100)}%` }}
                                ></div>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-6 text-right">
                          <div className="flex flex-col items-end">
                             <p className="text-sm font-bold text-slate-900">{(camp.totalImpressions || 0).toLocaleString()}</p>
                             <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span className="text-emerald-500">{camp.totalClicks || 0} Clicks</span>
                                <span>• {(camp.totalClicks / (camp.totalImpressions || 1) * 100).toFixed(1)}% CTR</span>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                <Trash2 size={16} />
                             </button>
                             <button className="p-2 text-slate-900 hover:text-indigo-600 transition-colors">
                                <ChevronRight size={16} />
                             </button>
                          </div>
                       </td>
                    </tr>
                 ))}
                 
                 {campaigns.length === 0 && (
                    <tr>
                       <td colSpan="6" className="py-40 text-center space-y-4">
                          <Layers size={32} className="text-slate-200 mx-auto" />
                          <div className="space-y-1">
                             <h4 className="text-lg font-bold text-slate-400">Inventory Empty</h4>
                             <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto">Initialize a new campaign to begin your ad broadcast cycle.</p>
                          </div>
                          <button onClick={() => setShowCreate(true)} className="pro-btn-secondary py-2.5">Provision Campaign</button>
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      </section>

      {/* Creation Modal Overhaul */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in group">
           <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowCreate(false)}></div>
           <form onSubmit={handleCreate} className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-100 shadow-2xl p-10 overflow-hidden animate-slide-up">
              <div className="relative space-y-6">
                 <div className="flex items-center gap-4 mb-2">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Campaign Deployment v1.4</h2>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Protocol Name</label>
                       <input
                         type="text"
                         className="pro-input"
                         placeholder="e.g. Q2 Growth Hub"
                         value={newCampaign.name}
                         onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                         required
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cycle Budget (₹)</label>
                       <input
                         type="number"
                         className="pro-input"
                         placeholder="5,000"
                         value={newCampaign.budget}
                         onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                         required
                       />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Ad Content (Post Copy)</label>
                       <textarea
                         className="pro-input h-32 resize-none pt-4 pr-12"
                         placeholder="Define your ad broadcast logic here..."
                         value={newCampaign.adText}
                         onChange={(e) => setNewCampaign({ ...newCampaign, adText: e.target.value })}
                         required
                       />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                         Tracking Redirect URL
                         <span className="text-emerald-600 opacity-60">(Recommended)</span>
                       </label>
                       <input
                         type="url"
                         className="pro-input border-emerald-100 bg-emerald-50/10 placeholder:text-emerald-200"
                         placeholder="https://t.me/your_path"
                         value={newCampaign.trackingUrl}
                         onChange={(e) => setNewCampaign({ ...newCampaign, trackingUrl: e.target.value })}
                       />
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 leading-relaxed italic">Your links will be automatically wrapped in our TeleAds conversion telemetry.</p>
                    </div>
                 </div>

                 <div className="flex gap-3 pt-6 border-t border-slate-50">
                    <button type="button" onClick={() => setShowCreate(false)} className="pro-btn-secondary flex-1">Abort</button>
                    <button type="submit" className="pro-btn-primary flex-[2]">Initialize Cycle</button>
                 </div>
              </div>
           </form>
        </div>
      )}
    </div>
  );
}
