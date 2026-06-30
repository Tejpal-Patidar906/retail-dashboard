const express = require('express');
const router = express.Router();
const {
  getInventory, getStockAlerts, updateInventory, addProduct, deleteProduct
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(protect);

router.get('/', getInventory);
router.get('/alerts', getStockAlerts);
// Staff can add products and update stock
router.post('/', roleCheck('admin', 'manager', 'staff', 'store_owner'), addProduct);
router.put('/:id', roleCheck('admin', 'manager', 'staff', 'store_owner'), updateInventory);
// Only admin can delete
router.delete('/:id', roleCheck('admin', 'store_owner'), deleteProduct);

module.exports = router;
