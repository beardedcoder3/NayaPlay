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
        // If user exists and not in registration process
        if (currentUser) {
          // Check for verification route
          const isVerification = window.location.pathname === '/verify-email';
          const requiresVerification = sessionStorage.getItem('requiresVerification') === 'true';

          // If on verification page and verification is required, keep the user
          if (isVerification && requiresVerification) {
            setUser(currentUser);
            setLoading(false);
            return;
          }

          // For all other cases, proceed normally
          if (!sessionStorage.getItem('registrationInProgress')) {
            setUser(currentUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
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