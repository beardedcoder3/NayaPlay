// src/contexts/AdminContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminRole, setAdminRole] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          // Check for both boolean true and string "true"
          if (userData?.isAdmin === true || userData?.isAdmin === "true") {
            setIsAdmin(true);
            setAdminRole(userData.adminRole || 'admin');
          } else {
            setIsAdmin(false);
            setAdminRole(null);
          }
        } else {
          setIsAdmin(false);
          setAdminRole(null);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setAdminRole(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('Admin status:', { isAdmin, adminRole, isLoading });
  }, [isAdmin, adminRole, isLoading]);

  return (
    <AdminContext.Provider value={{ isAdmin, isLoading, adminRole }}>
      {!isLoading && children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};