const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const firebaseAdmin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin with service account
// Remove this line
// const serviceAccount = require('./firebase-config.json');

// Add this instead
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
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? "vercel remove naya-play" 
      : "http://localhost:3002"
  }
});

// Middleware
const allowedOrigins = [
  'https://dev.d3gbazqn8zu3vg.amplifyapp.com',
  'http://localhost:3002',
  'https://nayaplay.co',
  'https://www.nayaplay.co'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

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

// Generate verification code
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

// Socket.IO connections
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
// Email verification endpoint
// Email verification endpoint

app.post('/api/verify-code', async (req, res) => {
  console.log('Verify code request:', req.body);
  const { code, userId } = req.body;

  if (!code || !userId) {
    console.log('Missing fields:', { code, userId });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Get verification code document
    const docRef = await firebaseAdmin.firestore()
      .collection('verificationCodes')
      .doc(userId)
      .get();

    if (!docRef.exists) {
      console.log('No verification code found for user:', userId);
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const data = docRef.data();
    console.log('Comparing codes:', {
      provided: code,
      stored: data.code,
      match: data.code === code
    });

    // Check code first (before expiration)
    if (data.code !== code) {
      console.log('Code mismatch');
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Then check expiration
    if (Date.now() > data.expiresAt.toDate().getTime()) {
      console.log('Code expired');
      return res.status(400).json({ error: 'Verification code expired' });
    }

    // Update user
    console.log('Updating user verification status');
    await firebaseAdmin.firestore()
      .collection('users')
      .doc(userId)
      .update({
        emailVerified: true,
        verifiedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      });

    // Delete verification code
    await docRef.ref.delete();

    console.log('Verification successful');
    res.json({ success: true });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify code endpoint
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

    // Update user and delete code
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
      error: 'Failed to verify code' 
    });
  }
});


// Crypto webhook endpoint
app.post('/api/crypto-webhook', async (req, res) => {
  const { payment_id, payment_status, pay_amount, actually_paid, outcome_amount } = req.body;
  console.log('Received webhook:', req.body);

  try {
    // Find transaction by payment_id
    const transactionsRef = firebaseAdmin.firestore().collection('transactions');
    const snapshot = await transactionsRef
      .where('paymentId', '==', payment_id)
      .get();

    if (!snapshot.empty) {
      const transaction = snapshot.docs[0];
      const transactionData = transaction.data();

      // Update transaction
      await transaction.ref.update({
        status: payment_status,
        receivedAmount: actually_paid,
        finalAmount: outcome_amount,
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      });

      // If payment is completed, update user's balance
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

// Debug endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running',
    emailConfig: {
      host: process.env.ZOHO_MAIL_HOST,
      port: process.env.ZOHO_MAIL_PORT,
      user: process.env.ZOHO_MAIL_USER
    }
  });
});

// Start first game
startNewGame();

// Start server
const PORT = process.env.PORT || 3003; // Update default port
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Email configuration loaded:', {
    host: process.env.ZOHO_MAIL_HOST,
    port: process.env.ZOHO_MAIL_PORT,
    user: process.env.ZOHO_MAIL_USER
  });
});