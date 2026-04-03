import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Megaphone, Users, Wallet, BarChart3,
  LogOut, ShieldCheck, Crown, Bell, Search, ChevronDown,
  Menu, X, Plus, DollarSign, Bot, Inbox, Layers, Settings, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const cn = (...c) => c.filter(Boolean).join(' ');

const NAV = {
  advertiser: [
    { label: 'Dashboard',   path: '/dashboard',      icon: LayoutDashboard },
    { label: 'Campaigns',   path: '/campaigns',      icon: Megaphone },
    { label: 'New Campaign',path: '/campaigns/new',  icon: Plus, sub: true },
    { label: 'Analytics',   path: '/analytics',      icon: BarChart3 },
    { label: 'Wallet',      path: '/wallet',          icon: Wallet },
  ],
  publisher: [
    { label: 'Dashboard',   path: '/dashboard',      icon: LayoutDashboard },
    { label: 'My Channels', path: '/groups',          icon: Layers },
    { label: 'Add Channel', path: '/groups/new',     icon: Plus, sub: true },
    { label: 'Ad Inbox',    path: '/ad-inbox',       icon: Inbox },
    { label: 'Analytics',   path: '/analytics',      icon: BarChart3 },
    { label: 'Earnings',    path: '/wallet',          icon: DollarSign },
  ],
};

export default function Layout() {
  const { user, logout, activeRole, switchRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isAdmin = user?.roles?.isAdmin || user?.roles?.isSuperAdmin;
  const navItems = NAV[activeRole] || NAV.advertiser;

  const switchTo = (role) => { try { switchRole(role); navigate('/dashboard'); } catch {} };
  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (p) => p === '/dashboard' ? location.pathname === p : location.pathname.startsWith(p);

  const NavItem = ({ item }) => {
    const active = isActive(item.path);
    return (
      <Link to={item.path} onClick={() => setMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group/item',
          item.sub && 'ml-4 text-xs opacity-80',
          active
            ? 'bg-indigo-50 text-indigo-700 font-semibold'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
        )}>
        <item.icon size={item.sub ? 13 : 15} className={cn('shrink-0 transition-transform group-hover/item:scale-110', active ? 'text-indigo-600' : 'text-slate-400')} />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {collapsed && (
          <div className="absolute left-14 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  const SidebarInner = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg">
          T
        </div>
        {!collapsed && (
          <div>
            <p className="font-black text-sm text-slate-900 leading-tight">TeleAds Pro</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">CPM Network</p>
          </div>
        )}
      </div>

      {/* Role switcher */}
      {!collapsed && (
        <div className="p-3 border-b border-slate-100">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            <button onClick={() => switchTo('advertiser')}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all',
                activeRole === 'advertiser' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
              <Megaphone size={11} /> Advert
            </button>
            <button onClick={() => switchTo('publisher')}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all',
                activeRole === 'publisher' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
              <Bot size={11} /> Publish
            </button>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="p-2 border-b border-slate-100 flex flex-col gap-2 items-center">
            <button onClick={() => switchTo('advertiser')} 
                className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-all', activeRole === 'advertiser' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100')}>
                <Megaphone size={14} />
            </button>
            <button onClick={() => switchTo('publisher')} 
                className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-all', activeRole === 'publisher' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100')}>
                <Bot size={14} />
            </button>
        </div>
      )}

      {/* User chip */}
      {!collapsed && (
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white flex items-center justify-center text-xs font-black shrink-0">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.email}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">{isAdmin ? 'Admin' : activeRole}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto custom-scrollbar">
        <p className={cn('text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2', collapsed && 'hidden')}>
          {activeRole === 'advertiser' ? 'Advertise' : 'Earn'}
        </p>
        
        {navItems.map(item => <NavItem key={item.path} item={item} />)}

        {isAdmin && (
          <>
            <p className={cn('text-[10px] font-bold text-rose-400 uppercase tracking-widest px-3 py-2 border-t border-slate-100 mt-2 pt-3', collapsed && 'hidden')}>
              Admin
            </p>
            {[
              { label:'Admin Console', path:'/admin', icon:ShieldCheck, visible: user?.roles?.isAdmin || user?.roles?.isSuperAdmin },
              { label:'Super Panel', path:'/superadmin', icon:Crown, visible: user?.roles?.isSuperAdmin },
            ].filter(i => i.visible).map(item => <NavItem key={item.path} item={item} />)}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-slate-100">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-all group/logout">
          <LogOut size={15} className="shrink-0 transition-transform group-hover/logout:-translate-x-1" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar Desktop */}
      <aside className={cn(
        'hidden lg:flex flex-col flex-shrink-0 h-screen bg-white border-r border-slate-200 transition-all duration-300 relative z-30 shadow-sm',
        collapsed ? 'w-16' : 'w-60'
      )}>
        <SidebarInner />
        <button onClick={() => setCollapsed(v => !v)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 z-40 transition-all">
          <ChevronLeft size={12} className={cn('transition-transform duration-300', collapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Sidebar Mobile */}
      <aside className={cn(
        'fixed inset-y-0 left-0 w-60 z-50 bg-white border-r border-slate-200 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="absolute top-4 right-4">
          <button onClick={() => setMobileOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
            <X size={18} />
          </button>
        </div>
        <SidebarInner />
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 shrink-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-all border border-slate-100">
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 flex-1 max-w-sm focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/50 transition-all group">
            <Search size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input placeholder="Search everywhere..." className="text-sm bg-transparent outline-none text-slate-600 placeholder:text-slate-400 w-full font-medium" />
          </div>

          <div className="flex-1" />

          {/* Role pill (desktop) */}
          <div className="hidden md:flex items-center bg-slate-50 border border-slate-100 rounded-full p-1 gap-1">
            <button onClick={() => switchTo('advertiser')}
              className={cn('px-4 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5',
                activeRole === 'advertiser' ? 'bg-white shadow-sm border border-slate-200 text-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100')}>
              <Megaphone size={12} /> Advertiser
            </button>
            <button onClick={() => switchTo('publisher')}
              className={cn('px-4 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5',
                activeRole === 'publisher' ? 'bg-white shadow-sm border border-slate-200 text-emerald-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100')}>
              <Bot size={12} /> Publisher
            </button>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-all">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p className="font-bold text-sm text-slate-800">Notifications</p>
                  <span className="bg-rose-100 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-full">3 New</span>
                </div>
                <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                  {[
                    { icon:'✓', t:'Campaign approved', m:'"Q2 Tech Push" is live', time:'2m ago', bg:'bg-emerald-100 text-emerald-600' },
                    { icon:'📨', t:'New ad request',    m:'Waiting in your inbox',   time:'14m ago', bg:'bg-blue-100 text-blue-600' },
                    { icon:'₹', t:'Payout processed',  m:'₹2,340 transferred',       time:'1h ago',  bg:'bg-violet-100 text-violet-600' },
                  ].map((n, i) => (
                    <div key={i} className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-start gap-3 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${n.bg}`}>{n.icon}</div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{n.t}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{n.m}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                  <button className="text-xs font-semibold text-indigo-500 hover:text-indigo-700">View all notifications</button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-all">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white flex items-center justify-center text-xs font-black">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <ChevronDown size={13} className="text-slate-400 hidden sm:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-11 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.email}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">{isAdmin ? 'Admin' : activeRole + ' mode'}</p>
                </div>
                <div className="p-2">
                  <Link to="/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <Settings size={13} /> Settings
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-500 hover:bg-rose-50 transition-colors">
                    <LogOut size={13} /> Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1320px] mx-auto p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
