const mongoose = require('mongoose');

const WalletTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Transaction details
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'campaign_spend', 'earning', 'refund', 'adjustment'],
    required: true
  },
  
  amount: { type: Number, required: true },
  
  // Wallet type
  walletType: {
    type: String,
    enum: ['advertiser', 'publisher'],
    required: true
  },
  
  // Related entities
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  adPost: { type: mongoose.Schema.Types.ObjectId, ref: 'AdPost' },
  
  // Payment details
  paymentId: { type: String }, // Razorpay payment ID
  withdrawalId: { type: String },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Description
  description: { type: String, required: true },
  
  // Metadata
  metadata: {
    cpm: Number,
    impressions: Number,
    views: Number,
    clicks: Number,
    publisherShare: Number,
    platformFee: Number
  },
  
  // Admin who processed this (if applicable)
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Timestamps
  processedAt: { type: Date },
  completedAt: { type: Date }
}, { timestamps: true });

// Index for faster queries
WalletTransactionSchema.index({ user: 1, createdAt: -1 });
WalletTransactionSchema.index({ type: 1, status: 1 });
WalletTransactionSchema.index({ walletType: 1, status: 1 });

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);
