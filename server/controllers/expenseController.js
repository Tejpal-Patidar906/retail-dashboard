const asyncHandler = require('express-async-handler');
const Expense = require('../models/Expense');

// @desc    Get all expenses for the store
// @route   GET /api/expenses
const getExpenses = asyncHandler(async (req, res) => {
  const expenses = await Expense.find({ store: req.storeId }).sort({ date: -1 });
  
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  res.json({
    success: true,
    count: expenses.length,
    total: totalExpenses,
    data: expenses
  });
});

// @desc    Add new expense
// @route   POST /api/expenses
const addExpense = asyncHandler(async (req, res) => {
  const { description, amount, category, date } = req.body;
  
  const expense = await Expense.create({
    store: req.storeId,
    description,
    amount,
    category,
    date: date || Date.now()
  });

  res.status(201).json({ success: true, data: expense });
});

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense || expense.store.toString() !== req.storeId.toString()) {
    res.status(404);
    throw new Error('Expense not found');
  }
  await expense.deleteOne();
  res.json({ success: true, message: 'Expense removed' });
});

module.exports = { getExpenses, addExpense, deleteExpense };
