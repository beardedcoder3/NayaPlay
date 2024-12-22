import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          // Don't reload immediately
          const agentDoc = await getDoc(doc(db, 'supportAgents', currentUser.uid));
          if (agentDoc.exists()) {
            currentUser.supportAgent = {
              ...agentDoc.data(),
              isApproved: agentDoc.data().status === 'approved'
            };
          }
          console.log('Current user with agent data:', currentUser);
          setUser(currentUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};

export default useAuth;