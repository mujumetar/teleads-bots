import { useState, useEffect } from 'react';
import api from '../api/axios';
import StatsCard from '../components/StatsCard';
import { 
  TrendingUp, 
  Users, 
  Megaphone, 
  Clock, 
  ChevronRight, 
  Bot, 
  Activity, 
  ArrowRight,
  PlusCircle,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, activeRole } = useAuth();
  const [stats, setStats] = useState({
    walletBalance: 0,
    totalCampaigns: 0,
    totalGroups: 0,
    activeAds: 0,
    totalImpressions: 0,
    totalClicks: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [meRes, statsRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/admin/stats')
        ]);
        setStats({
          ...statsRes.data,
          walletBalance: meRes.data.walletBalance
        });
        
        setRecentActivities([
          { id: 1, type: 'node', label: 'Group Node Indexed', date: '5m', value: 'Technology', status: 'pending' },
          { id: 2, type: 'ad', label: 'Campaign Broadcast', date: '12m', value: 'SaaS Launch', status: 'active' },
          { id: 3, type: 'wallet', label: 'Funds Deposited', date: '1h', value: '₹5,000.00', status: 'done' },
        ]);
      } catch (err) {
        console.error('Data Sync Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [activeRole]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in mb-20 max-w-7xl mx-auto px-4 sm:px-6">
      {/* SaaS Hero Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-8 border-b border-slate-100">
        <div className="space-y-1">
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
           <p className="text-slate-500 text-sm font-medium">
             Welcome, {user?.email?.split('@')[0]}. Managing your {activeRole} ecosystem.
           </p>
        </div>

        <div className="flex items-center gap-3">
           {activeRole === 'advertiser' ? (
              <Link to="/campaigns" className="pro-btn-primary">
                <PlusCircle size={16} />
                New Campaign
              </Link>
           ) : (
              <Link to="/groups" className="pro-btn-accent">
                <Bot size={16} />
                Add Group
              </Link>
           )}
           <Link to="/wallet" className="pro-btn-secondary">
             <Wallet size={16} />
             Deposit
           </Link>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard icon={<TrendingUp size={20} />} label="Total Reach" value={(stats?.totalImpressions || 0).toLocaleString()} />
        <StatsCard icon={<Activity size={20} />} label="Engagement" value={(stats?.totalClicks || 0).toLocaleString()} />
        <StatsCard icon={<Users size={20} />} label="Managed Assets" value={activeRole === 'publisher' ? (stats?.totalGroups || 0) : (stats?.totalCampaigns || 0)} />
        <div className="pro-card p-6 flex flex-col justify-between bg-slate-50 border-transparent">
           <div>
              <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Wallet Balance</p>
              <p className="text-2xl font-bold text-slate-900">₹{(stats?.walletBalance || 0).toLocaleString()}</p>
           </div>
           <Link to="/wallet" className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">Manage Funds <ArrowRight size={12} /></Link>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <section className="pro-card">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
                 <button className="text-xs font-semibold text-slate-400 hover:text-slate-600">View All</button>
              </div>

              <div className="divide-y divide-slate-50">
                 {recentActivities.map(act => (
                    <div key={act.id} className="py-4 flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                             act.type === 'node' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                             act.type === 'ad' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                             'bg-slate-50 text-slate-500 border-slate-100'
                          }`}>
                            {act.type === 'node' ? <Bot size={18} /> : act.type === 'ad' ? <Megaphone size={18} /> : <Wallet size={18} />}
                          </div>
                          <div>
                             <p className="text-sm font-semibold text-slate-900">{act.label}</p>
                             <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                <span>{act.value}</span>
                                <span>•</span>
                                <span>{act.date}</span>
                             </div>
                          </div>
                       </div>
                       <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </div>
                 ))}
              </div>
           </section>
        </div>

        <div className="space-y-8">
           <div className="pro-card bg-indigo-600 text-white border-transparent">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                 <ShieldCheck size={20} />
                 Pro Support
              </h3>
              <p className="text-indigo-100/80 text-sm font-medium mb-6 leading-relaxed">
                 Need help with campaign targeting or node verification? Our experts are here to optimize your yield.
              </p>
              <button className="w-full py-2.5 bg-white text-indigo-600 rounded-lg font-bold text-xs hover:bg-slate-50 transition-all">
                Contact Protocol Support
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
