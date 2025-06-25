import { format } from 'date-fns';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { uploadFile } from './spaceUploader.js';
import Student from '../modules/student/student.schema.js';
import { sendEmailViaMsg91 } from './email.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default company details
const COMPANY_DETAILS = {
    name: 'GSNA Education Pvt Ltd',
    address: 'GSTIN : 36AAHCG5673R1ZQ',
    email: 'accounts@nniit.com',
    phone: '+91 9110763704',
   
};

export function generateInvoice(data) {
    const {
        studentName,
        email,
        invoiceNumber,
        invoiceDate = new Date(),
        courses = [], // Array of courses
        paidAmount = 0,
    } = data;

    // Calculate total quantity
    const totalQuantity = courses.reduce((sum, c) => sum + (c.quantity || 0), 0);
    const sgstPercentage = 9;
    const cgstPercentage = 9;
    let subtotal, sgstAmount, cgstAmount, totalAmount, courseRows;

    if (data.totalAmount) {
        // Remove 18% GST from totalAmount to get subtotal
        subtotal = +(data.totalAmount / 1.18).toFixed(2);
        sgstAmount = +(subtotal * sgstPercentage / 100).toFixed(2);
        cgstAmount = +(subtotal * cgstPercentage / 100).toFixed(2);
        totalAmount = +data.totalAmount;
        // Per-unit price
        const perUnitPrice = totalQuantity > 0 ? +(subtotal / totalQuantity).toFixed(2) : 0;
        // Set each course's price and amount based on per-unit price
        courseRows = courses.map(course => ({
            description: course.description,
            quantity: course.quantity,
            price: perUnitPrice,
            amount: +(perUnitPrice * course.quantity).toFixed(2)
        }));
    } else {
        // Calculate subtotal for all courses
        courseRows = courses.map(course => ({
            description: course.description,
            quantity: course.quantity,
            price: course.price,
            amount: +(course.price * course.quantity).toFixed(2)
        }));
        subtotal = courseRows.reduce((sum, row) => sum + row.amount, 0);
        sgstAmount = +(subtotal * sgstPercentage / 100).toFixed(2);
        cgstAmount = +(subtotal * cgstPercentage / 100).toFixed(2);
        totalAmount = +(subtotal + sgstAmount + cgstAmount).toFixed(2);
    }
    const dueAmount = +(totalAmount - paidAmount).toFixed(2);

    // Convert invoiceDate to Date object and calculate due date
    const invoiceDateObj = new Date(invoiceDate);
    const dueDateObj = new Date(invoiceDateObj);
    dueDateObj.setDate(dueDateObj.getDate() + 30);

    return {
        // Company Details
        company: {
            name: COMPANY_DETAILS.name,
            address: COMPANY_DETAILS.address,
            email: COMPANY_DETAILS.email,
            phone: COMPANY_DETAILS.phone
        },

        // Student Details
        student: {
            name: studentName,
            email,
        },

        // Invoice Details
        invoice: {
            number: invoiceNumber,
            date: format(invoiceDateObj, 'dd/MM/yyyy'),
            dueDate: format(dueDateObj, 'dd/MM/yyyy'),
            subtotal: subtotal, // Add subtotal here for reference
            total: totalAmount  // Add total here for reference
        },

        // Course Details (array)
        courses: courseRows,
        subtotal,

        // Financial Details
        financial: {
            sgst: {
                percentage: sgstPercentage,
                amount: sgstAmount
            },
            cgst: {
                percentage: cgstPercentage,
                amount: cgstAmount
            },
            paidAmount,
            dueAmount,
            totalAmount
        },

        // Terms and Conditions
        terms: 'Payment is due within 15 days'
    };
}


export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}


export function generateInvoiceText(invoice) {
    const {
        company,
        student,
        invoice: inv,
        course,
        financial,
        payment
    } = invoice;

    return `


From:
${company.name}
${company.address}
Email: ${company.email}
Phone: ${company.phone}

To:
${student.name}
Email: ${student.email}

Invoice Number: ${inv.number}
Date: ${inv.date}
Due Date: ${inv.dueDate}

Description:
${course.description}
Quantity: ${course.quantity}


Discount (${financial.discount.percentage}%): ${formatCurrency(financial.discount.amount)}
Tax (${financial.tax.percentage}%): ${formatCurrency(financial.tax.amount)}
Total Amount: ${formatCurrency(financial.totalAmount)}
Amount Paid: ${formatCurrency(financial.paidAmount)}
Amount Due: ${formatCurrency(financial.dueAmount)}

Thank you for your business!
    `.trim();
}

