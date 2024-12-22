import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, where, orderBy, updateDoc, increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const BalanceContext = createContext();

export function BalanceProvider({ children }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const auth = getAuth();

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribers = [];

    // Listen to user's balance
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribeBalance = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setBalance(doc.data().balance || 0);
      }
    });
    unsubscribers.push(unsubscribeBalance);

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

    const updateAllTransactions = (type, newTransactions) => {
      setTransactions(prev => {
        // Filter out old transactions of this type
        const filteredTransactions = prev.filter(t => {
          if (type === 'regular') return t.type === 'agent_transfer';
          if (type === 'receiver') return t.type !== 'agent_transfer' || !t.isReceived;
          if (type === 'sender') return t.type !== 'agent_transfer' || t.isReceived;
          return true;
        });

        // Combine and sort all transactions
        return [...filteredTransactions, ...newTransactions].sort((a, b) => {
          const dateA = (a.createdAt || a.timestamp)?.toDate() || new Date(0);
          const dateB = (b.createdAt || b.timestamp)?.toDate() || new Date(0);
          return dateB - dateA;
        });
      });
    };

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [auth.currentUser]);

  const updateBalance = async (amount) => {
    if (!auth.currentUser) return;
    
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      balance: increment(amount)
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