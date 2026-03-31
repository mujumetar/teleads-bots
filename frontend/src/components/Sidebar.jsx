import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  Wallet, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Bot,
  Menu,
  X,
  ChevronRight,
  ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Sidebar() {
  const { user, logout, activeRole, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['advertiser', 'publisher', 'superadmin'] },
    { name: 'My Groups', path: '/groups', icon: <Users size={20} />, roles: ['publisher'] },
    { name: 'My Campaigns', path: '/campaigns', icon: <Megaphone size={20} />, roles: ['advertiser'] },
    { name: 'Wallet', path: '/wallet', icon: <Wallet size={20} />, roles: ['advertiser', 'publisher'] },
    { name: 'Admin Hub', path: '/superadmin', icon: <ShieldCheck size={20} />, roles: ['superadmin'] },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} />, roles: ['advertiser', 'publisher', 'superadmin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(activeRole));

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-[45] lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-slate-200
        transition-transform duration-500 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-8">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Bot size={24} className="text-white" />
              </div>
              <div>
                <span className="text-xl font-black text-slate-900 tracking-tight block">TeleAds</span>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Network Protocol</span>
              </div>
            </div>
          </div>

          <div className="px-6 mb-8">
             <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 flex gap-1">
                <button 
                  onClick={() => switchRole('advertiser')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeRole === 'advertiser' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Megaphone size={14} />
                  Ads
                </button>
                <button 
                  onClick={() => switchRole('publisher')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeRole === 'publisher' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Users size={14} />
                  Pub
                </button>
             </div>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
            {filteredItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <div className="flex items-center gap-3.5">
                  <span className={`transition-transform duration-300 group-hover:scale-110`}>
                    {item.icon}
                  </span>
                  <span className="font-bold text-sm tracking-tight">{item.name}</span>
                </div>
                <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1`} />
              </NavLink>
            ))}
          </nav>

          <div className="p-6">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center border border-white shadow-sm">
                  <span className="text-indigo-600 font-bold text-xs uppercase">{user?.email?.[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{user?.email?.split('@')[0]}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{activeRole}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm"
              >
                <LogOut size={14} />
                <span>Terminate Session</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