function generateHTML(invoice) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoice.number}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
        }
        .invoice-container {
            width: 100%;
            height: 100vh;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
    </div>
</body>
</html>
    `;
}


async function generatePDF(invoice, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 0 });
            const writeStream = fs.createWriteStream(outputPath);

            doc.pipe(writeStream);

            // Replace hardcoded image paths with dynamic ones
            const backgroundImagePath = path.join(__dirname, '../assets/InvoiceHome.pdf.png');
            const logoImagePath = path.join(__dirname, '../assets/NNIIT LOGO.png');

            // Add background image
            doc.image(backgroundImagePath, 0, 0, {
                width: 595.28,
                height: 841.89
            });

            // Add logo at top right
            doc.image(logoImagePath, 455, 20, { width: 120 });

            // Add invoice number at top left (moved up by 10px and left by 5px)
            doc.fontSize(20).fillColor('#006778').font('Helvetica-Bold').text(invoice.invoice?.number || '', 110, 70, { align: 'left' });

            // From Section
            doc.fontSize(12).fillColor('#0097b2').font('Helvetica-Bold').text('From', 120, 180);
            doc.fontSize(11).fillColor('#222').font('Helvetica').text(invoice.company?.name || '', 120, 200);
            doc.text(invoice.company?.phone || '', 120, 215);
            doc.text(invoice.company?.email || '', 120, 230);
            doc.text('GSTIN : ' + (invoice.company?.address || ''), 120, 245);

            // Bill To Section
            doc.fontSize(12).fillColor('#0097b2').font('Helvetica-Bold').text('Bill To', 320, 180);
            doc.fontSize(11).fillColor('#222').font('Helvetica').text(invoice.student?.name || '', 320, 200);
            doc.text(invoice.student?.email || '', 320, 215);

            // Invoice Date & Due Date (now stacked vertically above table header)
            doc.fontSize(11).fillColor('#fff').font('Helvetica-Bold').text('Invoice Date', 70, 320);
            doc.fontSize(11).fillColor('#fff').font('Helvetica').text(invoice.invoice?.date || '', 150, 320);
            doc.fontSize(11).fillColor('#fff').font('Helvetica-Bold').text('Due Date', 70, 338);
            doc.fontSize(11).fillColor('#fff').font('Helvetica').text(invoice.invoice?.dueDate || '', 150, 338);

            // Table Header (Qty, Description, Unit Price, Amount) with background
            doc.save();
            doc.rect(10, 350, 570, 35).fill('#00b2d6');
            doc.fontSize(13).fillColor('#fff').font('Helvetica-Bold');
            doc.text('Qty', 10, 355, { width: 60, align: 'center' });
            doc.text('Description', 70, 355, { width: 240, align: 'center' });
            doc.text('Unit Price', 310, 355, { width: 120, align: 'center' });
            doc.text('Amount', 430, 355, { width: 150, align: 'center' });
            doc.restore();

            // Table Row Content for multiple courses (flexible row height)
            let rowY = 395;
            doc.fontSize(12).fillColor('#222').font('Helvetica');
            const rowHeights = invoice.courses.map(course => {
                // Calculate height needed for description (word wrap)
                const descHeight = doc.heightOfString(course.description || '', { width: 230, align: 'left' });
                // Minimum row height for numbers, etc.
                return Math.max(24, descHeight + 8);
            });
            invoice.courses.forEach((course, idx) => {
                const thisRowHeight = rowHeights[idx];
                doc.text(String(course.quantity || ''), 10, rowY, { width: 60, align: 'center' });
                doc.text(course.description || '', 75, rowY, { width: 230, align: 'left' });
                doc.text(formatCurrency(course.price || 0), 310, rowY, { width: 120, align: 'center' });
                doc.text(formatCurrency(course.amount || 0), 430, rowY, { width: 150, align: 'center' });
                rowY += thisRowHeight;
            });

            // Table Row Borders (flexible height)
            const tableStartY = 385;
            const tableHeight = rowHeights.reduce((a, b) => a + b, 0);
            doc.lineWidth(0.7);
            doc.rect(10, tableStartY, 570, tableHeight).stroke();
            doc.moveTo(70, tableStartY).lineTo(70, tableStartY + tableHeight).stroke();
            doc.moveTo(310, tableStartY).lineTo(310, tableStartY + tableHeight).stroke();
            doc.moveTo(430, tableStartY).lineTo(430, tableStartY + tableHeight).stroke();
            // Draw horizontal lines for each row
            let borderY = tableStartY;
            for (let h of rowHeights) {
                borderY += h;
                if (borderY < tableStartY + tableHeight) {
                    doc.moveTo(10, borderY).lineTo(580, borderY).stroke();
                }
            }

            // Subtotal as simple line, colored like Total Amount
            doc.fontSize(12).fillColor('#006778').font('Helvetica-Bold').text('Subtotal:', 310, rowY, { width: 160, align: 'left' });
            doc.fontSize(12).fillColor('#222').font('Helvetica-Bold').text(formatCurrency(invoice.subtotal || 0), 430, rowY, { width: 150, align: 'center' });
            rowY += 22;
            // SGST and CGST
            doc.fontSize(11).fillColor('#222').font('Helvetica-Bold').text(`SGST (${invoice.financial?.sgst?.percentage || 0}%):`, 310, rowY, { width: 120, align: 'left' });
            doc.fontSize(11).fillColor('#222').font('Helvetica').text(formatCurrency(invoice.financial?.sgst?.amount || 0), 430, rowY, { width: 150, align: 'center' });
            rowY += 18;
            doc.fontSize(11).fillColor('#222').font('Helvetica-Bold').text(`CGST (${invoice.financial?.cgst?.percentage || 0}%):`, 310, rowY, { width: 120, align: 'left' });
            doc.fontSize(11).fillColor('#222').font('Helvetica').text(formatCurrency(invoice.financial?.cgst?.amount || 0), 430, rowY, { width: 150, align: 'center' });
            rowY += 22;
            doc.fontSize(12).fillColor('#006778').font('Helvetica-Bold').text('Total Amount:', 310, rowY, { width: 120, align: 'left' });
            doc.fontSize(12).fillColor('#006778').font('Helvetica-Bold').text(formatCurrency(invoice.financial?.totalAmount || 0), 430, rowY, { width: 150, align: 'center' });

            // Terms & Conditions
            doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold').text('Terms & Conditions', 60, 780);
            doc.fontSize(10).fillColor('#000000').font('Helvetica').text(invoice.terms || 'Payment is due within 15 days', 60, 795);

            doc.end();

            writeStream.on('finish', () => {
                console.log(`PDF successfully written to: ${outputPath}`);
                resolve(outputPath);
            });

            writeStream.on('error', (err) => {
                console.error('Error writing PDF:', err);
                reject(err);
            });
        } catch (error) {
            console.error('Error generating PDF:', error);
            reject(error);
        }
    });
}

export async function createInvoice(options) {
    const invoice = generateInvoice(options);
    
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 0 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));

            // Replace hardcoded image paths with dynamic ones
            const backgroundImagePath = path.join(__dirname, '../assets/InvoiceHome.pdf.png');
            const logoImagePath = path.join(__dirname, '../assets/NNIIT LOGO.png');

            // Add background image
            doc.image(backgroundImagePath, 0, 0, {
                width: 595.28,
                height: 841.89
            });

            // Add logo at top right
            doc.image(logoImagePath, 455, 20, { width: 120 });

            // Add invoice number at top left (moved up by 10px and left by 5px)
            doc.fontSize(20).fillColor('#006778').font('Helvetica-Bold').text(invoice.invoice?.number || '', 110, 70, { align: 'left' });

            // From Section
            doc.fontSize(12).fillColor('#0097b2').font('Helvetica-Bold').text('From', 120, 180);
            doc.fontSize(11).fillColor('#222').font('Helvetica').text(invoice.company?.name || '', 120, 200);
            doc.text(invoice.company?.phone || '', 120, 215);
            doc.text(invoice.company?.email || '', 120, 230);
            doc.text('GSTIN : ' + (invoice.company?.address || ''), 120, 245);

            // Bill To Section
            doc.fontSize(12).fillColor('#0097b2').font('Helvetica-Bold').text('Bill To', 320, 180);
            doc.fontSize(11).fillColor('#222').font('Helvetica').text(invoice.student?.name || '', 320, 200);
            doc.text(invoice.student?.email || '', 320, 215);

            // Invoice Date & Due Date
            doc.fontSize(11).fillColor('#fff').font('Helvetica-Bold').text('Invoice Date', 70, 320);
            doc.fontSize(11).fillColor('#fff').font('Helvetica').text(invoice.invoice?.date || '', 150, 320);
            doc.fontSize(11).fillColor('#fff').font('Helvetica-Bold').text('Due Date', 70, 338);
            doc.fontSize(11).fillColor('#fff').font('Helvetica').text(invoice.invoice?.dueDate || '', 150, 338);

            // Table Header
            doc.save();
            doc.rect(10, 350, 570, 35).fill('#00b2d6');
            doc.fontSize(13).fillColor('#fff').font('Helvetica-Bold');
            doc.text('Qty', 10, 355, { width: 60, align: 'center' });
            doc.text('Description', 70, 355, { width: 240, align: 'center' });
            doc.text('Unit Price', 310, 355, { width: 120, align: 'center' });
            doc.text('Amount', 430, 355, { width: 150, align: 'center' });
            doc.restore();

            // Table Row Content for multiple courses (flexible row height)
            let rowY = 395;
            doc.fontSize(12).fillColor('#222').font('Helvetica');
            const rowHeights = invoice.courses.map(course => {
                // Calculate height needed for description (word wrap)
                const descHeight = doc.heightOfString(course.description || '', { width: 230, align: 'left' });
                // Minimum row height for numbers, etc.
                return Math.max(24, descHeight + 8);
            });
            invoice.courses.forEach((course, idx) => {
                const thisRowHeight = rowHeights[idx];
                doc.text(String(course.quantity || ''), 10, rowY, { width: 60, align: 'center' });
                doc.text(course.description || '', 75, rowY, { width: 230, align: 'left' });
                doc.text(formatCurrency(course.price || 0), 310, rowY, { width: 120, align: 'center' });
                doc.text(formatCurrency(course.amount || 0), 430, rowY, { width: 150, align: 'center' });
                rowY += thisRowHeight;
            });

            // Table Row Borders (flexible height)
            const tableStartY = 385;
            const tableHeight = rowHeights.reduce((a, b) => a + b, 0);
            doc.lineWidth(0.7);
            doc.rect(10, tableStartY, 570, tableHeight).stroke();
            doc.moveTo(70, tableStartY).lineTo(70, tableStartY + tableHeight).stroke();
            doc.moveTo(310, tableStartY).lineTo(310, tableStartY + tableHeight).stroke();
            doc.moveTo(430, tableStartY).lineTo(430, tableStartY + tableHeight).stroke();
            // Draw horizontal lines for each row
            let borderY = tableStartY;
            for (let h of rowHeights) {
                borderY += h;
                if (borderY < tableStartY + tableHeight) {
                    doc.moveTo(10, borderY).lineTo(580, borderY).stroke();
                }
            }

            // Subtotal as simple line, colored like Total Amount
            doc.fontSize(12).fillColor('#006778').font('Helvetica-Bold').text('Subtotal:', 310, rowY, { width: 120, align: 'left' });
            doc.fontSize(12).fillColor('#222').font('Helvetica-Bold').text(formatCurrency(invoice.subtotal || 0), 430, rowY, { width: 150, align: 'center' });
            rowY += 22;
            // SGST and CGST
            doc.fontSize(11).fillColor('#222').font('Helvetica-Bold').text(`SGST (${invoice.financial?.sgst?.percentage || 0}%):`, 310, rowY, { width: 120, align: 'left' });
            doc.fontSize(11).fillColor('#222').font('Helvetica').text(formatCurrency(invoice.financial?.sgst?.amount || 0), 430, rowY, { width: 150, align: 'center' });
            rowY += 18;
            doc.fontSize(11).fillColor('#222').font('Helvetica-Bold').text(`CGST (${invoice.financial?.cgst?.percentage || 0}%):`, 310, rowY, { width: 120, align: 'left' });
            doc.fontSize(11).fillColor('#222').font('Helvetica').text(formatCurrency(invoice.financial?.cgst?.amount || 0), 430, rowY, { width: 150, align: 'center' });
            rowY += 22;
            doc.fontSize(12).fillColor('#006778').font('Helvetica-Bold').text('Total Amount:', 310, rowY, { width: 120, align: 'left' });
            doc.fontSize(12).fillColor('#006778').font('Helvetica-Bold').text(formatCurrency(invoice.financial?.totalAmount || 0), 430, rowY, { width: 150, align: 'center' });

            // Terms & Conditions
            doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold').text('Terms & Conditions', 60, 780);
            doc.fontSize(10).fillColor('#000000').font('Helvetica').text(invoice.terms || 'Payment is due within 15 days', 60, 795);

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

export async function createInvoiceAndUpload(options) {
    try {
        // Generate the invoice PDF buffer
        const pdfBuffer = await createInvoice(options);
        
        // Generate a unique filename for the invoice
        const timestamp = Date.now();
        const invoiceNumber = options.invoiceNumber || `INV-${timestamp}`;
        const fileName = `invoice_${invoiceNumber}_${timestamp}.pdf`;
        const key = `/invoices/${fileName}`; // S3/Spaces key
        
        // Upload to DigitalOcean Spaces
        let publicUrl = await uploadFile(
            pdfBuffer, 
            fileName, 
            'invoices', // folder in bucket
            'application/pdf'
        );
        // If uploadFile returns an object with url property, extract it
        if (publicUrl && publicUrl.url) publicUrl = publicUrl.url;
        // Remove any duplicate protocol in the URL
        publicUrl = publicUrl.replace(/(https:\/\/[^.]+)\.https:\/\//, '$1.');
        
        return {
            success: true,
            url: publicUrl,
            fileName: fileName,
            invoiceNumber: invoiceNumber,
            key: key // Add the key to the response
        };
    } catch (error) {
        console.error('Error creating and uploading invoice:', error);
        return {
            success: false,
            error: error.message
        };
    }
}


// Test function - generates and uploads invoice without email
export async function generateInvoiceAndUploadOnly(options) {
    try {
        // Generate and upload invoice to cloud
        const uploadResult = await createInvoiceAndUpload(options);
        
        if (!uploadResult.success) {
            throw new Error(`Failed to upload invoice: ${uploadResult.error}`);
        }
        
        return {
            success: true,
            invoiceUrl: uploadResult.url,
            invoiceNumber: uploadResult.invoiceNumber,
            emailSent: false,
            message: 'Invoice generated and uploaded successfully'
        };
        
    } catch (error) {
        console.error('Error in generateInvoiceAndUploadOnly:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Fetches student data for invoice generation by student_id.
 * Returns: { student_id, studentName, email, courses: [{ description, quantity, price }] }
 */
export async function getStudentInvoiceData(student_id) {
  const student = await Student.findOne({ student_id: Number(student_id) });
  if (!student) throw new Error('Student not found');

  // Map subjects to courses for invoice
  const courses = (student.subjects || []).map(subj => ({
    description: subj.subject,
    quantity: subj.classes || 1,
    price: subj.price || 0
  }));

  // Generate invoice date and number
  const invoiceDate = format(new Date(), 'yyyy-MM-dd');
  const invoiceNumber = `NNIIT${student.student_id}`;

  // Calculate due amount
  const dueAmount = student.amount_pending && student.amount_pending > 0 ? student.amount_pending : 0;
  // Get total amount
  const totalAmount = student.total_amount || 0;

  return {
    student_id: student.student_id,
    studentName: student.full_name,
    email: student.email,
    courses,
    invoiceDate,
    invoiceNumber,
    dueAmount,
    totalAmount
  };
}

/**
 * Send invoice email to student by student_id (fetches order, email, full_name, invoice_url)
 */
export async function sendInvoiceEmailByStudentId(student_id, invoiceUrlOverride = null) {
  // Dynamic import to avoid circular dependency
  const Order = (await import('../modules/order/order.schema.js')).default;
  const Student = (await import('../modules/student/student.schema.js')).default;
  const order = await Order.findOne({ student_id: Number(student_id) });
  const student = await Student.findOne({ student_id: Number(student_id) });
  if (!order) throw new Error('Order not found');
  if (!student) throw new Error('Student not found');
  if (!student.email) throw new Error('Student email not found');
  // Get latest invoice_url from payment_details
  let invoice_url = invoiceUrlOverride;
  if (!invoice_url && order.payment_details && order.payment_details.length > 0) {
    const lastPayment = order.payment_details[order.payment_details.length - 1];
    if (lastPayment.invoice_url) invoice_url = lastPayment.invoice_url;
  }
  if (!invoice_url) throw new Error('No invoice URL found for email');
  await sendEmailViaMsg91('INVOICE_GENERATED', {
    student_name: student.full_name,
    email: student.email,
    invoice_link: invoice_url
  });
  return { success: true };
}