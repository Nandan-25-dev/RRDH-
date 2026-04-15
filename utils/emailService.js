/**
 * Email Service for RRDC&H Hospital Management System
 * Handles all email notifications using Nodemailer
 */

const nodemailer = require('nodemailer');

// Email configuration from environment variables
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: (process.env.SMTP_PORT || '587') === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

// Create transporter
let transporter = null;

try {
  transporter = nodemailer.createTransport(emailConfig);
} catch (error) {
  console.log('⚠️  Email configuration incomplete. Email features disabled.');
}

/**
 * Test email connection
 */
const testConnection = async () => {
  try {
    if (transporter) {
      await transporter.verify();
      console.log('✅ Email service connected successfully');
      return true;
    }
  } catch (error) {
    console.log('⚠️  Email service not available:', error.message);
  }
  return false;
};

/**
 * Send email helper
 */
const sendEmail = async (to, subject, htmlContent) => {
  try {
    if (!transporter) {
      console.log('⚠️  Email service not configured');
      return false;
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'RRDC Hospital <noreply@rrdc-hospital.com>',
      to,
      subject,
      html: htmlContent
    });

    console.log('📧 Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return false;
  }
};

/**
 * Patient Registration Welcome Email
 */
const sendWelcomeEmail = async (patientName, patientEmail) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 Welcome to RRDC&H Hospital</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${patientName}</strong>,</p>
            <p>Thank you for registering with RRDC&H Hospital Management System!</p>
            <p>Your account has been successfully created. You can now:</p>
            <ul>
              <li>✅ Login to your patient dashboard</li>
              <li>📅 Book appointments with our doctors</li>
              <li>💊 View prescriptions and medical records</li>
              <li>💳 Check your payment history</li>
              <li>🔔 Receive appointment reminders</li>
            </ul>
            <p><strong>Quick Start:</strong></p>
            <p>Login at: <a href="http://localhost:3000/admin/login" style="color: #667eea;">Hospital Management Portal</a></p>
            <p>Use your registered email/username and password to access your account.</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br><strong>RRDC&H Hospital Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(patientEmail, '👋 Welcome to RRDC&H Hospital!', htmlContent);
};

/**
 * Appointment Confirmation Email
 */
