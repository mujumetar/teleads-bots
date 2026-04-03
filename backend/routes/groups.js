const express = require('express');
const Group = require('../models/Group');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/groups/bot-register - For the Python bot to register groups
router.post('/bot-register', async (req, res) => {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const { name, telegramGroupId, telegramGroupUsername, memberCount, telegramOwnerId } = req.body;
    // We assume the bot already checked if it exists, but we verify here too
    const existing = await Group.findOne({ telegramGroupId });
    if (existing) return res.status(409).json({ message: 'Already registered' });

    const User = require('../models/User');
    let ownerId = '000000000000000000000000';
    if (telegramOwnerId) {
      const user = await User.findOne({ telegramId: telegramOwnerId });
      if (user) ownerId = user._id;
    }

    const group = await Group.create({
      owner: ownerId,
      name,
      telegramGroupId,
      telegramGroupUsername,
      telegramOwnerId,
      memberCount: memberCount || 0,
      status: 'pending'
    });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/groups/bot-status/:telegramGroupId - For bot to check group status
router.get('/bot-status/:telegramGroupId', async (req, res) => {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const group = await Group.findOne({ telegramGroupId: req.params.telegramGroupId });
    if (!group) return res.status(404).json({ message: 'Not found' });
    
    // Fetch ad post stats for this group
    const AdPost = require('../models/AdPost');
    const stats = await AdPost.aggregate([
      { $match: { group: group._id } },
      { $group: { _id: null, totalImpressions: { $sum: '$impressions' }, totalClicks: { $sum: '$clicks' }, count: { $sum: 1 } } }
    ]);

    const stat = stats[0] || { totalImpressions: 0, totalClicks: 0, count: 0 };

    res.json({
      status: group.status,
      revenue: group.revenueEarned || 0,
      impressions: stat.totalImpressions,
      clicks: stat.totalClicks,
      totalAds: stat.count,
      performanceScore: group.performanceScore || 0,
      dynamicCpm: group.dynamicCpm || 100,
      memberCount: group.memberCount || 0,
      avgViews: group.avgViews || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/groups/bot-user-stats/:telegramId - For bot to fetch user earnings/stats
router.get('/bot-user-stats/:telegramId', async (req, res) => {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const User = require('../models/User');
    const user = await User.findOne({ telegramId: req.params.telegramId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not linked', reason: 'unlinked' });
    }
    
    const groups = await Group.find({ owner: user._id });
    
    // Fetch aggregated stats for each group
    const AdPost = require('../models/AdPost');
    const detailedGroups = await Promise.all(groups.map(async (g) => {
      const stats = await AdPost.aggregate([
        { $match: { group: g._id, status: 'sent' } },
        { $group: { 
          _id: null, 
          totalImpressions: { $sum: '$impressions' }, 
          count: { $sum: 1 } 
        } }
      ]);
      const stat = stats[0] || { totalImpressions: 0, count: 0 };
      return {
        name: g.name,
        status: g.status,
        memberCount: g.memberCount,
        revenue: g.revenueEarned || 0,
        impressions: stat.totalImpressions,
        totalAds: stat.count
      };
    }));

    const totalGroups = groups.length;
    const activeGroups = groups.filter(g => g.status === 'approved').length;
    let totalRevenue = 0;
    groups.forEach(g => totalRevenue += (g.revenueEarned || 0));
    
    // Auto-generate referral code if missing (for legacy users)
    if (!user.referralCode) {
      user.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await user.save();
    }
    
    res.json({
      linked: true,
      email: user.email,
      role: user.role,
      referralCode: user.referralCode,
      walletBalance: user.publisherWallet || 0,
      totalEarned: user.totalEarned || totalRevenue,
      totalGroups,
      activeGroups,
      groups: detailedGroups
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/groups/bot-link-account - For the bot to link an email to a Telegram ID
router.post('/bot-link-account', async (req, res) => {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const { email, telegramId, telegramUsername } = req.body;
    const User = require('../models/User');
    
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { telegramId, telegramUsername },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ message: 'Email not found in system.' });
    
    // Automatically claim any pending groups this user previously registered
    await Group.updateMany(
      { telegramOwnerId: telegramId, owner: '000000000000000000000000' },
      { $set: { owner: user._id } }
    );
    
    res.json({ success: true, user: user.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/groups/bot-user-data/:telegramId - For bot to get user's campaigns and groups
router.get('/bot-user-data/:telegramId', async (req, res) => {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const User = require('../models/User');
    const Campaign = require('../models/Campaign');
    const Group = require('../models/Group');

    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) return res.status(404).json({ message: 'User not linked' });

    const [groups, campaigns] = await Promise.all([
      Group.find({ owner: user._id }),
      Campaign.find({ advertiser: user._id })
    ]);

    res.json({
      user: { 
        email: user.email, 
        publisherWallet: user.publisherWallet || 0,
        advertiserWallet: user.advertiserWallet || 0,
        totalEarned: user.totalEarned || 0 
      },
      groups: groups.map(g => ({
        id: g._id,
        name: g.name,
        status: g.status,
        memberCount: g.memberCount,
        performanceScore: g.performanceScore,
        revenue: g.revenueEarned || 0
      })),
      campaigns: campaigns.map(c => ({
        id: c._id,
        name: c.name,
        status: c.status,
        budget: c.budget,
        totalSpent: c.totalSpent || 0,
        totalViews: c.totalViews || 0
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/groups/claim - For a user to claim a group registered via bot
router.post('/claim', authenticate, async (req, res) => {
  try {
    const { telegramGroupId } = req.body;
    const group = await Group.findOne({ telegramGroupId, owner: '000000000000000000000000' });
    if (!group) return res.status(404).json({ message: 'Group not found or already claimed' });
    
    group.owner = req.user.id;
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/groups - Register a group (publishers)
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, telegramGroupId, telegramGroupUsername, memberCount, category, language, postFrequency } = req.body;
    if (!name || !telegramGroupId) {
      return res.status(400).json({ message: 'Name and telegramGroupId are required' });
    }
    const existing = await Group.findOne({ telegramGroupId });
    if (existing) return res.status(409).json({ message: 'This group is already registered' });

    const group = await Group.create({
      owner: req.user.id,
      name,
      telegramGroupId,
      telegramGroupUsername,
      memberCount: memberCount || 0,
      category: category || 'other',
      language: language || 'en',
      postFrequency: postFrequency || 4,
    });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/groups - Get groups (own for users, all for admins)
router.get('/', authenticate, async (req, res) => {
  try {
    let filter = {};
    if (!req.user.roles?.isSuperAdmin && !req.user.roles?.isAdmin) {
      filter.owner = req.user.id;
    }
    // If query param ?status=approved, filter by status
    if (req.query.status) filter.status = req.query.status;

    const groups = await Group.find(filter)
      .populate('owner', 'email')
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/groups/approved - Public list of approved groups for advertisers
router.get('/approved', authenticate, async (req, res) => {
  try {
    const groups = await Group.find({ status: 'approved' })
      .populate('owner', 'email')
      .sort({ memberCount: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/groups/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('owner', 'email');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!req.user.roles?.isSuperAdmin && !req.user.roles?.isAdmin && group.owner._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/groups/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!req.user.roles?.isSuperAdmin && !req.user.roles?.isAdmin && group.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const updates = req.body;
    if (!req.user.roles?.isSuperAdmin) {
      delete updates.status;
      delete updates.owner;
      delete updates.memberCount;
      delete updates.dynamicCpm;
      delete updates.avgViews;
      delete updates.performanceScore;
    }
    Object.assign(group, updates);
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/groups/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!req.user.roles?.isSuperAdmin && !req.user.roles?.isAdmin && group.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    await group.deleteOne();
    res.json({ message: 'Group deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/groups/bot-referral - Handle referral from bot
router.post('/bot-referral', async (req, res) => {
  try {
    const { telegramId, referralCode } = req.body;
    const secret = req.headers['x-admin-secret'];
    if (secret !== process.env.ADMIN_SECRET) return res.status(401).json({ message: 'Unauthorized' });

    if (!telegramId || !referralCode) return res.status(400).json({ message: 'Missing data' });

    // Find the referrer
    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    if (!referrer) return res.status(404).json({ message: 'Referrer not found' });

    // Find or create the user (placeholder)
    let user = await User.findOne({ telegramId });
    if (user) {
       // If user already exists and was never referred, we can link them now if they are "new"
       // but typically referrals are for new users. 
       // For simplicity, we only link if they don't have a referrer yet.
       if (!user.referredBy && user.createdAt > (new Date() - 3600000)) { // 1 hour old
          user.referredBy = referrer._id;
          await user.save();
       }
    } else {
       // We can't create a full user here easily without email/pass
       // But we can store this mapping somewhere or wait for them to /link
       // For now, we'll assume the user will /link later.
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
