import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Menu, Bot, Activity, Bell, Search, HelpCircle, Shield } from 'lucide-react';

export default function Layout() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-20 flex items-center px-6 justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
               <Bot size={24} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">TeleAds</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-slate-500 font-bold text-sm px-4 hover:text-indigo-600 transition-colors">Sign In</a>
            <a href="/register" className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl hover:bg-indigo-600 active:scale-95 transition-all">Get Started</a>
          </div>
        </header>
        <main className="pt-20">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-900">
      <Sidebar />
      
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen transition-all duration-500">
        {/* Production-Grade Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 flex items-center px-10 justify-between">
           <div className="flex items-center gap-8 flex-1">
              <div className="hidden xl:flex items-center gap-3 bg-slate-100 px-4 py-2.5 rounded-2xl border border-slate-200 w-80 group focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:bg-white transition-all">
                 <Search size={18} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                 <input type="text" placeholder="Search protocol..." className="bg-transparent border-none text-sm font-bold text-slate-700 w-full outline-none placeholder:text-slate-400" />
              </div>

              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/10">
                 <Activity size={16} className="text-indigo-400" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Cluster Live</span>
              </div>
           </div>

           <div className="flex items-center gap-6">
              <button className="hidden lg:flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-all">
                 <HelpCircle size={16} />
                 Resources
              </button>

              <div className="h-8 w-px bg-slate-200 hidden lg:block"></div>

              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all cursor-pointer relative group">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
                 </div>
                 
                 <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block">
                       <p className="text-xs font-black uppercase tracking-tight">{user?.email?.split('@')[0]}</p>
                       <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Master Node</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm shadow-sm">
                       {user?.email?.[0].toUpperCase()}
                    </div>
                 </div>
              </div>
           </div>
        </header>

        <main className="p-10 max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </main>
        
        <footer className="px-10 py-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/30">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <Shield size={12} className="text-indigo-500" />
             TeleAds Protocol v2.4.0 • Enterprise License
           </p>
           <div className="flex items-center gap-6">
              <a href="#" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Documentation</a>
              <a href="#" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">API Keys</a>
              <a href="#" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Support Matrix</a>
           </div>
        </footer>
      </div>
    </div>
  );
}
