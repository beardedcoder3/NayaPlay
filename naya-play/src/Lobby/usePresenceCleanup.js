// usePresenceCleanup.js
import { useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const usePresenceCleanup = () => {
  useEffect(() => {
    const cleanupStalePresence = async () => {
      try {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000; // 5 minutes threshold
        const activeUsersRef = collection(db, 'activeUsers');
        const q = query(
          activeUsersRef,
          where('lastActive', '<', fiveMinutesAgo)
        );

        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      } catch (error) {
        console.error('Error cleaning up stale presence:', error);
      }
    };

    // Run cleanup every minute
    const interval = setInterval(cleanupStalePresence, 60 * 1000);
    return () => clearInterval(interval);
  }, []);
};