const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const SystemConfig = require('../models/SystemConfig');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder',
});

// POST /api/payments/create-order - Initialize a deposit
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { amount } = req.body; // Amount in INR
    
    // Fetch min deposit from system config
    let config = await SystemConfig.findOne();
    const minDeposit = config?.minCampaignBudget || 100;
    
    if (amount < minDeposit) {
      return res.status(400).json({ message: `Minimum deposit is ₹${minDeposit}` });
    }

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user._id,
        email: req.user.email,
      },
    };

    const order = await razorpay.orders.create(options);
    
    // Create pending transaction
    await WalletTransaction.create({
      user: req.user._id,
      type: 'deposit',
      amount,
      walletType: 'advertiser',
      status: 'pending',
      paymentId: order.id,
      description: `Pending deposit of ₹${amount}`,
      metadata: {
        razorpay_order_id: order.id,
      },
    });

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/verify - Verify payment signature
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Payment verified
      const tx = await WalletTransaction.findOne({ paymentId: razorpay_order_id });
      if (!tx) return res.status(404).json({ message: 'Transaction not found' });
      if (tx.status === 'completed') return res.status(400).json({ message: 'Already processed' });

      tx.status = 'completed';
      tx.paymentId = razorpay_payment_id;
      tx.processedAt = new Date();
      tx.completedAt = new Date();
      await tx.save();

      // Update user advertiser wallet
      const user = await User.findById(req.user._id);
      user.advertiserWallet += tx.amount;
      await user.save();

      // --- REFERRAL REWARD ---
      if (user.referredBy) {
        const config = await SystemConfig.findOne();
        if (config?.enableReferrals) {
          const rewardPct = config.referralRewardAdvertiserPct || 0.10;
          const rewardAmount = tx.amount * rewardPct;
          
          if (rewardAmount > 0) {
            const referrer = await User.findById(user.referredBy);
            if (referrer) {
              referrer.publisherWallet += rewardAmount;
              referrer.referralEarnings += rewardAmount;
              await referrer.save();

              // Record reward transaction
              await WalletTransaction.create({
                user: referrer._id,
                type: 'earning',
                amount: rewardAmount,
                walletType: 'publisher',
                status: 'completed',
                description: `Referral reward from ${user.email}'s deposit`,
                metadata: { referredUser: user._id, originalAmount: tx.amount }
              });
            }
          }
        }
      }
      // -----------------------

      res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        balance: (await User.findById(req.user._id)).advertiserWallet
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/transactions - User's own transactions
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/withdraw - Request a payout
router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const { amount, method, details } = req.body;
    
    // Get min withdrawal from system config
    let config = await SystemConfig.findOne();
    const minWithdrawal = config?.minWithdrawalAmount || 1000;
    
    if (amount < minWithdrawal) return res.status(400).json({ message: `Minimum withdrawal is ₹${minWithdrawal}` });
    
    const user = await User.findById(req.user._id);
    if (user.publisherWallet < amount) return res.status(400).json({ message: 'Insufficient publisher wallet balance' });
    
    // Create withdrawal transaction (don't deduct balance until approved)
    const tx = await WalletTransaction.create({
      user: req.user._id,
      amount,
      type: 'withdrawal',
      walletType: 'publisher',
      status: 'pending',
      description: `Withdrawal request via ${method}: ${details}`,
      metadata: { method, details }
    });
    
    res.status(201).json(tx);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
