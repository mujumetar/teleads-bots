const express = require('express');
const SystemConfig = require('../models/SystemConfig');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/system/config - get system configuration (superadmin only)
router.get('/config', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      // Create default config if none exists
      config = await SystemConfig.create({});
    }
    res.json(config);
  } catch (error) {
    console.error('Get system config error:', error);
    res.status(500).json({ message: 'Failed to get system configuration', error: error.message });
  }
});

// PUT /api/system/config - update system configuration (superadmin only)
router.put('/config', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
    }

    // Update allowed fields
    const allowedFields = [
      'defaultCPM', 'publisherShare', 'platformFee', 'minGroupMembers',
      'fraudThreshold', 'autoApproval', 'minCampaignBudget', 'maxCampaignBudget',
      'minWithdrawalAmount', 'withdrawalProcessingTime', 'autoPlacement',
      'enableDynamicPricing', 'highPerformanceThreshold', 'lowPerformanceThreshold',
      'emailNotifications', 'telegramNotifications', 'maintenanceMode', 'maintenanceMessage'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        config[field] = req.body[field];
      }
    });

    config.lastUpdated = new Date();
    await config.save();

    res.json({
      message: 'System configuration updated successfully',
      config
    });
  } catch (error) {
    console.error('Update system config error:', error);
    res.status(500).json({ message: 'Failed to update system configuration', error: error.message });
  }
});

// GET /api/system/analytics - get platform analytics (superadmin only)
router.get('/analytics', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const Campaign = require('../models/Campaign');
    const Group = require('../models/Group');
    const AdPost = require('../models/AdPost');
    const WalletTransaction = require('../models/WalletTransaction');

    // Get platform statistics
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalCampaigns = await Campaign.countDocuments();
    const totalGroups = await Group.countDocuments({ status: 'approved' });
    const totalAdPosts = await AdPost.countDocuments();

    // Get financial statistics
    const platformEarnings = await WalletTransaction.aggregate([
      { $match: { type: 'campaign_spend', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const publisherEarnings = await WalletTransaction.aggregate([
      { $match: { type: 'earning', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalImpressions = await Campaign.aggregate([
      { $group: { _id: null, total: { $sum: '$totalImpressions' } } }
    ]);

    const totalViews = await Campaign.aggregate([
      { $group: { _id: null, total: { $sum: '$totalViews' } } }
    ]);

    // Get active campaigns
    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });

    // Get recent transactions
    const recentTransactions = await WalletTransaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'email firstName lastName');

    res.json({
      overview: {
        totalUsers,
        totalCampaigns,
        totalGroups,
        totalAdPosts,
        activeCampaigns
      },
      financial: {
        platformEarnings: platformEarnings[0]?.total || 0,
        publisherEarnings: publisherEarnings[0]?.total || 0,
        totalImpressions: totalImpressions[0]?.total || 0,
        totalViews: totalViews[0]?.total || 0
      },
      recentTransactions
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Failed to get analytics', error: error.message });
  }
});

// POST /api/system/backup - create backup (superadmin only)
router.post('/backup', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    // This is a placeholder for backup functionality
    // In production, you'd implement actual database backup
    res.json({
      message: 'Backup functionality not yet implemented',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ message: 'Failed to create backup', error: error.message });
  }
});

// GET /api/system/health - system health check (superadmin only)
router.get('/health', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    
    // Check uptime
    const uptime = process.uptime();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
      },
      uptime: Math.round(uptime) + ' seconds'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ message: 'Health check failed', error: error.message });
  }
});

module.exports = router;
