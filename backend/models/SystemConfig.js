const mongoose = require('mongoose');

const SystemConfigSchema = new mongoose.Schema({
  // Revenue Control
  defaultCPM: { type: Number, default: 100 }, // INR per 1000 impressions
  publisherShare: { type: Number, default: 0.65 }, // 65% to publishers
  platformFee: { type: Number, default: 0.05 }, // 5% platform fee
  minGroupMembers: { type: Number, default: 1000 },
  
  // Referral Program
  referralRewardAdvertiserPct: { type: Number, default: 0.10 }, // 10% of their deposits
  referralRewardPublisherPct: { type: Number, default: 0.05 }, // 5% of their earnings
  enableReferrals: { type: Boolean, default: true },
  // Fraud Detection
  fraudThreshold: { type: Number, default: 0.2 }, // 20% view-to-member ratio threshold
  autoApproval: { type: Boolean, default: false },
  
  // Campaign Settings
  minCampaignBudget: { type: Number, default: 500 }, // INR
  maxCampaignBudget: { type: Number, default: 100000 }, // INR
  
  // Payment Settings
  minWithdrawalAmount: { type: Number, default: 1000 }, // INR
  withdrawalProcessingTime: { type: Number, default: 24 }, // hours
  
  // Ad Engine Settings
  autoPlacement: { type: Boolean, default: true },
  priorityGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  blacklistedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  
  // System Status
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String },
  
  // Analytics
  totalPlatformEarnings: { type: Number, default: 0 },
  totalImpressions: { type: Number, default: 0 },
  totalCampaigns: { type: Number, default: 0 },
  totalGroups: { type: Number, default: 0 },
  totalUsers: { type: Number, default: 0 },
  
  // Dynamic Pricing
  enableDynamicPricing: { type: Boolean, default: true },
  highPerformanceThreshold: { type: Number, default: 20 }, // performance score %
  lowPerformanceThreshold: { type: Number, default: 5 }, // performance score %
  
  // Notification Settings
  emailNotifications: { type: Boolean, default: true },
  telegramNotifications: { type: Boolean, default: true },
  
  // API Settings
  telegramBotToken: { type: String },
  razorpayKeyId: { type: String },
  razorpayKeySecret: { type: String },
  
  // Version
  version: { type: String, default: '1.0.0' },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);
