import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, increment, serverTimestamp } from 'firebase/firestore';
import { getCryptoPrice } from './blockCypherServices';

export const initiateDeposit = async (userId, cryptocurrency, address) => {
  try {
    const transactionRef = await addDoc(collection(db, 'transactions'), {
      userId,
      type: 'deposit',
      status: 'pending',
      cryptocurrency,
      address,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      transactionId: transactionRef.id,
      address
    };
  } catch (error) {
    console.error('Error initiating deposit:', error);
    throw error;
  }
};

export const updateTransactionStatus = async (transactionId, btcAmount, userId) => {
  try {
    const btcPrice = await getCryptoPrice('btc');
    const usdAmount = btcAmount * btcPrice;

    const transactionRef = doc(db, 'transactions', transactionId);
    await updateDoc(transactionRef, {
      status: 'completed',
      amount: btcAmount,
      usdValue: usdAmount,
      lastUpdated: serverTimestamp()
    });

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      balance: increment(usdAmount)
    });

    return usdAmount;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};