// crashGameService.js
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc,
  serverTimestamp,
  limit,
  getDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

const calculateCrashPoint = () => {
  const random = Math.random();
  if (random < 0.60) return 1.1 + (Math.random() * 0.9);
  if (random < 0.85) return 2 + (Math.random() * 1);
  if (random < 0.95) return 3 + (Math.random() * 2);
  return 5 + (Math.random() * 5);
};

class CrashGameService {
  async getCurrentGame() {
    try {
      const gamesQuery = query(
        collection(db, 'crashGames'),
        where('status', '==', 'active'),
        limit(1)
      );
      
      const snapshot = await getDocs(gamesQuery);
      return snapshot.empty ? null : {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };
    } catch (error) {
      console.error('Error getting current game:', error);
      throw error;
    }
  }

  async startNewGame() {
    try {
      // Clean up any existing active games
      const activeGames = await getDocs(
        query(collection(db, 'crashGames'), where('status', '==', 'active'))
      );
      
      for (const doc of activeGames.docs) {
        await updateDoc(doc.ref, {
          status: 'finished',
          state: 'crashed',
          endedAt: serverTimestamp()
        });
      }

      const crashPoint = calculateCrashPoint();
      return await addDoc(collection(db, 'crashGames'), {
        startedAt: serverTimestamp(),
        playStartedAt: null,
        crashPoint,
        status: 'active',
        state: 'betting',
        multiplier: 1,
        countdown: 10
      });
    } catch (error) {
      console.error('Error starting new game:', error);
      throw error;
    }
  }

  async placeBet(userId, username, gameId, betAmount) {
    try {
      // Verify game is in betting state
      const gameDoc = await getDoc(doc(db, 'crashGames', gameId));
      if (!gameDoc.exists() || gameDoc.data().state !== 'betting') {
        throw new Error('Game is not in betting state');
      }

      // Check for existing bet
      const existingBetQuery = query(
        collection(db, 'crashPlayers'),
        where('gameId', '==', gameId),
        where('userId', '==', userId)
      );
      
      const existingBet = await getDocs(existingBetQuery);
      if (!existingBet.empty) {
        throw new Error('Player already has a bet in this game');
      }

      // Place bet
      const playerDoc = await addDoc(collection(db, 'crashPlayers'), {
        userId,
        username,
        gameId,
        betAmount: Number(betAmount),
        placedAt: serverTimestamp(),
        status: 'playing'
      });

      return {
        id: playerDoc.id,
        ...(await getDoc(playerDoc)).data()
      };
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
  }

  async cashOut(playerId, multiplier, betAmount) {
    try {
      const winAmount = betAmount * multiplier;
      await updateDoc(doc(db, 'crashPlayers', playerId), {
        status: 'cashed_out',
        cashoutMultiplier: multiplier,
        winAmount,
        cashedAt: serverTimestamp()
      });
      return winAmount;
    } catch (error) {
      console.error('Error cashing out:', error);
      throw error;
    }
  }

  async updateGameState(gameId, state, multiplier = null) {
    try {
      if (!gameId) return;

      const gameRef = doc(db, 'crashGames', gameId);
      const updateData = { state };

      if (state === 'playing') {
        updateData.playStartedAt = serverTimestamp();
      } 
      else if (state === 'crashed') {
        updateData.status = 'finished';
        updateData.endedAt = serverTimestamp();
        updateData.finalMultiplier = multiplier;
      }

      await updateDoc(gameRef, updateData);
    } catch (error) {
      console.error('Error updating game state:', error);
      throw error;
    }
  }
}

export const crashGameService = new CrashGameService();