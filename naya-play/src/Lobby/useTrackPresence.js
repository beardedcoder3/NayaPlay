// hooks/useTrackPresence.js
import { useEffect } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const useTrackPresence = (gameId) => {
  useEffect(() => {
    if (!gameId) return;

    // Use sessionStorage to maintain a stable ID per browser tab
    const generateStableId = () => {
      const tabId = sessionStorage.getItem('tabId') || Math.random().toString(36).substring(2);
      sessionStorage.setItem('tabId', tabId);
      return tabId;
    };

    const sessionId = generateStableId();
    const presenceRef = doc(db, 'activeUsers', sessionId);

    // Function to cleanup old presence
    const cleanup = () => {
      return deleteDoc(presenceRef).catch(console.error);
    };

    // Set user as present in this game
    const setPresence = async () => {
      await cleanup(); // Clean up any existing presence first
      await setDoc(presenceRef, {
        gameId,
        lastActive: Date.now()
      });
    };

    // Set initial presence
    setPresence();

    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanup();
      } else {
        setPresence();
      }
    };

    // Handle tab visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up an interval to update lastActive
    const intervalId = setInterval(() => {
      setPresence();
    }, 30000); // Update every 30 seconds

    // Cleanup on unmount or route change
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
      cleanup();
    };
  }, [gameId]);
};