const asyncHandler = require('express-async-handler');
const PDFDocument = require('pdfkit');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const exportToCSV = require('../utils/exportCSV');

// Helper: draw PDF header
const drawPDFHeader = (doc, title) => {
  doc.fillColor('#5B8AF0').fontSize(24).text('RetailIQ Analytics', 50, 50);
  doc.fillColor('#4A5270').fontSize(12).text('Retail Store Dashboard Report', 50, 80);
  doc.fillColor('#E2E8F8').fontSize(18).text(title, 50, 110);
  doc.moveTo(50, 140).lineTo(550, 140).strokeColor('#5B8AF0').stroke();
  doc.moveDown(2);
};

// Helper: draw table rows
const drawTable = (doc, headers, rows, startY) => {
  const colWidth = 490 / headers.length;
  let y = startY;

  // Header row
  doc.fillColor('#5B8AF0').fontSize(10);
  headers.forEach((h, i) => {
    doc.text(h, 50 + i * colWidth, y, { width: colWidth, align: 'left' });
  });
  y += 20;
  doc.moveTo(50, y).lineTo(540, y).strokeColor('#4A5270').stroke();
  y += 5;

  // Data rows
  doc.fillColor('#E2E8F8').fontSize(9);
  rows.forEach((row, rowIndex) => {
    if (y > 720) {
      doc.addPage();
      y = 50;
    }
    if (rowIndex % 2 === 0) {
      doc.rect(50, y - 2, 490, 18).fillColor('#0E1220').fill();
    }
    doc.fillColor('#E2E8F8');
    row.forEach((cell, i) => {
      doc.text(String(cell ?? ''), 52 + i * colWidth, y, { width: colWidth - 4, align: 'left' });
    });
    y += 20;
  });

  return y;
};

// @desc    Generate Sales PDF report
// @route   GET /api/reports/sales-pdf
const generateSalesPDF = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [sales, summary] = await Promise.all([
    Sale.find({ createdAt: { $gte: since }, store: req.storeId })
      .populate('products.product', 'name sku')
      .populate('customer', 'name')
      .populate('staff', 'name')
      .sort({ createdAt: -1 })
      .limit(50),
    Sale.aggregate([
      { $match: { createdAt: { $gte: since }, store: req.storeId } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalProfit: { $sum: '$profit' },
          transactions: { $sum: 1 },
          returns: { $sum: { $cond: ['$returnFlag', 1, 0] } },
        },
      },
    ]),
  ]);

  const doc = new PDFDocument({ size: 'A4', margin: 50, theme: 'dark' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');
  doc.pipe(res);

  // Background
  doc.rect(0, 0, 612, 792).fill('#080B12');

  drawPDFHeader(doc, 'Sales Report — Last 30 Days');

  // Summary section
  const s = summary[0] || { totalRevenue: 0, totalProfit: 0, transactions: 0, returns: 0 };
  doc.fillColor('#E2E8F8').fontSize(12);
  doc.text(`Total Revenue: $${s.totalRevenue.toLocaleString()}`, 50, doc.y);
  doc.text(`Total Profit: $${s.totalProfit.toLocaleString()}`);
  doc.text(`Transactions: ${s.transactions}`);
  doc.text(`Returns: ${s.returns}`);
  doc.text(`AOV: $${s.transactions > 0 ? (s.totalRevenue / s.transactions).toFixed(2) : '0'}`);
  doc.moveDown(1);

  // Sales table
  const headers = ['Date', 'Customer', 'Staff', 'Total', 'Profit', 'Payment', 'Return'];
  const rows = sales.map(sale => [
    new Date(sale.createdAt).toLocaleDateString(),
    sale.customer?.name || 'Walk-in',
    sale.staff?.name || 'N/A',
    `$${sale.total.toFixed(2)}`,
    `$${sale.profit.toFixed(2)}`,
    sale.paymentMethod,
    sale.returnFlag ? 'Yes' : 'No',
  ]);

  drawTable(doc, headers, rows, doc.y + 10);
  doc.fillColor('#4A5270').fontSize(9).text(`Generated: ${new Date().toLocaleString()}`, 50, 760);
  doc.end();
});

// @desc    Export Inventory CSV
// @route   GET /api/reports/inventory-csv
const exportInventoryCSV = asyncHandler(async (req, res) => {
  const products = await Product.find({ store: req.storeId }).sort({ category: 1, name: 1 });

  const fields = [
    { label: 'Name', value: 'name' },
    { label: 'SKU', value: 'sku' },
    { label: 'Category', value: 'category' },
    { label: 'Price', value: 'price' },
    { label: 'Cost Price', value: 'costPrice' },
    { label: 'Stock', value: 'stock' },
    { label: 'Reorder Level', value: 'reorderLevel' },
    { label: 'Branch', value: 'branch' },
  ];

  const data = products.map(p => ({
    name: p.name,
    sku: p.sku,
    category: p.category,
    price: p.price,
    costPrice: p.costPrice,
    stock: p.stock,
    reorderLevel: p.reorderLevel,
    branch: p.branch,
  }));

  const csv = exportToCSV(data, fields);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.csv"');
  res.send(csv);
});

// @desc    Generate Customer insights PDF
// @route   GET /api/reports/customers-pdf
const generateCustomersPDF = asyncHandler(async (req, res) => {
  const customers = await Customer.find({ store: req.storeId }).sort({ totalSpent: -1 }).limit(100);

  const segments = { VIP: 0, Regular: 0, New: 0 };
  let totalSpent = 0;
  customers.forEach(c => {
    segments[c.segment] = (segments[c.segment] || 0) + 1;
    totalSpent += c.totalSpent;
  });

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="customers-report.pdf"');
  doc.pipe(res);

  doc.rect(0, 0, 612, 792).fill('#080B12');
  drawPDFHeader(doc, 'Customer Insights Report');

  doc.fillColor('#E2E8F8').fontSize(12);
  doc.text(`Total Customers: ${customers.length}`);
  doc.text(`VIP Customers: ${segments.VIP}`);
  doc.text(`Regular Customers: ${segments.Regular}`);
  doc.text(`New Customers: ${segments.New}`);
  doc.text(`Total Revenue (Top 100): $${totalSpent.toLocaleString()}`);
  doc.text(`Avg LTV: $${customers.length > 0 ? (totalSpent / customers.length).toFixed(2) : '0'}`);
  doc.moveDown(1);

  const headers = ['Name', 'Email', 'Segment', 'Total Spent', 'Visits', 'Last Visit'];
  const rows = customers.map(c => [
    c.name,
    c.email || 'N/A',
    c.segment,
    `$${c.totalSpent.toFixed(2)}`,
    c.visits,
    new Date(c.lastVisit).toLocaleDateString(),
  ]);

  drawTable(doc, headers, rows, doc.y + 10);
  doc.fillColor('#4A5270').fontSize(9).text(`Generated: ${new Date().toLocaleString()}`, 50, 760);
  doc.end();
});

module.exports = { generateSalesPDF, exportInventoryCSV, generateCustomersPDF };
