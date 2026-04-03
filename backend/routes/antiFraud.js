const express = require('express');
const AntiFraudService = require('../services/antiFraud');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

// POST /api/anti-fraud/check/group - check group for fraud
router.post('/check/group', authenticate, requirePermission('APPROVE_GROUP'), async (req, res) => {
  try {
    const { groupId } = req.body;
    
    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    const fraudCheck = await AntiFraudService.checkGroupFraud(groupId);
    
    res.json({
      groupId,
      ...fraudCheck
    });
  } catch (error) {
    console.error('Group fraud check error:', error);
    res.status(500).json({ message: 'Failed to check group for fraud', error: error.message });
  }
});

// POST /api/anti-fraud/check/campaign - check campaign for fraud
router.post('/check/campaign', authenticate, requirePermission('MANAGE_CAMPAIGNS'), async (req, res) => {
  try {
    const { campaignId } = req.body;
    
    if (!campaignId) {
      return res.status(400).json({ message: 'Campaign ID is required' });
    }

    const fraudCheck = await AntiFraudService.checkCampaignFraud(campaignId);
    
    res.json({
      campaignId,
      ...fraudCheck
    });
  } catch (error) {
    console.error('Campaign fraud check error:', error);
    res.status(500).json({ message: 'Failed to check campaign for fraud', error: error.message });
  }
});

// POST /api/anti-fraud/check/user - check user for fraud
router.post('/check/user', authenticate, requirePermission('MANAGE_USERS'), async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const fraudCheck = await AntiFraudService.checkUserFraud(userId);
    
    res.json({
      userId,
      ...fraudCheck
    });
  } catch (error) {
    console.error('User fraud check error:', error);
    res.status(500).json({ message: 'Failed to check user for fraud', error: error.message });
  }
});

// POST /api/anti-fraud/impressions - check impression fraud
router.post('/impressions', authenticate, async (req, res) => {
  try {
    const { adPostId, newViews } = req.body;
    
    if (!adPostId || newViews === undefined) {
      return res.status(400).json({ message: 'Ad post ID and new views are required' });
    }

    const fraudCheck = await AntiFraudService.detectImpressionFraud(adPostId, newViews);
    
    // Execute automated actions if fraud detected
    if (fraudCheck.isFraud && fraudCheck.action !== 'allow') {
      await AntiFraudService.executeFraudAction(
        'adpost',
        adPostId,
        fraudCheck.action,
        fraudCheck.reasons.join(', ')
      );
    }
    
    res.json({
      adPostId,
      newViews,
      ...fraudCheck
    });
  } catch (error) {
    console.error('Impression fraud check error:', error);
    res.status(500).json({ message: 'Failed to check impression fraud', error: error.message });
  }
});

// POST /api/anti-fraud/execute - execute fraud action manually
router.post('/execute', authenticate, requirePermission('MANAGE_USERS'), async (req, res) => {
  try {
    const { entityType, entityId, action, reason } = req.body;
    
    if (!entityType || !entityId || !action) {
      return res.status(400).json({ message: 'Entity type, entity ID, and action are required' });
    }

    await AntiFraudService.executeFraudAction(entityType, entityId, action, reason);
    
    res.json({
      message: `Fraud action ${action} executed on ${entityType} ${entityId}`,
      entityType,
      entityId,
      action,
      reason
    });
  } catch (error) {
    console.error('Execute fraud action error:', error);
    res.status(500).json({ message: 'Failed to execute fraud action', error: error.message });
  }
});

// GET /api/anti-fraud/report - generate fraud report
router.get('/report', authenticate, requirePermission('VIEW_ALL_DATA'), async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const report = await AntiFraudService.generateFraudReport(timeRange);
    
    res.json(report);
  } catch (error) {
    console.error('Generate fraud report error:', error);
    res.status(500).json({ message: 'Failed to generate fraud report', error: error.message });
  }
});

