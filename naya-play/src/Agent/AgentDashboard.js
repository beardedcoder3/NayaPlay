import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc, 
  doc,
  writeBatch,
  serverTimestamp,
  addDoc,
  onSnapshot,
  orderBy,
  limit 
} from 'firebase/firestore';
import { 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  History,
  Activity,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AgentDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalBalance: 0,
    totalTransactions: 0,
    todayTransactions: 0,
    totalTransferred: 0
  });
  
  const [transactions, setTransactions] = useState([]);
  const [transferAmount, setTransferAmount] = useState('');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/agent/login');
      return;
    }

    // Listen to agent's data
    const agentRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribeAgent = onSnapshot(agentRef, (doc) => {
      if (doc.exists()) {
        setMetrics(prev => ({
          ...prev,
          totalBalance: doc.data().balance || 0
        }));
      }
    });

    // Listen to transactions
    const transactionsQuery = query(
      collection(db, 'agentTransactions'),
      where('agentId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionData = [];
      let totalTransferred = 0;
      let todayTransactions = 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        transactionData.push(data);
        
        if (data.type === 'user_transfer' && data.status === 'completed') {
          totalTransferred += data.amount;
          if (data.timestamp?.toDate() >= today) {
            todayTransactions++;
          }
        }
      });

      setTransactions(transactionData);
      setMetrics(prev => ({
        ...prev,
        totalTransactions: transactionData.length,
        todayTransactions,
        totalTransferred
      }));
      setLoading(false);
    });

    return () => {
      unsubscribeAgent();
      unsubscribeTransactions();
    };
  }, [navigate]);

  const handleTransfer = async () => {
    if (!recipientUsername || !transferAmount) {
      setTransferMessage('Please fill in all fields');
      return;
    }

    try {
      const transferAmountNum = Number(transferAmount);
      if (isNaN(transferAmountNum) || transferAmountNum <= 0) {
        setTransferMessage('Please enter a valid amount');
        return;
      }

      // Find user by username
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('username', '==', recipientUsername));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        setTransferMessage('User not found');
        return;
      }

      const recipientDoc = userSnapshot.docs[0];
      const recipientRef = doc(db, 'users', recipientDoc.id);
      const agentRef = doc(db, 'users', auth.currentUser.uid);

      // Get current data
      const [agentSnapshot, recipientSnapshot] = await Promise.all([
        getDoc(agentRef),
        getDoc(recipientRef)
      ]);

      if (!agentSnapshot.exists() || !recipientSnapshot.exists()) {
        setTransferMessage('Account data not found');
        return;
      }

      const currentAgentBalance = agentSnapshot.data().balance || 0;
      if (currentAgentBalance < transferAmountNum) {
        setTransferMessage('Insufficient balance');
        return;
      }

      // Create transaction document
      const transactionRef = doc(collection(db, 'agentTransactions'));
      
      // Start batch
      const batch = writeBatch(db);

      // Update recipient's balance
      batch.update(recipientRef, {
        balance: (recipientSnapshot.data().balance || 0) + transferAmountNum
      });

      // Update agent's balance
      batch.update(agentRef, {
        balance: currentAgentBalance - transferAmountNum
      });

      // Create transaction record
      const transactionData = {
        id: transactionRef.id,
        agentId: auth.currentUser.uid,
        agentUsername: agentSnapshot.data().username,
        userId: recipientDoc.id,
        username: recipientUsername,
        amount: transferAmountNum,
        type: 'agent_transfer',  // Changed from 'user_transfer'
        timestamp: serverTimestamp(),
        status: 'completed',
        previousAgentBalance: currentAgentBalance,
        newAgentBalance: currentAgentBalance - transferAmountNum
      };
      
      batch.set(transactionRef, transactionData);
      await batch.commit();

      // Create notification
      try {
        const notificationsRef = collection(db, 'notifications');
        const notificationData = {
          userId: recipientDoc.id,
          transactionId: transactionRef.id,
          type: 'payment_received',
          seen: false,
          data: {
            ...transactionData,
            timestamp: new Date()
          },
          createdAt: new Date()
        };

        await addDoc(notificationsRef, notificationData);
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      setTransferMessage('Transfer successful');
      setTransferAmount('');
      setRecipientUsername('');
    } catch (error) {
      console.error('Transfer error:', error);
      setTransferMessage('Transfer failed: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-white text-xl font-semibold">Agent Dashboard</h1>
            </div>
            <button
              onClick={() => {
                auth.signOut();
                navigate('/agent/login');
              }}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-400 
                hover:text-red-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400">Balance</h3>
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-2xl font-semibold text-white">
              ${metrics.totalBalance.toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400">Total Transferred</h3>
              <ArrowUpRight className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-2xl font-semibold text-white">
              ${metrics.totalTransferred.toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400">Total Transactions</h3>
              <Activity className="h-5 w-5 text-indigo-400" />
            </div>
            <p className="text-2xl font-semibold text-white">
              {metrics.totalTransactions}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400">Today's Transactions</h3>
              <History className="h-5 w-5 text-purple-400" />
            </div>
            <p className="text-2xl font-semibold text-white">
              {metrics.todayTransactions}
            </p>
          </div>
        </div>

        {/* Transfer Section and Transaction History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Transfer Form */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Transfer to User</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={recipientUsername}
                onChange={(e) => setRecipientUsername(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
              />

              <input
                type="number"
                placeholder="Amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
              />

              <button
                onClick={handleTransfer}
                className="w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600
                  transition-colors duration-200"
              >
                Transfer
              </button>

              {transferMessage && (
                <p className={`text-sm ${
                  transferMessage.includes('successful') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {transferMessage}
                </p>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Recent Transactions</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {transactions.length > 0 ? transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{transaction.username}</p>
                    <p className="text-xs text-gray-400">
                      {transaction.timestamp?.toDate()?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-400">
                      ${(transaction.amount || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">{transaction.type}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-400">No transactions yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;