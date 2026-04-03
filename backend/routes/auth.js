const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, referralCode } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user with default advertiser role
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      referredBy: referrer ? referrer._id : null,
      roles: {
        advertiser: true, // Default role for new users
        publisher: false,
        isAdmin: false,
        isSuperAdmin: false
      }
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        currentMode: user.currentMode,
        advertiserWallet: user.advertiserWallet,
        publisherWallet: user.publisherWallet
      } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Check if user is active
    if (!user.isActive || user.isBanned) {
      return res.status(401).json({ 
        message: 'Account is not active',
        reason: user.isBanned ? user.banReason : 'Account deactivated'
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        currentMode: user.currentMode,
        advertiserWallet: user.advertiserWallet,
        publisherWallet: user.publisherWallet
      } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me - get current user info
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      roles: user.roles,
      currentMode: user.currentMode,
      advertiserWallet: user.advertiserWallet,
      publisherWallet: user.publisherWallet,
      totalSpent: user.totalSpent,
      totalEarned: user.totalEarned,
      telegramId: user.telegramId,
      telegramUsername: user.telegramUsername,
      isActive: user.isActive,
      isBanned: user.isBanned,
      permissions: req.userPermissions
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/profile - update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, phone, currentMode } = req.body;
    const user = await User.findById(req.user._id);

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (currentMode && ['advertiser', 'publisher'].includes(currentMode)) {
      user.currentMode = currentMode;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        roles: user.roles,
        currentMode: user.currentMode
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/enable-publisher - enable publisher role
router.post('/enable-publisher', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.roles.publisher) {
      return res.status(400).json({ message: 'Publisher role already enabled' });
    }

    user.roles.publisher = true;
    await user.save();

    res.json({
      message: 'Publisher role enabled successfully',
      roles: user.roles
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/link-telegram
router.post('/link-telegram', authenticate, async (req, res) => {
  try {
    const { telegramId, telegramUsername } = req.body;
    const user = await User.findById(req.user._id);

    const existingUser = await User.findOne({ 
      telegramId, 
      _id: { $ne: user._id } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Telegram account is already linked to another user' });
    }

    user.telegramId = telegramId;
    user.telegramUsername = telegramUsername;
    await user.save();

    res.json({
      message: 'Telegram account linked successfully',
      telegramId: user.telegramId,
      telegramUsername: user.telegramUsername
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/config - get public configuration
router.get('/config', async (req, res) => {
  res.json({
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  });
});

module.exports = router;
