require('dotenv').config();  // Move this to the very top

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const firebaseAdmin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

// Add this debug log to verify
console.log('DEBUG - Environment Variables:', {
  SMTP_HOST: process.env.SMTP_HOST || 'not set',
  SMTP_PORT: process.env.SMTP_PORT || 'not set',
  SMTP_USER: process.env.SMTP_USER || 'not set',
  SMTP_PASS_SET: process.env.SMTP_PASSWORD ? 'yes' : 'no'
});

// Initialize AWS SNS Client
const snsClient = new SNSClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Verify credentials are loaded
console.log('AWS Region:', process.env.AWS_REGION);
console.log('AWS Access Key ID:', process.env.AWS_ACCESS_KEY_ID?.slice(0, 5) + '...');

// Initialize Firebase Admin with environment variables
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

// Initialize Firebase Admin
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount)
});

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      'https://nayaplay.co', 
      'https://www.nayaplay.co', 
      'https://dev.d3gbazqn8zu3vg.amplifyapp.com'
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Email Configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  pool: true,
  maxConnections: 10,
  maxMessages: 200,
  rateDelta: 1000,
  rateLimit: 10
});

// Cache verification template
// Replace the existing getVerificationEmailTemplate function with this:
const getVerificationEmailTemplate = (username, code) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to NayaPlay - Verify Your Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1b1e; font-family: Arial, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 37.5em; margin: 0 auto; padding: 20px 0; background-color: #1a1b1e;">
        <tr>
            <td align="center" style="padding: 20px;">
                <!-- Main Container -->
                <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #1f2937; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 20px; background-color: #1f2937;">
                            <img src="https://www.nayaplay.co/static/media/Logo2.9d9eee96e726f06834fe.png" alt="NayaPlay" width="140" style="display: block; margin-bottom: 20px;">
                            <h1 style="margin: 0; color: #4f46e5; font-size: 28px; font-weight: bold;">Welcome to NayaPlay!</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px 20px; background-color: #1f2937;">
                            <p style="color: #e2e8f0; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                                Hello ${username},<br><br>
                                Your verification code is:
                            </p>

                            <!-- Code Display -->
                            <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                                <tr>
                                    <td align="center">
                                        <div style="background-color: #2d2e33; border: 2px solid #4f46e5; border-radius: 12px; padding: 20px; display: inline-block;">
                                            <span style="color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace;">${code}</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Notice -->
                            <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                                <tr>
                                    <td style="background-color: #2d2e33; padding: 20px; border-radius: 12px;">
                                        <p style="color: #9ca3af; font-size: 14px; line-height: 20px; margin: 0; text-align: center;">
                                            ⏰ This code will expire in <span style="color: #e2e8f0; font-weight: bold;">10 minutes</span><br>
                                            🔒 For security reasons, never share this code with anyone
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #2d2e33; padding: 30px 20px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px;">
                                Need help? Contact us at:
                            </p>
                            <p style="margin: 0;">
                                <a href="mailto:support@nayaplay.co" style="color: #4f46e5; text-decoration: none; font-weight: 500;">support@nayaplay.co</a>
                                <span style="color: #4b5563; margin: 0 10px;">•</span>
                                <a href="tel:+18143092786" style="color: #4f46e5; text-decoration: none; font-weight: 500;">+1 814-309-2786</a>
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Footer Text -->
                <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin-top: 20px;">
                    <tr>
                        <td align="center" style="padding: 0 20px;">
                            <p style="color: #6b7280; font-size: 12px; line-height: 16px; margin: 0;">
                                © 2024 NayaPlay. All rights reserved.<br>
                                If you didn't create a NayaPlay account, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

// One-time verification at startup
transporter.verify()
  .then(() => console.log('SMTP ready'))
  .catch(err => console.error('SMTP Error:', err.message));

// Helper Functions
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Game state variables
let currentGame = null;
let gameInterval = null;

const calculateCrashPoint = () => {
  const random = Math.random();
  if (random < 0.60) return 1.1 + (Math.random() * 0.9);
  if (random < 0.85) return 2 + (Math.random() * 1);
  if (random < 0.95) return 3 + (Math.random() * 2);
  return 5 + (Math.random() * 5);
};

const startNewGame = () => {
  currentGame = {
    id: Date.now(),
    state: 'betting',
    countdown: 10,
    crashPoint: calculateCrashPoint(),
    multiplier: 1.00,
    players: new Map(),
    startedAt: null
  };

  io.emit('game_starting', { 
    id: currentGame.id,
    countdown: currentGame.countdown
  });

  let countdownInterval = setInterval(() => {
    currentGame.countdown--;
    io.emit('countdown', currentGame.countdown);

    if (currentGame.countdown <= 0) {
      clearInterval(countdownInterval);
      startPlaying();
    }
  }, 1000);
};

