const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Product = require('./models/Product');
const Sale = require('./models/Sale');
const Customer = require('./models/Customer');
const Staff = require('./models/Staff');
const Store = require('./models/Store');

const connectDB = require('./config/db');

// ─── Seed Data ───────────────────────────────────────────

const users = [
  { name: 'Rahul Sharma', email: 'admin@groceryiq.com', password: 'admin123', role: 'admin', branch: 'Main Branch' },
  { name: 'Priya Singh', email: 'manager@groceryiq.com', password: 'manager123', role: 'manager', branch: 'Main Branch' },
  { name: 'Amit Kumar', email: 'staff1@groceryiq.com', password: 'staff123', role: 'staff', branch: 'Main Branch' },
  { name: 'Sunita Patel', email: 'staff2@groceryiq.com', password: 'staff123', role: 'staff', branch: 'Main Branch' },
  { name: 'Ravi Verma', email: 'staff3@groceryiq.com', password: 'staff123', role: 'staff', branch: 'East Wing' },
  { name: 'Neha Gupta', email: 'manager2@groceryiq.com', password: 'manager123', role: 'manager', branch: 'East Wing' },
];

const products = [
  // Fruits & Vegetables
  { name: 'Tomato', sku: 'VEG-001', category: 'Fruits & Vegetables', price: 40, costPrice: 25, stock: 150, unit: 'kg', reorderLevel: 30, supplier: 'Fresh Farm Co.', branch: 'Main Branch' },
  { name: 'Potato', sku: 'VEG-002', category: 'Fruits & Vegetables', price: 30, costPrice: 18, stock: 200, unit: 'kg', reorderLevel: 50, supplier: 'Fresh Farm Co.', branch: 'Main Branch' },
  { name: 'Onion', sku: 'VEG-003', category: 'Fruits & Vegetables', price: 35, costPrice: 20, stock: 180, unit: 'kg', reorderLevel: 40, supplier: 'Fresh Farm Co.', branch: 'Main Branch' },
  { name: 'Banana', sku: 'FRU-001', category: 'Fruits & Vegetables', price: 60, costPrice: 35, stock: 100, unit: 'dozen', reorderLevel: 20, supplier: 'Fruit Valley', branch: 'Main Branch' },
  { name: 'Apple (Shimla)', sku: 'FRU-002', category: 'Fruits & Vegetables', price: 180, costPrice: 110, stock: 12, unit: 'kg', reorderLevel: 15, supplier: 'Fruit Valley', branch: 'Main Branch' },
  { name: 'Spinach', sku: 'VEG-004', category: 'Fruits & Vegetables', price: 25, costPrice: 12, stock: 0, unit: 'kg', reorderLevel: 10, supplier: 'Fresh Farm Co.', branch: 'Main Branch' },
  { name: 'Carrot', sku: 'VEG-005', category: 'Fruits & Vegetables', price: 45, costPrice: 28, stock: 80, unit: 'kg', reorderLevel: 20, supplier: 'Fresh Farm Co.', branch: 'Main Branch' },

  // Dairy & Eggs
  { name: 'Amul Full Cream Milk', sku: 'DAI-001', category: 'Dairy & Eggs', price: 68, costPrice: 55, stock: 200, unit: 'litre', reorderLevel: 50, supplier: 'Amul', branch: 'Main Branch' },
  { name: 'Amul Butter 500g', sku: 'DAI-002', category: 'Dairy & Eggs', price: 285, costPrice: 220, stock: 45, unit: 'pack', reorderLevel: 15, supplier: 'Amul', branch: 'Main Branch' },
  { name: 'Farm Fresh Eggs (12)', sku: 'DAI-003', category: 'Dairy & Eggs', price: 90, costPrice: 65, stock: 8, unit: 'dozen', reorderLevel: 20, supplier: 'Poultry Plus', branch: 'Main Branch' },
  { name: 'Nestlé Yogurt 400g', sku: 'DAI-004', category: 'Dairy & Eggs', price: 55, costPrice: 38, stock: 60, unit: 'pack', reorderLevel: 15, supplier: 'Nestlé', branch: 'Main Branch' },
  { name: 'Paneer 200g', sku: 'DAI-005', category: 'Dairy & Eggs', price: 95, costPrice: 72, stock: 35, unit: 'pack', reorderLevel: 10, supplier: 'Amul', branch: 'Main Branch' },

  // Beverages
  { name: 'Tata Tea Premium 500g', sku: 'BEV-001', category: 'Beverages', price: 265, costPrice: 190, stock: 80, unit: 'pack', reorderLevel: 20, supplier: 'Tata Consumer', branch: 'Main Branch' },
  { name: 'Nescafé Classic 200g', sku: 'BEV-002', category: 'Beverages', price: 420, costPrice: 300, stock: 40, unit: 'pack', reorderLevel: 10, supplier: 'Nestlé', branch: 'Main Branch' },
  { name: 'Real Juice Mixed Fruit 1L', sku: 'BEV-003', category: 'Beverages', price: 120, costPrice: 80, stock: 90, unit: 'litre', reorderLevel: 25, supplier: 'Dabur', branch: 'Main Branch' },
  { name: 'Bisleri Water 1L', sku: 'BEV-004', category: 'Beverages', price: 20, costPrice: 10, stock: 300, unit: 'piece', reorderLevel: 60, supplier: 'Bisleri', branch: 'Main Branch' },
  { name: 'Coca Cola 2L', sku: 'BEV-005', category: 'Beverages', price: 95, costPrice: 65, stock: 5, unit: 'piece', reorderLevel: 20, supplier: 'Coca Cola India', branch: 'Main Branch' },

  // Snacks & Sweets
  { name: 'Haldiram Aloo Bhujia 400g', sku: 'SNK-001', category: 'Snacks & Sweets', price: 150, costPrice: 100, stock: 60, unit: 'pack', reorderLevel: 15, supplier: 'Haldiram', branch: 'Main Branch' },
  { name: "Lay's Classic Salted 78g", sku: 'SNK-002', category: 'Snacks & Sweets', price: 30, costPrice: 18, stock: 120, unit: 'pack', reorderLevel: 30, supplier: 'PepsiCo', branch: 'Main Branch' },
  { name: 'Cadbury Dairy Milk 40g', sku: 'SNK-003', category: 'Snacks & Sweets', price: 40, costPrice: 25, stock: 200, unit: 'piece', reorderLevel: 50, supplier: 'Mondelez', branch: 'Main Branch' },
  { name: 'Parle-G Biscuits 800g', sku: 'SNK-004', category: 'Snacks & Sweets', price: 80, costPrice: 52, stock: 0, unit: 'pack', reorderLevel: 20, supplier: 'Parle', branch: 'Main Branch' },

  // Grains & Pulses
  { name: 'India Gate Basmati Rice 5kg', sku: 'GRN-001', category: 'Grains & Pulses', price: 520, costPrice: 380, stock: 50, unit: 'pack', reorderLevel: 10, supplier: 'KRBL Ltd', branch: 'Main Branch' },
  { name: 'Aashirvaad Atta 10kg', sku: 'GRN-002', category: 'Grains & Pulses', price: 450, costPrice: 320, stock: 40, unit: 'pack', reorderLevel: 10, supplier: 'ITC', branch: 'Main Branch' },
  { name: 'Toor Dal 1kg', sku: 'GRN-003', category: 'Grains & Pulses', price: 140, costPrice: 100, stock: 75, unit: 'kg', reorderLevel: 15, supplier: 'Local Supplier', branch: 'Main Branch' },
  { name: 'Chana Dal 1kg', sku: 'GRN-004', category: 'Grains & Pulses', price: 110, costPrice: 78, stock: 60, unit: 'kg', reorderLevel: 12, supplier: 'Local Supplier', branch: 'Main Branch' },

  // Spices & Condiments
  { name: 'MDH Haldi Powder 100g', sku: 'SPC-001', category: 'Spices & Condiments', price: 65, costPrice: 42, stock: 90, unit: 'pack', reorderLevel: 20, supplier: 'MDH', branch: 'Main Branch' },
  { name: 'Everest Garam Masala 50g', sku: 'SPC-002', category: 'Spices & Condiments', price: 55, costPrice: 34, stock: 70, unit: 'pack', reorderLevel: 15, supplier: 'Everest', branch: 'Main Branch' },
  { name: 'Maggi Tomato Ketchup 1kg', sku: 'SPC-003', category: 'Spices & Condiments', price: 160, costPrice: 110, stock: 45, unit: 'pack', reorderLevel: 10, supplier: 'Nestlé', branch: 'Main Branch' },

  // Personal Care
  { name: 'Colgate MaxFresh 150g', sku: 'PC-001', category: 'Personal Care', price: 95, costPrice: 62, stock: 80, unit: 'piece', reorderLevel: 20, supplier: 'Colgate-Palmolive', branch: 'Main Branch' },
  { name: 'Dove Soap 75g', sku: 'PC-002', category: 'Personal Care', price: 55, costPrice: 34, stock: 100, unit: 'piece', reorderLevel: 25, supplier: 'HUL', branch: 'Main Branch' },
  { name: 'Head & Shoulders 400ml', sku: 'PC-003', category: 'Personal Care', price: 340, costPrice: 235, stock: 30, unit: 'piece', reorderLevel: 8, supplier: 'P&G', branch: 'Main Branch' },

  // Bakery
  { name: 'Britannia Bread 400g', sku: 'BAK-001', category: 'Bakery', price: 45, costPrice: 30, stock: 60, unit: 'pack', reorderLevel: 15, supplier: 'Britannia', branch: 'Main Branch' },
  { name: 'Pav Buns (6 piece)', sku: 'BAK-002', category: 'Bakery', price: 30, costPrice: 18, stock: 40, unit: 'pack', reorderLevel: 10, supplier: 'Local Bakery', branch: 'Main Branch' },
];

