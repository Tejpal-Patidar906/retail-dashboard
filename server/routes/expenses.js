const express = require('express');
const router = express.Router();
const { getExpenses, addExpense, deleteExpense } = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Only store_owner and manager can manage expenses
router.use(protect);
router.use(roleCheck('store_owner', 'manager'));

router.route('/')
  .get(getExpenses)
  .post(addExpense);

router.route('/:id')
  .delete(deleteExpense);

module.exports = router;
