import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Megaphone, Plus, Trash2, Edit, Eye, Search } from 'lucide-react';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns');
      setCampaigns(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      setCampaigns(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting');
    }
  };

  const filtered = campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1><Megaphone size={28} /> Campaigns</h1>
          <p className="page-subtitle">Manage your advertising campaigns</p>
        </div>
        <Link to="/campaigns/new" className="btn btn--primary">
          <Plus size={18} /> New Campaign
        </Link>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          {['all', 'pending', 'active', 'paused', 'completed', 'rejected'].map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Megaphone size={48} />
            <p>No campaigns found</p>
            <Link to="/campaigns/new" className="btn btn--primary btn--sm">Create your first campaign</Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Budget</th>
                  <th>Spent</th>
                  <th>Impressions</th>
                  <th>Clicks</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c._id}>
                    <td className="font-medium">{c.name}</td>
                    <td><span className={`badge badge--${c.status}`}>{c.status}</span></td>
                    <td>${c.budget.toFixed(2)}</td>
                    <td>${(c.budgetSpent || 0).toFixed(2)}</td>
                    <td>{c.totalImpressions || 0}</td>
                    <td>{c.totalClicks || 0}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-btns">
                        <Link to={`/campaigns/${c._id}`} className="action-btn" title="View">
                          <Eye size={16} />
                        </Link>
                        <button onClick={() => deleteCampaign(c._id)} className="action-btn action-btn--danger" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