const customers = [
  { name: 'Ramesh Agarwal', email: 'ramesh@email.com', phone: '+91-98765-01001', segment: 'VIP', totalSpent: 12480, visits: 48, branch: 'Main Branch' },
  { name: 'Savita Joshi', email: 'savita@email.com', phone: '+91-98765-01002', segment: 'VIP', totalSpent: 9200, visits: 35, branch: 'Main Branch' },
  { name: 'Deepak Mehta', email: 'deepak@email.com', phone: '+91-98765-01003', segment: 'VIP', totalSpent: 8750, visits: 42, branch: 'Main Branch' },
  { name: 'Anita Reddy', email: 'anita@email.com', phone: '+91-98765-01004', segment: 'Regular', totalSpent: 3200, visits: 18, branch: 'Main Branch' },
  { name: 'Vijay Nair', email: 'vijay@email.com', phone: '+91-98765-01005', segment: 'Regular', totalSpent: 2800, visits: 15, branch: 'Main Branch' },
  { name: 'Meena Pillai', email: 'meena@email.com', phone: '+91-98765-01006', segment: 'Regular', totalSpent: 1950, visits: 12, branch: 'Main Branch' },
  { name: 'Suresh Yadav', email: 'suresh@email.com', phone: '+91-98765-01007', segment: 'Regular', totalSpent: 2100, visits: 9, branch: 'Main Branch' },
  { name: 'Kavita Das', email: 'kavita@email.com', phone: '+91-98765-01008', segment: 'New', totalSpent: 450, visits: 2, branch: 'Main Branch' },
  { name: 'Mohan Lal', email: 'mohan@email.com', phone: '+91-98765-01009', segment: 'New', totalSpent: 280, visits: 1, branch: 'Main Branch' },
  { name: 'Pooja Sharma', email: 'pooja@email.com', phone: '+91-98765-01010', segment: 'New', totalSpent: 620, visits: 3, branch: 'Main Branch' },
  { name: 'Rajesh Kumar', email: 'rajesh@email.com', phone: '+91-98765-01011', segment: 'VIP', totalSpent: 11200, visits: 52, branch: 'Main Branch' },
  { name: 'Geeta Bose', email: 'geeta@email.com', phone: '+91-98765-01012', segment: 'Regular', totalSpent: 3800, visits: 21, branch: 'Main Branch' },
];

