import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Layout, CheckCircle, Info, ArrowLeft, Bot } from 'lucide-react';

export default function GroupCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    telegramGroupId: '',
    telegramGroupUsername: '',
    niche: 'tech',
  });
  const [categories, setCategories] = useState([]);
  const [showRequest, setShowRequest] = useState(false);
  const [requestData, setRequestData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/groups', formData);
      navigate('/groups');
    } catch (err) {
      alert(err.response?.data?.message || 'Error registering group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1><Layout size={28} /> Register Group</h1>
          <p className="page-subtitle">Add your Telegram group to the monetization network</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn btn--ghost">
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <div className="dashboard-grid no-sidebar">
        <div className="card">
          <div className="card-header"><h2>Group Details</h2></div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="auth-form full-width">
              <div className="form-group">
                <label>Display Name *</label>
                <input
                  placeholder="e.g. Finance News Global"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="input--dark"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Telegram Chat ID *</label>
                  <input
                    placeholder="-100..."
                    value={formData.telegramGroupId}
                    onChange={(e) => setFormData({ ...formData, telegramGroupId: e.target.value })}
                    required
                    className="input--dark"
                  />
                </div>
                <div className="form-group">
                  <label>Niche / Category *</label>
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
                    Request new niche
                  </button>
                </div>
              </div>

              {showRequest && (
                <div className="card bg-light p-4 mb-4 border-dashed">
                  <h4 className="mb-2">Request New Niche</h4>
                  <div className="form-group mb-3">
                    <input 
                      placeholder="Niche Name" 
                      value={requestData.name}
                      onChange={(e) => setRequestData({ ...requestData, name: e.target.value })}
                      className="input--dark"
                    />
                  </div>
                  <button type="button" onClick={handleRequestNiche} className="btn btn--primary btn--sm">Submit Request</button>
                </div>
              )}

              <div className="form-group">
                <label>Public Username (Optional)</label>
                <input
                  placeholder="@mygroup"
                  value={formData.telegramGroupUsername}
                  onChange={(e) => setFormData({ ...formData, telegramGroupUsername: e.target.value })}
                  className="input--dark"
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn--primary btn--full">
                {loading ? 'Registering...' : 'Register Group'}
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2><Info size={18}/> How to Setup</h2></div>
          <div className="card-body">
            <div className="instruction-list">
              <div className="instruction-item">
                <span className="step">1</span>
                <p>Add our bot <strong>@TeleAdsBot</strong> to your group as an administrator.</p>
              </div>
              <div className="instruction-item">
                <span className="step">2</span>
                <p>Run the <code className="code-text">/register</code> command inside your group to get your <strong>Chat ID</strong>.</p>
              </div>
              <div className="instruction-item">
                <span className="step">3</span>
                <p>Paste the Chat ID into the form and click register.</p>
              </div>
              <div className="instruction-item">
                <span className="step">4</span>
                <p>Wait for admin approval (usually within 24 hours).</p>
              </div>
            </div>
            
            <div className="alert alert--info mt-4">
              <Bot size={18} />
              <p>Make sure the bot has permission to "Post Messages" in your group/channel.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
