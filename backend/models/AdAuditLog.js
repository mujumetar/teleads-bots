const mongoose = require('mongoose');

const AdAuditLogSchema = new mongoose.Schema({
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  status: { type: String, enum: ['success', 'failed', 'skipped'], required: true },
  reason: { type: String }, // e.g. "Frequency Cooldown", "Min Members", "Low Budget", "Chat Not Found"
  details: { type: mongoose.Schema.Types.Mixed }, // Any extra info like (diff/wait)
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('AdAuditLog', AdAuditLogSchema);
