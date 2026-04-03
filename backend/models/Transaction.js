const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'payout', 'spend', 'settlement', 'earning', 'adjustment'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'rejected'], default: 'pending' },
  method: { type: String, default: 'manual' }, // e.g., 'stripe', 'crypto', 'manual'
  reference: { type: String }, // e.g., transaction hash or receipt number
  note: { type: String },
  adminNote: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