// GET /api/anti-fraud/dashboard - get fraud dashboard data
router.get('/dashboard', authenticate, requirePermission('VIEW_ALL_DATA'), async (req, res) => {
  try {
    const Group = require('../models/Group');
    const Campaign = require('../models/Campaign');
    const User = require('../models/User');
    const AdPost = require('../models/AdPost');

    const [
      totalGroups,
      flaggedGroups,
      totalCampaigns,
      rejectedCampaigns,
      totalUsers,
      bannedUsers,
      recentFraudChecks
    ] = await Promise.all([
      Group.countDocuments(),
      Group.countDocuments({ isFlagged: true }),
      Campaign.countDocuments(),
      Campaign.countDocuments({ status: 'rejected' }),
      User.countDocuments(),
      User.countDocuments({ isBanned: true }),
      // Get recent fraud checks (would need to implement logging)
      Promise.resolve([])
    ]);

    const dashboard = {
      overview: {
        totalGroups,
        flaggedGroups,
        groupFraudRate: totalGroups > 0 ? ((flaggedGroups / totalGroups) * 100).toFixed(2) : 0,
        totalCampaigns,
        rejectedCampaigns,
        campaignFraudRate: totalCampaigns > 0 ? ((rejectedCampaigns / totalCampaigns) * 100).toFixed(2) : 0,
        totalUsers,
        bannedUsers,
        userFraudRate: totalUsers > 0 ? ((bannedUsers / totalUsers) * 100).toFixed(2) : 0
      },
      recentActivity: recentFraudChecks,
      alerts: []
    };

    // Add alerts for high fraud rates
    if (dashboard.overview.groupFraudRate > 10) {
      dashboard.alerts.push({
        type: 'warning',
        message: `High group fraud rate: ${dashboard.overview.groupFraudRate}%`,
        priority: 'medium'
      });
    }

    if (dashboard.overview.campaignFraudRate > 15) {
      dashboard.alerts.push({
        type: 'warning',
        message: `High campaign fraud rate: ${dashboard.overview.campaignFraudRate}%`,
        priority: 'high'
      });
    }

    res.json(dashboard);
  } catch (error) {
    console.error('Fraud dashboard error:', error);
    res.status(500).json({ message: 'Failed to get fraud dashboard', error: error.message });
  }
});

// GET /api/anti-fraud/flagged - get all flagged entities
router.get('/flagged', authenticate, requirePermission('VIEW_ALL_DATA'), async (req, res) => {
  try {
    const { type } = req.query;
    
    let data = [];
    
    switch (type) {
      case 'groups':
        const Group = require('../models/Group');
        data = await Group.find({ isFlagged: true })
          .populate('owner', 'email firstName lastName')
          .sort({ updatedAt: -1 });
        break;
        
      case 'campaigns':
        const Campaign = require('../models/Campaign');
        data = await Campaign.find({ status: 'rejected' })
          .populate('advertiser', 'email firstName lastName')
          .sort({ updatedAt: -1 });
        break;
        
      case 'users':
        const User = require('../models/User');
        data = await User.find({ isBanned: true })
          .sort({ updatedAt: -1 });
        break;
        
      default:
        // Return all flagged entities
        const [groups, campaigns, users] = await Promise.all([
          Group.find({ isFlagged: true }).populate('owner', 'email firstName lastName'),
          Campaign.find({ status: 'rejected' }).populate('advertiser', 'email firstName lastName'),
          User.find({ isBanned: true })
        ]);
        
        data = {
          groups,
          campaigns,
          users
        };
    }
    
    res.json({
      type: type || 'all',
      data,
      count: Array.isArray(data) ? data.length : Object.values(data).reduce((sum, arr) => sum + arr.length, 0)
    });
  } catch (error) {
    console.error('Get flagged entities error:', error);
    res.status(500).json({ message: 'Failed to get flagged entities', error: error.message });
  }
});

// POST /api/anti-fraud/bulk-check - bulk fraud check for multiple entities
router.post('/bulk-check', authenticate, requirePermission('VIEW_ALL_DATA'), async (req, res) => {
  try {
    const { entityType, entityIds } = req.body;
    
    if (!entityType || !entityIds || !Array.isArray(entityIds)) {
      return res.status(400).json({ message: 'Entity type and array of entity IDs are required' });
    }

    const results = [];
    
    for (const entityId of entityIds) {
      let fraudCheck;
      
      switch (entityType) {
        case 'groups':
          fraudCheck = await AntiFraudService.checkGroupFraud(entityId);
          break;
        case 'campaigns':
          fraudCheck = await AntiFraudService.checkCampaignFraud(entityId);
          break;
        case 'users':
          fraudCheck = await AntiFraudService.checkUserFraud(entityId);
          break;
        default:
          fraudCheck = { isFraud: false, reasons: ['Invalid entity type'] };
      }
      
      results.push({
        entityId,
        ...fraudCheck
      });
    }
    
    res.json({
      entityType,
      totalChecked: entityIds.length,
      results
    });
  } catch (error) {
    console.error('Bulk fraud check error:', error);
    res.status(500).json({ message: 'Failed to perform bulk fraud check', error: error.message });
  }
});

module.exports = router;
