const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

// Helper to create a dynamic transporter based on store config
const getTransporter = async (store) => {
  // If store has valid email config, use real SMTP
  if (store && store.emailConfig && store.emailConfig.email && store.emailConfig.appPassword) {
    return nodemailer.createTransport({
      service: 'gmail', // You can change this to use host/port for generic SMTP
      auth: {
        user: store.emailConfig.email,
        pass: store.emailConfig.appPassword
      }
    });
  }

  // Fallback to Ethereal for testing
  try {
    const account = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass
      }
    });
  } catch (err) {
    console.error('Failed to create ethereal test account', err);
    return null;
  }
};

/**
 * Generates a PDF bill in memory and returns a Buffer
 */
const generatePDF = (sale, storeName) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fontSize(20).text(storeName || 'GroceryIQ Store', { align: 'center' });
      doc.fontSize(12).text('Tax Invoice / Bill of Supply', { align: 'center' });
      doc.moveDown();

      // Bill details
      doc.fontSize(10)
         .text(`Bill No: ${sale._id}`)
         .text(`Date: ${new Date(sale.createdAt).toLocaleString('en-IN')}`)
         .text(`Cashier: ${sale.staff?.name || 'Staff'}`)
         .text(`Payment: ${sale.paymentMethod?.toUpperCase() || 'CASH'}`);

      if (sale.customer) {
        doc.text(`Customer: ${sale.customer.name}`);
      }
      doc.moveDown();

      // Table Header
      const tableTop = doc.y;
      doc.text('Item', 50, tableTop)
         .text('Qty', 300, tableTop)
         .text('Price', 350, tableTop)
         .text('Total', 450, tableTop);
      
      doc.moveTo(50, doc.y + 5).lineTo(500, doc.y + 5).stroke();
      doc.moveDown();

      // Items
      let y = doc.y;
      sale.products.forEach(item => {
        doc.text(item.product?.name || 'Unknown Item', 50, y, { width: 240 })
           .text(item.qty.toString(), 300, y)
           .text(`Rs. ${item.price.toFixed(2)}`, 350, y)
           .text(`Rs. ${(item.qty * item.price).toFixed(2)}`, 450, y);
        y += 15;
      });

      doc.moveTo(50, y + 5).lineTo(500, y + 5).stroke();
      
      // Totals
      doc.fontSize(12).font('Helvetica-Bold')
         .text('Grand Total:', 300, y + 15)
         .text(`Rs. ${sale.total.toFixed(2)}`, 400, y + 15, { align: 'right' });

      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica').text('Thank you for shopping with us!', { align: 'center' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Sends an email with the PDF attached
 */
const sendBillEmail = async (sale, store) => {
  if (!sale.customer || !sale.customer.email) return;

  const transporter = await getTransporter(store);
  if (!transporter) return;

  try {
    const pdfBuffer = await generatePDF(sale, store?.name);
    const senderEmail = store?.emailConfig?.email || 'billing@groceryiq.com';
    const storeName = store?.name || 'GroceryIQ';

    const mailOptions = {
      from: `"${storeName}" <${senderEmail}>`,
      to: sale.customer.email,
      subject: `Your Bill from ${storeName}`,
      text: `Hello ${sale.customer.name},\n\nThank you for your purchase. Please find your bill attached.\n\nTotal: Rs. ${sale.total}\n\nRegards,\n${storeName}`,
      attachments: [
        {
          filename: `Invoice_${sale._id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Determine if it was sent via Ethereal (for dev/testing) or real SMTP
    if (transporter.transporter?.name === 'SMTP (Ethereal)') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`📧 Test Email sent to ${sale.customer.email}. Preview URL: ${previewUrl}`);
      return { success: true, previewUrl };
    } else {
      console.log(`📧 Real Email sent to ${sale.customer.email}`);
      return { success: true, previewUrl: null }; 
    }
  } catch (error) {
    console.error('Error sending email bill:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendBillEmail, generatePDF };
