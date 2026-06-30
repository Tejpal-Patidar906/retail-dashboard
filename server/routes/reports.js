const express = require('express');
const router = express.Router();
const { generateSalesPDF, exportInventoryCSV, generateCustomersPDF } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(protect, roleCheck('admin', 'manager', 'store_owner'));

router.get('/sales-pdf', generateSalesPDF);
router.get('/inventory-csv', exportInventoryCSV);
router.get('/customers-pdf', generateCustomersPDF);

module.exports = router;
