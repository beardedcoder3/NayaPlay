const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const firebaseAdmin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
require('dotenv').config();

// Initialize AWS SNS Client
const snsClient = new SNSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

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
// Update your CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));


// Email Configuration
const transporter = nodemailer.createTransport({
  host: process.env.ZOHO_MAIL_HOST || 'smtppro.zoho.eu',
  port: parseInt(process.env.ZOHO_MAIL_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.ZOHO_MAIL_USER || 'noreply@nayaplay.co',
    pass: process.env.ZOHO_MAIL_PASSWORD
  },
  debug: true
});

// Verify SMTP connection
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP Verification Error:', error);
  } else {
    console.log("Server is ready to send emails");
  }
});

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
// Generate Email Verification Code Endpoint
app.post('/api/generate-verification', async (req, res) => {
  console.log('Generate verification request:', req.body);
  const { email, userId, username } = req.body;
  
  try {
    const verificationCode = generateVerificationCode();
    console.log('Generated code for user:', { userId, code: verificationCode });

    await firebaseAdmin.firestore()
      .collection('verificationCodes')
      .doc(userId)
      .set({
        code: verificationCode,
        email,
        userId,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });

    const info = await transporter.sendMail({
      from: '"NayaPlay" <noreply@nayaplay.co>',
      to: email,
      subject: 'Verify Your NayaPlay Account',
      html: `
        <div style="background-color: #1a1b1e; color: #ffffff; padding: 20px; border-radius: 10px;">
          <h1 style="color: #4f46e5;">Welcome to NayaPlay!</h1>
          <p>Hello ${username},</p>
          <p>Your verification code is:</p>
          <div style="background-color: #2d2e33; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; letter-spacing: 5px; font-family: monospace;">${verificationCode}</span>
          </div>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
    });

    console.log('Verification email sent:', info.messageId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error generating verification:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
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
      host: process.env.ZOHO_MAIL_HOST,
      port: process.env.ZOHO_MAIL_PORT,
      user: process.env.ZOHO_MAIL_USER
    },
    awsConfig: {
      region: process.env.AWS_REGION
    }
  });
});

// Start first game
startNewGame();

// Start server
const PORT = process.env.PORT || 3003;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Email configuration loaded:', {
    host: process.env.ZOHO_MAIL_HOST,
    port: process.env.ZOHO_MAIL_PORT,
    user: process.env.ZOHO_MAIL_USER
  });
  console.log('AWS SNS configuration loaded for region:', process.env.AWS_REGION);
});