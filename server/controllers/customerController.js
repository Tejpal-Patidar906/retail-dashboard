const asyncHandler = require('express-async-handler');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');

// @desc    Get all customers
// @route   GET /api/customers
const getCustomers = asyncHandler(async (req, res) => {
  const { branch, segment, search } = req.query;
  const filter = { store: req.storeId };

  if (branch) filter.branch = branch;
  if (segment) filter.segment = segment;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const customers = await Customer.find(filter).sort({ totalSpent: -1 });

  // KPIs
  const totalCustomers = await Customer.countDocuments({ store: req.storeId, ...(branch ? { branch } : {}) });
  const repeatCount = await Customer.countDocuments({ store: req.storeId, visits: { $gt: 1 }, ...(branch ? { branch } : {}) });
  const avgLTV = customers.length > 0
    ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length
    : 0;

  res.json({
    success: true,
    count: customers.length,
    kpis: {
      totalCustomers,
      repeatRate: totalCustomers > 0 ? ((repeatCount / totalCustomers) * 100).toFixed(1) : 0,
      avgLTV: avgLTV.toFixed(2),
      churnRate: '12.4', // Simulated
    },
    data: customers,
  });
});

// @desc    Get customer segments breakdown
// @route   GET /api/customers/segments
const getSegments = asyncHandler(async (req, res) => {
  const { branch } = req.query;
  const filter = { store: req.storeId, ...(branch ? { branch } : {}) };

  const data = await Customer.aggregate([
    { $match: filter },
    { $group: { _id: '$segment', count: { $sum: 1 }, totalSpent: { $sum: '$totalSpent' } } },
    { $sort: { count: -1 } },
  ]);

  res.json({ success: true, data });
});

// @desc    Get hourly foot traffic
// @route   GET /api/customers/traffic
const getFootTraffic = asyncHandler(async (req, res) => {
  const { branch } = req.query;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const filter = { createdAt: { $gte: since }, store: req.storeId };
  if (branch) filter.branch = branch;

  const data = await Sale.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        visits: { $sum: 1 },
        revenue: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        hour: '$_id',
        label: {
          $concat: [
            { $toString: '$_id' },
            ':00',
          ],
        },
        visits: 1,
        revenue: 1,
        _id: 0,
      },
    },
  ]);

  res.json({ success: true, data });
});

// @desc    Add new customer
// @route   POST /api/customers
const addCustomer = asyncHandler(async (req, res) => {
  const customerData = { ...req.body, store: req.storeId };
  const customer = await Customer.create(customerData);
  res.status(201).json({ success: true, data: customer });
});

// @desc    Update customer
// @route   PUT /api/customers/:id
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, store: req.storeId },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  res.json({ success: true, data: customer });
});

module.exports = { getCustomers, getSegments, getFootTraffic, addCustomer, updateCustomer };
