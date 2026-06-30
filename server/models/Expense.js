const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Salary', 'Rent', 'Electricity', 'Maintenance', 'Marketing', 'Logistics', 'Other']
  },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
