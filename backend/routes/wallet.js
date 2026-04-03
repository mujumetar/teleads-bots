const express = require('express');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

// GET /api/wallet/balance - get wallet balances
router.get('/balance', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      advertiserWallet: user.advertiserWallet,
      publisherWallet: user.publisherWallet,
      totalSpent: user.totalSpent,
      totalEarned: user.totalEarned
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ message: 'Failed to get wallet balance', error: error.message });
  }
});

// GET /api/wallet/transactions - get wallet transactions
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, walletType } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (walletType) filter.walletType = walletType;

    const transactions = await WalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('campaign', 'name')
      .populate('group', 'name')
      .populate('adPost', 'adText');

    const total = await WalletTransaction.countDocuments(filter);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to get transactions', error: error.message });
  }
});

// POST /api/wallet/withdraw - request withdrawal
router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const { amount, bankDetails } = req.body;
    const user = await User.findById(req.user._id);

    // Check if user has sufficient publisher wallet balance
    if (user.publisherWallet < amount) {
      return res.status(400).json({ message: 'Insufficient balance in publisher wallet' });
    }

    // Create withdrawal transaction
    const transaction = new WalletTransaction({
      user: req.user._id,
      type: 'withdrawal',
      amount,
      walletType: 'publisher',
      status: 'pending',
      description: `Withdrawal request of ₹${amount}`,
      metadata: { bankDetails }
    });

    await transaction.save();

    // Optionally reduce wallet balance immediately or wait for approval
    // For now, we'll wait for admin approval

    res.json({
      message: 'Withdrawal request submitted successfully',
      transaction
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Failed to process withdrawal', error: error.message });
  }
});

// GET /api/wallet/admin/transactions - get all transactions (admin only)
router.get('/admin/transactions', authenticate, requirePermission('VIEW_ALL_DATA'), async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, walletType } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (walletType) filter.walletType = walletType;

    const transactions = await WalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'email firstName lastName')
      .populate('campaign', 'name')
      .populate('group', 'name')
      .populate('adPost', 'adText')
      .populate('processedBy', 'email firstName lastName');

    const total = await WalletTransaction.countDocuments(filter);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get admin transactions error:', error);
    res.status(500).json({ message: 'Failed to get transactions', error: error.message });
  }
});

// PUT /api/wallet/admin/transactions/:id/approve - approve transaction (admin only)
router.put('/admin/transactions/:id/approve', authenticate, requirePermission('CONTROL_PAYMENTS'), async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await WalletTransaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction is not pending' });
    }

    // Update transaction status
    transaction.status = 'completed';
    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();
    transaction.completedAt = new Date();

    await transaction.save();

    // If it's a withdrawal, deduct from user's publisher wallet
    if (transaction.type === 'withdrawal') {
      const user = await User.findById(transaction.user);
      user.publisherWallet -= transaction.amount;
      await user.save();
    }

    res.json({
      message: 'Transaction approved successfully',
      transaction
    });
  } catch (error) {
    console.error('Approve transaction error:', error);
    res.status(500).json({ message: 'Failed to approve transaction', error: error.message });
  }
});

// PUT /api/wallet/admin/transactions/:id/reject - reject transaction (admin only)
router.put('/admin/transactions/:id/reject', authenticate, requirePermission('CONTROL_PAYMENTS'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const transaction = await WalletTransaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction is not pending' });
    }

    // Update transaction status
    transaction.status = 'failed';
    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();
    transaction.description += ` (Rejected: ${reason})`;

    await transaction.save();

    res.json({
      message: 'Transaction rejected successfully',
      transaction
    });
  } catch (error) {
    console.error('Reject transaction error:', error);
    res.status(500).json({ message: 'Failed to reject transaction', error: error.message });
  }
});

// GET /api/wallet/admin/summary - get wallet summary (admin only)
router.get('/admin/summary', authenticate, requirePermission('VIEW_REVENUE'), async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Get total balances
    const totalAdvertiserBalance = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$advertiserWallet' } } }
    ]);

    const totalPublisherBalance = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$publisherWallet' } } }
    ]);

    // Get transaction statistics
    const totalDeposits = await WalletTransaction.aggregate([
      { $match: { type: 'deposit', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalWithdrawals = await WalletTransaction.aggregate([
      { $match: { type: 'withdrawal', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingWithdrawals = await WalletTransaction.aggregate([
      { $match: { type: 'withdrawal', status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    res.json({
      balances: {
        totalAdvertiserBalance: totalAdvertiserBalance[0]?.total || 0,
        totalPublisherBalance: totalPublisherBalance[0]?.total || 0
      },
      transactions: {
        totalDeposits: totalDeposits[0]?.total || 0,
        totalWithdrawals: totalWithdrawals[0]?.total || 0,
        pendingWithdrawals: pendingWithdrawals[0]?.total || 0,
        pendingWithdrawalCount: pendingWithdrawals[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('Get wallet summary error:', error);
    res.status(500).json({ message: 'Failed to get wallet summary', error: error.message });
  }
});

module.exports = router;
