const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder',
});

const GlobalSetting = require('../models/GlobalSetting');

// POST /api/payments/create-order - Initialize a deposit
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { amount } = req.body; // Amount in INR
    
    // Fetch dynamic min deposit from settings
    const minDepositSetting = await GlobalSetting.findOne({ key: 'min_deposit' });
    const minDeposit = minDepositSetting ? Number(minDepositSetting.value) : 100;
    
    if (amount < minDeposit) {
      return res.status(400).json({ message: `Minimum deposit is ₹${minDeposit}` });
    }

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    // Create pending transaction
    await Transaction.create({
      user: req.user.id,
      amount: amount,
      type: 'deposit',
      status: 'pending',
      reference: order.id,
      note: 'Razorpay order created',
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/verify - Verify the payment signature
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
      const tx = await Transaction.findOne({ reference: razorpay_order_id });
      if (!tx) return res.status(404).json({ message: 'Transaction not found' });
      if (tx.status === 'completed') return res.status(400).json({ message: 'Already processed' });

      tx.status = 'completed';
      tx.reference = razorpay_payment_id;
      await tx.save();

      // Update user wallet
      await User.findByIdAndUpdate(req.user.id, { $inc: { walletBalance: tx.amount } });

      res.json({ success: true, message: 'Payment verified successfully' });
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
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/withdraw - Request a payout
router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const { amount, method, details } = req.body;
    if (amount < 500) return res.status(400).json({ message: 'Minimum withdrawal is ₹500' });
    
    const user = await User.findById(req.user.id);
    if (user.walletBalance < amount) return res.status(400).json({ message: 'Insufficient balance' });
    
    // Deduct balance upfront and mark as pending withdrawal
    user.walletBalance -= amount;
    await user.save();
    
    const tx = await Transaction.create({
      user: req.user.id,
      amount,
      type: 'withdrawal',
      status: 'pending',
      note: `Withdrawal via ${method}: ${details}`
    });
    
    res.status(201).json(tx);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
