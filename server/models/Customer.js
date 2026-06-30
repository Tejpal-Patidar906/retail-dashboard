const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  segment: { type: String, enum: ['VIP', 'Regular', 'New'], default: 'New' },
  totalSpent: { type: Number, default: 0 },
  visits: { type: Number, default: 0 },
  lastVisit: { type: Date, default: Date.now },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  branch: { type: String, default: 'Main Branch' },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
