const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

// @desc    Get all inventory (products with stock)
// @route   GET /api/inventory
const getInventory = asyncHandler(async (req, res) => {
  const { branch, category, status, search } = req.query;
  const filter = { store: req.storeId };

  if (branch) filter.branch = branch;
  if (category) filter.category = category;
  if (search) filter.name = { $regex: search, $options: 'i' };

  let products = await Product.find(filter).sort({ name: 1 });

  // Apply status filter after fetching (uses virtual)
  if (status && status !== 'all') {
    products = products.filter(p => p.stockStatus === status);
  }

  // Inventory KPIs
  const totalValue = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
  const criticalCount = products.filter(p => p.stockStatus === 'critical').length;
  const lowCount = products.filter(p => p.stockStatus === 'low').length;
  const outCount = products.filter(p => p.stockStatus === 'out').length;

  res.json({
    success: true,
    count: products.length,
    kpis: {
      totalSkus: products.length,
      criticalStock: criticalCount,
      lowStock: lowCount,
      outOfStock: outCount,
      inventoryValue: totalValue,
    },
    data: products,
  });
});

// @desc    Get low/critical stock alerts
// @route   GET /api/inventory/alerts
const getStockAlerts = asyncHandler(async (req, res) => {
  const { branch } = req.query;
  const filter = { store: req.storeId };
  if (branch) filter.branch = branch;

  const products = await Product.find(filter);
  const alerts = products.filter(p => ['critical', 'low', 'out'].includes(p.stockStatus));

  res.json({ success: true, count: alerts.length, data: alerts });
});

// @desc    Update stock level
// @route   PUT /api/inventory/:id
const updateInventory = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const { stock, price, costPrice, reorderLevel, name, category } = req.body;

  if (stock !== undefined) product.stock = stock;
  if (price !== undefined) product.price = price;
  if (costPrice !== undefined) product.costPrice = costPrice;
  if (reorderLevel !== undefined) product.reorderLevel = reorderLevel;
  if (name) product.name = name;
  if (category) product.category = category;

  const updated = await product.save();

  // Emit socket event if stock is low
  if (req.io && updated.stockStatus !== 'ok') {
    req.io.emit('stock_alert', { product: updated.name, stock: updated.stock, status: updated.stockStatus });
  }

  res.json({ success: true, data: updated });
});

// @desc    Add new product
// @route   POST /api/inventory
const addProduct = asyncHandler(async (req, res) => {
  const productData = { ...req.body, store: req.storeId };
  const product = await Product.create(productData);
  res.status(201).json({ success: true, data: product });
});

// @desc    Delete product
// @route   DELETE /api/inventory/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  await product.deleteOne();
  res.json({ success: true, message: 'Product removed' });
});

module.exports = { getInventory, getStockAlerts, updateInventory, addProduct, deleteProduct };
