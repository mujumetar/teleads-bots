const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/transactions - Get all transactions (Superadmin only)
router.get('/', authenticate, async (req, res) => {
  try {
    // Restrict to superadmin as per user request
    if (!req.user.roles?.isSuperAdmin) {
      return res.status(403).json({ message: 'Superadmin access required' });
    }

    const transactions = await Transaction.find()
      .populate('user', 'email firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/transactions/withdraw - Process or Request withdrawal (Superadmin only)
router.post('/withdraw', authenticate, async (req, res) => {
  try {
    // Restrict to superadmin as per user request
    if (!req.user.roles?.isSuperAdmin) {
      return res.status(403).json({ message: 'Superadmin access required' });
    }

    const { userId, amount, method, reference, note } = req.body;

    const user = await User.findById(userId || req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check balance
    if (user.publisherWallet < amount) {
      return res.status(400).json({ message: 'Insufficient publisher wallet balance' });
    }

    // Deduct balance
    user.publisherWallet -= amount;
    await user.save();

    // Create transaction record
    const transaction = await Transaction.create({
      user: user._id,
      amount,
      type: 'withdrawal',
      status: 'completed', // Admin processing it means it's completed
      method: method || 'manual',
      reference,
      note
    });

    res.status(201).json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/transactions/deposit - Manual deposit (Superadmin only)
router.post('/deposit', authenticate, async (req, res) => {
  try {
    if (!req.user.roles?.isSuperAdmin) {
      return res.status(403).json({ message: 'Superadmin access required' });
    }

    const { userId, amount, walletType, reference, note } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (walletType === 'advertiser') user.advertiserWallet += amount;
    else user.publisherWallet += amount;

    await user.save();

    const transaction = await Transaction.create({
      user: user._id,
      amount,
      type: 'deposit',
      status: 'completed',
      method: 'manual',
      reference,
      note
    });

    res.json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
