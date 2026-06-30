const express = require('express');
const router = express.Router();
const { getStoreSettings, updateStoreSettings, getStoreInfo } = require('../controllers/storeController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(protect);

router.get('/settings', roleCheck('admin', 'store_owner'), getStoreSettings);
router.put('/settings', roleCheck('admin', 'store_owner'), updateStoreSettings);
router.get('/info', getStoreInfo);

module.exports = router;
