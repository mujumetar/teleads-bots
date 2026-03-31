const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  advertiser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  adText: { type: String, required: true },
  adImageUrl: { type: String }, // optional image
  niche: { type: String, default: 'other' },
  targetAudience: [{ type: String }],
  targetGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }], 
  budget: { type: Number, required: true }, // total budget in base currency (INR or USD)
  currency: { type: String, default: 'INR' },
  budgetSpent: { type: Number, default: 0 },
  costPerPost: { type: Number, default: 10 }, // cost per ad post (e.g. 10 INR)
  status: { type: String, enum: ['pending', 'active', 'paused', 'completed', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  totalImpressions: { type: Number, default: 0 }, // telegram 'views'
  totalClicks: { type: Number, default: 0 }, // unique link clicks
  trackingUrl: { type: String }, // external redirect URL managed by the platform
}, { timestamps: true });

module.exports = mongoose.model('Campaign', CampaignSchema);
