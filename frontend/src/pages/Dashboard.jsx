import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import StatsCard from '../components/StatsCard';
import { Megaphone, Users, DollarSign, Activity, ChevronRight, Layout } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, activeRole } = useAuth();
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalGroups: 0,
    totalEarnings: 0,
    totalSpent: 0,
    totalImpressions: 0,
  });
  const [recentAds, setRecentAds] = useState([]);
  const [recentGroups, setRecentGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [campRes, groupRes] = await Promise.all([
        api.get('/campaigns'),
        api.get('/groups'),
      ]);
      
      const campaigns = campRes.data || [];
      const groups = groupRes.data || [];
      
      setRecentAds(campaigns.slice(0, 5));
      setRecentGroups(groups.slice(0, 5));
      
      const earnings = groups.reduce((acc, curr) => acc + (curr.revenueEarned || 0), 0);
      const spent = campaigns.reduce((acc, curr) => acc + (curr.budgetSpent || 0), 0);
      const totalImpressions = campaigns.reduce((acc, curr) => acc + (curr.totalImpressions || 0), 0);

      setStats({
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        totalGroups: groups.length,
        totalEarnings: earnings,
        totalSpent: spent,
        totalImpressions,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  const isAds = activeRole === 'advertiser';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>👋 Welcome, {user?.email.split('@')[0]}</h1>
          <p className="page-subtitle">Viewing your <strong>{activeRole}</strong> analytics</p>
        </div>
      </div>

      <div className="stats-grid">
        {isAds ? (
          <>
            <StatsCard icon={<Megaphone size={24} />} label="Total Campaigns" value={stats.totalCampaigns} color="blue" />
            <StatsCard icon={<Activity size={24} />} label="Total Reach" value={stats.totalImpressions} color="purple" />
            <StatsCard icon={<DollarSign size={24} />} label="Total Spent" value={`₹${stats.totalSpent.toFixed(2)}`} color="orange" />
          </>
        ) : (
          <>
            <StatsCard icon={<Layout size={24} />} label="Listed Groups" value={stats.totalGroups} color="green" />
            <StatsCard icon={<Activity size={24} />} label="Group Impressions" value={stats.totalImpressions} color="blue" />
            <StatsCard icon={<DollarSign size={24} />} label="Total Earnings" value={`₹${stats.totalEarnings.toFixed(2)}`} color="green" />
          </>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="card card--full">
          <div className="card-header">
            <h2>{isAds ? 'Recent Ad Campaigns' : 'Recent Groups'}</h2>
            <Link to={isAds ? '/campaigns' : '/groups'} className="btn btn--ghost btn--sm">
              Manage {isAds ? 'Ads' : 'Groups'} <ChevronRight size={16} />
            </Link>
          </div>
          <div className="card-body">
            <div className="table-container">
              {isAds ? (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Budget</th>
                      <th>Views</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAds.map(ad => (
                      <tr key={ad._id}>
                        <td className="font-medium">{ad.name}</td>
                        <td><span className={`badge badge--${ad.status}`}>{ad.status}</span></td>
                        <td>₹{ad.budget}</td>
                        <td>{ad.totalImpressions}</td>
                        <td>{new Date(ad.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Group</th>
                      <th>Status</th>
                      <th>Members</th>
                      <th>Earnings</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentGroups.map(grp => (
                      <tr key={grp._id}>
                        <td className="font-medium">{grp.name}</td>
                        <td><span className={`badge badge--${grp.status}`}>{grp.status}</span></td>
                        <td>{grp.memberCount}</td>
                        <td className="text-green">₹{grp.revenueEarned.toFixed(2)}</td>
                        <td>{new Date(grp.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
