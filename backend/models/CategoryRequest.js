const mongoose = require('mongoose');

const CategoryRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminComment: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('CategoryRequest', CategoryRequestSchema);
