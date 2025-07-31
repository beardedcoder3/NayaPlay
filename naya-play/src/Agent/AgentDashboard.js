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
  LogOut,
  Search,
  Calendar,
  User,
  RefreshCcw,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle },
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Clock },
    failed: { bg: 'bg-red-500/10', text: 'text-red-400', icon: AlertCircle }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
};

const LoadingSpinner = () => (
  <div className="flex-1 flex items-center justify-center bg-gray-900 min-h-screen">
    <div className="flex flex-col items-center gap-3">
      <RefreshCcw className="w-8 h-8 text-emerald-500 animate-spin" />
      <p className="text-gray-400 animate-pulse">Loading dashboard...</p>
    </div>
  </div>
);

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
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('all');
  const [agentData, setAgentData] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/agent/login');
      return;
    }

    // Listen to agent's data
    const agentRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribeAgent = onSnapshot(agentRef, (doc) => {
      if (doc.exists()) {
        setAgentData(doc.data());
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
        
        // Filter based on search term
        if (searchTerm && !data.username?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return;
        }
        
        // Filter based on view mode
        if (viewMode !== 'all' && data.status !== viewMode) {
          return;
        }

        transactionData.push(data);
        
        if (data.type === 'agent_transfer' && data.status === 'completed') {
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
  }, [navigate, searchTerm, viewMode]);

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
        type: 'agent_transfer',
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
          amount: transferAmountNum,  // Move amount to top level
          agentUsername: agentSnapshot.data().username,
          timestamp: serverTimestamp(),  // Use serverTimestamp instead of new Date()
          message: `Payment received from agent ${agentSnapshot.data().username}`
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

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000)
      : timestamp instanceof Date 
        ? timestamp 
        : new Date();

    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-6">
              
              <div className="relative group">
                <input 
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 w-72 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all duration-200 border border-gray-600 hover:border-gray-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 group-hover:text-gray-300 transition-colors" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-700 rounded-lg">
                <User className="h-5 w-5 text-emerald-400" />
                <span className="text-white">{agentData?.username}</span>
              </div>
              <button
                onClick={() => {
                  auth.signOut();
                  navigate('/agent/login');
                }}
                className="flex items-center px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400">Balance</h3>
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-semibold text-white">
              ${metrics.totalBalance.toFixed(2)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400">Total Transferred</h3>
              <ArrowUpRight className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-semibold text-white">
              ${metrics.totalTransferred.toFixed(2)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400">Total Transactions</h3>
              <Activity className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-semibold text-white">
              {metrics.totalTransactions}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400">Today's Transactions</h3>
              <History className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-semibold text-white">
              {metrics.todayTransactions}
            </p>
          </motion.div>
        </div>

        {/* Transfer Section and Transaction History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Transfer Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Transfer to User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Recipient Username
                </label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={recipientUsername}
                  onChange={(e) => setRecipientUsername(e.target.value)}
                  className="w-full bg-gray-700/50 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none border border-gray-600 hover:border-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-gray-700/50 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none border border-gray-600 hover:border-gray-500"
                />
              </div>

              <button
                onClick={handleTransfer}
                className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600
                  transition-colors duration-200 font-medium"
              >
                Transfer Funds
              </button>

              {transferMessage && (
                <div className={`p-4 rounded-lg ${
                  transferMessage.includes('successful') 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-red-500/10 text-red-400'
                } flex items-center gap-2`}>
                  {transferMessage.includes('successful') 
                    ? <CheckCircle className="h-5 w-5" />
                    : <AlertCircle className="h-5 w-5" />
                  }
                  <p>{transferMessage}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Recent Transactions</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    viewMode === 'all'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setViewMode('completed')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    viewMode === 'completed'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setViewMode('pending')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    viewMode === 'pending'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              <AnimatePresence>
                {transactions.length > 0 ? transactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{transaction.username}</p>
                        <p className="text-xs text-gray-400">
                          {transaction.timestamp?.toDate()?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-400">
                        ${transaction.amount?.toFixed(2)}
                      </p>
                      <StatusBadge status={transaction.status} />
                    </div>
                  </motion.div>
                )) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <Activity className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No transactions found</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;