import React, { useState, useEffect } from 'react';
import { Wallet, DollarSign, Bitcoin, Gift, UserCheck } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';

const TabButton = ({ name, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200
      ${isActive 
        ? 'bg-indigo-600 text-white' 
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
  >
    <Icon size={20} />
    <span>{name}</span>
  </button>
);

const PaymentTypeButton = ({ type, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
      ${isActive 
        ? 'bg-gray-700 text-white' 
        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
      }`}
  >
    <Icon size={16} />
    <span>{type}</span>
  </button>
);

const TransactionRow = ({ transaction }) => {
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'finished':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'credited':
        return 'bg-blue-500/20 text-blue-400';
      case 'processing':
        return 'bg-indigo-500/20 text-indigo-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getAmountDisplay = () => {
    let prefix = '+';
    const isReceived = transaction.userId === auth.currentUser.uid;
  
    if (transaction.type === 'agent_transfer' || transaction.type === 'user_transfer') {
      prefix = isReceived ? '+' : '-';
    } else if (transaction.type === 'withdrawal') {
      prefix = '-';
    }
  
    const amount = parseFloat(transaction.amount);
    const displayAmount = !isNaN(amount) ? amount.toFixed(2) : '0.00';
  
    return `${prefix}$${displayAmount}`;
  };

  const getMethodDisplay = () => {
    if (transaction.type === 'agent_transfer' || transaction.type === 'user_transfer') {
      return `Agent: ${transaction.agentUsername || 'Unknown'}`;
    }
  
    return transaction.method || transaction.type;
  };

  return (
    <div className="grid grid-cols-4 gap-4 py-4 px-6 hover:bg-gray-800/50 transition-colors
      border-b border-gray-700/50 last:border-0">
      <div>
        <p className={`font-medium ${
          transaction.type === 'withdrawal' || 
          (transaction.type === 'agent_transfer' && transaction.agentId === auth.currentUser.uid)
            ? 'text-red-400' 
            : 'text-green-400'
        }`}>
          {getAmountDisplay()}
        </p>
      </div>
      <div className="flex items-center space-x-2 text-gray-300">
        <Gift size={16} className="text-gray-400" />
        <span>{getMethodDisplay()}</span>
      </div>
      <div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(transaction.status)}`}>
          {transaction.status || 'Completed'}
        </span>
      </div>
      <div className="text-gray-400 text-sm">
        {transaction.timestamp?.toDate().toLocaleString()}
      </div>
    </div>
  );
};

const TransactionsPage = () => {
  const [activeTab, setActiveTab] = useState('others');
  const [paymentType, setPaymentType] = useState('crypto');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    setLoading(true);
    const unsubscribers = [];

    // Regular transactions
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const regularTransactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      updateTransactions('regular', regularTransactions);
    });
    unsubscribers.push(unsubTransactions);

    // Bonus redemptions
    const bonusQuery = query(
      collection(db, 'bonusRedemptions'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubBonus = onSnapshot(bonusQuery, (snapshot) => {
      const bonusTransactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'bonus_redeem',
          status: 'Completed',
          amount: data.amount,
          code: data.code,
          timestamp: data.timestamp,
          userId: data.userId
        };
      });
      updateTransactions('bonus', bonusTransactions);
    });
    unsubscribers.push(unsubBonus);

    // Agent transactions
    const agentTransactionsQuery = query(
      collection(db, 'agentTransactions'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubAgentReceived = onSnapshot(agentTransactionsQuery, (snapshot) => {
      const agentTransactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isReceived: true
      }));
      updateTransactions('agentReceived', agentTransactions);
    });
    unsubscribers.push(unsubAgentReceived);

    const agentSentQuery = query(
      collection(db, 'agentTransactions'),
      where('agentId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubAgentSent = onSnapshot(agentSentQuery, (snapshot) => {
      const sentTransactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isReceived: false
      }));
      updateTransactions('agentSent', sentTransactions);
    });
    unsubscribers.push(unsubAgentSent);

    const updateTransactions = (type, newTransactions) => {
      setTransactions(prev => {
        let filtered = [];
        if (type === 'bonus') {
          filtered = prev.filter(t => t.type !== 'bonus_redeem');
        } else if (type === 'regular') {
          filtered = prev.filter(t => t.type !== 'deposit' && t.type !== 'withdrawal');
        } else if (type === 'agentReceived') {
          filtered = prev.filter(t => !t.isReceived || t.type !== 'agent_transfer');
        } else if (type === 'agentSent') {
          filtered = prev.filter(t => t.isReceived || t.type !== 'agent_transfer');
        }

        return [...filtered, ...newTransactions].sort((a, b) => {
          const dateA = (a.timestamp || a.createdAt)?.toDate() || new Date(0);
          const dateB = (b.timestamp || b.createdAt)?.toDate() || new Date(0);
          return dateB - dateA;
        });
      });
      setLoading(false);
    };

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [auth.currentUser]);

  const filteredTransactions = transactions.filter(transaction => {
    if (activeTab === 'agents') {
      return transaction.type === 'agent_transfer' || transaction.type === 'user_transfer';
    }
    if (activeTab === 'deposits') {
      return transaction.type === 'deposit';
    }
    if (activeTab === 'withdrawals') {
      return transaction.type === 'withdrawal';
    }
    if (activeTab === 'others') {
      return transaction.type === 'bonus_redeem';
    }
    return false;
  });

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 
            bg-clip-text text-transparent">
            Transactions
          </h1>
          <p className="text-gray-400">View your transaction history</p>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50">
          <div className="p-4 border-b border-gray-700/50">
            <div className="flex space-x-4">
              <TabButton 
                name="Others" 
                icon={Gift} 
                isActive={activeTab === 'others'} 
                onClick={() => setActiveTab('others')}
              />
              <TabButton 
                name="Deposits" 
                icon={Wallet} 
                isActive={activeTab === 'deposits'} 
                onClick={() => setActiveTab('deposits')}
              />
              <TabButton 
                name="Withdrawals" 
                icon={DollarSign} 
                isActive={activeTab === 'withdrawals'} 
                onClick={() => setActiveTab('withdrawals')}
              />
              <TabButton 
                name="Agent Transfers" 
                icon={UserCheck} 
                isActive={activeTab === 'agents'} 
                onClick={() => setActiveTab('agents')}
              />
            </div>
          </div>

          {(activeTab === 'deposits' || activeTab === 'withdrawals') && (
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex space-x-4">
                <PaymentTypeButton 
                  type="Crypto" 
                  icon={Bitcoin} 
                  isActive={paymentType === 'crypto'} 
                  onClick={() => setPaymentType('crypto')}
                />
                <PaymentTypeButton 
                  type="Local Currency" 
                  icon={DollarSign} 
                  isActive={paymentType === 'local'} 
                  onClick={() => setPaymentType('local')}
                />
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-700/50">
            <div className="grid grid-cols-4 gap-4 py-3 px-6 bg-gray-800/50">
              <div className="text-sm font-medium text-gray-400">Amount</div>
              <div className="text-sm font-medium text-gray-400">Method</div>
              <div className="text-sm font-medium text-gray-400">Status</div>
              <div className="text-sm font-medium text-gray-400">Date</div>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 
                  rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading transactions...</p>
              </div>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map(transaction => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-400">No transactions found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;