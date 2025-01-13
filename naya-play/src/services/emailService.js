// emailService.js
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');

// Create Zoho Mail transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 465,
  secure: true,
  auth: {
    user: 'noreply@nayaplay.co',
    pass: process.env.ZOHO_MAIL_PASSWORD // Make sure to set this in your environment variables
  }
});

// Cache for email templates
let emailTemplates = {};

// Load email template from file
async function loadTemplate(templateName) {
  if (emailTemplates[templateName]) {
    return emailTemplates[templateName];
  }

  const templatePath = path.join(__dirname, '..', 'email-templates', `${templateName}.html`);
  const template = await fs.readFile(templatePath, 'utf8');
  emailTemplates[templateName] = handlebars.compile(template);
  return emailTemplates[templateName];
}

// Send verification email
async function sendVerificationEmail(userData) {
  try {
    const template = await loadTemplate('verification');
    const verificationLink = `https://nayaplay.co/verify-email?code=${userData.verificationCode}`;

    const html = template({
      username: userData.username,
      email: userData.email,
      verificationLink,
      currentYear: new Date().getFullYear()
    });

    const mailOptions = {
      from: '"NayaPlay" <noreply@nayaplay.co>',
      to: userData.email,
      subject: 'Verify Your NayaPlay Account',
      html,
      headers: {
        'X-Entity-Ref-ID': `verify-${Date.now()}`
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

// Send welcome email after verification
async function sendWelcomeEmail(userData) {
  try {
    const template = await loadTemplate('welcome');
    
    const html = template({
      username: userData.username,
      loginLink: 'https://nayaplay.co/login',
      currentYear: new Date().getFullYear()
    });

    const mailOptions = {
      from: '"NayaPlay" <noreply@nayaplay.co>',
      to: userData.email,
      subject: 'Welcome to NayaPlay! 🎮',
      html,
      headers: {
        'X-Entity-Ref-ID': `welcome-${Date.now()}`
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail
};