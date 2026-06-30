const asyncHandler = require('express-async-handler');
const Staff = require('../models/Staff');
const User = require('../models/User');

// @desc    Get all staff with performance data
// @route   GET /api/staff
const getStaff = asyncHandler(async (req, res) => {
  const { branch, status, shift } = req.query;
  const filter = { store: req.storeId };

  if (branch) filter.branch = branch;
  if (status) filter.status = status;
  if (shift) filter.shift = shift;

  const staff = await Staff.find(filter)
    .populate('user', 'name email role isActive')
    .sort({ salesTotal: -1 });

  // KPIs
  const onShift = await Staff.countDocuments({ store: req.storeId, status: 'active', ...(branch ? { branch } : {}) });
  const allStaff = await Staff.find({ store: req.storeId, ...(branch ? { branch } : {}) }).populate('user', 'name');
  const topSeller = [...allStaff].sort((a, b) => b.salesTotal - a.salesTotal)[0];
  const avgRating = allStaff.length > 0
    ? (allStaff.reduce((sum, s) => sum + s.rating, 0) / allStaff.length).toFixed(1)
    : 0;
  const avgTransactions = allStaff.length > 0
    ? Math.round(allStaff.reduce((sum, s) => sum + s.transactionCount, 0) / allStaff.length)
    : 0;

  res.json({
    success: true,
    count: staff.length,
    kpis: {
      onShift,
      topSeller: topSeller ? topSeller.user?.name : 'N/A',
      avgRating,
      avgTransactions,
    },
    data: staff,
  });
});

// @desc    Get staff leaderboard (top performers)
// @route   GET /api/staff/leaderboard
const getLeaderboard = asyncHandler(async (req, res) => {
  const { branch, limit = 10 } = req.query;
  const filter = { store: req.storeId, ...(branch ? { branch } : {}) };

  const staff = await Staff.find(filter)
    .populate('user', 'name email')
    .sort({ salesTotal: -1 })
    .limit(parseInt(limit));

  res.json({ success: true, data: staff });
});

// @desc    Update staff info
// @route   PUT /api/staff/:id
const updateStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findOneAndUpdate(
    { _id: req.params.id, store: req.storeId },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  ).populate('user', 'name email role');

  if (!staff) {
    res.status(404);
    throw new Error('Staff record not found');
  }

  if (req.io) req.io.emit('staff_update', { staff });
  res.json({ success: true, data: staff });
});

// @desc    Add new staff member (creates User + Staff record)
// @route   POST /api/staff
const addStaff = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'staff', shift = 'Morning', branch = 'Main Branch' } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email, and password are required');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('User already exists with this email');
  }

  // Create user account
  const user = await User.create({ name, email, password, role, branch, store: req.storeId });

  // Create staff performance record
  const staffRecord = await Staff.create({
    user: user._id,
    store: req.storeId,
    shift,
    branch,
    salesTotal: 0,
    transactionCount: 0,
    rating: 4.0,
    status: 'active',
  });

  const populated = await Staff.findById(staffRecord._id).populate('user', 'name email role');

  if (req.io) req.io.emit('staff_added', { staff: populated });

  res.status(201).json({ success: true, data: populated });
});

// @desc    Remove staff member (deactivate user + staff record)
// @route   DELETE /api/staff/:id
const removeStaff = asyncHandler(async (req, res) => {
  const staffRecord = await Staff.findOne({ _id: req.params.id, store: req.storeId }).populate('user');
  if (!staffRecord) {
    res.status(404);
    throw new Error('Staff record not found');
  }

  // Deactivate the user account
  if (staffRecord.user) {
    await User.findByIdAndUpdate(staffRecord.user._id, { isActive: false });
  }

  // Delete staff record
  await staffRecord.deleteOne();

  if (req.io) req.io.emit('staff_removed', { staffId: req.params.id });

  res.json({ success: true, message: 'Staff member removed successfully' });
});

module.exports = { getStaff, getLeaderboard, updateStaff, addStaff, removeStaff };
