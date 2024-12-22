// src/Admin/AdminContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ADMIN_CONFIG } from './AdminConfig';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminRole, setAdminRole] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && ADMIN_CONFIG.ADMIN_EMAILS.includes(user.email)) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        setIsAdmin(true);
        setAdminRole('super');
        await updateDoc(doc(db, 'users', user.uid), {
          isAdmin: true,
          adminRole: 'super'
        });
      } else {
        setIsAdmin(false);
        setAdminRole(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, isLoading, adminRole }}>
      {children}
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