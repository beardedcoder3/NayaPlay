// services/crashGameService.js
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    updateDoc,
    doc,
    serverTimestamp,
    orderBy,
    limit,
    getDoc,
    increment 
  } from 'firebase/firestore';
  import { db } from '../../../firebase';
  import { GAME_CONFIG } from '../config/gameConfig';
  import { calculateCrashPoint } from '../utils/gameUtils';
  
  class CrashGameService {
    constructor() {
      this.gamesRef = collection(db, 'crashGames');
      this.playersRef = collection(db, 'crashPlayers');
    }
  
    async getCurrentGame() {
        try {
          const activeGames = await getDocs(
            query(this.gamesRef, where('status', '==', 'active'), limit(1))
          );
      
          if (!activeGames.empty) {
            const doc = activeGames.docs[0];
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              startedAt: data.startedAt,
              playStartedAt: data.playStartedAt,
              endedAt: data.endedAt
            };
          }
          return null;
        } catch (error) {
          console.error('Error getting current game:', error);
          throw error;
        }
      }
      
  
      async startNewGame() {
        try {
          // Check for and clean up any existing active games
          const activeGames = await getDocs(
            query(this.gamesRef, where('status', '==', 'active'))
          );
          
          // Clean up all active games
          await Promise.all(
            activeGames.docs.map(doc => 
              updateDoc(doc.ref, {
                status: 'finished',
                state: 'crashed',
                endedAt: serverTimestamp()
              })
            )
          );
      
          // Wait a moment before starting new game
          await new Promise(resolve => setTimeout(resolve, 100));
      
          // Create new game
          const crashPoint = calculateCrashPoint();
          const gameData = {
            startedAt: serverTimestamp(),
            crashPoint,
            status: 'active',
            state: 'betting',
            multiplier: 1,
            countdown: GAME_CONFIG.COUNTDOWN_TIME,
            playStartedAt: null,
            totalBets: 0,
            totalAmount: 0
          };
      
          const gameRef = await addDoc(this.gamesRef, gameData);
          return { id: gameRef.id, ...gameData };
        } catch (error) {
          console.error('Error starting new game:', error);
          throw error;
        }
      }
  
    async placeBet(userId, username, gameId, betAmount) {
      try {
        // Get current game state
        const gameRef = doc(this.gamesRef, gameId);
        const gameDoc = await getDoc(gameRef);
  
        if (!gameDoc.exists()) {
          throw new Error('Game not found');
        }
  
        const gameData = gameDoc.data();
        if (gameData.state !== 'betting' || gameData.betsLocked) {
          throw new Error('Betting is not currently allowed');
        }
  
        // Check for existing bet
        const existingBets = await getDocs(
          query(
            this.playersRef,
            where('gameId', '==', gameId),
            where('userId', '==', userId)
          )
        );
        
        if (!existingBets.empty) {
          throw new Error('You already have a bet in this game');
        }
  
        // Place bet
        const betData = {
          userId,
          username,
          gameId,
          betAmount: Number(betAmount),
          placedAt: serverTimestamp(),
          status: 'playing',
          cashoutMultiplier: null,
          winAmount: null
        };
  
        const betRef = await addDoc(this.playersRef, betData);
  
        // Update game totals
        await updateDoc(gameRef, {
          totalBets: increment(1),
          totalAmount: increment(betAmount)
        });
  
        return { id: betRef.id, ...betData };
      } catch (error) {
        console.error('Error placing bet:', error);
        throw error;
      }
    }
  
    async cashOut(playerId, gameId, multiplier, betAmount) {
      try {
        // Verify game state
        const gameRef = doc(this.gamesRef, gameId);
        const gameDoc = await getDoc(gameRef);
  
        if (!gameDoc.exists()) {
          throw new Error('Game not found');
        }
  
        const gameData = gameDoc.data();
        if (gameData.state !== 'playing') {
          throw new Error('Game is not in playing state');
        }
  
        if (multiplier > gameData.crashPoint) {
          throw new Error('Invalid cashout multiplier');
        }
  
        const winAmount = betAmount * multiplier;
        const playerRef = doc(this.playersRef, playerId);
        
        await updateDoc(playerRef, {
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
  
    async updateGameState(gameId, state, data = {}) {
      try {
        const gameRef = doc(this.gamesRef, gameId);
        const updateData = {
          state,
          ...data
        };
  
        switch (state) {
          case 'betting':
            updateData.playStartedAt = null;
            updateData.multiplier = 1.00;
            updateData.betsLocked = false;
            break;
            
          case 'playing':
            updateData.playStartedAt = serverTimestamp();
            updateData.betsLocked = true;
            break;
            
          case 'crashed':
            updateData.status = 'finished';
            updateData.endedAt = serverTimestamp();
            updateData.finalMultiplier = data.multiplier || 1.00;
            updateData.betsLocked = true;
            break;
        }
  
        await updateDoc(gameRef, updateData);
      } catch (error) {
        console.error('Error updating game state:', error);
        throw error;
      }
    }
  
    async getRecentCrashes(limit = 5) {
        try {
          const crashesSnapshot = await getDocs(
            query(
              this.gamesRef,
              where('status', '==', 'finished'),
              where('finalMultiplier', '>', 0),
              orderBy('finalMultiplier', 'desc'),
              orderBy('endedAt', 'desc'),
              limit(limit)
            )
          );
      
          return crashesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              multiplier: data.finalMultiplier || 1.00,
              endedAt: data.endedAt?.toMillis ? data.endedAt.toMillis() : null
            };
          });
        } catch (error) {
          console.error('Error getting recent crashes:', error);
          throw error;
        }
      }
  
    async cleanupStuckGames() {
      try {
        const stuckGames = await getDocs(
          query(
            this.gamesRef,
            where('status', '==', 'active'),
            where('startedAt', '<', new Date(Date.now() - 5 * 60 * 1000)) // Games older than 5 minutes
          )
        );
  
        for (const doc of stuckGames.docs) {
          await updateDoc(doc.ref, {
            status: 'finished',
            state: 'crashed',
            endedAt: serverTimestamp(),
            finalMultiplier: doc.data().multiplier || 1.00
          });
        }
      } catch (error) {
        console.error('Error cleaning up stuck games:', error);
      }
    }
  }
  
  export const crashGameService = new CrashGameService();