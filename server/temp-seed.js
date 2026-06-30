const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Product = require('./models/Product');
const Sale = require('./models/Sale');
const Customer = require('./models/Customer');
const Staff = require('./models/Staff');
const Store = require('./models/Store');

const connectDB = require('./config/db');

const products = [
  // Fruits & Vegetables
  { name: 'Tomato', sku: 'VEG-001', category: 'Fruits & Vegetables', price: 40, costPrice: 25, stock: 150, unit: 'kg', reorderLevel: 30, supplier: 'Fresh Farm Co.', branch: 'Main Branch' },
  { name: 'Potato', sku: 'VEG-002', category: 'Fruits & Vegetables', price: 30, costPrice: 18, stock: 200, unit: 'kg', reorderLevel: 50, supplier: 'Fresh Farm Co.', branch: 'Main Branch' },
  { name: 'Onion', sku: 'VEG-003', category: 'Fruits & Vegetables', price: 35, costPrice: 20, stock: 180, unit: 'kg', reorderLevel: 40, supplier: 'Fresh Farm Co.', branch: 'Main Branch' },
  { name: 'Banana', sku: 'FRU-001', category: 'Fruits & Vegetables', price: 60, costPrice: 35, stock: 100, unit: 'dozen', reorderLevel: 20, supplier: 'Fruit Valley', branch: 'Main Branch' },
  { name: 'Apple (Shimla)', sku: 'FRU-002', category: 'Fruits & Vegetables', price: 180, costPrice: 110, stock: 12, unit: 'kg', reorderLevel: 15, supplier: 'Fruit Valley', branch: 'Main Branch' },

  // Dairy & Eggs
  { name: 'Amul Full Cream Milk', sku: 'DAI-001', category: 'Dairy & Eggs', price: 68, costPrice: 55, stock: 200, unit: 'litre', reorderLevel: 50, supplier: 'Amul', branch: 'Main Branch' },
  { name: 'Amul Butter 500g', sku: 'DAI-002', category: 'Dairy & Eggs', price: 285, costPrice: 220, stock: 45, unit: 'pack', reorderLevel: 15, supplier: 'Amul', branch: 'Main Branch' },
  
  // Beverages
  { name: 'Tata Tea Premium 500g', sku: 'BEV-001', category: 'Beverages', price: 265, costPrice: 190, stock: 80, unit: 'pack', reorderLevel: 20, supplier: 'Tata Consumer', branch: 'Main Branch' },
  { name: 'Nescafé Classic 200g', sku: 'BEV-002', category: 'Beverages', price: 420, costPrice: 300, stock: 40, unit: 'pack', reorderLevel: 10, supplier: 'Nestlé', branch: 'Main Branch' },
  
  // Snacks & Sweets
  { name: 'Haldiram Aloo Bhujia 400g', sku: 'SNK-001', category: 'Snacks & Sweets', price: 150, costPrice: 100, stock: 60, unit: 'pack', reorderLevel: 15, supplier: 'Haldiram', branch: 'Main Branch' },
  { name: "Lay's Classic Salted 78g", sku: 'SNK-002', category: 'Snacks & Sweets', price: 30, costPrice: 18, stock: 120, unit: 'pack', reorderLevel: 30, supplier: 'PepsiCo', branch: 'Main Branch' },
];

const customers = [
  { name: 'Ramesh Agarwal', email: 'ramesh@email.com', phone: '+91-98765-01001', segment: 'VIP', totalSpent: 12480, visits: 48, branch: 'Main Branch' },
  { name: 'Savita Joshi', email: 'savita@email.com', phone: '+91-98765-01002', segment: 'VIP', totalSpent: 9200, visits: 35, branch: 'Main Branch' },
  { name: 'Deepak Mehta', email: 'deepak@email.com', phone: '+91-98765-01003', segment: 'VIP', totalSpent: 8750, visits: 42, branch: 'Main Branch' },
  { name: 'Anita Reddy', email: 'anita@email.com', phone: '+91-98765-01004', segment: 'Regular', totalSpent: 3200, visits: 18, branch: 'Main Branch' },
  { name: 'Vijay Nair', email: 'vijay@email.com', phone: '+91-98765-01005', segment: 'Regular', totalSpent: 2800, visits: 15, branch: 'Main Branch' },
];

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

