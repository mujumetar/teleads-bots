const mongoose = require('mongoose');

// ImpressionsLog stores each view snapshot taken from Telegram for an AdPost
const ImpressionsLogSchema = new mongoose.Schema({
  adPost: { type: mongoose.Schema.Types.ObjectId, ref: 'AdPost', required: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  
  views: { type: Number, default: 0 },          // raw Telegram view count at this moment
  snapshotType: { 
    type: String, 
    enum: ['initial', '1h', '6h', '24h', 'manual'], 
    default: 'manual' 
  },
  fetchedAt: { type: Date, default: Date.now },

  // CPM billing info at this snapshot
  impressions: { type: Number, default: 0 },
  costAtSnapshot: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ImpressionsLog', ImpressionsLogSchema);
