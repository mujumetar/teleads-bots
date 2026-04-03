import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import {
  Users,
  Megaphone,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Filter,
  TrendingUp,
  Pause,
  Play,
  Search,
  IndianRupee,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  LayoutDashboard,
  Send,
  Activity,
  AlertTriangle,
  BarChart3,
  Settings,
  Zap,
  RotateCcw,
  Target,
  Wallet,
  Globe,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  LogOut,
  Menu,
  Download,
  Grid3X3,
  List,
  Calendar,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Copy,
  CheckSquare,
  Square,
  ChevronLeft,
  ArrowUpDown,
  FileSpreadsheet,
  FileJson,
  Printer,
  Clock,
  RefreshCw,
  Ban,
  Unlock,
  Mail,
  Phone,
  Bot,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import ManualAdSender from '../components/ManualAdSender';

function cn(...args) { return clsx(args); }

// Superadmin Sidebar Component
const SuperadminSidebar = ({ activeTab, setActiveTab, stats, isCollapsed, setIsCollapsed, onLogout, users, groups, bots, campaigns }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'tracking', label: 'Master Ledger', icon: List },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users, badge: users?.length },
    { id: 'groups', label: 'Groups', icon: Layers, badge: groups?.length },
    { id: 'bots', label: 'Bots', icon: Bot, badge: bots?.length },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone, badge: campaigns?.length },
    { id: 'filler-ads', label: 'Filler Ads', icon: Zap },
    { id: 'finance', label: 'Finance', icon: IndianRupee },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={cn(
      "h-screen bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shrink-0">
            S
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-white text-sm">Superadmin</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Control Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {!isCollapsed && (
        <div className="p-3 grid grid-cols-2 gap-2 border-b border-slate-800">
          <div className="bg-slate-900 rounded-lg p-2">
            <p className="text-[10px] text-slate-400 uppercase">Revenue</p>
            <p className="text-sm font-bold text-emerald-400">₹{(stats?.totalRevenue || 0).toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-2">
            <p className="text-[10px] text-slate-400 uppercase">Active</p>
            <p className="text-sm font-bold text-violet-400">{stats?.activeCampaigns || 0}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === item.id
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200",
              isCollapsed && "justify-center px-2"
            )}
          >
            <item.icon size={isCollapsed ? 20 : 18} />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-slate-800 space-y-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-all"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <><ChevronRight size={18} className="rotate-180" /> <span className="text-xs">Collapse</span></>}
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
        >
          <LogOut size={18} />
          {!isCollapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );
};

