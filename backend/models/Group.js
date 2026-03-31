const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  telegramGroupId: { type: String, required: true, unique: true }, // the actual Telegram chat ID
  telegramGroupUsername: { type: String }, // e.g. @mychannel
  niche: { type: String, default: 'other' },
  tags: [{ type: String }], // e.g. ['India', 'Crypto']
  memberCount: { type: Number, default: 0 },
  language: { type: String, default: 'en' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' },
  rejectionReason: { type: String },
  revenueEarned: { type: Number, default: 0 },
  botAdded: { type: Boolean, default: false }, // whether the bot has been added to this group
  postFrequency: { type: Number, default: 4 }, // hours between ad posts
  lastAdPostedAt: { type: Date },
  totalImpressionsByGroup: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Group', GroupSchema);
