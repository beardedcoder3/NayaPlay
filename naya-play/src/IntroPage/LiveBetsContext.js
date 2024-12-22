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
    // Set up real-time listener for most recent bets
    const betsQuery = query(
      collection(db, 'liveBets'),
      orderBy('timestamp', 'desc'),
      limit(MAX_BETS)
    );

    const unsubscribe = onSnapshot(betsQuery, (snapshot) => {
      const bets = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          betAmount: parseFloat(data.betAmount),
          multiplier: parseFloat(data.multiplier),
          payout: parseFloat(data.payout),
          time: formatTime(data.timestamp?.toDate())
        };
      });
      setAllBets(bets);
    });

    // Run initial cleanup
    deleteOldBets();

    return () => unsubscribe();
  }, []);

  const addBet = async (newBet) => {
    try {
      // Add new bet
      await addDoc(collection(db, 'liveBets'), {
        ...newBet,
        timestamp: serverTimestamp(),
        betAmount: parseFloat(newBet.betAmount),
        multiplier: parseFloat(newBet.multiplier),
        payout: parseFloat(newBet.payout)
      });

      // Clean up old bets after adding new one
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