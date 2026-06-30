const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true },
  sku: { type: String, required: [true, 'SKU is required'], unique: true, uppercase: true, trim: true },
  category: {
    type: String,
    enum: [
      'Fruits & Vegetables',
      'Dairy & Eggs',
      'Beverages',
      'Snacks & Sweets',
      'Grains & Pulses',
      'Spices & Condiments',
      'Personal Care',
      'Bakery',
      'Frozen Foods',
      'Household',
    ],
    required: [true, 'Category is required'],
  },
  price: { type: Number, required: [true, 'Price is required'], min: 0 },
  costPrice: { type: Number, required: [true, 'Cost price is required'], min: 0 },
  stock: { type: Number, required: [true, 'Stock is required'], min: 0, default: 0 },
  unit: { type: String, enum: ['kg', 'g', 'litre', 'ml', 'piece', 'pack', 'dozen', 'box'], default: 'piece' },
  reorderLevel: { type: Number, default: 10 },
  supplier: { type: String, default: '', trim: true },
  expiryDate: { type: Date, default: null },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  branch: { type: String, default: 'Main Branch' },
  imageUrl: { type: String, default: '' },
}, { timestamps: true });

// Virtual: stock status
productSchema.virtual('stockStatus').get(function () {
  if (this.stock === 0) return 'out';
  if (this.stock <= this.reorderLevel / 2) return 'critical';
  if (this.stock <= this.reorderLevel) return 'low';
  return 'ok';
});

// Virtual: margin %
productSchema.virtual('margin').get(function () {
  if (this.price === 0) return 0;
  return (((this.price - this.costPrice) / this.price) * 100).toFixed(1);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
