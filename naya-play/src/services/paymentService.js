import axios from 'axios';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, increment, serverTimestamp } from 'firebase/firestore';

const NOWPAYMENTS_API_KEY = '0RG9GSB-496MXSY-Q671DNV-QSZWKKB';
const API_BASE = 'https://api.nowpayments.io/v1';

export const createPayment = async (userId, cryptocurrency) => {
  try {
    // Create invoice with $30 minimum
    const response = await axios.post(`${API_BASE}/invoice`, {
      price_amount: 30, // Minimum $30
      price_currency: "usd",
      pay_currency: cryptocurrency === 'BTC' ? 'btc' : 'usdttrc20',
      order_id: `${userId}-${Date.now()}`,
      order_description: "Crypto Deposit",
      success_url: "http://localhost:3002/success",
      cancel_url: "http://localhost:3002/cancel",
      ipn_callback_url: "https://bfb7-149-102-244-185.ngrok-free.app/api/crypto-webhook"
    }, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY
      }
    });

    console.log('NOWPayments response:', response.data);

    // Store initial transaction record with only defined fields
    const transactionRef = await addDoc(collection(db, 'transactions'), {
      userId,
      paymentId: response.data.id,
      type: 'deposit',
      status: 'pending',
      cryptocurrency,
      invoiceId: response.data.id,
      invoiceUrl: response.data.invoice_url,
      createdAt: serverTimestamp(),
      amount: response.data.price_amount // Only include amount from response
    });

    return {
      transactionId: transactionRef.id,
      invoiceUrl: response.data.invoice_url
    };
  } catch (error) {
    console.error('Error creating payment:', error);
    if (error.response) {
      console.log('Error response:', error.response.data);
    }
    throw error;
  }
};

export const updateTransaction = async (transactionId, amount, userId) => {
  try {
    const transactionRef = doc(db, 'transactions', transactionId);
    const userRef = doc(db, 'users', userId);

    await updateDoc(transactionRef, {
      status: 'completed',
      amount: amount,
      updatedAt: serverTimestamp()
    });

    await updateDoc(userRef, {
      balance: increment(amount)
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};