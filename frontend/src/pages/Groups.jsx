import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  PlusCircle, 
  Users, 
  ExternalLink, 
  Trash2, 
  Clock, 
  Bot, 
  Search,
  Globe,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', telegramGroupId: '', telegramGroupUsername: '', memberCount: '', category: 'technology' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch (err) {
      console.error('Inventory Retrieval Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/groups', newGroup);
      setShowAdd(false);
      setNewGroup({ name: '', telegramGroupId: '', telegramGroupUsername: '', memberCount: '', category: 'technology' });
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding group');
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
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Publisher Inventory</h1>
           <p className="text-slate-500 text-sm font-medium">Manage and index your Telegram monetization nodes.</p>
        </div>

        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="pro-btn-accent"
        >
          <PlusCircle size={16} />
          {showAdd ? 'Cancel' : 'Add Group'}
        </button>
      </section>

      {showAdd && (
        <section className="pro-card border-emerald-100 bg-emerald-50/10">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Globe size={20} className="text-emerald-600" />
            Provision New Node
          </h2>
          <form onSubmit={handleAddGroup} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Node Name</label>
              <input
                type="text"
                placeholder="Technology News"
                className="pro-input"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Telegram Group ID</label>
              <input
                type="text"
                placeholder="-100xxxxxxxx"
                className="pro-input"
                value={newGroup.telegramGroupId}
                onChange={(e) => setNewGroup({ ...newGroup, telegramGroupId: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Username Handle</label>
               <input
                 type="text"
                 placeholder="@group_username"
                 className="pro-input"
                 value={newGroup.telegramGroupUsername}
                 onChange={(e) => setNewGroup({ ...newGroup, telegramGroupUsername: e.target.value })}
               />
            </div>
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Population (Members)</label>
               <input
                 type="number"
                 placeholder="5000"
                 className="pro-input"
                 value={newGroup.memberCount}
                 onChange={(e) => setNewGroup({ ...newGroup, memberCount: e.target.value })}
                 required
               />
            </div>
            <div className="md:col-span-2 pt-4">
               <button type="submit" className="pro-btn-accent w-full py-4 uppercase font-bold text-xs tracking-widest">Authorize Ingestion</button>
            </div>
          </form>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groups.map((group) => (
          <div key={group._id} className="pro-card hover:bg-slate-50/50 relative group">
            <div className="flex flex-col h-full justify-between">
               <div className="space-y-6">
                  <div className="flex items-start justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100">
                           <Users size={22} />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{group.name}</h3>
                           <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-400">
                                {group.telegramGroupUsername || 'Private Node'}
                              </span>
                              {group.telegramGroupUsername && (
                                <a href={`https://t.me/${group.telegramGroupUsername.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-indigo-600 transition-colors">
                                   <ExternalLink size={12} />
                                </a>
                              )}
                           </div>
                        </div>
                     </div>
                     <div className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                       group.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                     }`}>
                       {group.status}
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 py-6 border-y border-slate-50">
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Members</p>
                        <p className="text-lg font-bold text-slate-900">{group.memberCount?.toLocaleString()}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Niche</p>
                        <p className="text-lg font-bold text-slate-900 capitalize">{group.category || 'Tech'}</p>
                     </div>
                     <div className="space-y-1 text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Reach</p>
                        <p className="text-lg font-bold text-emerald-600">{Math.floor(group.memberCount * 0.12).toLocaleString()}</p>
                     </div>
                  </div>
               </div>

               <div className="pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash2 size={16} />
                     </button>
                  </div>
                  <button className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                    Node Stats <ChevronRight size={14} />
                  </button>
               </div>
            </div>
          </div>
        ))}
        
        {groups.length === 0 && (
          <div className="lg:col-span-2 py-40 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
             <Bot size={40} className="text-slate-200" />
             <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-400">Inventory Empty</h3>
                <p className="text-sm font-medium text-slate-400 max-w-sm">Synchronize your first Telegram group node to begin yield operations.</p>
             </div>
             <button onClick={() => setShowAdd(true)} className="pro-btn-secondary py-2.5">Provision Node</button>
          </div>
        )}
      </div>
    </div>
  );
}