const startPlaying = () => {
  currentGame.state = 'playing';
  currentGame.startedAt = Date.now();
  io.emit('game_started', { id: currentGame.id });

  gameInterval = setInterval(() => {
    currentGame.multiplier += 0.01;
    io.emit('multiplier_update', currentGame.multiplier);

    if (currentGame.multiplier >= currentGame.crashPoint) {
      handleCrash();
    }
  }, 50);
};

const handleCrash = () => {
  clearInterval(gameInterval);
  currentGame.state = 'crashed';
  io.emit('game_crashed', { 
    crashPoint: currentGame.multiplier,
    players: Array.from(currentGame.players.values())
  });

  setTimeout(startNewGame, 3000);
};

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  if (currentGame) {
    socket.emit('game_state', currentGame);
  }

  socket.on('place_bet', async ({ userId, amount }) => {
    if (currentGame && currentGame.state === 'betting') {
      currentGame.players.set(userId, {
        userId,
        betAmount: amount,
        status: 'playing'
      });
      io.emit('bet_placed', { userId, amount });
    }
  });

  socket.on('cash_out', ({ userId }) => {
    if (currentGame && currentGame.state === 'playing') {
      const player = currentGame.players.get(userId);
      if (player && player.status === 'playing') {
        player.status = 'cashed_out';
        player.cashoutMultiplier = currentGame.multiplier;
        player.winAmount = player.betAmount * currentGame.multiplier;
        io.emit('player_cashed_out', player);
      }
    }
  });
});

// API Routes
// Generate Email Verification Code Endpoint (Optimized version)
app.post('/api/generate-verification', async (req, res) => {
  const { email, userId, username } = req.body;
  
  if (!email || !userId || !username) {
    return res.status(400).json({ 
      error: 'Missing required fields'
    });
  }

  try {
    const verificationCode = generateVerificationCode();
    const verificationData = {
      code: verificationCode,
      email,
      userId,
      createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };

    const mailOptions = {
      from: '"NayaPlay" <noreply@nayaplay.co>',
      to: email,
      subject: 'Verify Your NayaPlay Account',
      html: getVerificationEmailTemplate(username, verificationCode)
    };

    // Execute Firebase write and email send in parallel
    await Promise.all([
      firebaseAdmin.firestore()
        .collection('verificationCodes')
        .doc(userId)
        .set(verificationData),
      transporter.sendMail(mailOptions)
    ]);

    res.json({ success: true });
    
  } catch (error) {
    console.error('Verification error:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    res.status(500).json({ 
      error: 'Failed to send verification email',
      details: error.message
    });
  }
});

app.get('/test-email', async (req, res) => {
  try {
    const testResult = await transporter.verify();
    console.log('SMTP Test Result:', testResult);
    
    const info = await transporter.sendMail({
      from: '"NayaPlay Test" <noreply@nayaplay.co>',
      to: "noreply@nayaplay.co",
      subject: "SMTP Test",
      text: "Test email"
    });
    
    res.json({ 
      success: true, 
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Test Email Error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    res.status(500).json({ error: error.message });
  }
});

// Email Verify Code Endpoint
app.post('/api/verify-code', async (req, res) => {
  console.log('Verify code request:', req.body);
  const { code, userId } = req.body;

  if (!code || !userId) {
    return res.status(400).json({ 
      success: false,
      error: 'Missing required fields' 
    });
  }

  try {
    const docRef = await firebaseAdmin.firestore()
      .collection('verificationCodes')
      .doc(userId)
      .get();

    if (!docRef.exists) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid verification code' 
      });
    }

    const data = docRef.data();
    
    if (data.code !== code) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid verification code' 
      });
    }

    if (Date.now() > data.expiresAt.toDate().getTime()) {
      return res.status(400).json({ 
        success: false,
        error: 'Verification code expired' 
      });
    }

    await firebaseAdmin.firestore()
      .collection('users')
      .doc(userId)
      .update({
        emailVerified: true,
        verifiedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      });

    await docRef.ref.delete();

    return res.json({ 
      success: true,
      message: 'Verification successful' 
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to verify code',
      details: error.message
    });
  }
});

