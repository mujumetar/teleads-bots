const mongoose = require('mongoose');

const AdPostSchema = new mongoose.Schema({
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  telegramMessageId: { type: String }, // the message ID returned by Telegram after posting
  status: { type: String, enum: ['scheduled', 'sent', 'failed', 'deleted'], default: 'scheduled' },
  sentAt: { type: Date },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  costCharged: { type: Number, default: 0 }, // amount charged to advertiser
  publisherEarnings: { type: Number, default: 0 }, // amount paid to publisher (70% of costCharged)
  errorMessage: { type: String }, // if status is 'failed'
}, { timestamps: true });

module.exports = mongoose.model('AdPost', AdPostSchema);
