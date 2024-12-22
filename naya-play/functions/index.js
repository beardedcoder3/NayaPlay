const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
admin.initializeApp();

const serverClient = StreamChat.getInstance(
  functions.config().stream.key,
  functions.config().stream.secret
);

// Run game loop every second
exports.runCrashGameLoop = functions.pubsub.schedule('every 1 seconds').onRun(async (context) => {
  const db = admin.firestore();
  
  try {
    // Get active game
    const gameQuery = await db.collection('crashGames')
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (gameQuery.empty) {
      // No active game, create one
      const crashPoint = calculateCrashPoint();
      await db.collection('crashGames').add({
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        crashPoint,
        status: 'active',
        state: 'betting',
        multiplier: 1.00,
        countdown: 10
      });
      return null;
    }

    const gameDoc = gameQuery.docs[0];
    const game = gameDoc.data();

    // Handle betting phase
    if (game.state === 'betting') {
      const countdown = game.countdown || 0;
      
      if (countdown > 0) {
        await gameDoc.ref.update({
          countdown: countdown - 1
        });
      } else {
        await gameDoc.ref.update({
          state: 'playing',
          multiplier: 1.00
        });
      }
      return null;
    }

    // Handle playing phase
    if (game.state === 'playing') {
      const newMultiplier = (game.multiplier || 1.00) + 0.01;
      
      if (newMultiplier >= game.crashPoint) {
        // Game crashed
        await gameDoc.ref.update({
          state: 'crashed',
          status: 'finished',
          finalMultiplier: game.multiplier,
          endedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Create new game after 3 seconds
        setTimeout(async () => {
          const crashPoint = calculateCrashPoint();
          await db.collection('crashGames').add({
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
            crashPoint,
            status: 'active',
            state: 'betting',
            multiplier: 1.00,
            countdown: 10
          });
        }, 3000);
      } else {
        await gameDoc.ref.update({
          multiplier: newMultiplier
        });
      }
    }

    return null;
  } catch (error) {
    console.error('Error in game loop:', error);
    return null;
  }
});

// Utility function for crash point calculation
function calculateCrashPoint() {
  const random = Math.random();
  if (random < 0.60) return 1.1 + (Math.random() * 0.9);     // 60% chance: 1.1x - 2x
  if (random < 0.85) return 2 + (Math.random() * 1);         // 25% chance: 2x - 3x
  if (random < 0.95) return 3 + (Math.random() * 2);         // 10% chance: 3x - 5x
  return 5 + (Math.random() * 5);                            // 5% chance: 5x - 10x
}

exports.cryptoWebhook = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    console.log('Received webhook:', req.body);
    
    const { 
      address, 
      confirmations = 0,
      total,
      hash,
      input_addresses
    } = req.body;

    try {
      // Find the pending transaction for this address
      const transactionsRef = admin.firestore().collection('transactions');
      const snapshot = await transactionsRef
        .where('address', '==', address)
        .where('status', '==', 'pending')
        .get();

      if (snapshot.empty) {
        console.log('No matching transaction found for address:', address);
        return res.status(404).json({ error: 'No matching transaction found' });
      }

      const transaction = snapshot.docs[0];
      const transactionData = transaction.data();

      // Update transaction status based on confirmations
      const status = confirmations >= 2 ? 'completed' : 'processing';
      
      await transaction.ref.update({
        status,
        confirmations,
        txHash: hash,
        amount: total / 100000000, // Convert satoshis to BTC
        senderAddress: input_addresses?.[0] || 'unknown',
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      // If transaction is completed, update user's balance
      if (status === 'completed') {
        const btcAmount = total / 100000000;
        const usdAmount = btcAmount * 40000; // Example fixed rate

        await admin.firestore()
          .doc(`users/${transactionData.userId}`)
          .update({
            balance: admin.firestore.FieldValue.increment(usdAmount)
          });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

exports.getStreamToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'User must be logged in'
    );
  }

  try {
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(context.auth.uid)
      .get();
    
    const userData = userDoc.data();

    if (data.type === 'admin' && !userData.isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied', 
        'User must be an admin'
      );
    }

    const token = serverClient.createToken(context.auth.uid);

    return { token };
  } catch (error) {
    console.error('Error generating Stream token:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error generating chat token'
    );
  }
});