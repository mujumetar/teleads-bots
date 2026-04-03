import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Send, 
  Megaphone, 
  Users, 
  Target, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Filter,
  Zap,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManualAdSender() {
  const [campaigns, setCampaigns] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [filterNiche, setFilterNiche] = useState('');
  const [expandedCampaign, setExpandedCampaign] = useState(null);
  const [skipFrequency, setSkipFrequency] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchGroups();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get('/api/admin/manual-ads/campaigns');
      setCampaigns(res.data);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    }
  };

  const fetchGroups = async (niche = '') => {
    try {
      const params = niche ? { niche } : {};
      const res = await axios.get('/api/admin/manual-ads/groups', { params });
      setGroups(res.data);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  const handleSendAds = async () => {
    if (!selectedCampaign || selectedGroups.length === 0) {
      alert('Please select a campaign and at least one group');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post('/api/admin/manual-ads/send', {
        campaignId: selectedCampaign,
        groupIds: selectedGroups,
        skipFrequencyCheck: skipFrequency
      });
      setResult(res.data);
      // Refresh campaigns to get updated budget
      fetchCampaigns();
    } catch (err) {
      console.error('Failed to send ads:', err);
      setResult({
        error: true,
        message: err.response?.data?.message || 'Failed to send ads'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async () => {
    if (!selectedCampaign) {
      alert('Please select a campaign');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const campaign = campaigns.find(c => c._id === selectedCampaign);
      const res = await axios.post('/api/admin/manual-ads/broadcast', {
        campaignId: selectedCampaign,
        targetNiche: campaign?.niche,
        maxGroups: 10,
        skipFrequencyCheck: skipFrequency
      });
      setResult(res.data);
      fetchCampaigns();
    } catch (err) {
      console.error('Failed to broadcast:', err);
      setResult({
        error: true,
        message: err.response?.data?.message || 'Failed to broadcast'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleGroupSelection = (groupId) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const selectedCampaignData = campaigns.find(c => c._id === selectedCampaign);
  const niches = [...new Set(groups.map(g => g.niche).filter(Boolean))];

  const filteredGroups = filterNiche 
    ? groups.filter(g => g.niche === filterNiche)
    : groups;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white">
          <Send size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manual Ad Sender</h2>
          <p className="text-slate-500">Manually send ads to specific groups or broadcast to matching audiences</p>
        </div>
      </div>

      {/* Campaign Selection */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Megaphone size={18} className="text-violet-500" />
            Select Campaign
          </h3>
        </div>
        <div className="p-6 space-y-4">
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Megaphone size={48} className="mx-auto mb-4 opacity-50" />
              <p>No active campaigns available</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {campaigns.map(campaign => (
                <motion.div
                  key={campaign._id}
                  onClick={() => setSelectedCampaign(campaign._id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedCampaign === campaign._id
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-slate-200 hover:border-violet-300'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-900">{campaign.name}</h4>
                      <p className="text-sm text-slate-500 line-clamp-1">{campaign.adText}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="px-2 py-1 bg-slate-100 rounded-md">{campaign.niche}</span>
                        <span className="text-slate-400">CPM: ₹{campaign.cpm}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">
                        ₹{campaign.budgetSpent?.toLocaleString()} / ₹{campaign.budget?.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400">
                        Remaining: ₹{(campaign.budget - campaign.budgetSpent)?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Budget Bar */}
                  <div className="mt-3">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${(campaign.budgetSpent / campaign.budget) * 100}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Group Selection */}
      {selectedCampaign && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Users size={18} className="text-violet-500" />
                Select Groups ({selectedGroups.length} selected)
              </h3>
              <div className="flex items-center gap-4">
                <select
                  value={filterNiche}
                  onChange={(e) => {
                    setFilterNiche(e.target.value);
                    fetchGroups(e.target.value);
                  }}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">All Niches</option>
                  {niches.map(niche => (
                    <option key={niche} value={niche}>{niche}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={skipFrequency}
                    onChange={(e) => setSkipFrequency(e.target.checked)}
                    className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  Skip frequency check
                </label>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {filteredGroups.map(group => (
                <motion.div
                  key={group._id}
                  onClick={() => toggleGroupSelection(group._id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedGroups.includes(group._id)
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-emerald-300'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedGroups.includes(group._id)
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-slate-300'
                    }`}>
                      {selectedGroups.includes(group._id) && (
                        <CheckCircle2 size={14} className="text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{group.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>{group.memberCount?.toLocaleString()} members</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{group.niche}</span>
                        <span className="text-emerald-600 font-medium">
                          Avg views: {group.avgViews?.toLocaleString()}
                        </span>
                        <span className="text-violet-600 font-medium">
                          Score: {group.performanceScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      {selectedCampaign && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-4"
        >
          <button
            onClick={handleSendAds}
            disabled={loading || selectedGroups.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
            Send to {selectedGroups.length} Group{selectedGroups.length !== 1 ? 's' : ''}
          </button>

          <button
            onClick={handleBroadcast}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Zap size={20} />
            )}
            Auto-Broadcast to Matching Groups
          </button>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-2xl border-2 p-6 ${
              result.error 
                ? 'border-rose-200 bg-rose-50' 
                : 'border-emerald-200 bg-emerald-50'
            }`}
          >
            {result.error ? (
              <div className="flex items-center gap-3 text-rose-700">
                <XCircle size={24} />
                <span className="font-semibold">{result.message}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-700">
                  <CheckCircle2 size={24} />
                  <span className="font-semibold text-lg">
                    {result.summary?.success || result.sent} Ads Sent Successfully
                  </span>
                </div>

                {result.summary && (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-slate-900">{result.summary.total}</div>
                      <div className="text-xs text-slate-500">Total</div>
                    </div>
                    <div className="bg-emerald-100 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-emerald-700">{result.summary.success}</div>
                      <div className="text-xs text-emerald-600">Success</div>
                    </div>
                    <div className="bg-amber-100 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-amber-700">{result.summary.skipped}</div>
                      <div className="text-xs text-amber-600">Skipped</div>
                    </div>
                    <div className="bg-rose-100 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-rose-700">{result.summary.failed}</div>
                      <div className="text-xs text-rose-600">Failed</div>
                    </div>
                  </div>
                )}

                {result.results && result.results.length > 0 && (
                  <div className="bg-white rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-slate-100 text-xs font-semibold text-slate-500 uppercase">
                      Detailed Results
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {result.results.map((r, i) => (
                        <div key={i} className="px-4 py-2 border-b border-slate-100 last:border-0 flex items-center justify-between">
                          <span className="font-medium text-slate-700">{r.groupName}</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            r.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                            r.status === 'skipped' ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
