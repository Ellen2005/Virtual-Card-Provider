// utils/helpers.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Generate JWT token (FIXED: supports role)
const generateToken = (payload) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

  if (!JWT_SECRET || JWT_SECRET === 'your_jwt_secret') {
    console.error('❌ ERROR: JWT_SECRET not properly configured!');
    throw new Error('Server configuration error');
  }

  return jwt.sign(
    payload, // { id, role }
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
};

// Generate random token for password reset
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create transporter FIRST (before sendEmail function)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  // FIX FOR SELF-SIGNED CERTIFICATE ERROR:
  tls: {
    rejectUnauthorized: false
  }
});

console.log('SMTP Config Check:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  hasPass: !!process.env.SMTP_PASS,
  passLength: process.env.SMTP_PASS?.length
});

// Test email connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error.message);
    console.error('SMTP Config:', {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      hasUser: !!process.env.SMTP_USER,
      hasPass: !!process.env.SMTP_PASS
    });
  } else {
    console.log('✅ SMTP Server is ready to send emails');
  }
});

// Send email function - ACTUAL IMPLEMENTATION
const sendEmail = async (to, subject, html) => {
  try {
    if (!to || !subject || !html) {
      console.error('❌ Missing email parameters:', { to: !!to, subject: !!subject, html: !!html });
      return false;
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('⚠️ SMTP not configured. Email not sent.');
      console.log(`📧 Would send email to: ${to}`);
      console.log(`📧 Subject: ${subject}`);
      return false;
    }

    const mailOptions = {
      from: `"Virtual Card Provider" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    console.log(`📧 To: ${to}, Subject: ${subject}`);
    
    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    
    // In development, simulate success to continue testing
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Dev mode: Simulating email success');
      console.log(`📧 Would have sent email to: ${to}`);
      console.log(`📧 Subject: ${subject}`);
      return true;
    }
    
    return false;
  }
};

// Legacy function - use sendEmail instead
const sendVerificationEmail = sendEmail;

module.exports = {
  generateToken,
  generateRandomToken,
  sendEmail,
  sendVerificationEmail
};