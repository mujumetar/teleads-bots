const express = require('express');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Group = require('../models/Group');
const AdPost = require('../models/AdPost');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin or superadmin
router.use(authenticate, requireRole('admin', 'superadmin'));

const Bot = require('../models/Bot');
const Transaction = require('../models/Transaction');
const GlobalSetting = require('../models/GlobalSetting');

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
      { $inc: { walletBalance: amount } },
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
        await User.findByIdAndUpdate(tx.user, { $inc: { walletBalance: tx.amount } });
      }
    }
    
    tx.status = status;
    tx.adminNote = adminNote;
    await tx.save();
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
      .populate('advertiser', 'email');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
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
      .populate('owner', 'email');
    if (!group) return res.status(404).json({ message: 'Group not found' });
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

// POST /api/admin/wallet/:userId - Add funds to user wallet (superadmin)
router.post('/wallet/:userId', requireRole('superadmin'), async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $inc: { walletBalance: amount } },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/trigger-ads - Manually trigger the ad scheduler (Important for Vercel Cron Jobs)
router.get('/trigger-ads', async (req, res) => {
  try {
    const { processAdQueue } = require('../bot/telegramBot');
    await processAdQueue();
    res.json({ success: true, message: 'Ad queue processed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
