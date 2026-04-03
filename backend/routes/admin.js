const express = require('express');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Group = require('../models/Group');
const AdPost = require('../models/AdPost');
const SystemConfig = require('../models/SystemConfig');
const { authenticate, requireRole } = require('../middleware/auth');
const { push, Notify } = require('../services/notify');

const router = express.Router();

// Public/Secret-based routes (Must be BEFORE general auth middleware)
// POST /api/admin/link-telegram - Synchronize TG ID with User Email
// Allows admin secret OR JWT authentication for admin/superadmin
router.post('/link-telegram', authenticate, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { email, telegramId } = req.body;
    const user = await User.findOneAndUpdate({ email }, { telegramId }, { new: true });
    if (!user) return res.status(404).json({ message: 'User profile not found' });
    
    res.json({ success: true, user: user.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/trigger-ads - Manually trigger the ad scheduler
// Accessible via JWT (admin/superadmin) OR ADMIN_SECRET or Vercel CRON_SECRET
router.get('/trigger-ads', async (req, res, next) => {
  const secret = req.headers['x-admin-secret'];
  const cronSecret = req.headers['x-vercel-cron'];
  
  if (secret === process.env.ADMIN_SECRET || cronSecret === process.env.CRON_SECRET) {
     return next();
  }
  // If no secret, pass to authenticate middleware
  authenticate(req, res, next);
}, async (req, res) => {
  try {
    const { processAdQueue } = require('../bot/telegramBot');
    await processAdQueue(req.query.force === 'true');
    res.json({ success: true, message: 'Ad cycle triggered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/bot-config - Fetch all active bot tokens
// Validates via ADMIN_SECRET (used by python_bot)
router.get('/bot-config', async (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ message: 'Invalid admin secret' });
  }
  try {
    const Bot = require('../models/Bot');
    const bots = await Bot.find({ status: 'active' });
    res.json(bots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/bot-settings - Fetch global app settings for the bot
// Validates via ADMIN_SECRET
router.get('/bot-settings', async (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ message: 'Invalid admin secret' });
  }
  try {
    const GlobalSetting = require('../models/GlobalSetting');
    const settings = await GlobalSetting.find();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// All subsequent admin routes require authenticate + role check
router.use(authenticate, requireRole('admin', 'superadmin'));

const Bot = require('../models/Bot');
const Transaction = require('../models/Transaction');
const GlobalSetting = require('../models/GlobalSetting');

// GET /api/admin/all-data - Consolidated dashboard data for optimization
router.get('/all-data', async (req, res) => {
  try {
    const [
      users, campaigns, groups, bots, transactions, settings, adPosts, config
    ] = await Promise.all([
      User.find().sort({ createdAt: -1 }),
      Campaign.find().populate('advertiser', 'email').sort({ createdAt: -1 }),
      Group.find().populate('owner', 'email').sort({ createdAt: -1 }),
      Bot.find().sort({ isPrimary: -1, createdAt: -1 }),
      Transaction.find().populate('user', 'email').sort({ createdAt: -1 }),
      GlobalSetting.find(),
      AdPost.find().limit(500), // For performance stats calculation
      SystemConfig.findOne() || SystemConfig.create({})
    ]);

    // Aggregate performance stats on the fly
    const campaignStats = campaigns.map(c => {
      const logs = adPosts.filter(p => p.campaign && p.campaign.toString() === c._id.toString());
      return {
        _id: c._id,
        name: c.name,
        totalAds: logs.length,
        totalImpressions: logs.reduce((s, l) => s + (l.impressions || 0), 0),
        totalClicks: logs.reduce((s, l) => s + (l.clicks || 0), 0),
        totalCost: logs.reduce((s, l) => s + (l.costCharged || 0), 0)
      };
    });

    const groupStats = groups.map(g => {
      const logs = adPosts.filter(p => p.group && p.group.toString() === g._id.toString());
      return {
        _id: g._id,
        name: g.name,
        totalAds: logs.length,
        totalImpressions: logs.reduce((s, l) => s + (l.impressions || 0), 0),
        totalClicks: logs.reduce((s, l) => s + (l.clicks || 0), 0),
        totalEarnings: logs.reduce((s, l) => s + (l.publisherEarnings || 0), 0)
      };
    });

    // Basic Stats
    const stats = {
      totalUsers: users.length,
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalGroups: groups.length,
      approvedGroups: groups.filter(g => g.status === 'approved').length,
      totalRevenue: adPosts.reduce((s, p) => s + (p.costCharged || 0), 0),
      totalPublisherPayouts: adPosts.reduce((s, p) => s + (p.publisherEarnings || 0), 0),
    };
    stats.platformProfit = stats.totalRevenue - stats.totalPublisherPayouts;

    // Self-healing: Ensure any campaign with [FILLER] in name is marked as isFiller
    for (const camp of campaigns) {
      if (camp.name.includes('[FILLER]') && !camp.isFiller) {
        camp.isFiller = true;
        await camp.save();
      }
    }

    res.json({
      stats,
      users,
      campaigns,
      groups,
      bots,
      transactions,
      settings,
      config,
      performanceStats: { campaignStats, groupStats }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/config - Update SystemConfig
router.put('/config', requireRole('superadmin'), async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) config = new SystemConfig();
    
    Object.assign(config, req.body);
    config.lastUpdated = Date.now();
    await config.save();
    
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/stats - Enhanced Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalCampaigns, totalGroups, totalAdPosts, totalBots] = await Promise.all([
      User.countDocuments(),
      Campaign.countDocuments(),
      Group.countDocuments(),
      AdPost.countDocuments(),
      Bot.countDocuments(),
    ]);

    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });
    const pendingCampaigns = await Campaign.countDocuments({ status: 'pending' });
    const pendingGroups = await Group.countDocuments({ status: 'pending' });
    const approvedGroups = await Group.countDocuments({ status: 'approved' });

    // Revenue stats - detailed for settlements
    const revenueAgg = await AdPost.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$costCharged' }, totalPublisherPayouts: { $sum: '$publisherEarnings' } } }
    ]);
    
    // Deposit vs Payout stats
    const transactionAgg = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);
    const txStats = transactionAgg.reduce((acc, curr) => {
      acc[curr._id] = curr.total;
      return acc;
    }, {});

    const rev = revenueAgg[0] || { totalRevenue: 0, totalPublisherPayouts: 0 };

    res.json({
      totalUsers,
      totalCampaigns,
      activeCampaigns,
      pendingCampaigns,
      totalGroups,
      approvedGroups,
      pendingGroups,
      totalAdPosts,
      totalBots,
      totalRevenue: rev.totalRevenue,
      totalPublisherPayouts: rev.totalPublisherPayouts,
      platformProfit: rev.totalRevenue - rev.totalPublisherPayouts,
      totalDeposits: txStats.deposit || 0,
      totalWithdrawals: txStats.withdrawal || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- BOT MANAGEMENT ---
// GET /api/admin/bots - List all bots
router.get('/bots', async (req, res) => {
  try {
    const bots = await Bot.find().sort({ isPrimary: -1, createdAt: -1 });
    res.json(bots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/bots - Create a bot
router.post('/bots', async (req, res) => {
  try {
    const { name, token, isPrimary } = req.body;
    if (isPrimary) {
      await Bot.updateMany({}, { isPrimary: false });
    }
    const bot = await Bot.create({ name, token, isPrimary });
    res.status(201).json(bot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/bots/:id - Update bot status or info
router.put('/bots/:id', async (req, res) => {
  try {
    const { status, isPrimary } = req.body;
    if (isPrimary) {
      await Bot.updateMany({ _id: { $ne: req.params.id } }, { isPrimary: false });
    }
    const bot = await Bot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bot) return res.status(404).json({ message: 'Bot not found' });
    res.json(bot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/bots/:id
router.delete('/bots/:id', async (req, res) => {
  try {
    await Bot.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bot deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- TRANSACTION & SETTLEMENTS ---
// GET /api/admin/transactions - All transactions
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('user', 'email')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/transactions/deposit - Record a deposit and add to user wallet
router.post('/transactions/deposit', async (req, res) => {
  try {
    const { userId, amount, reference, note } = req.body;
    const tx = await Transaction.create({
      user: userId,
      amount,
      type: 'deposit',
      status: 'completed',
      reference,
      note
    });
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { advertiserWallet: amount } },
      { new: true }
    ).select('-password');
    
    res.status(201).json({ transaction: tx, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/transactions/:id/status - Approve/reject withdrawal or settlement
router.put('/transactions/:id/status', async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    if (tx.status === 'pending' && status === 'completed') {
      // Completed, balance adjustment already handled or not needed
    } else if (tx.status === 'pending' && status === 'rejected') {
      // If was withdrawal, refund the user
      if (tx.type === 'withdrawal' || tx.type === 'payout') {
        await User.findByIdAndUpdate(tx.user, { $inc: { publisherWallet: tx.amount } });
      }
    }
    
    tx.status = status;
    tx.adminNote = adminNote;
    await tx.save();

    // Push Telegram notification to user
    const txUser = await User.findById(tx.user);
    if (txUser?.telegramId && (tx.type === 'withdrawal' || tx.type === 'payout')) {
      if (status === 'completed') {
        push(txUser.telegramId, Notify.withdrawalApproved(tx.amount, tx.note || 'UPI'));
      } else if (status === 'rejected') {
        push(txUser.telegramId, Notify.withdrawalRejected(tx.amount, tx.adminNote));
      }
    }

    res.json(tx);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- GLOBAL SETTINGS ---
// GET /api/admin/settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await GlobalSetting.find();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/settings - Update or create setting
router.put('/settings', async (req, res) => {
  try {
    const { key, value, description } = req.body;
    const setting = await GlobalSetting.findOneAndUpdate(
      { key },
      { value, description },
      { upsert: true, new: true }
    );
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- GLOBAL ASSET ACCESS (FOR POWER OVER EVERYTHING) ---
// GET /api/admin/campaigns - ALL campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate('advertiser', 'email')
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/groups - ALL groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('owner', 'email')
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rest of the existing user roles route
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/role - Update user role (superadmin only)
router.put('/users/:id/role', requireRole('superadmin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/campaigns/:id/status - Approve/reject campaigns
router.put('/campaigns/:id/status', async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['active', 'paused', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const update = { status };
    if (status === 'rejected' && rejectionReason) update.rejectionReason = rejectionReason;
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('advertiser', 'email telegramId');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    // Push Telegram notification to advertiser
    if (campaign.advertiser?.telegramId) {
      if (status === 'active') {
        push(campaign.advertiser.telegramId, Notify.campaignApproved(campaign.name, campaign.budget, campaign.cpm));
      }
    }

    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/groups/:id/status - Approve/reject groups
router.put('/groups/:id/status', async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const update = { status };
    if (status === 'rejected' && rejectionReason) update.rejectionReason = rejectionReason;
    const group = await Group.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('owner', 'email telegramId');
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Push Telegram notification to group owner
    if (group.owner?.telegramId) {
      if (status === 'approved') {
        push(group.owner.telegramId, Notify.groupApproved(group.name, group.dynamicCpm));
      } else if (status === 'rejected') {
        push(group.owner.telegramId, Notify.groupRejected(group.name, rejectionReason));
      }
    }

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/adposts - All ad posts with details
router.get('/adposts', async (req, res) => {
  try {
    const adPosts = await AdPost.find()
      .populate({ path: 'campaign', select: 'name advertiser', populate: { path: 'advertiser', select: 'email' } })
      .populate('group', 'name telegramGroupUsername')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(adPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/wallet/:userId - Adjust user wallet (superadmin)
router.post('/wallet/:userId', requireRole('superadmin'), async (req, res) => {
  try {
    const { amount, walletType, note } = req.body; // walletType: 'advertiser' | 'publisher'
    if (!amount || isNaN(amount)) return res.status(400).json({ message: 'Invalid amount' });
    if (!['advertiser', 'publisher'].includes(walletType)) {
      return res.status(400).json({ message: 'Invalid wallet type' });
    }

    const field = walletType === 'advertiser' ? 'advertiserWallet' : 'publisherWallet';
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $inc: { [field]: amount } },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Create a transaction record for this adjustment
    const Transaction = require('../models/Transaction');
    await Transaction.create({
      user: user._id,
      amount: Math.abs(amount),
      type: amount > 0 ? 'deposit' : 'withdrawal',
      status: 'completed',
      reference: 'Manual Admin Adjustment',
      note: note || `Admin adjusted ${walletType} wallet by ₹${amount}`
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// PUT /api/admin/users/:id - Update user details (Superadmin only)
router.put('/users/:id', requireRole('superadmin'), async (req, res) => {
  try {
    const { role, advertiserWallet, publisherWallet, isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { 
      role, advertiserWallet, publisherWallet, isActive 
    }, { new: true });
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireRole('superadmin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/groups/:id
router.delete('/groups/:id', requireRole('superadmin'), async (req, res) => {
  try {
    await Group.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Group deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/campaigns/:id
// DELETE /api/admin/campaigns/:id
router.delete('/campaigns/:id', requireRole('superadmin'), async (req, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/performance-stats - Aggregated performance metrics
router.get('/performance-stats', async (req, res) => {
  try {
    const AdPost = require('../models/AdPost');
    
    // Campaign wise stats
    const campaignStats = await AdPost.aggregate([
      { $group: {
        _id: '$campaign',
        totalAds: { $sum: 1 },
        totalImpressions: { $sum: '$impressions' },
        totalClicks: { $sum: '$clicks' },
        totalCost: { $sum: '$costCharged' }
      }},
      { $lookup: { from: 'campaigns', localField: '_id', foreignField: '_id', as: 'campaign' }},
      { $unwind: '$campaign' }
    ]);

    // Group wise stats
    const groupStats = await AdPost.aggregate([
      { $group: {
        _id: '$group',
        totalAds: { $sum: 1 },
        totalImpressions: { $sum: '$impressions' },
        totalClicks: { $sum: '$clicks' },
        totalEarnings: { $sum: '$publisherEarnings' }
      }},
      { $lookup: { from: 'groups', localField: '_id', foreignField: '_id', as: 'group' }},
      { $unwind: '$group' }
    ]);

    res.json({ campaignStats, groupStats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
