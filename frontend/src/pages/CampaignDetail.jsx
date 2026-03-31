import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Megaphone, ArrowLeft, TrendingUp, DollarSign, Eye, MousePointer } from 'lucide-react';
import StatsCard from '../components/StatsCard';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/campaigns/${id}`)
      .then(res => setCampaign(res.data))
      .catch(() => navigate('/campaigns'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;
  if (!campaign) return null;

  const progress = campaign.budget > 0 ? ((campaign.budgetSpent / campaign.budget) * 100).toFixed(1) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1><Megaphone size={28} /> {campaign.name}</h1>
          <p className="page-subtitle">
            <span className={`badge badge--${campaign.status}`}>{campaign.status}</span>
            &nbsp; Created {new Date(campaign.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button onClick={() => navigate(-1)} className="btn btn--ghost">
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <div className="stats-grid">
        <StatsCard icon={<DollarSign size={24} />} label="Budget" value={`₹${campaign.budget.toFixed(2)}`} color="blue" />
        <StatsCard icon={<TrendingUp size={24} />} label="Spent" value={`₹${(campaign.budgetSpent || 0).toFixed(2)}`} color="orange" />
        <StatsCard icon={<Eye size={24} />} label="Impressions" value={campaign.totalImpressions || 0} color="purple" />
        <StatsCard icon={<MousePointer size={24} />} label="Clicks" value={campaign.totalClicks || 0} color="green" />
      </div>

      <div className="card">
        <div className="card-header"><h2>Budget Progress</h2></div>
        <div className="card-body">
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${Math.min(progress, 100)}%` }}></div>
          </div>
          <p className="progress-text">{progress}% of budget used</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header"><h2>Ad Copy</h2></div>
          <div className="card-body">
            <pre className="ad-preview">{campaign.adText}</pre>
            {campaign.trackingUrl && (
              <p className="mt-2"><strong>Link:</strong> <a href={campaign.trackingUrl} target="_blank" rel="noopener">{campaign.trackingUrl}</a></p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Details</h2></div>
          <div className="card-body">
            <div className="detail-list">
              <div className="detail-item">
                <span className="detail-label">Cost Per Post</span>
                <span className="detail-value">${campaign.costPerPost}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Start Date</span>
                <span className="detail-value">{campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'Not set'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">End Date</span>
                <span className="detail-value">{campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Not set'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Target Groups</span>
                <span className="detail-value">{campaign.targetGroups?.length || 'All groups'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
