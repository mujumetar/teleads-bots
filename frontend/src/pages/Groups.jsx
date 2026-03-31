import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Users, Plus, Trash2, Search } from 'lucide-react';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (id) => {
    if (!window.confirm('Remove this group?')) return;
    try {
      await api.delete(`/groups/${id}`);
      setGroups(prev => prev.filter(g => g._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.telegramGroupUsername || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1><Users size={28} /> My Groups</h1>
          <p className="page-subtitle">Manage your Telegram groups for ad placements</p>
        </div>
        <Link to="/groups/new" className="btn btn--primary">
          <Plus size={18} /> Register Group
        </Link>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Users size={48} />
            <p>No groups registered yet</p>
            <Link to="/groups/new" className="btn btn--primary btn--sm">Register your first group</Link>
          </div>
        </div>
      ) : (
        <div className="groups-grid">
          {filtered.map(g => (
            <div key={g._id} className="group-card">
              <div className="group-card__header">
                <h3>{g.name}</h3>
                <span className={`badge badge--${g.status}`}>{g.status}</span>
              </div>
              <div className="group-card__body">
                <div className="group-card__stat">
                  <span className="label">Group ID</span>
                  <span className="value">{g.telegramGroupId}</span>
                </div>
                {g.telegramGroupUsername && (
                  <div className="group-card__stat">
                    <span className="label">Username</span>
                    <span className="value">{g.telegramGroupUsername}</span>
                  </div>
                )}
                <div className="group-card__stat">
                  <span className="label">Members</span>
                  <span className="value">{g.memberCount?.toLocaleString()}</span>
                </div>
                <div className="group-card__stat">
                  <span className="label">Niche</span>
                  <span className="value">{g.niche}</span>
                </div>
                <div className="group-card__stat">
                  <span className="label">Revenue</span>
                  <span className="value highlight">₹{(g.revenueEarned || 0).toFixed(2)}</span>
                </div>
                <div className="group-card__stat">
                  <span className="label">Ad Frequency</span>
                  <span className="value">Every {g.postFrequency}h</span>
                </div>
              </div>
              {g.rejectionReason && (
                <div className="group-card__rejection">
                  <strong>Rejection reason:</strong> {g.rejectionReason}
                </div>
              )}
              <div className="group-card__footer">
                <button onClick={() => deleteGroup(g._id)} className="btn btn--danger btn--sm">
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
