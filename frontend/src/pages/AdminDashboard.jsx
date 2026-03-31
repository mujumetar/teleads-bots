import { useState, useEffect } from 'react';
import api from '../api/axios';
import StatsCard from '../components/StatsCard';
import {
  Shield, Users, Megaphone, LayoutGrid, DollarSign,
  CheckCircle, XCircle, Clock, Activity
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingCampaigns, setPendingCampaigns] = useState([]);
  const [pendingGroups, setPendingGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
      console.error(err);
    } finally {
      setLoading(false);
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

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1><Shield size={28} /> Admin Panel</h1>
          <p className="page-subtitle">Manage campaigns, groups, and users</p>
        </div>
      </div>

      {stats && (
        <div className="stats-grid stats-grid--5">
          <StatsCard icon={<Users size={24} />} label="Total Users" value={stats.totalUsers} color="blue" />
          <StatsCard icon={<Megaphone size={24} />} label="Active Campaigns" value={stats.activeCampaigns} color="green" />
          <StatsCard icon={<Clock size={24} />} label="Pending Approval" value={stats.pendingCampaigns + stats.pendingGroups} color="orange" />
          <StatsCard icon={<LayoutGrid size={24} />} label="Approved Groups" value={stats.approvedGroups} color="purple" />
          <StatsCard icon={<DollarSign size={24} />} label="Platform Revenue" value={`₹${(stats.totalRevenue || 0).toFixed(2)}`} color="green" />
        </div>
      )}

      <div className="tab-bar">
        {['overview', 'campaigns', 'groups', 'users'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'campaigns' && pendingCampaigns.length > 0 && (
              <span className="tab-badge">{pendingCampaigns.length}</span>
            )}
            {tab === 'groups' && pendingGroups.length > 0 && (
              <span className="tab-badge">{pendingGroups.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && stats && (
        <div className="dashboard-grid">
          <div className="card">
            <div className="card-header"><h2><Activity size={20} /> Revenue Breakdown</h2></div>
            <div className="card-body">
              <div className="detail-list">
                <div className="detail-item">
                  <span className="detail-label">Total Revenue</span>
                  <span className="detail-value">₹{(stats.totalRevenue || 0).toFixed(2)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Publisher Payouts (70%)</span>
                  <span className="detail-value">₹{(stats.totalPublisherPayouts || 0).toFixed(2)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Platform Profit (30%)</span>
                  <span className="detail-value highlight">₹{(stats.platformProfit || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h2>System Overview</h2></div>
            <div className="card-body">
              <div className="detail-list">
                <div className="detail-item">
                  <span className="detail-label">Total Campaigns</span>
                  <span className="detail-value">{stats.totalCampaigns}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Groups</span>
                  <span className="detail-value">{stats.totalGroups}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Ad Posts</span>
                  <span className="detail-value">{stats.totalAdPosts}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="card">
          <div className="card-header"><h2>Pending Campaigns</h2></div>
          <div className="card-body">
            {pendingCampaigns.length === 0 ? (
              <div className="empty-state"><CheckCircle size={48} /><p>No pending campaigns</p></div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Advertiser</th>
                      <th>Budget</th>
                      <th>Cost/Post</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingCampaigns.map(c => (
                      <tr key={c._id}>
                        <td className="font-medium">{c.name}</td>
                        <td>{c.advertiser?.email}</td>
                        <td>₹{c.budget.toFixed(2)}</td>
                        <td>₹{c.costPerPost}</td>
                        <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="action-btns">
                            <button onClick={() => handleCampaignAction(c._id, 'active')} className="action-btn action-btn--success" title="Approve">
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={() => {
                              const reason = prompt('Rejection reason (optional):');
                              handleCampaignAction(c._id, 'rejected', reason || '');
                            }} className="action-btn action-btn--danger" title="Reject">
                              <XCircle size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="card">
          <div className="card-header"><h2>Pending Groups</h2></div>
          <div className="card-body">
            {pendingGroups.length === 0 ? (
              <div className="empty-state"><CheckCircle size={48} /><p>No pending groups</p></div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Owner</th>
                      <th>Group ID</th>
                      <th>Members</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingGroups.map(g => (
                      <tr key={g._id}>
                        <td className="font-medium">{g.name}</td>
                        <td>{g.owner?.email}</td>
                        <td><code>{g.telegramGroupId}</code></td>
                        <td>{g.memberCount?.toLocaleString()}</td>
                        <td>{g.category}</td>
                        <td>
                          <div className="action-btns">
                            <button onClick={() => handleGroupAction(g._id, 'approved')} className="action-btn action-btn--success" title="Approve">
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={() => {
                              const reason = prompt('Rejection reason (optional):');
                              handleGroupAction(g._id, 'rejected', reason || '');
                            }} className="action-btn action-btn--danger" title="Reject">
                              <XCircle size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header"><h2>All Users</h2></div>
          <div className="card-body">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Wallet</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td className="font-medium">{u.email}</td>
                      <td><span className={`badge badge--${u.role}`}>{u.role}</span></td>
                      <td>₹{(u.walletBalance || 0).toFixed(2)}</td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
