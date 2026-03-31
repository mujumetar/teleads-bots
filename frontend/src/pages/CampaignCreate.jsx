import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Megaphone, Calculator, ArrowLeft, Send } from 'lucide-react';

export default function CampaignCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    adText: '',
    adImageUrl: '',
    trackingUrl: '',
    niche: 'tech',
    budget: '',
    costPerPost: 10, // 10 INR
  });
  const [estimate, setEstimate] = useState({ groups: 0, members: 0 });
  const [categories, setCategories] = useState([]);
  const [showRequest, setShowRequest] = useState(false);
  const [requestData, setRequestData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (formData.niche) calculateAudience();
  }, [formData.niche]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
      if (res.data.length > 0) setFormData(prev => ({ ...prev, niche: res.data[0].slug }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestNiche = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories/request', requestData);
      alert('Niche request submitted! Admin will review it.');
      setShowRequest(false);
      setRequestData({ name: '', description: '' });
    } catch (err) {
      alert('Failed to submit request');
    }
  };

  const calculateAudience = async () => {
    try {
      const res = await api.get(`/campaigns/audience-estimate?niche=${formData.niche}`);
      setEstimate(res.data);
    } catch (err) {
      console.error('Error fetching audience estimate:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/campaigns', formData);
      navigate('/campaigns');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1><Megaphone size={28} /> Create Campaign</h1>
          <p className="page-subtitle">Target niches and launch your ad network campaign</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn btn--ghost">
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <div className="dashboard-grid no-sidebar">
        <div className="card">
          <div className="card-header"><h2>Ad Details</h2></div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="auth-form full-width">
              <div className="form-group">
                <label>Campaign Name *</label>
                <input
                  placeholder="e.g. Crypto Launch Promo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="input--dark"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Target Niche *</label>
                  <select
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                    className="input--dark"
                  >
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowRequest(!showRequest)} className="btn-link text-small mt-1">
                    Don't see your niche? Request here
                  </button>
                </div>
                <div className="form-group">
                  <label>Budget (₹ INR) *</label>
                  <input
                    type="number"
                    placeholder="Min ₹100"
                    min="100"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    required
                    className="input--dark"
                  />
                </div>
              </div>

              {showRequest && (
                <div className="card bg-light p-4 mb-4 border-dashed">
                  <h4 className="mb-2">Request New Category</h4>
                  <div className="form-group mb-3">
                    <input 
                      placeholder="Category Name" 
                      value={requestData.name}
                      onChange={(e) => setRequestData({ ...requestData, name: e.target.value })}
                      className="input--dark"
                    />
                  </div>
                  <div className="form-group mb-3">
                    <textarea 
                      placeholder="Why do we need this?" 
                      value={requestData.description}
                      onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                      className="input--dark"
                    />
                  </div>
                  <button type="button" onClick={handleRequestNiche} className="btn btn--primary btn--sm">Submit Request</button>
                </div>
              )}

              <div className="form-group">
                <label>Ad Content (Markdown) *</label>
                <textarea
                  placeholder="Write your ad copy here..."
                  value={formData.adText}
                  onChange={(e) => setFormData({ ...formData, adText: e.target.value })}
                  required
                  className="input--dark"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Landing/Tracking URL</label>
                <input
                  placeholder="https://example.com"
                  value={formData.trackingUrl}
                  onChange={(e) => setFormData({ ...formData, trackingUrl: e.target.value })}
                  className="input--dark"
                />
              </div>

              <div className="form-group">
                <label>Ad Image URL (Optional)</label>
                <input
                  placeholder="https://..."
                  value={formData.adImageUrl}
                  onChange={(e) => setFormData({ ...formData, adImageUrl: e.target.value })}
                  className="input--dark"
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn--primary btn--full">
                {loading ? 'Creating...' : <><Send size={18}/> Launch Campaign</>}
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2><Calculator size={18}/> Audience Calculator</h2></div>
          <div className="card-body">
            <div className="estimate-box">
              <div className="estimate-item">
                <span className="label">Available Reach</span>
                <span className="value">{estimate.members.toLocaleString()} members</span>
              </div>
              <div className="estimate-item">
                <span className="label">Niche Groups</span>
                <span className="value">{estimate.groups} groups</span>
              </div>
              <div className="estimate-item">
                <span className="label">Est. Total Posts</span>
                <span className="value">{formData.budget ? Math.floor(formData.budget / formData.costPerPost) : 0}</span>
              </div>
              <p className="text-small text-muted mt-3">Estimates are based on active and approved publishers in the <strong>{formData.niche}</strong> category.</p>
            </div>
            
            <div className="cost-breakdown mt-4">
              <h4>Pricing Policy</h4>
              <div className="detail-item">
                <span>Network Cost</span>
                <span>₹10.00 / post</span>
              </div>
              <div className="detail-item text-green">
                <span>Total Potential Impressions</span>
                <span>~{(estimate.members * 0.1).toFixed(0)} views</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
