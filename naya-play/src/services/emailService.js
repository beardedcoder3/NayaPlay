const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');

// Create PurelyMail transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.purelymail.com',
  port: 587,  // PurelyMail recommended port
  secure: false, // Use TLS
  auth: {
    user: 'noreply@nayaplay.co',
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: true
  }
});

// Rest of your code remains exactly the same
let emailTemplates = {};

async function loadTemplate(templateName) {
  if (emailTemplates[templateName]) {
    return emailTemplates[templateName];
  }

  const templatePath = path.join(__dirname, '..', 'email-templates', `${templateName}.html`);
  const template = await fs.readFile(templatePath, 'utf8');
  emailTemplates[templateName] = handlebars.compile(template);
  return emailTemplates[templateName];
}

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