const asyncHandler = require('express-async-handler');
const Store = require('../models/Store');

// @desc    Get current store settings
// @route   GET /api/store/settings
// @access  Private (admin/store_owner)
const getStoreSettings = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.storeId);
  
  if (!store) {
    res.status(404);
    throw new Error('Store not found');
  }

  // We only send back the email config, could send more settings later
  res.json({
    success: true,
    data: {
      name: store.name,
      gstNumber: store.gstNumber,
      address: store.address,
      phone: store.phone,
      upiId: store.upiId || '',
      emailConfig: {
        email: store.emailConfig?.email || '',
        appPassword: store.emailConfig?.appPassword ? '********' : '' // Mask password
      }
    }
  });
});

// @desc    Update store settings (including email config)
// @route   PUT /api/store/settings
// @access  Private (admin/store_owner)
const updateStoreSettings = asyncHandler(async (req, res) => {
  const { name, gstNumber, address, phone, emailConfig, upiId } = req.body;
  
  const store = await Store.findById(req.storeId);
  
  if (!store) {
    res.status(404);
    throw new Error('Store not found');
  }

  if (name) store.name = name;
  if (gstNumber !== undefined) store.gstNumber = gstNumber;
  if (address !== undefined) store.address = address;
  if (phone !== undefined) store.phone = phone;
  if (upiId !== undefined) store.upiId = upiId;

  if (emailConfig) {
    if (emailConfig.email !== undefined) store.emailConfig.email = emailConfig.email;
    // Only update appPassword if it's not the masked value and not undefined
    if (emailConfig.appPassword && emailConfig.appPassword !== '********') {
      store.emailConfig.appPassword = emailConfig.appPassword;
    }
    // Handle clearing the password
    if (emailConfig.appPassword === '') {
      store.emailConfig.appPassword = '';
    }
  }

  await store.save();

  res.json({
    success: true,
    message: 'Store settings updated successfully',
    data: {
      name: store.name,
      upiId: store.upiId || '',
      emailConfig: {
        email: store.emailConfig?.email || '',
        appPassword: store.emailConfig?.appPassword ? '********' : ''
      }
    }
  });
});

// @desc    Get public store info (for POS / UPI etc)
// @route   GET /api/store/info
// @access  Private (Any authenticated user)
const getStoreInfo = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.storeId);
  if (!store) {
    res.status(404);
    throw new Error('Store not found');
  }

  res.json({
    success: true,
    data: {
      name: store.name,
      upiId: store.upiId || ''
    }
  });
});

module.exports = { getStoreSettings, updateStoreSettings, getStoreInfo };
