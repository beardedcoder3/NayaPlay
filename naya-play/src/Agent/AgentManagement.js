import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  addDoc, 
  serverTimestamp,
  onSnapshot,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { 
  Users, 
  DollarSign, 
  ShieldCheck, 
  ShieldAlert,
  Activity,
  ArrowUpRight,
  Search,
  CheckCircle,
  XCircle,
  User,
  Wallet,
  Calendar,
  ChevronRight,
  Clock
} from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, trend, color = "blue" }) => {
  const colorVariants = {
    blue: "from-blue-500/20 to-transparent border-blue-500/20 text-blue-400",
    green: "from-green-500/20 to-transparent border-green-500/20 text-green-400",
    yellow: "from-yellow-500/20 to-transparent border-yellow-500/20 text-yellow-400",
    purple: "from-purple-500/20 to-transparent border-purple-500/20 text-purple-400"
  };

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 
        transition-opacity duration-300 from-blue-500/5 via-transparent to-transparent rounded-2xl" />
      
      <div className="relative bg-[#1a1b1e] border border-white/5 rounded-2xl p-6 
        transition-all duration-300 hover:shadow-lg hover:shadow-black/20">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-white tracking-tight">
              {typeof value === 'number' && title.includes('Transferred') ? 
                `$${value.toFixed(2)}` : value}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center
            bg-gradient-to-br from-white/5 to-transparent border border-white/5
            ${colorVariants[color]}`}>
            <Icon size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

const TransferModal = ({ agent, onClose, onTransfer }) => {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleTransfer = () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setMessage('Please enter a valid amount');
      return;
    }
    onTransfer(Number(amount));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1b1e] rounded-2xl max-w-md w-full p-6 border border-white/5">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-xl bg-blue-500/10">
            <Wallet className="text-blue-400" size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">Transfer Funds</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Agent</label>
            <div className="flex items-center space-x-3 p-3 bg-[#101114] rounded-xl border border-white/5">
              <User size={20} className="text-gray-400" />
              <span className="text-white">{agent?.username}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Amount</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <DollarSign size={18} />
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#101114] text-white pl-10 pr-4 py-3 rounded-xl border border-white/5
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount"
              />
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-sm ${
              message.includes('successful') 
                ? 'bg-green-500/10 text-green-400' 
                : 'bg-red-500/10 text-red-400'
            }`}>
              {message}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleTransfer}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl
                transition-all duration-300 font-medium"
            >
              Transfer Funds
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-xl
                transition-all duration-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState({
    totalAgents: 0,
    pendingVerification: 0,
    activeAgents: 0,
    totalTransferred: 0
  });
  const [showTransferModal, setShowTransferModal] = useState(false);

  useEffect(() => {
    console.log('Setting up agents listener...');
  
    const agentsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'agent')
    );
  
    const transactionsQuery = query(
      collection(db, 'agentTransactions'),
      where('type', 'in', ['user_transfer', 'admin_transfer']),
      where('status', '==', 'completed'),
      orderBy('timestamp', 'desc')
    );
  
    const unsubscribeAgents = onSnapshot(agentsQuery, (snapshot) => {
      const agentData = [];
      let activeCount = 0;
      let pendingCount = 0;
  
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        agentData.push(data);
  
        if (data.verified) {
          activeCount++;
        } else {
          pendingCount++;
        }
      });
  
      setAgents(agentData);
      setMetrics(prev => ({
        ...prev,
        totalAgents: snapshot.size,
        activeAgents: activeCount,
        pendingVerification: pendingCount
      }));
      setLoading(false);
    });
  
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      let totalTransferred = 0;
      
      snapshot.forEach((doc) => {
        const transaction = doc.data();
        if (transaction.amount) {
          totalTransferred += Number(transaction.amount);
        }
      });
      
      setMetrics(prev => ({
        ...prev,
        totalTransferred
      }));
    });
  
    return () => {
      if (unsubscribeAgents) unsubscribeAgents();
      if (unsubscribeTransactions) unsubscribeTransactions();
    };
  }, []);

  const handleVerifyAgent = async (agentId, verify = true) => {
    try {
      const agentRef = doc(db, 'users', agentId);
      await updateDoc(agentRef, {
        verified: verify,
        verifiedAt: verify ? serverTimestamp() : null,
        lastUpdated: serverTimestamp()
      });

      await addDoc(collection(db, 'agentTransactions'), {
        agentId,
        type: verify ? 'verification_approved' : 'verification_rejected',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating agent status:', error);
    }
  };

  const handleTransferFunds = async (amount) => {
    if (!selectedAgent || !amount) return;
  
    try {
      const agentDocRef = doc(db, 'users', selectedAgent.id);
      const agentSnapshot = await getDoc(agentDocRef);
  
      if (!agentSnapshot.exists()) return;
  
      const currentBalance = agentSnapshot.data().balance || 0;
  
      await updateDoc(agentDocRef, {
        balance: currentBalance + amount,
        lastUpdated: serverTimestamp()
      });
  
      await addDoc(collection(db, 'agentTransactions'), {
        agentId: selectedAgent.id,
        amount: amount,
        type: 'admin_transfer',
        timestamp: serverTimestamp(),
        status: 'completed',
        agentUsername: selectedAgent.username,
        previousBalance: currentBalance,
        newBalance: currentBalance + amount
      });
  
      setShowTransferModal(false);
      setSelectedAgent(null);
    } catch (error) {
      console.error('Transfer error:', error);
    }
  };

  const filteredAgents = agents.filter(agent => 
    agent.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin" />
          <div className="mt-4 text-sm text-gray-400">Loading agents...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Agents"
          value={metrics.totalAgents}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Pending Verification"
          value={metrics.pendingVerification}
          icon={ShieldAlert}
          color="yellow"
        />
        <MetricCard
          title="Active Agents"
          value={metrics.activeAgents}
          icon={Activity}
          color="green"
        />
        <MetricCard
          title="Total Transferred"
          value={metrics.totalTransferred}
          icon={ArrowUpRight}
          color="purple"
        />
      </div>

      {/* Search and Table */}
      <div className="bg-[#1a1b1e] rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Agents List</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#101114] text-white pl-10 pr-4 py-2 rounded-xl border border-white/5
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#101114] border-b border-white/5">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                  Agent
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                  Balance
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                  Registration
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAgents.map((agent) => (
                <tr key={agent.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <User className="text-blue-400" size={20} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{agent.username}</p>
                        <p className="text-sm text-gray-400">{agent.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium
                      ${agent.verified 
                        ? 'bg-green-500/10 text-green-400' 
                        : 'bg-yellow-500/10 text-yellow-400'}`}
                    >
                      <span className={`w-1 h-1 rounded-full 
                        ${agent.verified ? 'bg-green-400' : 'bg-yellow-400'}`} />
                        <span>{agent.verified ? 'Verified' : 'Pending'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="text-gray-400" size={16} />
                        <span className="text-white font-medium">
                          ${agent.balance?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-gray-400">
                        <Calendar size={16} />
                        <span>
                          {agent.createdAt ? 
                            (agent.createdAt.toDate ? 
                              agent.createdAt.toDate().toLocaleDateString() 
                              : new Date(agent.createdAt).toLocaleDateString()
                            ) 
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {!agent.verified ? (
                          <>
                            <button
                              onClick={() => handleVerifyAgent(agent.id, true)}
                              className="p-2 hover:bg-green-500/10 rounded-xl transition-all duration-300
                                text-green-400"
                              title="Approve Agent"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleVerifyAgent(agent.id, false)}
                              className="p-2 hover:bg-red-500/10 rounded-xl transition-all duration-300
                                text-red-400"
                              title="Reject Agent"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedAgent(agent);
                              setShowTransferModal(true);
                            }}
                            className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400
                              rounded-xl transition-all duration-300 text-sm font-medium
                              flex items-center space-x-2"
                          >
                            <Wallet size={16} />
                            <span>Transfer</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
  
            {filteredAgents.length === 0 && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No agents found</p>
              </div>
            )}
          </div>
        </div>
  
        {/* Transfer Modal */}
        {showTransferModal && (
          <TransferModal
            agent={selectedAgent}
            onClose={() => {
              setShowTransferModal(false);
              setSelectedAgent(null);
            }}
            onTransfer={handleTransferFunds}
          />
        )}
      </div>
    );
  };
  
  export default AgentManagement;