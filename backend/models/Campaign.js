const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  advertiser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  adText: { type: String, required: true },
  adImageUrl: { type: String },
  targetUrl: { type: String },   // The URL to track clicks
  niche: { type: String, default: 'general' },
  targetCategories: [{ type: String }], // crypto, trading, memes, news, etc.

  // ── Budget & CPM ──
  budgetType: { type: String, enum: ['fixed_cpm', 'total_budget'], default: 'total_budget' },
  budget: { type: Number, required: true },  // total INR budget
  budgetSpent: { type: Number, default: 0 },
  cpm: { type: Number, default: 100 },       // cost per 1000 impressions (INR)

  // ── Performance ──
  totalViews: { type: Number, default: 0 },       // total Telegram message views
  totalImpressions: { type: Number, default: 0 }, // calculated impressions from views
  totalClicks: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },              // click-through rate %

  // ── Custom Buttons ──
  buttonText: { type: String },
  buttonUrl: { type: String },

  // ── Status ──
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'paused', 'rejected', 'completed'],
    default: 'pending'
  },
  rejectionReason: { type: String },
  autoPlacement: { type: Boolean, default: true }, // let AI choose groups
  selectedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  targetGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }], // For compatibility

  // ── Scheduling ──
  startDate: { type: Date },
  endDate: { type: Date },

  // ── Filler Ads Logic ──
  isFiller: { type: Boolean, default: false }, // If true, this ad is used when no paid campaigns are available
  fillerCpm: { type: Number, default: 24 },    // Specific CPM to pay publishers for filler ads
}, { timestamps: true });

module.exports = mongoose.model('Campaign', CampaignSchema);