const sendAppointmentConfirmation = async (patientEmail, patientName, appointmentDetails) => {
  const { date, time, doctor, department, service } = appointmentDetails;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .details-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .details-box div { margin: 10px 0; }
          .label { font-weight: bold; color: #667eea; }
          .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Appointment Confirmation</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${patientName}</strong>,</p>
            <p>Your appointment has been confirmed!</p>
            
            <div class="details-box">
              <div><span class="label">📅 Date:</span> ${new Date(date).toLocaleDateString('en-IN')}</div>
              <div><span class="label">⏰ Time:</span> ${time}</div>
              <div><span class="label">👨‍⚕️ Doctor:</span> ${doctor || 'TBA'}</div>
              <div><span class="label">🏥 Department:</span> ${department || 'General'}</div>
              <div><span class="label">💊 Service:</span> ${service || 'Consultation'}</div>
            </div>

            <p><strong>Important:</strong></p>
            <ul>
              <li>Please arrive 15 minutes before your appointment</li>
              <li>Bring all relevant medical documents</li>
              <li>In case of emergency, call: +91-XXX-XXXX-XXXX</li>
            </ul>

            <p>You can manage your appointment from your dashboard.</p>
            <p>Best regards,<br><strong>RRDC&H Hospital Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(patientEmail, '📅 Appointment Confirmed - RRDC&H Hospital', htmlContent);
};

/**
 * Appointment Reminder Email (24 hours before)
 */
const sendAppointmentReminder = async (patientEmail, patientName, appointmentDetails) => {
  const { date, time, doctor, department } = appointmentDetails;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ff9800; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .details-box { background: white; border-left: 4px solid #ff9800; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .details-box div { margin: 10px 0; }
          .label { font-weight: bold; color: #ff9800; }
          .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Appointment Reminder</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${patientName}</strong>,</p>
            <p>This is a reminder about your upcoming appointment at RRDC&H Hospital:</p>
            
            <div class="details-box">
              <div><span class="label">📅 Date:</span> ${new Date(date).toLocaleDateString('en-IN')}</div>
              <div><span class="label">⏰ Time:</span> ${time}</div>
              <div><span class="label">👨‍⚕️ Doctor:</span> ${doctor || 'TBA'}</div>
              <div><span class="label">🏥 Department:</span> ${department || 'General'}</div>
            </div>

            <p>⏱️ <strong>Please arrive 15 minutes early.</strong></p>

            <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
            <p>Best regards,<br><strong>RRDC&H Hospital Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(patientEmail, '🔔 Appointment Reminder - RRDC&H Hospital', htmlContent);
};

/**
 * Payment Invoice Email
 */
const sendPaymentInvoice = async (patientEmail, patientName, paymentDetails) => {
  const { invoiceNumber, amount, appointmentService, dueDate, paymentMethod } = paymentDetails;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .invoice-box { background: white; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .invoice-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .invoice-row.total { font-weight: bold; border: none; border-top: 2px solid #667eea; padding-top: 10px; margin-top: 10px; }
          .label { color: #667eea; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Payment Invoice</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${patientName}</strong>,</p>
            <p>Please find your invoice details below:</p>
            
            <div class="invoice-box">
              <div class="invoice-row">
                <span><span class="label">Invoice #</span></span>
                <span>${invoiceNumber}</span>
              </div>
              <div class="invoice-row">
                <span><span class="label">Service</span></span>
                <span>${appointmentService || 'Hospital Service'}</span>
              </div>
              <div class="invoice-row">
                <span><span class="label">Amount</span></span>
                <span>₹${amount}</span>
              </div>
              <div class="invoice-row">
                <span><span class="label">Payment Method</span></span>
                <span>${paymentMethod}</span>
              </div>
              <div class="invoice-row">
                <span><span class="label">Due Date</span></span>
                <span>${new Date(dueDate).toLocaleDateString('en-IN')}</span>
              </div>
              <div class="invoice-row total">
                <span><span class="label">Total Due</span></span>
                <span>₹${amount}</span>
              </div>
            </div>

            <p>Please settle the payment by the due date. For payment inquiries, please contact our billing department.</p>
            <p>Best regards,<br><strong>RRDC&H Hospital Billing</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(patientEmail, `💳 Invoice #${invoiceNumber} - RRDC&H Hospital`, htmlContent);
};

/**
 * Prescription Ready Email
 */
const sendPrescriptionEmail = async (patientEmail, patientName, prescriptionDetails) => {
  const { medicines, doctor, notes } = prescriptionDetails;

  const medicinesHtml = medicines.map(med => `
    <div style="margin: 10px 0; padding: 10px; background: #f0f7ff; border-left: 3px solid #667eea; border-radius: 3px;">
      <div><strong>${med.name}</strong> - ${med.dosage}</div>
      <div style="font-size: 12px; color: #666;">Frequency: ${med.frequency} | Duration: ${med.duration}</div>
      <div style="font-size: 12px; color: #666;">Instructions: ${med.instructions}</div>
    </div>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💊 Your Prescription</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${patientName}</strong>,</p>
            <p>Your prescription from Dr. ${doctor} is now available:</p>
            
            <div style="margin: 20px 0;">
              <h3 style="color: #667eea;">Prescribed Medicines:</h3>
              ${medicinesHtml}
            </div>

            ${notes ? `
              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 15px 0;">
                <strong>Doctor's Notes:</strong>
                <p>${notes}</p>
              </div>
            ` : ''}

            <p><strong>Important:</strong></p>
            <ul>
              <li>Follow the dosage and frequency as prescribed</li>
              <li>Keep medicines in a cool, dry place</li>
              <li>Do not share medicines with others</li>
              <li>Consult doctor if you experience any side effects</li>
            </ul>

            <p>You can download or print this prescription from your patient dashboard.</p>
            <p>Best regards,<br><strong>RRDC&H Medical Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(patientEmail, '💊 Your Prescription - RRDC&H Hospital', htmlContent);
};

/**
 * Feedback Response Email
 */
const sendFeedbackResponse = async (patientEmail, patientName, feedbackResponse) => {
  const { feedbackType, responseMessage } = feedbackResponse;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .response-box { background: white; border-left: 4px solid #4caf50; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Feedback Response</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${patientName}</strong>,</p>
            <p>Thank you for your feedback regarding <strong>${feedbackType}</strong>.</p>
            
            <div class="response-box">
              <h3 style="color: #4caf50; margin-bottom: 10px;">Our Response:</h3>
              <p>${responseMessage}</p>
            </div>

            <p>We appreciate your valuable input and will use it to improve our services.</p>
            <p>If you have any further concerns, please don't hesitate to contact us.</p>
            <p>Best regards,<br><strong>RRDC&H Hospital Management</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(patientEmail, '📝 Response to Your Feedback - RRDC&H Hospital', htmlContent);
};

/**
 * Admin Signup Confirmation Email
 */
const sendAdminWelcomeEmail = async (adminEmail, adminName, role) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .details-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .details-box div { margin: 10px 0; }
          .label { font-weight: bold; color: #667eea; }
          .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome Admin!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${adminName}</strong>,</p>
            <p>Your admin account has been successfully created on the RRDC&H Hospital Management System!</p>
            
            <div class="details-box">
              <div><span class="label">Role:</span> ${role}</div>
              <div><span class="label">Email:</span> ${adminEmail}</div>
            </div>

            <p><strong>You can now:</strong></p>
            <ul>
              <li>✅ Access the admin dashboard</li>
              <li>📊 View hospital statistics and reports</li>
              <li>👥 Manage patients and doctors</li>
              <li>📅 Handle appointments and schedules</li>
              <li>💳 Process payments and invoices</li>
              <li>📋 Manage services and prescriptions</li>
            </ul>

            <p><strong>Login Details:</strong></p>
            <p>Portal: <a href="http://localhost:3000/admin/login" style="color: #667eea;">http://localhost:3000/admin/login</a></p>
            <p>Username/Email: ${adminEmail}</p>

            <p>For security, please keep your password confidential and never share it with anyone.</p>
            <p>Best regards,<br><strong>RRDC&H System Administrator</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(adminEmail, '🎉 Welcome to RRDC&H Admin Portal!', htmlContent);
};

// Export functions
module.exports = {
  testConnection,
  sendEmail,
  sendWelcomeEmail,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendPaymentInvoice,
  sendPrescriptionEmail,
  sendFeedbackResponse,
  sendAdminWelcomeEmail
};
