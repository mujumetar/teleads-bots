const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  telegramGroupId: { type: String, required: true, unique: true },
  telegramGroupUsername: { type: String },
  telegramOwnerId: { type: String }, // Telegram ID of the admin who ran /register
  memberCount: { type: Number, default: 0 },

  // ── Content ──
  category: { type: String, default: 'general' },
  niche: { type: String, default: 'general' },
  language: { type: String, default: 'en' },
  description: { type: String },

  // ── Performance & Scoring ──
  avgViews: { type: Number, default: 0 },        // avg views per post
  performanceScore: { type: Number, default: 0 }, // (avgViews/memberCount)*100
  dynamicCpm: { type: Number, default: 100 },     // calculated CPM for this group
  postFrequency: { type: Number, default: 4 },    // hours between ads

  // ── Earnings ──
  revenueEarned: { type: Number, default: 0 },
  totalAdsPosted: { type: Number, default: 0 },
  lastAdPostedAt: { type: Date },

  // ── Anti-Fraud ──
  isVerified: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String },
  viewToMemberRatio: { type: Number, default: 0 }, // fraud detection metric

  // ── Status ──
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  rejectionReason: { type: String },
}, { timestamps: true });

// Auto-calculate performance score and dynamic CPM before save
GroupSchema.pre('save', function() {
  if (this.memberCount > 0 && this.avgViews > 0) {
    this.performanceScore = Math.round((this.avgViews / this.memberCount) * 100);
    this.viewToMemberRatio = this.avgViews / this.memberCount;

    // Dynamic CPM: score > 20% → ₹150, score > 10% → ₹120, else → ₹80
    if (this.performanceScore > 20) {
      this.dynamicCpm = 150;
    } else if (this.performanceScore > 10) {
      this.dynamicCpm = 120;
    } else {
      this.dynamicCpm = 80;
    }
  }
});

module.exports = mongoose.model('Group', GroupSchema);
