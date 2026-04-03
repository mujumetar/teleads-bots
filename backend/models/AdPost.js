const mongoose = require('mongoose');

const AdPostSchema = new mongoose.Schema({
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  telegramMessageId: { type: String },

  // ── Status ──
  status: { type: String, enum: ['scheduled', 'sent', 'failed', 'deleted'], default: 'scheduled' },
  sentAt: { type: Date },
  errorMessage: { type: String },

  // ── View Tracking (CPM core) ──
  viewsAtPost: { type: Number, default: 0 },    // views right when posted
  viewsAt1h: { type: Number, default: 0 },       // views 1 hr after posting
  viewsAt6h: { type: Number, default: 0 },       // views 6 hrs after
  viewsAt24h: { type: Number, default: 0 },      // final snapshot (billing basis)
  lastViewsFetch: { type: Date },

  // ── CPM Billing ──
  cpmUsed: { type: Number, default: 0 },         // CPM rate at time of posting
  impressions: { type: Number, default: 0 },     // Current total impressions
  paidImpressions: { type: Number, default: 0 }, // Impressions already billed/paid
  costCharged: { type: Number, default: 0 },     // Total cost charged so far
  publisherEarnings: { type: Number, default: 0 }, // Total earned so far

  // ── Click Tracking ──
  clicks: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 }, // clicks/impressions * 100
}, { timestamps: true });

module.exports = mongoose.model('AdPost', AdPostSchema);
