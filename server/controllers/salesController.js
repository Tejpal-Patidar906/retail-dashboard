const asyncHandler = require('express-async-handler');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Store = require('../models/Store');
const Staff = require('../models/Staff');
const { sendBillEmail } = require('../utils/emailService');

// @desc    Get all sales with optional filters
// @route   GET /api/sales
const getSales = asyncHandler(async (req, res) => {
  const { branch, startDate, endDate, limit = 50 } = req.query;
  const filter = { store: req.storeId };

  if (branch) filter.branch = branch;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const sales = await Sale.find(filter)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('customer', 'name email')
    .populate('staff', 'name email')
    .populate('products.product', 'name sku category');

  res.json({ success: true, count: sales.length, data: sales });
});

// @desc    Get sales KPI summary
// @route   GET /api/sales/summary
const getSalesSummary = asyncHandler(async (req, res) => {
  const { branch, period = '30' } = req.query;
  const daysBack = parseInt(period);
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  const filter = { createdAt: { $gte: since }, store: req.storeId };
  if (branch) filter.branch = branch;

  const [result] = await Sale.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        totalProfit: { $sum: '$profit' },
        transactionCount: { $sum: 1 },
        returns: { $sum: { $cond: ['$returnFlag', 1, 0] } },
      },
    },
  ]);

  const summary = result || { totalRevenue: 0, totalProfit: 0, transactionCount: 0, returns: 0 };
  summary.aov = summary.transactionCount > 0 ? (summary.totalRevenue / summary.transactionCount) : 0;
  summary.returnRate = summary.transactionCount > 0
    ? ((summary.returns / summary.transactionCount) * 100).toFixed(1)
    : 0;

  res.json({ success: true, data: summary });
});

// @desc    Get daily sales breakdown (last 14 days)
// @route   GET /api/sales/daily
const getDailySales = asyncHandler(async (req, res) => {
  const { branch, days = 14 } = req.query;
  const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

  const filter = { createdAt: { $gte: since }, store: req.storeId };
  if (branch) filter.branch = branch;

  const data = await Sale.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        profit: { $sum: '$profit' },
        transactions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data });
});

// @desc    Get monthly sales for bar chart
// @route   GET /api/sales/monthly
const getMonthlySales = asyncHandler(async (req, res) => {
  const { branch } = req.query;
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  const filter = { createdAt: { $gte: since }, store: req.storeId };
  if (branch) filter.branch = branch;

  const data = await Sale.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        profit: { $sum: '$profit' },
        transactions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data });
});

// @desc    Create a new sale
// @route   POST /api/sales
const createSale = asyncHandler(async (req, res) => {
  const { products, customer, paymentMethod, branch, returnFlag } = req.body;

  let total = 0;
  let profit = 0;
  const saleProducts = [];

  for (const item of products) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error(`Product ${item.product} not found`);
    }
    const lineTotal = item.qty * product.price;
    const lineProfit = item.qty * (product.price - product.costPrice);
    total += lineTotal;
    profit += lineProfit;
    saleProducts.push({
      product: product._id,
      qty: item.qty,
      price: product.price,
      costPrice: product.costPrice,
    });

    // Deduct stock
    product.stock = Math.max(0, product.stock - item.qty);
    await product.save();
  }

  // Update staff performance stats
  await Staff.findOneAndUpdate(
    { user: req.user._id, store: req.storeId },
    { $inc: { salesTotal: total, transactionCount: 1 } }
  );

  const sale = await Sale.create({
    products: saleProducts,
    total,
    profit,
    customer,
    staff: req.user._id,
    store: req.storeId,
    branch: branch || req.user.branch,
    paymentMethod,
    returnFlag: returnFlag || false,
  });

  // Emit socket event
  if (req.io) {
    req.io.emit('new_sale', { sale, revenue: total, profit });
    // Check for low stock items
    for (const item of saleProducts) {
      const product = await Product.findById(item.product);
      if (product && product.stock <= product.reorderLevel) {
        req.io.emit('stock_alert', { product: product.name, stock: product.stock });
      }
    }
  }

  // Populate sale and store to send email
  let emailStatus = { sent: false, previewUrl: null };
  try {
    const populatedSale = await Sale.findById(sale._id).populate('customer', 'name email').populate('products.product', 'name');
    const store = await Store.findById(req.storeId);
    
    if (populatedSale.customer && populatedSale.customer.email) {
      const result = await sendBillEmail(populatedSale, store);
      if (result && result.success) {
        emailStatus.sent = true;
        emailStatus.previewUrl = result.previewUrl;
      }
    }
  } catch (err) {
    console.error('Email sending failed', err);
  }

  res.status(201).json({ success: true, data: sale, emailStatus });
});

// @desc    Delete a sale (restores stock)
// @route   DELETE /api/sales/:id
const deleteSale = asyncHandler(async (req, res) => {
  const sale = await Sale.findOne({ _id: req.params.id, store: req.storeId });
  
  if (!sale) {
    res.status(404);
    throw new Error('Sale not found');
  }

  // Restore stock
  for (const item of sale.products) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.qty }
    });
  }

  await Sale.deleteOne({ _id: req.params.id });

  if (req.io) {
    req.io.emit('sale_deleted', { id: req.params.id });
  }

  res.json({ success: true, message: 'Sale deleted and stock restored' });
});

// @desc    Get top-selling products
// @route   GET /api/sales/top-products
const getTopProducts = asyncHandler(async (req, res) => {
  const { branch, limit = 10 } = req.query;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const filter = { createdAt: { $gte: since }, store: req.storeId };
  if (branch) filter.branch = branch;

  const data = await Sale.aggregate([
    { $match: filter },
    { $unwind: '$products' },
    {
      $group: {
        _id: '$products.product',
        totalQty: { $sum: '$products.qty' },
        totalRevenue: { $sum: { $multiply: ['$products.qty', '$products.price'] } },
        totalProfit: {
          $sum: {
            $multiply: ['$products.qty', { $subtract: ['$products.price', '$products.costPrice'] }],
          },
        },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productInfo',
      },
    },
    { $unwind: '$productInfo' },
    {
      $project: {
        name: '$productInfo.name',
        sku: '$productInfo.sku',
        category: '$productInfo.category',
        totalQty: 1,
        totalRevenue: 1,
        totalProfit: 1,
      },
    },
  ]);

  res.json({ success: true, data });
});

// @desc    Get current user's sales performance
// @route   GET /api/sales/me
const getMySales = asyncHandler(async (req, res) => {
  const staffRecord = await Staff.findOne({ user: req.user._id, store: req.storeId });
  
  // Get today's sales for this user
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const [todayStats] = await Sale.aggregate([
    { $match: { staff: req.user._id, store: req.storeId, createdAt: { $gte: startOfDay } } },
    { $group: { _id: null, todayTotal: { $sum: '$total' }, todayCount: { $sum: 1 } } }
  ]);

  res.json({ 
    success: true, 
    data: {
      totalSales: staffRecord?.salesTotal || 0,
      totalCount: staffRecord?.transactionCount || 0,
      todayTotal: todayStats?.todayTotal || 0,
      todayCount: todayStats?.todayCount || 0,
    }
  });
});

module.exports = { getSales, getSalesSummary, getDailySales, getMonthlySales, createSale, getTopProducts, deleteSale, getMySales };