// ─── Seeder Functions ─────────────────────────────────────

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

const generateSales = (productDocs, customerDocs, userDocs) => {
  const sales = [];
  const paymentMethods = ['cash', 'card', 'upi'];
  const staffDocs = userDocs.filter(u => u.role === 'staff' || u.role === 'manager');

  // Generate 180 days of sales data
  for (let day = 0; day < 180; day++) {
    const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
    const dailyCount = randomInt(15, 40); // grocery stores have more transactions

    for (let i = 0; i < dailyCount; i++) {
      const numProducts = randomInt(2, 6); // grocery shoppers buy more items
      const saleProducts = [];
      let total = 0;
      let profit = 0;

      for (let j = 0; j < numProducts; j++) {
        const product = randomElement(productDocs);
        const qty = randomInt(1, 5);
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
      saleDate.setHours(randomInt(7, 21), randomInt(0, 59));

      sales.push({
        products: saleProducts,
        total: parseFloat(total.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        customer: Math.random() > 0.4 ? randomElement(customerDocs)._id : undefined,
        staff: randomElement(staffDocs)._id,
        branch: 'Main Branch',
        paymentMethod: randomElement(paymentMethods),
        returnFlag: Math.random() < 0.03,
        createdAt: saleDate,
      });
    }
  }

  return sales;
};

const seedDB = async () => {
  try {
    await connectDB();
    console.log('\n🌱 Starting GroceryIQ database seed...\n');

    // Clear existing data
    await Promise.all([
      Store.deleteMany({}),
      User.deleteMany({}),
      Product.deleteMany({}),
      Sale.deleteMany({}),
      Customer.deleteMany({}),
      Staff.deleteMany({}),
    ]);
    console.log('✅ Cleared existing data');

    // Create Store owner user manually first
    const owner = await User.create({
      name: 'Store Owner',
      email: 'owner@groceryiq.com',
      password: 'owner123',
      role: 'store_owner',
      branch: 'Main Branch'
    });

    // Create a Store
    const demoStore = await Store.create({
      name: 'Demo Grocery Store',
      owner: owner._id,
      phone: '9876543210'
    });
    console.log(`✅ Created Store: ${demoStore.name}`);

    // Update the owner with store reference
    owner.store = demoStore._id;
    await owner.save();

    // Create users
    const mappedUsers = users.map(u => ({ ...u, store: demoStore._id }));
    const createdUsers = await User.create(mappedUsers);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create products
    const mappedProducts = products.map(p => ({ ...p, store: demoStore._id }));
    const createdProducts = await Product.create(mappedProducts);
    console.log(`✅ Created ${createdProducts.length} grocery products`);

    // Create customers
    const createdCustomers = await Customer.create(
      customers.map(c => ({
        ...c,
        store: demoStore._id,
        lastVisit: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000),
      }))
    );
    console.log(`✅ Created ${createdCustomers.length} customers`);

    // Create staff records (for staff/manager users)
    const staffUsers = createdUsers.filter(u => u.role === 'staff' || u.role === 'manager');
    const shifts = ['Morning', 'Evening', 'Night'];
    const staffRecords = staffUsers.map((u, idx) => ({
      user: u._id,
      store: demoStore._id,
      shift: shifts[idx % 3],
      salesTotal: randomFloat(15000, 85000),
      transactionCount: randomInt(200, 800),
      rating: randomFloat(3.5, 5.0),
      status: Math.random() > 0.2 ? 'active' : 'off',
      branch: u.branch,
    }));
    const createdStaff = await Staff.create(staffRecords);
    console.log(`✅ Created ${createdStaff.length} staff records`);

    // Create sales
    const salesData = generateSales(createdProducts, createdCustomers, createdUsers);
    const mappedSales = salesData.map(s => ({ ...s, store: demoStore._id }));
    await Sale.insertMany(mappedSales);
    console.log(`✅ Created ${salesData.length} sales transactions`);

    console.log('\n🎉 GroceryIQ Database seeded successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('─────────────────────────────────────────────');
    console.log('👑 Admin:   admin@groceryiq.com   / admin123');
    console.log('📊 Manager: manager@groceryiq.com / manager123');
    console.log('🛒 Staff:   staff1@groceryiq.com  / staff123');
    console.log('─────────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDB();