const generateSales = (productDocs, customerDocs, userDocs, storeId) => {
  const sales = [];
  const paymentMethods = ['cash', 'card', 'upi'];
  const staffDocs = userDocs.filter(u => u.role === 'staff' || u.role === 'manager' || u.role === 'store_owner');

  for (let day = 0; day < 90; day++) {
    const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
    const dailyCount = randomInt(5, 20);

    for (let i = 0; i < dailyCount; i++) {
      const numProducts = randomInt(1, 4);
      const saleProducts = [];
      let total = 0;
      let profit = 0;

      for (let j = 0; j < numProducts; j++) {
        const product = randomElement(productDocs);
        const qty = randomInt(1, 3);
        const lineTotal = qty * product.price;
        const lineProfit = qty * (product.price - product.costPrice);
        total += lineTotal;
        profit += lineProfit;
        saleProducts.push({
          product: product._id,
          qty,
          price: product.price,
          costPrice: product.costPrice,
        });
      }

      const saleDate = new Date(date);
      saleDate.setHours(randomInt(8, 20), randomInt(0, 59));

      sales.push({
        products: saleProducts,
        total: parseFloat(total.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        customer: Math.random() > 0.4 ? randomElement(customerDocs)._id : undefined,
        staff: randomElement(staffDocs)._id,
        store: storeId,
        branch: 'Main Branch',
        paymentMethod: randomElement(paymentMethods),
        returnFlag: Math.random() < 0.02,
        createdAt: saleDate,
      });
    }
  }

  return sales;
};

const seedForOwner = async () => {
  try {
    await connectDB();
    console.log('Connected to DB');

    // 1. Find user Tejpal Patel
    const owner = await User.findOne({ name: 'Tejpal Patel' });
    if (!owner) {
      console.error("Owner 'Tejpal Patel' not found in the database!");
      process.exit(1);
    }

    const storeId = owner.store;
    if (!storeId) {
      console.error("Tejpal Patel does not have a store ID!");
      process.exit(1);
    }

    console.log(`Found Tejpal Patel, Store ID: ${storeId}`);

    // Create staff for Tejpal's store
    const randomNum = Math.floor(Math.random() * 10000);
    const newStaffUsers = await User.create([
      { name: 'Amit (Tejpal Staff)', email: `tejpal_staff_${randomNum}@groceryiq.com`, password: 'password', role: 'staff', store: storeId },
      { name: 'Priya (Tejpal Manager)', email: `tejpal_manager_${randomNum}@groceryiq.com`, password: 'password', role: 'manager', store: storeId },
    ]);
    console.log('Created Staff Users for Tejpal');

    // Create Staff records
    await Staff.create(newStaffUsers.map((u, idx) => ({
      user: u._id,
      store: storeId,
      shift: idx % 2 === 0 ? 'Morning' : 'Evening',
      salesTotal: randomFloat(5000, 20000),
      transactionCount: randomInt(50, 200),
      rating: randomFloat(4.0, 5.0),
      status: 'active',
      branch: 'Main Branch'
    })));

    // Add owner to available users for generating sales
    const allStoreUsers = [owner, ...newStaffUsers];

    // Insert Products
    const mappedProducts = products.map(p => ({ ...p, sku: `T-${p.sku}`, store: storeId }));
    const createdProducts = await Product.insertMany(mappedProducts);
    console.log(`Created ${createdProducts.length} products`);

    // Insert Customers
    const createdCustomers = await Customer.insertMany(customers.map(c => ({
      ...c,
      email: `t_${c.email}`,
      store: storeId,
      lastVisit: new Date(Date.now() - randomInt(0, 15) * 24 * 60 * 60 * 1000)
    })));
    console.log(`Created ${createdCustomers.length} customers`);

    // Insert Sales
    const sales = generateSales(createdProducts, createdCustomers, allStoreUsers, storeId);
    await Sale.insertMany(sales);
    console.log(`Created ${sales.length} sales`);

    console.log('Seeding for Tejpal Patel completed!');
    process.exit(0);

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedForOwner();
