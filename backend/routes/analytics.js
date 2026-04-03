const express = require('express');
const AnalyticsService = require('../services/analytics');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/user - get user-specific analytics
router.get('/user', authenticate, async (req, res) => {
  try {
    const { role } = req.query;
    const userId = req.user._id;

    // Determine which role analytics to return
    const analyticsRole = role || req.user.currentMode || 'advertiser';
    
    const analytics = await AnalyticsService.getUserAnalytics(userId, analyticsRole);
    
    res.json({
      role: analyticsRole,
      data: analytics
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ message: 'Failed to get user analytics', error: error.message });
  }
});

// GET /api/analytics/advertiser - get advertiser-specific analytics
router.get('/advertiser', authenticate, requirePermission('VIEW_ANALYTICS'), async (req, res) => {
  try {
    const userId = req.user._id;
    const analytics = await AnalyticsService.getUserAnalytics(userId, 'advertiser');
    
    res.json(analytics);
  } catch (error) {
    console.error('Advertiser analytics error:', error);
    res.status(500).json({ message: 'Failed to get advertiser analytics', error: error.message });
  }
});

// GET /api/analytics/publisher - get publisher-specific analytics
router.get('/publisher', authenticate, requirePermission('VIEW_ANALYTICS'), async (req, res) => {
  try {
    const userId = req.user._id;
    const analytics = await AnalyticsService.getUserAnalytics(userId, 'publisher');
    
    res.json(analytics);
  } catch (error) {
    console.error('Publisher analytics error:', error);
    res.status(500).json({ message: 'Failed to get publisher analytics', error: error.message });
  }
});

// GET /api/analytics/platform - get platform-wide analytics (admin only)
router.get('/platform', authenticate, requirePermission('VIEW_ALL_DATA'), async (req, res) => {
  try {
    const analytics = await AnalyticsService.getPlatformAnalytics();
    
    res.json(analytics);
  } catch (error) {
    console.error('Platform analytics error:', error);
    res.status(500).json({ message: 'Failed to get platform analytics', error: error.message });
  }
});

// GET /api/analytics/realtime - get real-time metrics (admin only)
router.get('/realtime', authenticate, requirePermission('VIEW_ALL_DATA'), async (req, res) => {
  try {
    const metrics = await AnalyticsService.getRealTimeMetrics();
    
    res.json(metrics);
  } catch (error) {
    console.error('Real-time metrics error:', error);
    res.status(500).json({ message: 'Failed to get real-time metrics', error: error.message });
  }
});

// GET /api/analytics/campaigns/:id - get specific campaign analytics
router.get('/campaigns/:id', authenticate, requirePermission('VIEW_ANALYTICS'), async (req, res) => {
  try {
    const Campaign = require('../models/Campaign');
    const AdPost = require('../models/AdPost');
    const ImpressionsLog = require('../models/ImpressionsLog');
    
    const campaignId = req.params.id;
    const userId = req.user._id;

    // Get campaign details
    const campaign = await Campaign.findOne({ 
      _id: campaignId, 
      advertiser: userId 
    }).populate('group');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Get ad posts for this campaign
    const adPosts = await AdPost.find({ campaign: campaignId })
      .populate('group')
      .sort({ createdAt: -1 });

    // Get impression logs
    const impressionLogs = await ImpressionsLog.find({ campaign: campaignId })
      .sort({ createdAt: -1 })
      .limit(100);

    // Calculate performance metrics
    const totalCost = adPosts.reduce((sum, post) => sum + (post.costCharged || 0), 0);
    const totalImpressions = adPosts.reduce((sum, post) => sum + (post.impressions || 0), 0);
    const totalViews = adPosts.reduce((sum, post) => sum + (post.viewsAt24h || 0), 0);

    res.json({
      campaign,
      adPosts,
      impressionLogs,
      metrics: {
        totalCost,
        totalImpressions,
        totalViews,
        avgCPM: totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0,
        postsCount: adPosts.length,
        budgetUtilization: campaign.budget > 0 ? (totalCost / campaign.budget) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Campaign analytics error:', error);
    res.status(500).json({ message: 'Failed to get campaign analytics', error: error.message });
  }
});

// GET /api/analytics/groups/:id - get specific group analytics
router.get('/groups/:id', authenticate, requirePermission('VIEW_ANALYTICS'), async (req, res) => {
  try {
    const Group = require('../models/Group');
    const AdPost = require('../models/AdPost');
    const WalletTransaction = require('../models/WalletTransaction');
    
    const groupId = req.params.id;
    const userId = req.user._id;

    // Get group details
    const group = await Group.findOne({ 
      _id: groupId, 
      owner: userId 
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Get ad posts for this group
    const adPosts = await AdPost.find({ group: groupId })
      .populate('campaign')
      .sort({ createdAt: -1 });

    // Get earnings for this group
    const earnings = await WalletTransaction.find({
      user: userId,
      type: 'earning',
      status: 'completed',
      group: groupId
    }).sort({ createdAt: -1 });

    // Calculate performance metrics
    const totalEarnings = earnings.reduce((sum, earning) => sum + earning.amount, 0);
    const avgViewsPerPost = adPosts.length > 0 
      ? adPosts.reduce((sum, post) => sum + (post.viewsAt24h || 0), 0) / adPosts.length 
      : 0;

    res.json({
      group,
      adPosts,
      earnings,
      metrics: {
        totalEarnings,
        totalAdsPosted: adPosts.length,
        avgViewsPerPost,
        performanceScore: group.performanceScore,
        revenuePerMember: group.memberCount > 0 ? totalEarnings / group.memberCount : 0,
        lastAdPostedAt: group.lastAdPostedAt
      }
    });
  } catch (error) {
    console.error('Group analytics error:', error);
    res.status(500).json({ message: 'Failed to get group analytics', error: error.message });
  }
});

// GET /api/analytics/export - export analytics data (admin only)
router.get('/export', authenticate, requirePermission('VIEW_ALL_DATA'), async (req, res) => {
  try {
    const { type, format = 'json' } = req.query;
    
    let data;
    switch (type) {
      case 'users':
        data = await AnalyticsService.getUserStats();
        break;
      case 'campaigns':
        data = await AnalyticsService.getCampaignStats();
        break;
      case 'groups':
        data = await AnalyticsService.getGroupStats();
        break;
      case 'financial':
        data = await AnalyticsService.getFinancialStats();
        break;
      default:
        return res.status(400).json({ message: 'Invalid export type' });
    }

    const filename = `analytics-${type}-${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'csv') {
      // Convert to CSV (simplified)
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSONtoCSV(data));
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(data);
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ message: 'Failed to export analytics', error: error.message });
  }
});

// Helper function to convert JSON to CSV (simplified)
function JSONtoCSV(data) {
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => `"${row[header] || ''}"`).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
  } else if (typeof data === 'object') {
    const headers = Object.keys(data);
    const csvHeaders = headers.join(',');
    const csvRow = headers.map(header => `"${data[header] || ''}"`).join(',');
    return [csvHeaders, csvRow].join('\n');
  }
  return '';
}

module.exports = router;
