const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Store name is required'], trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gstNumber: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  isActive: { type: Boolean, default: true },
  subscriptionStatus: { type: String, enum: ['trial', 'active', 'past_due', 'cancelled'], default: 'trial' },
  trialEndsAt: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }, // 14 days from now
  emailConfig: {
    email: { type: String, default: '' },
    appPassword: { type: String, default: '' }
  },
  upiId: { type: String, trim: true, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);
