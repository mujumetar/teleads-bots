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
    
    const { name, telegramGroupId, telegramGroupUsername, memberCount } = req.body;
    // We assume the bot already checked if it exists, but we verify here too
    const existing = await Group.findOne({ telegramGroupId });
    if (existing) return res.status(409).json({ message: 'Already registered' });

    // Since we don't know the user yet, the registrar must later claim the group
    // In a premium flow, the bot might ask for the user's email or account ID
    const group = await Group.create({
      owner: '000000000000000000000000', // placeholder for pending ownership
      name,
      telegramGroupId,
      telegramGroupUsername,
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
    
    res.json({
      status: group.status,
      revenue: group.revenueEarned || 0,
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
    if (req.user.role === 'user') {
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
    if (req.user.role === 'user' && group.owner._id.toString() !== req.user.id) {
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
    if (req.user.role === 'user' && group.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const updates = req.body;
    if (req.user.role === 'user') {
      delete updates.status;
      delete updates.owner;
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
    if (req.user.role === 'user' && group.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    await group.deleteOne();
    res.json({ message: 'Group deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