// Phone Verification Endpoints
app.post('/api/send-phone-verification', async (req, res) => {
  console.log('Received request body:', req.body);
  
  if (!req.body || !req.body.phoneNumber) {
    return res.status(400).json({
      success: false, 
      error: 'Phone number is required'
    });
  }

  const { phoneNumber } = req.body;
  console.log('Processing phone number:', phoneNumber);
  
  try {
    const verificationCode = generateVerificationCode();
    
    await firebaseAdmin.firestore()
      .collection('phoneVerifications')
      .doc(phoneNumber)
      .set({
        code: verificationCode,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });

    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const message = `Your NayaPlay verification code is: ${verificationCode}\n\nThis code will expire in 5 minutes.\n\nDo not share this code with anyone.`;

    const command = new PublishCommand({
      Message: message,
      PhoneNumber: formattedNumber,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: 'NAYAPLAY'
        },
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional'
        }
      }
    });

    const response = await snsClient.send(command);
    console.log('AWS SNS Response:', response);
    
    res.json({ 
      success: true, 
      messageId: response.MessageId 
    });
  } catch (error) {
    console.error('AWS SNS error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/verify-phone-code', async (req, res) => {
  const { phoneNumber, code } = req.body;
  
  try {
    const docRef = await firebaseAdmin.firestore()
      .collection('phoneVerifications')
      .doc(phoneNumber)
      .get();

    if (!docRef.exists) {
      return res.json({ 
        success: false,
        verified: false,
        error: 'Invalid or expired code'
      });
    }

    const data = docRef.data();
    const isValid = data.code === code && new Date() < data.expiresAt.toDate();

    if (isValid) {
      // Delete the verification code after successful verification
      await docRef.ref.delete();

      res.json({ 
        success: true,
        verified: true
      });
    } else {
      res.json({ 
        success: false,
        verified: false,
        error: 'Invalid or expired code'
      });
    }
  } catch (error) {
    console.error('Code verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Crypto Webhook Endpoint
app.post('/api/crypto-webhook', async (req, res) => {
  const { payment_id, payment_status, pay_amount, actually_paid, outcome_amount } = req.body;
  console.log('Received webhook:', req.body);

  try {
    const transactionsRef = firebaseAdmin.firestore().collection('transactions');
    const snapshot = await transactionsRef
      .where('paymentId', '==', payment_id)
      .get();

    if (!snapshot.empty) {
      const transaction = snapshot.docs[0];
      const transactionData = transaction.data();

      await transaction.ref.update({
        status: payment_status,
        receivedAmount: actually_paid,
        finalAmount: outcome_amount,
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      });

      if (payment_status === 'finished' || payment_status === 'confirmed') {
        await firebaseAdmin.firestore()
          .collection('users')
          .doc(transactionData.userId)
          .update({
            balance: firebaseAdmin.firestore.FieldValue.increment(Number(outcome_amount))
          });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Debug Endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running',
    emailConfig: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER
    },
    awsConfig: {
      region: process.env.AWS_REGION
    }
  });
});

// Marketing Email Configuration
const marketingTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: 'marketing@nayaplay.co',
    pass: process.env.SMTP_MARKETING_PASSWORD
  },
  requireTLS: true,
  debug: true
});

// Verify marketing email configuration
marketingTransporter.verify(function(error, success) {
  if (error) {
    console.error('Marketing SMTP Connection Error:', error);
  } else {
    console.log('Marketing SMTP Server ready');
  }
});

// Add this new endpoint for sending marketing emails
app.post('/api/send-marketing-email', async (req, res) => {
  const { subject, htmlContent, recipients } = req.body;
  
  try {
    // Validate inputs
    if (!subject || !htmlContent || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing or invalid required fields' 
      });
    }

    // Send email to each recipient
    const results = await Promise.all(recipients.map(async (recipient) => {
      const mailOptions = {
        from: '"NayaPlay Marketing" <marketing@nayaplay.co>',
        to: recipient,
        subject: subject,
        html: htmlContent
      };

      return marketingTransporter.sendMail(mailOptions);
    }));

    res.json({ 
      success: true, 
      messageIds: results.map(r => r.messageId)
    });
    
  } catch (error) {
    console.error('Marketing email error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send marketing email',
      details: error.message
    });
  }
});

// Bonus Email Configuration
const bonusTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: 'bonus@nayaplay.co',
    pass: process.env.SMTP_BONUS_PASSWORD
  },
  requireTLS: true,
  debug: true
});

// Verify bonus email configuration
bonusTransporter.verify(function(error, success) {
  if (error) {
    console.error('Bonus SMTP Connection Error:', error);
  } else {
    console.log('Bonus SMTP Server ready');
  }
});

// Add this new endpoint for sending bonus emails
app.post('/api/send-bonus-email', async (req, res) => {
  const { subject, htmlContent, recipients } = req.body;
  
  try {
    if (!subject || !htmlContent || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing or invalid required fields' 
      });
    }

    // Send email to each recipient
    const results = await Promise.all(recipients.map(async (recipient) => {
      const mailOptions = {
        from: '"NayaPlay Bonus" <bonus@nayaplay.co>',
        to: recipient,
        subject: subject,
        html: htmlContent
      };

      return bonusTransporter.sendMail(mailOptions);
    }));

    res.json({ 
      success: true, 
      messageIds: results.map(r => r.messageId)
    });
    
  } catch (error) {
    console.error('Bonus email error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send bonus email',
      details: error.message
    });
  }
});

// Start first game
startNewGame();

// Start server
const PORT = process.env.PORT || 3003;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Email configuration loaded:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER
  });
  console.log('AWS SNS configuration loaded for region:', process.env.AWS_REGION);
});