const express = require('express');
const Campaign = require('../models/Campaign');
const Group = require('../models/Group');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/campaigns/audience-estimate - Estimate reach based on niche
router.get('/audience-estimate', authenticate, async (req, res) => {
  try {
    const { niche } = req.query;
    const groups = await Group.find({ niche, status: 'approved' });
    const totalMembers = groups.reduce((acc, curr) => acc + (curr.memberCount || 0), 0);
    res.json({ groups: groups.length, members: totalMembers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/campaigns - Create a new campaign
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, adText, adImageUrl, budget, costPerPost, niche, trackingUrl, isFiller, fillerCpm } = req.body;
    if (!name || !adText || !budget) {
      return res.status(400).json({ message: 'Name, adText, and budget are required' });
    }
    
    const user = await User.findById(req.user.id);
    const isSuperAdminFiller = req.user.role === 'superadmin' && isFiller;

    if (!isSuperAdminFiller && (!user || user.advertiserWallet < budget)) {
      return res.status(400).json({ message: `Insufficient advertiser wallet balance. Required: ₹${budget}, Available: ₹${user?.advertiserWallet || 0}` });
    }

    const campaign = await Campaign.create({
      advertiser: req.user.id,
      name,
      adText,
      adImageUrl,
      niche: niche || 'other',
      budget,
      costPerPost: costPerPost || 10,
      status: isSuperAdminFiller ? 'active' : 'pending',
      trackingUrl,
      isFiller: isFiller || false,
      fillerCpm: fillerCpm || 24
    });
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/campaigns - Get campaigns for current user (or all for admin)
router.get('/', authenticate, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'user') {
      filter.advertiser = req.user.id;
    }
    const campaigns = await Campaign.find(filter)
      .populate('advertiser', 'email')
      .populate('targetGroups', 'name telegramGroupUsername')
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/campaigns/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('advertiser', 'email')
      .populate('targetGroups', 'name telegramGroupUsername memberCount');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    // Only owner or admin can view
    if (req.user.role === 'user' && campaign.advertiser._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', authenticate, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (req.user.role === 'user' && campaign.advertiser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = req.body;
    // Users can't set status to active directly
    if (req.user.role === 'user') {
      delete updates.status;
      delete updates.advertiser;
    }
    if (updates.budget && updates.budget > campaign.budget) {
      const user = await User.findById(req.user.id);
      if (!user || user.advertiserWallet < updates.budget) {
        return res.status(400).json({ message: `Insufficient balance to increase budget to ₹${updates.budget}` });
      }
    }

    Object.assign(campaign, updates);
    await campaign.save();
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/campaigns/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (req.user.role === 'user' && campaign.advertiser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    await campaign.deleteOne();
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
