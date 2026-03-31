const mongoose = require('mongoose');

const BotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'inactive', 'error'], default: 'active' },
  lastActive: { type: Date, default: Date.now },
  totalAdsSent: { type: Number, default: 0 },
  groupsManaged: { type: Number, default: 0 },
  errorLogs: [{ type: String }],
  isPrimary: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Bot', BotSchema);
