import { useState, useEffect } from 'react';
import api from '../api/axios';
import StatsCard from '../components/StatsCard';
import { 
  Users, Megaphone, Shield, DollarSign, Activity, Settings, 
  CheckCircle, XCircle, Bot, Landmark, List, PlusCircle, AlertCircle,
  Search, RefreshCw, Trash2, Edit3, Plus, ExternalLink
} from 'lucide-react';

export default function SuperadminDashboard() {
  const [activeTab, setActiveTab] = useState('financials');
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    activeBots: 0,
    pendingAds: 0,
    pendingGroups: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [settings, setSettings] = useState([]);
  const [catRequests, setCatRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  
  // New States for "More Control"
  const [allUsers, setAllUsers] = useState([]);
  const [allBots, setAllBots] = useState([]);
  const [allAdPosts, setAllAdPosts] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [showBotModal, setShowBotModal] = useState(false);
  const [newBot, setNewBot] = useState({ name: '', token: '', isPrimary: false });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const [statsRes, setRes, catRes, reqRes, txRes, usersRes, botsRes, adsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/settings'),
        api.get('/categories'),
        api.get('/categories/admin/requests'),
        api.get('/admin/transactions'),
        api.get('/admin/users'),
        api.get('/admin/bots'),
        api.get('/admin/adposts')
      ]);
      setStats(statsRes.data);
      setSettings(setRes.data);
      setCategories(catRes.data);
      setCatRequests(reqRes.data);
      setPendingTransactions(txRes.data.filter(t => t.status === 'pending'));
      setAllUsers(usersRes.data);
      setAllBots(botsRes.data);
      setAllAdPosts(adsRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAction = async (id, status) => {
    const adminNote = prompt('Enter payment reference or reason:');
    try {
      await api.put(`/admin/transactions/${id}/status`, { status, adminNote });
      fetchData();
    } catch (err) {
      alert('Action failed');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    if (!window.confirm(`Change user role to ${newRole}?`)) return;
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchData();
    } catch (err) {
      alert('Role update failed');
    }
  };

  const addWalletFunds = async (userId) => {
    const amount = prompt('Enter amount to ADD in ₹:');
    if (!amount || isNaN(amount)) return;
    try {
      await api.post(`/admin/wallet/${userId}`, { amount: parseFloat(amount) });
      fetchData();
      alert('Funds added successfully');
    } catch (err) {
      alert('Failed to add funds');
    }
  };

  const createBot = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/bots', newBot);
      setShowBotModal(false);
      setNewBot({ name: '', token: '', isPrimary: false });
      fetchData();
    } catch (err) {
      alert('Failed to add bot');
    }
  };

  const togglePrimaryBot = async (botId, isPrimary) => {
    try {
      await api.put(`/admin/bots/${botId}`, { isPrimary });
      fetchData();
    } catch (err) {
      alert('Failed to update bot');
    }
  };

  const updateSetting = async (key, value) => {
    try {
      await api.put('/admin/settings', { key, value });
      fetchData();
    } catch (err) {
      alert('Failed to update setting');
    }
  };

  const approveCategory = async (id) => {
    try {
      await api.post(`/categories/admin/approve/${id}`);
      fetchData();
    } catch (err) {
      alert('Approval failed');
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>⚙️ Master Control Center</h1>
          <p className="page-subtitle">Granular control over users, bots, and financials</p>
        </div>
        <button onClick={fetchData} className="btn btn--ghost">
          <RefreshCw size={18} /> Refresh Logic
        </button>
      </div>

      <div className="tabs-container" style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <button className={`tab-btn ${activeTab === 'financials' ? 'active' : ''}`} onClick={() => setActiveTab('financials')}>
          <Landmark size={18} /> Financials
        </button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={18} /> User Management
        </button>
        <button className={`tab-btn ${activeTab === 'bots' ? 'active' : ''}`} onClick={() => setActiveTab('bots')}>
          <Bot size={18} /> Bot Management
        </button>
        <button className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
          <List size={18} /> Categories
        </button>
        <button className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
          <Activity size={18} /> Network Activity
        </button>
        <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={18} /> Settings
        </button>
      </div>

      {activeTab === 'financials' && (
        <div className="dashboard-grid no-sidebar">
          <div className="stats-grid">
            <StatsCard label="Net Deposits" value={`₹${stats.totalDeposits}`} icon={<DollarSign size={24} />} color="green" />
            <StatsCard label="Net Payouts" value={`₹${stats.totalWithdrawals}`} icon={<PlusCircle size={24} />} color="blue" />
            <StatsCard label="Platform Profit" value={`₹${stats.platformProfit?.toFixed(2)}`} icon={<Activity size={24} />} color="purple" />
          </div>

          <div className="card">
            <div className="card-header"><h2>Pending Payout Requests</h2></div>
            <div className="card-body">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Amount</th>
                      <th>Details</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTransactions.filter(t => t.type === 'withdrawal').map(tx => (
                      <tr key={tx._id}>
                        <td>{tx.user?.email}</td>
                        <td className="font-bold">₹{tx.amount.toFixed(2)}</td>
                        <td className="text-small">{tx.note}</td>
                        <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="action-btns">
                            <button onClick={() => handleTransactionAction(tx._id, 'completed')} className="btn btn--primary btn--sm">Approve</button>
                            <button onClick={() => handleTransactionAction(tx._id, 'rejected')} className="btn btn--danger btn--sm">Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingTransactions.filter(t => t.type === 'withdrawal').length === 0 && (
                      <tr><td colSpan="5" className="text-center py-4">No pending withdrawals</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="dashboard-grid no-sidebar">
          <div className="card card--full">
            <div className="card-header">
              <h2>User Base Management</h2>
              <div className="search-box" style={{ maxWidth: '300px', margin: 0 }}>
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Filter by email..." 
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                />
              </div>
            </div>
            <div className="card-body">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Wallet</th>
                      <th>Joined</th>
                      <th>Master Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.filter(u => u.email.toLowerCase().includes(searchUser.toLowerCase())).map(user => (
                      <tr key={user._id}>
                        <td>{user.email}</td>
                        <td><span className={`badge badge--${user.role}`}>{user.role}</span></td>
                        <td className="font-bold">₹{user.walletBalance.toFixed(2)}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="action-btns">
                            <select 
                              className="input--sm" 
                              value={user.role} 
                              onChange={(e) => updateUserRole(user._id, e.target.value)}
                              style={{ width: 'auto', padding: '4px 8px' }}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                              <option value="superadmin">Superadmin</option>
                            </select>
                            <button onClick={() => addWalletFunds(user._id)} className="btn btn--ghost btn--sm" title="Add Funds">
                              <Plus size={14} /> ₹
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bots' && (
        <div className="dashboard-grid no-sidebar">
          <div className="card">
            <div className="card-header">
              <h2>Active Bots</h2>
              <button onClick={() => setShowBotModal(true)} className="btn btn--primary btn--sm"><Plus size={16}/> Add Bot</button>
            </div>
            <div className="card-body">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Bot Name</th>
                      <th>Primary</th>
                      <th>Status</th>
                      <th>Ads Sent</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBots.map(bot => (
                      <tr key={bot._id}>
                        <td className="font-bold">{bot.name}</td>
                        <td>
                          <button 
                            className={`badge ${bot.isPrimary ? 'badge--approved' : 'badge--pending'}`}
                            onClick={() => togglePrimaryBot(bot._id, !bot.isPrimary)}
                          >
                            {bot.isPrimary ? 'Primary' : 'Set Primary'}
                          </button>
                        </td>
                        <td><span className={`badge badge--${bot.status}`}>{bot.status}</span></td>
                        <td>{bot.totalAdsSent || 0}</td>
                        <td>
                          <button onClick={async () => {
                            if(window.confirm('Delete bot?')) {
                              await api.delete(`/admin/bots/${bot._id}`);
                              fetchData();
                            }
                          }} className="btn btn--danger btn--sm"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card card--full">
          <div className="card-header"><h2>Global Ad Stream</h2></div>
          <div className="card-body">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Target Group</th>
                    <th>Charged</th>
                    <th>Publisher</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {allAdPosts.map(post => (
                    <tr key={post._id}>
                      <td>{post.campaign?.name} <span className="text-muted">({post.campaign?.advertiser?.email})</span></td>
                      <td>{post.group?.name} <span className="text-muted">({post.group?.telegramGroupUsername})</span></td>
                      <td className="text-red">-₹{post.costCharged?.toFixed(2)}</td>
                      <td className="text-green">+₹{post.publisherEarnings?.toFixed(2)}</td>
                      <td>{new Date(post.sentAt || post.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {allAdPosts.length === 0 && <tr><td colSpan="5" className="text-center py-4">No ad activity yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="dashboard-grid no-sidebar">
          <div className="card">
            <div className="card-header"><h2>Niche Requests</h2></div>
            <div className="card-body">
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Niche</th><th>Reason</th><th>By</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {catRequests.filter(r => r.status === 'pending').map(req => (
                      <tr key={req._id}>
                        <td className="font-bold">{req.name}</td>
                        <td className="text-small">{req.description}</td>
                        <td>{req.requestedBy?.email}</td>
                        <td><button className="btn btn--primary btn--sm" onClick={() => approveCategory(req._id)}>Approve</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card card--full">
          <div className="card-header"><h2>System & Fee Controls</h2></div>
          <div className="card-body">
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div className="form-group">
                  <label>Credit Price (₹ INR)</label>
                  <input 
                    type="number" 
                    defaultValue={settings.find(s => s.key === 'credit_price')?.value} 
                    onBlur={(e) => updateSetting('credit_price', e.target.value)}
                    className="input--dark"
                  />
                </div>
                <div className="form-group">
                  <label>Pub. Revenue Share (%)</label>
                  <input 
                    type="number" 
                    defaultValue={settings.find(s => s.key === 'publisher_share')?.value} 
                    onBlur={(e) => updateSetting('publisher_share', e.target.value)}
                    className="input--dark"
                  />
                </div>
                <div className="form-group">
                  <label>Min. Deposit (₹ INR)</label>
                  <input 
                    type="number" 
                    defaultValue={settings.find(s => s.key === 'min_deposit')?.value} 
                    onBlur={(e) => updateSetting('min_deposit', e.target.value)}
                    className="input--dark"
                  />
                </div>
            </div>
            
            <div className="divider my-8"></div>
            
            <div className="setting-item flex-between py-4">
              <div>
                <h4>Maintenance Mode</h4>
                <p className="text-muted">Restrict access for everyone except admins.</p>
              </div>
              <button 
                onClick={() => updateSetting('maintenance_mode', !settings.find(s => s.key === 'maintenance_mode')?.value)} 
                className={`btn btn--sm ${settings.find(s => s.key === 'maintenance_mode')?.value ? 'btn--danger' : 'btn--primary'}`}
              >
                {settings.find(s => s.key === 'maintenance_mode')?.value ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bot Modal */}
      {showBotModal && (
        <div className="modal-overlay">
          <div className="modal-card card" style={{ maxWidth: '400px' }}>
            <div className="card-header"><h2>Add New Bot</h2></div>
            <div className="card-body">
              <form onSubmit={createBot} className="auth-form">
                <div className="form-group">
                  <label>Bot Name</label>
                  <input type="text" placeholder="e.g. TeleAds_Official_Bot" value={newBot.name} onChange={(e) => setNewBot({...newBot, name: e.target.value})} required className="input--dark" />
                </div>
                <div className="form-group">
                  <label>Bot Token</label>
                  <input type="password" placeholder="Telegram API Token" value={newBot.token} onChange={(e) => setNewBot({...newBot, token: e.target.value})} required className="input--dark" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="submit" className="btn btn--primary btn--full">Add Bot</button>
                  <button type="button" onClick={() => setShowBotModal(false)} className="btn btn--ghost btn--full">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
