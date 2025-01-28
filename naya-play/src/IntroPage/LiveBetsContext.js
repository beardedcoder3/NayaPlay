import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  deleteDoc, 
  addDoc, 
  serverTimestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { getDoc} from 'firebase/firestore';
import { doc } from 'firebase/firestore';
import { where } from 'firebase/firestore';
const LiveBetsContext = createContext();
const MAX_BETS = 10;

const formatTime = (date) => {
  if (!date) return "Just now";
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export const LiveBetsProvider = ({ children }) => {
  const [allBets, setAllBets] = useState([]);

  // Function to delete old bets
  const deleteOldBets = async () => {
    try {
      // Get all bets ordered by timestamp
      const betsQuery = query(
        collection(db, 'liveBets'),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(betsQuery);
      
      // If we have more than MAX_BETS
      if (snapshot.size > MAX_BETS) {
        // Get the documents to delete (everything after MAX_BETS)
        const docsToDelete = snapshot.docs.slice(MAX_BETS);
        
        // Firestore batches are limited to 500 operations
        // So we'll delete in chunks if necessary
        const deleteChunks = [];
        for (let i = 0; i < docsToDelete.length; i += 500) {
          const chunk = docsToDelete.slice(i, i + 500);
          const batch = writeBatch(db);
          
          chunk.forEach((doc) => {
            batch.delete(doc.ref);
          });
          
          deleteChunks.push(batch.commit());
        }
        
        await Promise.all(deleteChunks);
        console.log(`Deleted ${docsToDelete.length} old bets`);
      }
    } catch (error) {
      console.error("Error deleting old bets:", error);
    }
  };

  useEffect(() => {
    const betsQuery = query(
      collection(db, 'liveBets'),
      orderBy('timestamp', 'desc'),
      limit(MAX_BETS)
    );
  
    const unsubscribe = onSnapshot(betsQuery, async (snapshot) => {
      const userDisplayNames = new Map();
      const userGhostModes = new Map();
      const userIds = [...new Set(snapshot.docs.map(doc => doc.data().userId))];
  
      // Fetch user documents including ghost mode status
      await Promise.all(userIds.map(async (userId) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
  
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userDisplayNames.set(userId, userData.username);
            userGhostModes.set(userId, userData.ghostMode);
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
        }
      }));
  
      const bets = snapshot.docs.map(doc => {
        const data = doc.data();
        const isGhostMode = userGhostModes.get(data.userId) || false;
        const username = isGhostMode ? 'Anonymous' : (userDisplayNames.get(data.userId) || data.user);
        const isLoss = data.status === 'lost' || data.multiplier === 0;
        
        return {
          id: doc.id,
          ...data,
          user: username,
          betAmount: parseFloat(data.betAmount),
          multiplier: isLoss ? '0' : parseFloat(data.multiplier).toFixed(2),
          multiplierColor: isLoss ? 'text-red-500' : 'text-blue-500',
          payout: isLoss ? -parseFloat(data.betAmount) : parseFloat(data.payout),
          time: formatTime(data.timestamp?.toDate())
        };
      });
      
      setAllBets(bets);
    });
  
    deleteOldBets();
    return () => unsubscribe();
  }, []);
  
  const addBet = async (newBet, user) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let username = user.displayName;
      let isGhostMode = false;
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        username = userData.username || username;
        isGhostMode = userData.ghostMode || false;
      }
  
      await addDoc(collection(db, 'liveBets'), {
        ...newBet,
        userId: user.uid,
        user: isGhostMode ? 'Anonymous' : username,
        timestamp: serverTimestamp(),
        betAmount: parseFloat(newBet.betAmount),
        multiplier: newBet.status === 'lost' ? 0 : parseFloat(newBet.multiplier).toFixed(2),
        payout: parseFloat(newBet.payout)
      });
  
      await deleteOldBets();
    } catch (error) {
      console.error("Error adding bet:", error);
    }
  };

  return (
    <LiveBetsContext.Provider value={{ allBets, addBet }}>
      {children}
    </LiveBetsContext.Provider>
  );
};

export const useLiveBets = () => {
  const context = useContext(LiveBetsContext);
  if (!context) {
    throw new Error('useLiveBets must be used within a LiveBetsProvider');
  }
  return context;
};

export default LiveBetsProvider;