const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shift: { type: String, enum: ['Morning', 'Evening', 'Night'], default: 'Morning' },
  salesTotal: { type: Number, default: 0 },
  transactionCount: { type: Number, default: 0 },
  rating: { type: Number, min: 0, max: 5, default: 4 },
  status: { type: String, enum: ['active', 'off'], default: 'active' },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  branch: { type: String, default: 'Main Branch' },
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
