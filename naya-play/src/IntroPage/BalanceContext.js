import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  increment,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const BalanceContext = createContext();

export function BalanceProvider({ children }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const auth = getAuth();

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribers = [];

    // Set up balance listener - ONLY from users collection
    const setupBalanceListener = async () => {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        
        const unsubscribeUser = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setBalance(doc.data().balance || 0);
          }
        });
        unsubscribers.push(unsubscribeUser);
      } catch (error) {
        console.error("Error setting up balance listener:", error);
      }
    };
    setupBalanceListener();

    // Listen to user's regular transactions
    const transactionsRef = collection(db, 'transactions');
    const transactionsQuery = query(
      transactionsRef,
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const regularTransactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      updateAllTransactions('regular', regularTransactions);
    });
    unsubscribers.push(unsubscribeTransactions);

    // Listen to agent transactions where user is recipient
    const agentTransactionsRef = collection(db, 'agentTransactions');
    const receiverQuery = query(
      agentTransactionsRef,
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeReceiverTransactions = onSnapshot(receiverQuery, (snapshot) => {
      const receiverTransactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'agent_transfer',
        isReceived: true
      }));
      updateAllTransactions('receiver', receiverTransactions);
    });
    unsubscribers.push(unsubscribeReceiverTransactions);

    // Listen to agent transactions where user is sender
    const senderQuery = query(
      agentTransactionsRef,
      where('agentId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeSenderTransactions = onSnapshot(senderQuery, (snapshot) => {
      const senderTransactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'agent_transfer',
        isReceived: false
      }));
      updateAllTransactions('sender', senderTransactions);
    });
    unsubscribers.push(unsubscribeSenderTransactions);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [auth.currentUser]);

  const updateBalance = async (amount) => {
    if (!auth.currentUser) return;
    
    try {
      // Always use users collection
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      console.log('Updating balance in users by:', amount);

      // Update balance
      await updateDoc(userRef, {
        balance: increment(amount)
      });

      // Record transaction
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.uid,
        amount: amount,
        type: amount > 0 ? 'credit' : 'debit',
        createdAt: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error;
    }
  };

  const updateAllTransactions = (type, newTransactions) => {
    setTransactions(prev => {
      const filteredTransactions = prev.filter(t => {
        if (type === 'regular') return t.type === 'agent_transfer';
        if (type === 'receiver') return t.type !== 'agent_transfer' || !t.isReceived;
        if (type === 'sender') return t.type !== 'agent_transfer' || t.isReceived;
        return true;
      });

      return [...filteredTransactions, ...newTransactions].sort((a, b) => {
        const dateA = (a.createdAt || a.timestamp)?.toDate() || new Date(0);
        const dateB = (b.createdAt || b.timestamp)?.toDate() || new Date(0);
        return dateB - dateA;
      });
    });
  };

  return (
    <BalanceContext.Provider value={{ balance, transactions, updateBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
}

export default BalanceProvider;