// Quick Actions Panel
const QuickActions = ({ onAction }) => {
  const actions = [
    { id: 'trigger-ads', label: 'Run Ad Queue', icon: Play, color: 'emerald' },
    { id: 'pause-all', label: 'Pause All', icon: Pause, color: 'amber' },
    { id: 'broadcast', label: 'Broadcast', icon: Zap, color: 'violet' },
    { id: 'refresh', label: 'Refresh Data', icon: RotateCcw, color: 'blue' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.02]",
            action.color === 'emerald' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20",
            action.color === 'amber' && "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20",
            action.color === 'violet' && "bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20",
            action.color === 'blue' && "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
          )}
        >
          <action.icon size={18} />
          <span className="font-medium text-sm">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, subtext, trend, icon: Icon, color = 'violet' }) => {
  const colors = {
    violet: 'from-violet-500 to-fuchsia-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-pink-500',
    blue: 'from-blue-500 to-cyan-500',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", colors[color])}>
          <Icon size={20} />
        </div>
      </div>
      {trend && (
        <div className={cn("mt-3 flex items-center gap-1 text-xs", trend.up ? 'text-emerald-400' : 'text-rose-400')}>
          {trend.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{trend.value} from last period</span>
        </div>
      )}
    </div>
  );
};

// Advanced Controls Toolbar Component
const ControlsToolbar = ({
  itemCount,
  selectedCount,
  onSelectAll,
  viewMode,
  setViewMode,
  statusFilter,
  setStatusFilter,
  dateRange,
  setDateRange,
  sortConfig,
  onSort,
  showFilters,
  setShowFilters,
  autoRefresh,
  setAutoRefresh,
  exportMenuOpen,
  setExportMenuOpen,
  onExport,
  data,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  totalItems
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="space-y-3">
      {/* Main Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-3">
          {/* Select All */}
          <button
            onClick={onSelectAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            {selectedCount > 0 ? <CheckSquare size={18} className="text-violet-400" /> : <Square size={18} />}
            <span>{selectedCount > 0 ? `${selectedCount} selected` : 'Select All'}</span>
          </button>

          {/* Bulk Actions - Show when items selected */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-1 border-l border-slate-700 pl-3">
              <button className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg" title="Approve">
                <CheckCircle2 size={16} />
              </button>
              <button className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg" title="Reject">
                <XCircle size={16} />
              </button>
              <button className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg" title="Delete">
                <Trash2 size={16} />
              </button>
              <button className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg" title="Edit">
                <Edit3 size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all",
              showFilters ? "bg-violet-500/20 text-violet-400" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Filter size={16} />
            <span>Filters</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded transition-all",
                viewMode === 'list' ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              )}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded transition-all",
                viewMode === 'grid' ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              )}
            >
              <Grid3X3 size={16} />
            </button>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all",
              autoRefresh ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
            title="Auto refresh every 30s"
          >
            <RefreshCw size={16} className={autoRefresh && "animate-spin"} />
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <Download size={16} />
              <span>Export</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50">
                <button
                  onClick={() => onExport('csv', data, 'export')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 first:rounded-t-xl"
                >
                  <FileSpreadsheet size={16} className="text-emerald-400" />
                  Export as CSV
                </button>
                <button
                  onClick={() => onExport('json', data, 'export')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 last:rounded-b-xl"
                >
                  <FileJson size={16} className="text-blue-400" />
                  Export as JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4"
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 uppercase">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="paused">Paused</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 uppercase">Date:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            {/* Items Per Page */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 uppercase">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 uppercase">Sort:</span>
              <button
                onClick={() => onSort('createdAt')}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 hover:border-violet-500 transition-all"
              >
                Date
                <ArrowUpDown size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
          <span className="text-sm text-slate-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-8 h-8 text-sm rounded-lg transition-all",
                    currentPage === page
                      ? "bg-violet-500 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
const UserRow = ({ user, onRoleChange, onWalletAdjust }) => (
  <tr className="group hover:bg-slate-900/40 transition-all border-b border-slate-800">
    <td className="py-4 px-4 font-bold text-slate-200">{user.email}</td>
    <td className="py-4 px-4">
      <span className={`badge ${user.role === 'superadmin' ? 'badge-rose' : user.role === 'admin' ? 'badge-amber' : 'badge-indigo'}`}>
        {user.role}
      </span>
    </td>
    <td className="py-4 px-4 font-bold text-emerald-400">₹{(user.advertiserWallet || 0).toLocaleString()}</td>
    <td className="py-4 px-4 font-bold text-violet-400">₹{(user.publisherWallet || 0).toLocaleString()}</td>
    <td className="py-4 px-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={() => onWalletAdjust(user._id)} className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20"><IndianRupee size={16} /></button>
      <select
        className="bg-slate-800 border border-slate-700 rounded-lg py-1 px-2 text-xs text-slate-200 focus:outline-none"
        value={user.role}
        onChange={(e) => onRoleChange(user._id, e.target.value)}
      >
        <option value="user">User</option>
        <option value="admin">Admin</option>
        <option value="superadmin">Superadmin</option>
      </select>
    </td>
  </tr>
);

const GroupRow = ({ group, onStatusChange }) => (
  <tr className="hover:bg-slate-900/40 transition-all border-b border-slate-800">
    <td className="py-4 px-4">
      <div className="font-bold text-slate-200">{group.name}</div>
      <div className="text-[10px] text-slate-500 font-bold tracking-tight">{group.telegramGroupId}</div>
    </td>
    <td className="py-4 px-4 font-bold text-slate-400">{group.telegramGroupUsername || '-'}</td>
    <td className="py-4 px-4">
      <span className={`badge ${group.status === 'approved' ? 'badge-emerald' : group.status === 'rejected' ? 'badge-rose' : 'badge-amber'}`}>
        {group.status}
      </span>
    </td>
    <td className="py-4 px-4 text-right flex justify-end gap-2">
      <Link to={`/groups/edit/${group._id}`} className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center hover:bg-indigo-500/20"><Edit3 size={16} /></Link>
      {group.status === 'pending' && (
        <>
          <button onClick={() => onStatusChange(group._id, 'approved')} className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20"><CheckCircle2 size={16} /></button>
          <button onClick={() => onStatusChange(group._id, 'rejected')} className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500/20"><XCircle size={16} /></button>
        </>
      )}
    </td>
  </tr>
);

const CampaignRow = ({ campaign, onStatusChange }) => (
  <tr className="hover:bg-slate-900/40 transition-all border-b border-slate-800">
    <td className="py-4 px-4 font-bold text-slate-200">{campaign.name}</td>
    <td className="py-4 px-4 font-bold text-slate-500">{campaign.advertiser?.email || 'N/A'}</td>
    <td className="py-4 px-4 font-bold text-violet-400">₹{campaign.budget.toLocaleString()}</td>
    <td className="py-4 px-4">
      <span className={`badge ${campaign.status === 'active' ? 'badge-emerald' : campaign.status === 'pending' ? 'badge-amber' : 'badge-rose'}`}>
        {campaign.status}
      </span>
    </td>
    <td className="py-4 px-4 text-right flex justify-end gap-2">
      <Link to={`/campaigns/edit/${campaign._id}`} className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center hover:bg-indigo-500/20"><Edit3 size={16} /></Link>
      {campaign.status === 'pending' && (
        <>
          <button onClick={() => onStatusChange(campaign._id, 'active')} className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20"><CheckCircle2 size={16} /></button>
          <button onClick={() => onStatusChange(campaign._id, 'rejected')} className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500/20"><XCircle size={16} /></button>
        </>
      )}
    </td>
  </tr>
);

const TransactionRow = ({ tx, onUpdateStatus }) => (
  <tr className="hover:bg-slate-900/40 transition-all border-b border-slate-800">
    <td className="py-4 px-4">
      <div className="font-bold text-slate-200 underline truncate w-40">{tx.user?.email}</div>
      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(tx.createdAt).toLocaleString()}</div>
    </td>
    <td className="py-4 px-4 font-heavy">
      <span className={tx.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'}>
        {tx.type === 'deposit' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
      </span>
    </td>
    <td className="py-4 px-4 uppercase text-[10px] font-black tracking-widest text-slate-500">{tx.type}</td>
    <td className="py-4 px-4">
      <span className={`badge ${tx.status === 'completed' ? 'badge-emerald' : tx.status === 'rejected' ? 'badge-rose' : 'badge-amber'}`}>
        {tx.status}
      </span>
    </td>
    <td className="py-4 px-4 text-right">
      {tx.status === 'pending' && (
        <div className="flex justify-end gap-2">
          <button onClick={() => onUpdateStatus(tx._id, 'completed')} className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20"><CheckCircle2 size={16} /></button>
          <button onClick={() => onUpdateStatus(tx._id, 'rejected')} className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500/20"><XCircle size={16} /></button>
        </div>
      )}
    </td>
  </tr>
);

const AuditRow = ({ log }) => (
  <tr className="hover:bg-slate-900/40 transition-all border-b border-slate-800 text-xs">
    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
    <td className="py-3 px-4 font-bold text-slate-200">{log.campaign?.name || 'System'}</td>
    <td className="py-3 px-4 font-bold text-slate-400">{log.group?.name || '—'}</td>
    <td className="py-3 px-4">
      <span className={cn(
        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
        log.status === 'success' ? "bg-emerald-500/20 text-emerald-400" :
          log.status === 'failed' ? "bg-rose-500/20 text-rose-400" : "bg-slate-500/20 text-slate-400"
      )}>
        {log.status}
      </span>
    </td>
    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{log.reason || 'Ad posted successfully'}</td>
  </tr>
);

const PerformanceRow = ({ data, type }) => (
  <tr className="hover:bg-slate-900/40 transition-all border-b border-slate-800">
    <td className="py-4 px-4 font-bold text-slate-200">{data.name}</td>
    <td className="py-4 px-4 text-slate-400">{data.totalAds}</td>
    <td className="py-4 px-4 font-bold text-violet-400">{(data.totalImpressions || 0).toLocaleString()}</td>
    <td className="py-4 px-4 text-emerald-400 font-bold">₹{(type === 'campaign' ? data.totalCost : data.totalEarnings).toLocaleString()}</td>
    <td className="py-4 px-4 text-slate-400">
      {data.totalImpressions > 0 ? ((data.totalClicks || 0) / data.totalImpressions * 100).toFixed(2) : 0}%
    </td>
  </tr>
);

const GroupEditModal = ({ group, onClose, onSave }) => {
  const [formData, setFormData] = useState({ ...group });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`/groups/${group._id}`, formData);
      onSave();
      onClose();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-emerald-500/10 to-transparent">
            <div>
              <h2 className="text-xl font-black text-white">Edit Channel</h2>
              <p className="text-xs text-slate-500 mt-1">Update metrics and visibility for {group.name}</p>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400"><XCircle size={20} /></button>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Channel Name</label>
                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Username</label>
                <input value={formData.telegramGroupUsername} onChange={e => setFormData({ ...formData, telegramGroupUsername: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white" />
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase text-slate-400">Audience Metrics (Admin Only)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Member Count</label>
                  <input type="number" value={formData.memberCount} onChange={e => setFormData({ ...formData, memberCount: parseInt(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dynamic CPM (₹)</label>
                  <input type="number" value={formData.dynamicCpm} onChange={e => setFormData({ ...formData, dynamicCpm: parseFloat(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-emerald-400 font-bold" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Performance Score ({formData.performanceScore}%)</label>
                <input type="range" min="0" max="100" value={formData.performanceScore} onChange={e => setFormData({ ...formData, performanceScore: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Category</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white">
                {['Technology', 'Crypto', 'Finance', 'Education', 'Entertainment', 'Health', 'Sports', 'News', 'Gaming', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="p-6 bg-slate-950 border-t border-slate-800 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-900 text-slate-400 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50">
              {saving ? 'Saving...' : 'Update Metrics'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const UserEditModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({ ...user });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`/admin/users/${user._id}`, formData);
      onSave();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Edit User</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><XCircle size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email</label>
            <input value={formData.email} disabled className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 text-slate-400 cursor-not-allowed" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Role</label>
              <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-violet-500">
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Status</label>
              <select value={formData.isActive ? 'true' : 'false'} onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-violet-500">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Adv. Wallet (₹)</label>
              <input type="number" value={formData.advertiserWallet} onChange={e => setFormData({ ...formData, advertiserWallet: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Pub. Wallet (₹)</label>
              <input type="number" value={formData.publisherWallet} onChange={e => setFormData({ ...formData, publisherWallet: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-violet-500" />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const DataTable = ({ columns, data, onRowClick, actions }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-950 border-b border-slate-800">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className="hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                {columns.map((col, j) => (
                  <td key={j} className="px-4 py-3">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {actions.map((action, k) => (
                        <button
                          key={k}
                          onClick={(e) => { e.stopPropagation(); action.onClick(row); }}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            action.color === 'emerald' && "text-emerald-400 hover:bg-emerald-500/10",
                            action.color === 'rose' && "text-rose-400 hover:bg-rose-500/10",
                            action.color === 'amber' && "text-amber-400 hover:bg-amber-500/10"
                          )}
                        >
                          <action.icon size={16} />
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Skeleton = ({ className }) => (
  <div className={cn("bg-slate-800 animate-pulse rounded-xl", className)} />
);

const SuperadminDashboard = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'overview';

  const setActiveTab = (newTab) => navigate(`/superadmin/${newTab}`);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState({});
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [bots, setBots] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [performanceStats, setPerformanceStats] = useState({ campaignStats: [], groupStats: [] });
  const [globalSettings, setGlobalSettings] = useState({});
  const [systemConfig, setSystemConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Advanced Controls State
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [subTab, setSubTab] = useState('advertisers');
  const [editingUser, setEditingUser] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);

  useEffect(() => {
    fetchAllData();
    // Auto refresh interval
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchAllData, 30000); // 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchAllData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data } = await axios.get('/admin/all-data');
      setStats(data.stats);
      setCampaigns(data.campaigns);
      setGroups(data.groups);
      setUsers(data.users);
      setBots(data.bots);
      setTransactions(data.transactions);
      setPerformanceStats(data.performanceStats);
      setSystemConfig(data.config || {});

      const settingsMap = {};
      data.settings.forEach(s => {
        settingsMap[s.key] = s.value;
      });
      setGlobalSettings(settingsMap);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleQuickAction = async (actionId) => {
    switch (actionId) {
      case 'trigger-ads':
        try {
          await axios.get('/admin/trigger-ads?force=true');
          alert('Ad queue triggered successfully (Force Mode)');
          fetchAllData();
        } catch (err) {
          alert('Failed to trigger ads: ' + err.message);
        }
        break;
      case 'refresh':
        fetchAllData();
        break;
      case 'broadcast':
        setActiveTab('manual-ads');
        break;
      default:
        console.log('Action:', actionId);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change user role to ${newRole}?`)) return;
    try {
      await axios.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchAllData();
    } catch (err) { alert(err.message); }
  };

  const handleGroupStatus = async (groupId, status) => {
    try {
      await axios.put(`/admin/groups/${groupId}/status`, { status });
      fetchAllData();
    } catch (err) { alert(err.message); }
  };

  const handleCampaignStatus = async (campaignId, status) => {
    try {
      await axios.put(`/admin/campaigns/${campaignId}/status`, { status });
      fetchAllData();
    } catch (err) { alert(err.message); }
  };

  const handleTxStatus = async (txId, status) => {
    try {
      await axios.put(`/admin/transactions/${txId}/status`, { status });
      fetchAllData();
    } catch (err) { alert(err.message); }
  };
  const handleBotStatus = async (botId, updates) => {
    try {
      await axios.put(`/admin/bots/${botId}`, updates);
      fetchAllData();
    } catch (err) { alert(err.message); }
  };
  const handleWalletAdjustment = async (userId) => {
    const type = window.confirm('Press OK for Advertiser Wallet, Cancel for Publisher Wallet') ? 'advertiser' : 'publisher';
    const amountStr = window.prompt(`Adjust ${type} wallet. Use positive value to ADD, negative to DECREASE (e.g. 500 or -200):`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) return alert('Invalid amount');

    const note = window.prompt('Add a note for this adjustment (optional):');

    try {
      await axios.post(`/admin/wallet/${userId}`, { amount, walletType: type, note });
      alert(`Successfully adjusted ${type} wallet by ₹${amount}`);
      fetchAllData();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteBot = async (botId) => {
    if (!window.confirm('Are you sure you want to delete this bot?')) return;
    try {
      await axios.delete(`/admin/bots/${botId}`);
      fetchAllData();
    } catch (err) { alert(err.message); }
  };

  const handleAddBot = async () => {
    const name = window.prompt('Bot Name (e.g. TeleAds Main):');
    if (!name) return;
    const token = window.prompt('Bot Token from @BotFather:');
    if (!token) return;
    try {
      await axios.post('/admin/bots', { name, token });
      fetchAllData();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('PERMANENTLY DELETE THIS USER? This cannot be undone.')) return;
    try {
      await axios.delete(`/admin/users/${id}`);
      fetchAllData();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Delete this group?')) return;
    try {
      await axios.delete(`/admin/groups/${id}`);
      fetchAllData();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await axios.delete(`/admin/campaigns/${id}`);
      fetchAllData();
    } catch (err) { alert(err.message); }
  };

  // Filter and sort helpers
  const filterByDate = (items, dateField = 'createdAt') => {
    if (dateRange === 'all') return items;
    const now = new Date();
    const ranges = {
      today: new Date(now.setHours(0, 0, 0, 0)),
      week: new Date(now.setDate(now.getDate() - 7)),
      month: new Date(now.setDate(now.getDate() - 30)),
    };
    return items.filter(item => new Date(item[dateField]) >= ranges[dateRange]);
  };

  const sortItems = (items, key, direction) => {
    if (!key) return items;
    return [...items].sort((a, b) => {
      let aVal = key.includes('.') ? key.split('.').reduce((o, k) => o?.[k], a) : a[key];
      let bVal = key.includes('.') ? key.split('.').reduce((o, k) => o?.[k], b) : b[key];
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = (items) => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(i => i._id)));
    }
  };

  const handleUpdateSetting = async (key, value) => {
    try {
      await axios.put('/admin/settings', { key, value });
      alert(`Setting "${key}" updated to ${value}`);
      fetchAllData();
    } catch (err) { alert(err.message); }
  };

  const exportData = (format, data, filename) => {
    if (format === 'csv') {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(row => Object.values(row).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
    } else if (format === 'json') {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.click();
    }
    setExportMenuOpen(false);
  };

  const paginate = (items) => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  };

  // Apply filters and sorting
  const getFilteredAndSorted = (items, searchFields) => {
    let result = items;

    // Search filter
    if (searchQuery) {
      result = result.filter(item =>
        searchFields.some(field => {
          const value = field.includes('.')
            ? field.split('.').reduce((o, k) => o?.[k], item)
            : item[field];
          return value?.toString().toLowerCase().includes(searchQuery.toLowerCase());
        })
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }

    // Date filter
    result = filterByDate(result);

    // Sorting
    result = sortItems(result, sortConfig.key, sortConfig.direction);

    return result;
  };

  const filteredUsers = getFilteredAndSorted(users, ['email', 'firstName', 'lastName']);
  const filteredGroups = getFilteredAndSorted(groups, ['name', 'telegramGroupUsername', 'niche']);
  const filteredCampaigns = getFilteredAndSorted(campaigns, ['name', 'advertiser.email']);
  const filteredTransactions = getFilteredAndSorted(transactions, ['user.email', 'type', 'status']);



  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <SuperadminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        onLogout={() => { localStorage.clear(); window.location.href = '/login'; }}
      />

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        sidebarCollapsed ? "ml-16" : ""
      )}>
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white capitalize">{activeTab.replace('-', ' ')}</h2>
            {['users', 'groups', 'campaigns', 'transactions', 'bots'].includes(activeTab) && (
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-violet-500 text-slate-200"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'bots' && (
              <button
                onClick={handleAddBot}
                className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-all"
              >
                <Plus size={16} /> Add Bot
              </button>
            )}
            <button
              onClick={fetchAllData}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-all"
            >
              <RotateCcw size={18} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-400">System Online</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && !stats ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
              </div>
              <Skeleton className="h-[400px] w-full" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Quick Actions */}
                  <QuickActions onAction={handleQuickAction} />

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                      title="Total Revenue"
                      value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
                      subtext={`Profit: ₹${(stats?.platformProfit || 0).toLocaleString()}`}
                      trend={{ up: true, value: '+12.5%' }}
                      icon={IndianRupee}
                      color="emerald"
                    />
                    <MetricCard
                      title="Active Campaigns"
                      value={stats?.activeCampaigns || 0}
                      subtext={`${stats?.pendingCampaigns || 0} pending approval`}
                      icon={Megaphone}
                      color="violet"
                    />
                    <MetricCard
                      title="Total Users"
                      value={stats?.totalUsers || 0}
                      subtext={`${users.filter(u => u.roles?.isAdmin).length} admins`}
                      trend={{ up: true, value: '+8.2%' }}
                      icon={Users}
                      color="blue"
                    />
                    <MetricCard
                      title="Approved Groups"
                      value={stats?.approvedGroups || 0}
                      subtext={`${stats?.pendingGroups || 0} pending`}
                      icon={Layers}
                      color="amber"
                    />
                  </div>

                  {/* Recent Activity */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                      <h3 className="font-semibold text-white mb-4">Recent Transactions</h3>
                      <div className="space-y-3">
                        {transactions.slice(0, 5).map((tx, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                tx.type === 'deposit' ? "bg-emerald-500/10 text-emerald-400" :
                                  tx.type === 'withdrawal' ? "bg-rose-500/10 text-rose-400" :
                                    "bg-blue-500/10 text-blue-400"
                              )}>
                                <Wallet size={14} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-200">{tx.type}</p>
                                <p className="text-xs text-slate-500">{tx.user?.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={cn(
                                "text-sm font-bold",
                                tx.type === 'deposit' || tx.type === 'earning' ? "text-emerald-400" : "text-rose-400"
                              )}>
                                {tx.type === 'deposit' || tx.type === 'earning' ? '+' : '-'}₹{tx.amount}
                              </p>
                              <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full",
                                tx.status === 'completed' ? "bg-emerald-500/20 text-emerald-400" :
                                  tx.status === 'pending' ? "bg-amber-500/20 text-amber-400" :
                                    "bg-rose-500/20 text-rose-400"
                              )}>
                                {tx.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                      <h3 className="font-semibold text-white mb-4">System Health</h3>
                      <div className="space-y-4">
                        {[
                          { label: 'Database', status: 'Healthy', value: 95, color: 'bg-emerald-500' },
                          { label: 'Bot Status', status: 'Online', value: 92, color: 'bg-emerald-500' },
                          { label: 'Ad Queue', status: `${stats?.activeCampaigns || 0} pending`, value: 60, color: 'bg-amber-500' },
                          { label: 'API Performance', status: '98ms avg', value: 98, color: 'bg-emerald-500' },
                        ].map((item, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-400">{item.label}</span>
                              <span className={item.color === 'bg-emerald-500' ? 'text-emerald-400' : 'text-amber-400'}>{item.status}</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.value}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <ControlsToolbar
                    itemCount={filteredUsers.length}
                    selectedCount={selectedItems.size}
                    onSelectAll={() => selectAll(filteredUsers)}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    autoRefresh={autoRefresh}
                    setAutoRefresh={setAutoRefresh}
                    exportMenuOpen={exportMenuOpen}
                    setExportMenuOpen={setExportMenuOpen}
                    onExport={exportData}
                    data={filteredUsers}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                    totalItems={filteredUsers.length}
                  />
                  <DataTable
                    columns={[
                      {
                        header: 'Email', render: (u) => (
                          <div>
                            <p className="font-medium text-slate-200">{u.email}</p>
                            <p className="text-xs text-slate-500">{u.firstName} {u.lastName}</p>
                          </div>
                        )
                      },
                      {
                        header: 'Roles', render: (u) => (
                          <div className="flex flex-wrap gap-1">
                            {u.roles?.advertiser && <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded text-[10px]">Advertiser</span>}
                            {u.roles?.publisher && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px]">Publisher</span>}
                            {u.roles?.isAdmin && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px]">Admin</span>}
                            {u.roles?.isSuperAdmin && <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded text-[10px]">Super</span>}
                          </div>
                        )
                      },
                      {
                        header: 'Wallets', render: (u) => (
                          <div className="text-xs">
                            <p className="text-slate-400">Adv: ₹{u.advertiserWallet || 0}</p>
                            <p className="text-slate-400">Pub: ₹{u.publisherWallet || 0}</p>
                          </div>
                        )
                      },
                      {
                        header: 'Status', render: (u) => (
                          <span className={cn(
                            "px-2 py-1 rounded text-xs",
                            u.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                          )}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        )
                      },
                    ]}
                    data={paginate(filteredUsers)}
                    actions={[
                      { icon: ShieldCheck, color: 'emerald', onClick: (u) => handleRoleChange(u._id, u.role === 'user' ? 'admin' : 'user') },
                      { icon: Wallet, color: 'amber', onClick: (u) => handleWalletAdjustment(u._id) },
                      { icon: Edit3, color: 'blue', onClick: (u) => setEditingUser(u) },
                      { icon: Trash2, color: 'rose', onClick: (u) => handleDeleteUser(u._id) },
                    ]}
                  />
                </motion.div>
              )}

              {/* Groups Tab */}
              {activeTab === 'groups' && (
                <motion.div
                  key="groups"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <DataTable
                    columns={[
                      {
                        header: 'Group', render: (g) => (
                          <div>
                            <p className="font-medium text-slate-200">{g.name}</p>
                            <p className="text-xs text-slate-500">@{g.telegramGroupUsername || 'no-username'}</p>
                          </div>
                        )
                      },
                      {
                        header: 'Members', render: (g) => (
                          <span className="text-slate-300">{g.memberCount?.toLocaleString()}</span>
                        )
                      },
                      {
                        header: 'Niche', render: (g) => (
                          <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs">{g.niche || 'General'}</span>
                        )
                      },
                      {
                        header: 'CPM', render: (g) => (
                          <span className="text-violet-400 font-medium">₹{g.dynamicCpm}</span>
                        )
                      },
                      {
                        header: 'Status', render: (g) => (
                          <span className={cn(
                            "px-2 py-1 rounded text-xs",
                            g.status === 'approved' ? "bg-emerald-500/20 text-emerald-400" :
                              g.status === 'pending' ? "bg-amber-500/20 text-amber-400" :
                                "bg-rose-500/20 text-rose-400"
                          )}>
                            {g.status}
                          </span>
                        )
                      },
                    ]}
                    data={filteredGroups}
                    actions={[
                      { icon: CheckCircle2, color: 'emerald', onClick: (g) => handleGroupStatus(g._id, 'approved') },
                      { icon: Edit3, color: 'blue', onClick: (g) => setEditingGroup(g) },
                      { icon: XCircle, color: 'rose', onClick: (g) => handleGroupStatus(g._id, 'rejected') },
                      { icon: Trash2, color: 'rose', onClick: (g) => handleDeleteGroup(g._id) },
                    ]}
                  />
                </motion.div>
              )}

              {/* Campaigns Tab */}
              {activeTab === 'campaigns' && (
                <motion.div
                  key="campaigns"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <DataTable
                    columns={[
                      {
                        header: 'Campaign', render: (c) => (
                          <div>
                            <p className="font-medium text-slate-200">{c.name}</p>
                            <p className="text-xs text-slate-500">{c.adText?.slice(0, 50)}...</p>
                          </div>
                        )
                      },
                      {
                        header: 'Advertiser', render: (c) => (
                          <span className="text-slate-300">{c.advertiser?.email || 'Unknown'}</span>
                        )
                      },
                      {
                        header: 'Budget', render: (c) => (
                          <div className="text-xs">
                            <p className="text-slate-300">₹{c.budgetSpent?.toLocaleString()} / ₹{c.budget?.toLocaleString()}</p>
                            <div className="w-20 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(c.budgetSpent / c.budget) * 100}%` }} />
                            </div>
                          </div>
                        )
                      },
                      {
                        header: 'Status', render: (c) => (
                          <span className={cn(
                            "px-2 py-1 rounded text-xs",
                            c.status === 'active' ? "bg-emerald-500/20 text-emerald-400" :
                              c.status === 'pending' ? "bg-amber-500/20 text-amber-400" :
                                c.status === 'paused' ? "bg-blue-500/20 text-blue-400" :
                                  "bg-rose-500/20 text-rose-400"
                          )}>
                            {c.status}
                          </span>
                        )
                      },
                    ]}
                    data={filteredCampaigns}
                    actions={[
                      { icon: Play, color: 'emerald', onClick: (c) => handleCampaignStatus(c._id, 'active') },
                      { icon: Pause, color: 'amber', onClick: (c) => handleCampaignStatus(c._id, 'paused') },
                      { icon: Edit3, color: 'blue', onClick: (c) => window.location.href = `/campaigns/edit/${c._id}` },
                      { icon: Trash2, color: 'rose', onClick: (c) => handleDeleteCampaign(c._id) },
                    ]}
                  />
                </motion.div>
              )}

              {/* Master Ledger Tab */}
              {activeTab === 'tracking' && (
                <motion.div key="tracking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="flex bg-slate-900 p-1 rounded-xl w-fit border border-slate-800">
                    {['advertisers', 'publishers', 'campaigns'].map(sub => (
                      <button key={sub} onClick={() => setSubTab(sub)}
                        className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize", subTab === sub ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white")}>
                        {sub}
                      </button>
                    ))}
                  </div>

                  {subTab === 'advertisers' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-950 border-b border-slate-800">
                          <tr className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                            <th className="py-3 px-4 text-left">Advertiser</th>
                            <th className="py-3 px-4 text-right">Wallet Balance</th>
                            <th className="py-3 px-4 text-right">Lifetime Spend</th>
                            <th className="py-3 px-4 text-center">Active / Total</th>
                            <th className="py-3 px-4 text-right">Avg. CPM</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {users.filter(u => u.advertiserWallet > 0 || campaigns.some(c => c.advertiser?._id === u._id)).map(u => {
                            const uCamps = campaigns.filter(c => c.advertiser?._id === u._id);
                            const totalSpend = uCamps.reduce((s, c) => s + (c.budgetSpent || 0), 0);
                            const avgCpm = uCamps.reduce((s, c) => s + (c.cpm || 100), 0) / (uCamps.length || 1);
                            return (
                              <tr key={u._id} className="hover:bg-slate-800/50">
                                <td className="py-4 px-4">
                                  <p className="font-bold text-slate-200">{u.email}</p>
                                  <p className="text-[10px] text-slate-500">UID: {u._id.slice(-6).toUpperCase()}</p>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <span className={cn("px-3 py-1 rounded-lg font-black", u.advertiserWallet < 100 ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400")}>
                                    ₹{(u.advertiserWallet || 0).toLocaleString()}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-right text-slate-400 font-bold">₹{totalSpend.toLocaleString()}</td>
                                <td className="py-4 px-4 text-center">
                                  <span className="text-white font-bold">{uCamps.filter(c => c.status === 'active').length}</span>
                                  <span className="text-slate-600 mx-1">/</span>
                                  <span className="text-slate-500">{uCamps.length}</span>
                                </td>
                                <td className="py-4 px-4 text-right text-indigo-400 font-bold">₹{avgCpm.toFixed(0)}</td>
                                <td className="py-4 px-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingUser(u)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all"><Edit3 size={14} /></button>
                                    <button onClick={() => handleDeleteUser(u._id)} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all"><Trash2 size={14} /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {subTab === 'publishers' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-950 border-b border-slate-800">
                          <tr className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                            <th className="py-3 px-4 text-left">Publisher</th>
                            <th className="py-3 px-4 text-right">Earnings Balance</th>
                            <th className="py-3 px-4 text-right">Lifetime Earned</th>
                            <th className="py-3 px-4 text-center">Approved Channels</th>
                            <th className="py-3 px-4 text-right">Avg. Performance</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {users.filter(u => u.publisherWallet > 0 || groups.some(g => g.owner?._id === u._id)).map(u => {
                            const uGroups = groups.filter(g => g.owner?._id === u._id);
                            const totalEarned = uGroups.reduce((s, g) => s + (g.revenueEarned || 0), 0);
                            const avgScore = uGroups.reduce((s, g) => s + (g.performanceScore || 0), 0) / (uGroups.length || 1);
                            return (
                              <tr key={u._id} className="hover:bg-slate-800/50">
                                <td className="py-4 px-4">
                                  <p className="font-bold text-slate-200">{u.email}</p>
                                  <p className="text-[10px] text-slate-500">Joined: {new Date(u.createdAt).toLocaleDateString()}</p>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <span className="px-3 py-1 rounded-lg bg-violet-500/20 text-violet-400 font-black">
                                    ₹{(u.publisherWallet || 0).toLocaleString()}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-right text-slate-400 font-bold">₹{totalEarned.toLocaleString()}</td>
                                <td className="py-4 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Layers size={12} className="text-emerald-500" />
                                    <span className="text-white font-bold">{uGroups.filter(g => g.status === 'approved').length}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500" style={{ width: `${avgScore}%` }} />
                                    </div>
                                    <span className="text-[10px] text-emerald-400 font-bold">{avgScore.toFixed(0)}%</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingUser(u)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all"><Edit3 size={14} /></button>
                                    <button onClick={() => handleDeleteUser(u._id)} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all"><Trash2 size={14} /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {subTab === 'campaigns' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-950 border-b border-slate-800">
                          <tr className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                            <th className="py-3 px-4 text-left">Campaign Detail</th>
                            <th className="py-3 px-4 text-center">Delivery Status</th>
                            <th className="py-3 px-4 text-right">Financial Progress</th>
                            <th className="py-3 px-4 text-right">Impressions</th>
                            <th className="py-3 px-4 text-right">CTR / ROI</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {campaigns.map(c => {
                            const progress = (c.budgetSpent / c.budget) * 100;
                            return (
                              <tr key={c._id} className="hover:bg-slate-800/50">
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className={cn("w-2 h-10 rounded-full", c.status === 'active' ? 'bg-emerald-500' : 'bg-slate-700')} />
                                    <div>
                                      <p className="font-bold text-slate-200">{c.name}</p>
                                      <p className="text-[10px] text-slate-500 truncate w-32">{c.advertiser?.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800">
                                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", c.status === 'active' ? 'bg-emerald-500' : 'bg-slate-600')} />
                                    <span className="text-[10px] font-black uppercase text-slate-300">{c.status}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <p className="text-xs font-black text-white">₹{c.budgetSpent.toFixed(0)}</p>
                                  <p className="text-[10px] text-slate-500">of ₹{c.budget.toLocaleString()}</p>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <span className="text-violet-400 font-black">{(c.totalImpressions || 0).toLocaleString()}</span>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <p className="text-xs font-bold text-white">{((c.totalClicks / (c.totalImpressions || 1)) * 100).toFixed(2)}%</p>
                                  <p className="text-[10px] text-slate-500">{(c.totalClicks || 0)} clicks</p>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Link to={`/campaigns/edit/${c._id}`} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all"><Edit3 size={14} /></Link>
                                    <button onClick={() => handleDeleteCampaign(c._id)} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all"><Trash2 size={14} /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <motion.div key="performance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  {/* Advanced Analysis Header */}
                  <div className="bg-gradient-to-r from-slate-900 to-indigo-900/20 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><BarChart3 size={120} /></div>
                    <h2 className="text-3xl font-black text-white mb-2">Network Performance Analysis</h2>
                    <p className="text-slate-400 max-w-xl">Deep dive into ad delivery efficiency, financial margins, and group-wide engagement metrics.</p>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Delivery Funnel */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Network Reach Summary</h3>
                      <div className="space-y-6">
                        {[
                          { l: 'Campaign Groups', v: campaigns.length, c: 'bg-indigo-500', p: 100 },
                          { l: 'Active Channels', v: stats?.approvedGroups || 0, c: 'bg-emerald-500', p: (stats?.approvedGroups / stats?.totalGroups * 100) || 0 },
                          { l: 'Total Ad Placements', v: performanceStats.campaignStats.reduce((s, c) => s + c.totalAds, 0), c: 'bg-violet-500', p: 100 },
                          { l: 'Global Impressions', v: performanceStats.campaignStats.reduce((s, c) => s + c.totalImpressions, 0), c: 'bg-fuchsia-500', p: 100 },
                        ].map(f => (
                          <div key={f.l}>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-slate-300 font-bold">{f.l}</span>
                              <span className="text-white font-black">{f.v.toLocaleString()}</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${f.p}%` }} className={cn("h-full rounded-full", f.c)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Overview */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Financial Matrix</h3>
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                          <p className="text-[10px] text-violet-400 font-black uppercase tracking-widest">Total Gross Revenue</p>
                          <p className="text-2xl font-black text-white mt-1">₹{(stats?.totalRevenue || 0).toLocaleString()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Publisher Payouts</p>
                            <p className="text-lg font-black text-white">₹{(stats?.totalPublisherPayouts || 0).toLocaleString()}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Platform Profit</p>
                            <p className="text-lg font-black text-white">₹{(stats?.platformProfit || 0).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-800">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Profit Margin</span>
                            <span className="text-emerald-400 font-black">
                              {stats?.totalRevenue > 0 ? ((stats.platformProfit / stats.totalRevenue) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Group Distribution */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Group Suitability</h3>
                      <div className="flex flex-col gap-4">
                        {[
                          { l: 'Approved & Active', v: groups.filter(g => g.status === 'approved').length, i: CheckCircle2, c: 'text-emerald-400' },
                          { l: 'Pending Review', v: groups.filter(g => g.status === 'pending').length, i: Activity, c: 'text-amber-400' },
                          { l: 'Rejected / Flagged', v: groups.filter(g => g.status === 'rejected' || g.isFlagged).length, i: XCircle, c: 'text-rose-400' },
                        ].map(s => (
                          <div key={s.l} className="flex items-center gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <div className={cn("p-2 rounded-lg bg-slate-900", s.c)}><s.i size={18} /></div>
                            <div className="flex-1">
                              <p className="text-xs text-white font-bold">{s.l}</p>
                              <p className="text-slate-500 text-[10px]">{s.v} channels in this category</p>
                            </div>
                            <p className="text-xl font-black text-white">{s.v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Campaign Performance Table */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Megaphone size={18} className="text-violet-400" /> Campaign Breakdown
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="text-slate-500 border-b border-slate-800">
                            <tr className="text-[10px] uppercase font-black">
                              <th className="text-left py-3">Campaign</th>
                              <th className="text-right py-3">Ads</th>
                              <th className="text-right py-3">Impr.</th>
                              <th className="text-right py-3">Spent</th>
                              <th className="text-right py-3">CTR</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {performanceStats.campaignStats.length === 0 ? (
                              <tr><td colSpan={5} className="py-10 text-center text-slate-500 italic">No campaign data recorded yet.</td></tr>
                            ) : performanceStats.campaignStats.map(c => (
                              <PerformanceRow key={c._id} data={c} type="campaign" />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Group Performance Table */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Layers size={18} className="text-emerald-400" /> Group Performance
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="text-slate-500 border-b border-slate-800">
                            <tr className="text-[10px] uppercase font-black">
                              <th className="text-left py-3">Group</th>
                              <th className="text-right py-3">Ads</th>
                              <th className="text-right py-3">Impr.</th>
                              <th className="text-right py-3">Earned</th>
                              <th className="text-right py-3">CTR</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {performanceStats.groupStats.length === 0 ? (
                              <tr><td colSpan={5} className="py-10 text-center text-slate-500 italic">No group performance data available.</td></tr>
                            ) : performanceStats.groupStats.map(g => (
                              <PerformanceRow key={g._id} data={g} type="group" />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Finance Tab (Transactions) */}
              {activeTab === 'finance' && (
                <motion.div
                  key="finance"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    <table className="w-full">
                      <thead className="bg-slate-950 border-b border-slate-800">
                        <tr className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          <th className="text-left py-3 px-4">User</th>
                          <th className="text-left py-3 px-4">Amount</th>
                          <th className="text-left py-3 px-4">Type</th>
                          <th className="text-left py-3 px-4">Status</th>
                          <th className="text-right py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {transactions.map(tx => <TransactionRow key={tx._id} tx={tx} onUpdateStatus={handleTxStatus} />)}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Manual Ads Tab */}
              {activeTab === 'manual-ads' && (
                <motion.div
                  key="manual-ads"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ManualAdSender />
                </motion.div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  {/* KPI Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard title="Total Impressions" value={((stats?.totalImpressions || 0) / 1000).toFixed(1) + 'K'} subtext="Across all campaigns" icon={Eye} color="violet" />
                    <MetricCard title="Total Clicks" value={(stats?.totalClicks || 0).toLocaleString()} subtext={`${stats?.totalImpressions > 0 ? ((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2) : 0}% avg CTR`} icon={Target} color="blue" />
                    <MetricCard title="Ads Posted" value={(stats?.totalAdPosts || 0).toLocaleString()} subtext="All time" icon={Send} color="emerald" />
                    <MetricCard title="Platform Profit" value={`₹${(stats?.platformProfit || 0).toLocaleString()}`} subtext="35% margin" icon={TrendingUp} color="amber" />
                  </div>

                  {/* Revenue Breakdown */}
                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
                      <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-violet-400" /> Revenue Flow</h3>
                      <div className="space-y-3">
                        {[{ label: 'Advertiser Payments', value: stats?.totalRevenue || 0, color: 'bg-violet-500', pct: 100 },
                        { label: 'Publisher Payouts (65%)', value: ((stats?.totalRevenue || 0) * 0.65), color: 'bg-emerald-500', pct: 65 },
                        { label: 'Platform Profit (35%)', value: stats?.platformProfit || 0, color: 'bg-amber-500', pct: 35 }]
                          .map((item, i) => (
                            <div key={i}>
                              <div className="flex justify-between text-sm mb-1.5">
                                <span className="text-slate-400">{item.label}</span>
                                <span className="text-white font-medium">₹{parseFloat(item.value).toLocaleString()}</span>
                              </div>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${item.color} transition-all duration-1000`} style={{ width: `${item.pct}%` }} />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                      <h3 className="font-semibold text-white mb-4">Top Performing Groups</h3>
                      <div className="space-y-3">
                        {[...groups].sort((a, b) => (b.revenueEarned || 0) - (a.revenueEarned || 0)).slice(0, 5).map((g, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-200 truncate max-w-[140px]">{g.name}</p>
                              <p className="text-xs text-slate-500">{(g.memberCount || 0).toLocaleString()} members</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-emerald-400">₹{(g.revenueEarned || 0).toFixed(0)}</p>
                              <p className="text-[10px] text-slate-500">₹{g.dynamicCpm} CPM</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Campaign Performance Table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h3 className="font-semibold text-white mb-4">Campaign Performance Matrix</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                          <th className="pb-3 text-left">Campaign</th>
                          <th className="pb-3 text-right">Budget</th>
                          <th className="pb-3 text-right">Spent</th>
                          <th className="pb-3 text-right">Impressions</th>
                          <th className="pb-3 text-right">Effective CPM</th>
                          <th className="pb-3 text-right">Status</th>
                        </tr></thead>
                        <tbody className="divide-y divide-slate-800">
                          {campaigns.slice(0, 10).map((c, i) => (
                            <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                              <td className="py-3"><p className="font-medium text-slate-200">{c.name}</p><p className="text-xs text-slate-500">{c.advertiser?.email}</p></td>
                              <td className="py-3 text-right text-slate-300">₹{(c.budget || 0).toLocaleString()}</td>
                              <td className="py-3 text-right">
                                <span className="text-rose-400">₹{(c.budgetSpent || 0).toLocaleString()}</span>
                                <div className="w-16 h-1 bg-slate-800 rounded-full mt-1 ml-auto overflow-hidden"><div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min((c.budgetSpent / c.budget) * 100, 100)}%` }} /></div>
                              </td>
                              <td className="py-3 text-right text-slate-300">{(c.totalImpressions || 0).toLocaleString()}</td>
                              <td className="py-3 text-right text-violet-400">₹{c.totalImpressions > 0 ? ((c.budgetSpent / c.totalImpressions) * 1000).toFixed(2) : c.cpm || 100}</td>
                              <td className="py-3 text-right"><span className={`px-2 py-0.5 rounded text-xs ${c.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : c.status === 'paused' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>{c.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Anti-Fraud Tab */}
              {activeTab === 'fraud' && (
                <motion.div key="fraud" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard title="Flagged Groups" value={groups.filter(g => g.isFlagged).length} subtext="Pending review" icon={AlertTriangle} color="rose" />
                    <MetricCard title="Avg Score" value={groups.length > 0 ? (groups.reduce((s, g) => s + (g.performanceScore || 0), 0) / groups.length).toFixed(1) + '%' : '0%'} subtext="Network health" icon={Activity} color="emerald" />
                    <MetricCard title="Low-Score Groups" value={groups.filter(g => (g.performanceScore || 0) < 5).length} subtext="Score < 5%" icon={TrendingUp} color="amber" />
                    <MetricCard title="Rejected Groups" value={groups.filter(g => g.status === 'rejected').length} subtext="All time" icon={XCircle} color="violet" />
                  </div>

                  {/* Flagged Groups Table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                      <h3 className="font-semibold text-white flex items-center gap-2"><AlertTriangle size={18} className="text-rose-400" /> Flagged / At-Risk Groups</h3>
                      <span className="text-xs text-slate-400">{groups.filter(g => g.isFlagged || (g.performanceScore || 0) < 5).length} groups</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                          <th className="px-5 py-3 text-left">Group</th>
                          <th className="px-5 py-3 text-left">Members</th>
                          <th className="px-5 py-3 text-left">Score</th>
                          <th className="px-5 py-3 text-left">Avg Views</th>
                          <th className="px-5 py-3 text-left">Ratio</th>
                          <th className="px-5 py-3 text-left">Flag</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-slate-800">
                          {groups.filter(g => g.isFlagged || (g.performanceScore || 0) < 5).map((g, i) => {
                            const ratio = g.memberCount > 0 ? ((g.avgViews || 0) / g.memberCount * 100).toFixed(1) : 0;
                            const riskLevel = g.isFlagged ? 'HIGH' : ratio > 80 ? 'SUSPICIOUS' : 'LOW';
                            return (
                              <tr key={i} className="hover:bg-slate-800/50">
                                <td className="px-5 py-3"><p className="font-medium text-slate-200">{g.name}</p><p className="text-xs text-slate-500">{g.telegramGroupId}</p></td>
                                <td className="px-5 py-3 text-slate-300">{(g.memberCount || 0).toLocaleString()}</td>
                                <td className="px-5 py-3"><span className={`font-bold ${(g.performanceScore || 0) >= 10 ? 'text-emerald-400' : (g.performanceScore || 0) >= 5 ? 'text-amber-400' : 'text-rose-400'}`}>{g.performanceScore || 0}%</span></td>
                                <td className="px-5 py-3 text-slate-300">{(g.avgViews || 0).toLocaleString()}</td>
                                <td className="px-5 py-3"><span className={`${ratio > 80 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>{ratio}%</span></td>
                                <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${riskLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : riskLevel === 'SUSPICIOUS' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>{riskLevel}</span></td>
                                <td className="px-5 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => handleGroupStatus(g._id, 'approved')} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded" title="Clear flag & Approve"><CheckCircle2 size={15} /></button>
                                    <button onClick={() => handleGroupStatus(g._id, 'rejected')} className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded" title="Reject"><Ban size={15} /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {groups.filter(g => g.isFlagged || (g.performanceScore || 0) < 5).length === 0 && (
                            <tr><td colSpan={7} className="py-12 text-center text-slate-500">✅ No flagged or at-risk groups</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Network Score Distribution */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h3 className="font-semibold text-white mb-4">Network Score Distribution</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      {[{ label: 'High (>10%)', filter: g => (g.performanceScore || 0) >= 10, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                      { label: 'Mid (5–10%)', filter: g => (g.performanceScore || 0) >= 5 && (g.performanceScore || 0) < 10, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                      { label: 'Low (<5%)', filter: g => (g.performanceScore || 0) < 5, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                      ].map((tier, i) => (
                        <div key={i} className={`${tier.bg} border border-slate-800 rounded-xl p-4`}>
                          <p className={`text-2xl font-bold ${tier.color}`}>{groups.filter(tier.filter).length}</p>
                          <p className="text-xs text-slate-400 mt-1">{tier.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              {/* Filler Ads Tab */}
            {activeTab === 'filler-ads' && (
              <motion.div key="filler-ads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Zap className="text-amber-400" /> Superadmin Filler Ads</h2>
                    <p className="text-sm text-slate-400">Low-cost fallback ads that run when no paid campaigns are active.</p>
                  </div>
                  <button 
                    onClick={() => {
                      const name = window.prompt('Filler Ad Name:');
                      if (name) {
                        axios.post('/campaigns', {
                          name: `[FILLER] ${name}`,
                          adText: 'Enter your filler ad text here...',
                          budget: 1000000,
                          isFiller: true,
                          fillerCpm: 24,
                          status: 'active'
                        }).then(() => fetchAllData());
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                  >
                    <Plus size={18} /> New Filler Campaign
                  </button>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-black uppercase text-slate-500">
                        <tr>
                          <th className="py-4 px-6 text-left">Campaign Details</th>
                          <th className="py-4 px-6 text-right">Pub. CPM (₹)</th>
                          <th className="py-4 px-6 text-right">Analytics</th>
                          <th className="py-4 px-6 text-right">Budget</th>
                          <th className="py-4 px-6 text-center">Status</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {campaigns.filter(c => c.isFiller).map(c => {
                          const perf = performanceStats.campaignStats.find(s => s._id === c._id) || {};
                          return (
                            <tr key={c._id} className="hover:bg-slate-800/40 group transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold">
                                    {c.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-200">{c.name.replace('[FILLER] ', '')}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">{c.niche} • {new Date(c.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-2 py-1">
                                  <span className="text-[10px] font-black text-slate-500">₹</span>
                                  <input 
                                    type="number" 
                                    value={c.fillerCpm || 24} 
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      axios.put(`/campaigns/${c._id}`, { fillerCpm: val }).then(() => fetchAllData(false));
                                    }}
                                    className="w-12 bg-transparent text-right text-emerald-400 font-bold focus:outline-none"
                                  />
                                </div>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="space-y-1">
                                  <div className="flex justify-end gap-2 items-center">
                                    <span className="text-xs text-slate-400">Views:</span>
                                    <span className="text-xs font-bold text-white">{(perf.totalImpressions || 0).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-end gap-2 items-center">
                                    <span className="text-[10px] text-slate-500 uppercase">CTR:</span>
                                    <span className="text-[10px] font-bold text-blue-400">
                                      {perf.totalImpressions > 0 ? ((perf.totalClicks || 0) / perf.totalImpressions * 100).toFixed(2) : 0}%
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <p className="text-xs font-bold text-slate-300">₹{(c.budget || 0).toLocaleString()}</p>
                                <p className="text-[10px] text-slate-500">Remaining</p>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <button 
                                  onClick={() => handleCampaignStatus(c._id, c.status === 'active' ? 'paused' : 'active')}
                                  className={cn(
                                    "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                                    c.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                                    "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  )}
                                >
                                  {c.status}
                                </button>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <Link to={`/campaigns/edit/${c._id}`} className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20"><Edit3 size={16} /></Link>
                                   <button onClick={() => handleDeleteCampaign(c._id)} className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500/20"><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Bots Tab */}
              {activeTab === 'bots' && (
                <motion.div
                  key="bots"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <DataTable
                    columns={[
                      {
                        header: 'Bot Name', render: (b) => (
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 text-slate-400 group-hover:bg-violet-500/20 group-hover:text-violet-400 transition-colors")}>
                              <Bot size={16} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-200">{b.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{b.token.slice(0, 10)}...{b.token.slice(-5)}</p>
                            </div>
                          </div>
                        )
                      },
                      {
                        header: 'Groups', render: (b) => (
                          <span className="text-slate-300">{b.groupsManaged || 0} nodes</span>
                        )
                      },
                      {
                        header: 'Ads Sent', render: (b) => (
                          <span className="text-slate-300">{b.totalAdsSent || 0} posts</span>
                        )
                      },
                      {
                        header: 'Primary', render: (b) => (
                          <button
                            onClick={() => handleBotStatus(b._id, { isPrimary: !b.isPrimary })}
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all",
                              b.isPrimary ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-slate-800 text-slate-500 border border-slate-700"
                            )}
                          >
                            {b.isPrimary ? 'Primary' : 'Secondary'}
                          </button>
                        )
                      },
                      {
                        header: 'Status', render: (b) => (
                          <span className={cn(
                            "px-2 py-1 rounded text-xs",
                            b.status === 'active' ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                          )}>
                            {b.status}
                          </span>
                        )
                      },
                    ]}
                    data={bots}
                    actions={[
                      { icon: RefreshCw, color: 'emerald', onClick: (b) => handleBotStatus(b._id, { status: 'active' }) },
                      { icon: Trash2, color: 'rose', onClick: (b) => handleDeleteBot(b._id) },
                    ]}
                  />
                </motion.div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2"><Zap size={18} className="text-amber-400" /> CPM Tier Configuration</h3>
                    <p className="text-xs text-slate-500 mb-5">These rates are shown on the platform. Bot calculates dynamically per group score.</p>
                    <div className="grid grid-cols-3 gap-4">
                      {[{ tier: 'Gold (Score > 20%)', cpm: 150, color: 'amber' }, { tier: 'Silver (Score > 10%)', cpm: 120, color: 'blue' }, { tier: 'Bronze (Score ≤ 10%)', cpm: 80, color: 'slate' }].map((t, i) => (
                        <div key={i} className="bg-slate-800 rounded-xl p-4">
                          <p className="text-xs text-slate-400 mb-2">{t.tier}</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-slate-400 text-sm">₹</span>
                            <span className="text-2xl font-bold text-white">{t.cpm}</span>
                            <span className="text-slate-500 text-xs">/1K views</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="font-semibold text-white mb-5 flex items-center gap-2"><IndianRupee size={18} className="text-emerald-400" /> Payout & Referral Settings</h3>
                  <div className="space-y-4">
                    {[
                      { 
                        label: 'Publisher Revenue Share', 
                        value: (systemConfig.publisherShare * 100) || 60, 
                        key: 'publisherShare', 
                        unit: '%', 
                        note: 'Percentage of gross revenue paid to channel owners',
                        isPct: true 
                      },
                      { 
                        label: 'Min. Withdrawal Amount', 
                        value: systemConfig.minWithdrawalAmount || 1000, 
                        key: 'minWithdrawalAmount', 
                        unit: '₹', 
                        note: 'Minimum balance required to request a payout' 
                      },
                      { 
                        label: 'Referral Bonus (Advertiser)', 
                        value: (systemConfig.referralRewardAdvertiserPct * 100) || 10, 
                        key: 'referralRewardAdvertiserPct', 
                        unit: '%', 
                        note: 'Bonus paid to referrer from advertiser deposits',
                        isPct: true
                      },
                      { 
                        label: 'Referral Bonus (Publisher)', 
                        value: (systemConfig.referralRewardPublisherPct * 100) || 5, 
                        key: 'referralRewardPublisherPct', 
                        unit: '%', 
                        note: 'Bonus paid to referrer from publisher earnings',
                        isPct: true
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-4 border-b border-slate-800 last:border-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-200">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.note}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <input
                              type="number"
                              value={item.value}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                const finalVal = item.isPct ? val / 100 : val;
                                setSystemConfig({ ...systemConfig, [item.key]: finalVal });
                                axios.put('/admin/config', { [item.key]: finalVal });
                              }}
                              className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-right pr-8 text-white focus:outline-none focus:border-violet-500"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">{item.unit}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="font-semibold text-white mb-5 flex items-center gap-2"><Globe size={18} className="text-blue-400" /> Global Controls</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Global Ad Delivery', desc: 'Enable or disable all ad dispatching', key: 'ads_enabled', safe: false },
                        { label: 'Auto-Placement Engine', desc: 'AI-powered group matching for campaigns', key: 'auto_placement', safe: true },
                        { label: 'Fraud Detection', desc: 'Flag groups with suspicious engagement patterns', key: 'fraud_detection', safe: true },
                        { label: 'Daily Reports', desc: 'Send daily Telegram reports to publishers', key: 'daily_reports', safe: true },
                      ].map((setting, i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-slate-200">{setting.label}</p>
                            <p className="text-xs text-slate-500">{setting.desc}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!setting.safe && <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Critical</span>}
                            <button
                              onClick={() => handleQuickAction(setting.key === 'ads_enabled' ? 'trigger-ads' : setting.key)}
                              className="w-11 h-6 bg-emerald-500/30 border border-emerald-500/40 rounded-full relative cursor-pointer transition-all hover:bg-emerald-500/50"
                            >
                              <div className="w-4 h-4 bg-emerald-400 rounded-full absolute top-1 right-1 shadow"></div>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* New Dynamic Interval Setting */}
                      <div className="flex items-center justify-between py-4 border-b border-rose-500/10">
                        <div>
                          <p className="text-sm font-medium text-slate-200">Ad Posting Interval (Local Dev)</p>
                          <p className="text-xs text-slate-500">How often the system checks for new ads to send (in minutes).</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={globalSettings.ad_posting_interval || 30}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setGlobalSettings({ ...globalSettings, ad_posting_interval: val });
                              if (val > 0) {
                                axios.put('/admin/settings', { key: 'ad_posting_interval', value: val });
                              }
                            }}
                            className="w-20 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-center focus:outline-none focus:border-violet-500"
                          />
                          <span className="text-xs text-slate-500 font-bold">MINS</span>
                        </div>
                      </div>

                      {/* Minimum Group Members Setting */}
                      <div className="flex items-center justify-between py-4 border-b border-rose-500/10">
                        <div>
                          <p className="text-sm font-medium text-slate-200">Minimum Group Members</p>
                          <p className="text-xs text-slate-500">The minimum audience size required for a group to register.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={globalSettings.min_group_members || 100}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setGlobalSettings({ ...globalSettings, min_group_members: val });
                              if (val >= 0) {
                                axios.put('/admin/settings', { key: 'min_group_members', value: val });
                              }
                            }}
                            className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-center focus:outline-none focus:border-violet-500"
                          />
                          <span className="text-xs text-slate-500 font-bold">USERS</span>
                        </div>
                      </div>

                      {/* Ad Frequency Setting */}
                      <div className="flex items-center justify-between py-4 border-b border-rose-500/10">
                        <div>
                          <p className="text-sm font-medium text-slate-200">Global Ad Post Frequency</p>
                          <p className="text-xs text-slate-500">How long to wait before posting to the same group again (in minutes).</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={globalSettings.ad_frequency_limit_mins || 240}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setGlobalSettings({ ...globalSettings, ad_frequency_limit_mins: val });
                              if (val >= 0) {
                                axios.put('/admin/settings', { key: 'ad_frequency_limit_mins', value: val });
                              }
                            }}
                            className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-center focus:outline-none focus:border-violet-500"
                          />
                          <span className="text-xs text-slate-500 font-bold">MINS</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-rose-500/20 rounded-2xl p-6">
                    <h3 className="font-semibold text-rose-400 mb-4 flex items-center gap-2"><AlertTriangle size={18} /> Danger Zone</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => { if (window.confirm('Pause ALL active campaigns? This will stop all ad delivery.')) handleQuickAction('pause-all'); }}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-all text-sm font-medium"
                      >
                        <Pause size={16} /> Pause All Active Campaigns
                      </button>
                      <button
                        onClick={() => { if (window.confirm('Force-run the ad scheduler now?')) handleQuickAction('trigger-ads'); }}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/20 transition-all text-sm font-medium"
                      >
                        <Zap size={16} /> Force-Run Ad Queue Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {editingUser && (
                <UserEditModal
                  user={editingUser}
                  onClose={() => setEditingUser(null)}
                  onSave={fetchAllData}
                />
              )}

              {editingGroup && (
                <GroupEditModal
                  group={editingGroup}
                  onClose={() => setEditingGroup(null)}
                  onSave={fetchAllData}
                />
              )}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
};

export default SuperadminDashboard;
