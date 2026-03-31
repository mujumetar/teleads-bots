const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  walletBalance: { type: Number, default: 0 }, // For advertisers to fund campaigns, and publishers to receive earnings
  telegramId: { type: String }, // Linked telegram account
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
