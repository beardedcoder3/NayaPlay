import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertCircle,
  Download,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { 
  collection, 
  query, 
  getDocs,
  orderBy,
  limit 
} from 'firebase/firestore';
import { db } from '../../firebase';

const Card = ({ children, className = '' }) => (
  <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
    {children}
  </div>
);

const FinancialOverview = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [financialStats, setFinancialStats] = useState({
    totalRevenue: 0,
    pendingDeposits: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    recentTransactions: [],
    profitLoss: 0
  });

  // Helper function to parse amount string to number
  const parseAmount = (amount) => {
    return parseFloat(amount || '0');
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      console.error('Date parsing error:', error);
      return dateString;
    }
  };

  useEffect(() => {
    fetchFinancialData();
    const interval = setInterval(fetchFinancialData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timeframe]);

  const fetchFinancialData = async () => {
    try {
      console.log('Fetching transactions...');
      const transactionsRef = collection(db, 'transactions');
      // Create a query to order by createdAt
      const transactionsQuery = query(
        transactionsRef,
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(transactionsQuery);
      console.log('Fetched transactions:', querySnapshot.size);

      let totalDeposits = 0;
      let totalWithdrawals = 0;
      let pendingDeposits = 0;
      const recentTransactions = [];

      querySnapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        console.log('Transaction data:', data);
        
        const amount = parseAmount(data.amount);
        
        if (data.type === 'deposit') {
          totalDeposits += amount;
          if (data.status === 'pending') {
            pendingDeposits += amount;
          }
        } else if (data.type === 'withdrawal') {
          totalWithdrawals += amount;
        }
        
        recentTransactions.push(data);
      });

      setFinancialStats({
        totalRevenue: totalDeposits - totalWithdrawals,
        pendingDeposits,
        totalDeposits,
        totalWithdrawals,
        recentTransactions: recentTransactions.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        ).slice(0, 10),
        profitLoss: totalDeposits - totalWithdrawals
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      setLoading(false);
    }
  };

  const TransactionCard = ({ transaction }) => {
    // Add console.log to debug transaction data
    console.log('Rendering transaction:', transaction);
    
    return (
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div className={`p-2 rounded-full ${
            transaction.type === 'deposit' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {transaction.type === 'deposit' ? <ArrowUpRight /> : <ArrowDownRight />}
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {transaction.userId}
            </p>
            <p className="text-xs text-gray-400">
              Invoice: {transaction.invoiceId}
            </p>
            <p className="text-xs text-gray-400">
              {formatDate(transaction.createdAt)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-medium ${
            transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'
          }`}>
            {transaction.type === 'deposit' ? '+' : '-'} {transaction.amount} {transaction.cryptocurrency}
          </p>
          <p className={`text-xs ${
            transaction.status === 'pending' ? 'text-yellow-400' : 
            transaction.status === 'completed' ? 'text-green-400' : 'text-red-400'
          }`}>
            {transaction.status}
          </p>
          <a 
            href={transaction.invoiceUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs text-blue-400 hover:underline"
          >
            View Invoice
          </a>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Frame Selector */}
      <div className="flex space-x-4 mb-6">
        {['24h', '7d', '30d'].map((time) => (
          <button
            key={time}
            onClick={() => setTimeframe(time)}
            className={`px-4 py-2 rounded-lg ${
              timeframe === time 
                ? 'bg-indigo-500/20 text-indigo-400' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {time}
          </button>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Total Revenue (USDT)</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {financialStats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg text-green-400">
                <DollarSign size={24} />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Pending Deposits (USDT)</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {financialStats.pendingDeposits.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-400">
                <AlertCircle size={24} />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Total Deposits (USDT)</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {financialStats.totalDeposits.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                <Wallet size={24} />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Profit/Loss (USDT)</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {financialStats.profitLoss.toFixed(2)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                financialStats.profitLoss >= 0 
                  ? 'bg-green-500/10 text-green-400' 
                  : 'bg-red-500/10 text-red-400'
              }`}>
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
            <button className="p-2 hover:bg-gray-700 rounded-lg">
              <Download size={20} className="text-gray-400" />
            </button>
          </div>
          <div className="space-y-0">
            {financialStats.recentTransactions.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))}
            {financialStats.recentTransactions.length === 0 && (
              <p className="text-gray-400 text-center py-4">No recent transactions</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FinancialOverview;