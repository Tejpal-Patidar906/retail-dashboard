const express = require('express');
const router = express.Router();
const { getCustomers, getSegments, getFootTraffic, addCustomer, updateCustomer } = require('../controllers/customerController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(protect);

// Staff can view and add customers (for POS), but only admin/manager can see segments/traffic/update
router.get('/', roleCheck('admin', 'manager', 'store_owner', 'staff'), getCustomers);
router.get('/segments', roleCheck('admin', 'manager', 'store_owner'), getSegments);
router.get('/traffic', roleCheck('admin', 'manager', 'store_owner'), getFootTraffic);
router.post('/', roleCheck('admin', 'manager', 'store_owner', 'staff'), addCustomer);
router.put('/:id', roleCheck('admin', 'manager', 'store_owner'), updateCustomer);

module.exports = router;
