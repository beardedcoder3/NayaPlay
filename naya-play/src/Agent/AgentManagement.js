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
  orderBy 
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
  XCircle
} from 'lucide-react';
import { getDoc } from 'firebase/firestore';

const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState({
    totalAgents: 0,
    pendingVerification: 0,
    activeAgents: 0,
    totalTransferred: 0
  });
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferMessage, setTransferMessage] = useState('');

  useEffect(() => {
    console.log('Setting up agents listener...');
  
    // Query for agents
    const agentsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'agent')
    );
  
    // Query for all completed transfers
    const transactionsQuery = query(
      collection(db, 'agentTransactions'),
      where('type', 'in', ['user_transfer', 'admin_transfer']),
      where('status', '==', 'completed'),
      orderBy('timestamp', 'desc')
    );
  
    // Subscribe to agents
    const unsubscribeAgents = onSnapshot(agentsQuery, (snapshot) => {
      console.log('Received snapshot, size:', snapshot.size);
      
      const agentData = [];
      let activeCount = 0;
      let pendingCount = 0;
  
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        console.log('Agent data:', data);
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
    }, (error) => {
      console.error('Snapshot error:', error);
      setLoading(false);
    });
  
    // Subscribe to transactions
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      let totalTransferred = 0;
      
      snapshot.forEach((doc) => {
        const transaction = doc.data();
        if (transaction.amount) {
          totalTransferred += Number(transaction.amount);
          console.log('Transaction amount:', transaction.amount, 'Total:', totalTransferred);
        }
      });
  
      console.log('Final total transferred:', totalTransferred);
      
      setMetrics(prev => ({
        ...prev,
        totalTransferred
      }));
    });
  
    // Cleanup function
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

      // Add to agent transactions for record
      await addDoc(collection(db, 'agentTransactions'), {
        agentId,
        type: verify ? 'verification_approved' : 'verification_rejected',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating agent status:', error);
    }
  };

  const handleTransferFunds = async () => {
    if (!selectedAgent || !transferAmount) {
      setTransferMessage('Please select an agent and enter amount');
      return;
    }
  
    const amount = Number(transferAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setTransferMessage('Please enter a valid amount');
      return;
    }
  
    try {
      // Get agent reference and current data
      const agentDocRef = doc(db, 'users', selectedAgent.id);
      const agentSnapshot = await getDoc(agentDocRef);
  
      if (!agentSnapshot.exists()) {
        setTransferMessage('Agent not found');
        return;
      }
  
      const currentBalance = agentSnapshot.data().balance || 0;
  
      // Update agent's balance
      await updateDoc(agentDocRef, {
        balance: currentBalance + amount,
        lastUpdated: serverTimestamp()
      });
  
      // Log the transfer
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
  
      setTransferMessage('Transfer successful');
      setTransferAmount('');
      setShowTransferModal(false);
      setSelectedAgent(null);
    } catch (error) {
      console.error('Transfer error:', error);
      setTransferMessage('Transfer failed: ' + error.message);
    }
  };

  const filteredAgents = agents.filter(agent => 
    agent.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400">Total Agents</h3>
            <Users className="text-indigo-400 h-5 w-5" />
          </div>
          <p className="text-2xl font-semibold text-white">{metrics.totalAgents}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400">Pending Verification</h3>
            <ShieldAlert className="text-yellow-400 h-5 w-5" />
          </div>
          <p className="text-2xl font-semibold text-white">{metrics.pendingVerification}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400">Active Agents</h3>
            <Activity className="text-green-400 h-5 w-5" />
          </div>
          <p className="text-2xl font-semibold text-white">{metrics.activeAgents}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400">Total Transferred</h3>
            <ArrowUpRight className="text-blue-400 h-5 w-5" />
          </div>
          <p className="text-2xl font-semibold text-white">
            ${metrics.totalTransferred.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Agents List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Agents List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Registration Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredAgents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-700 
                        flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{agent.username}</p>
                        <p className="text-xs text-gray-400">{agent.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      agent.verified
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {agent.verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-white">{agent.balance?.toFixed(2) || '0.00'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                  {agent.createdAt ? 
  (agent.createdAt.toDate ? 
    agent.createdAt.toDate().toLocaleDateString() 
    : new Date(agent.createdAt).toLocaleDateString()
  ) 
  : 'N/A'
}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {!agent.verified ? (
                        <>
                          <button
                            onClick={() => handleVerifyAgent(agent.id, true)}
                            className="text-green-400 hover:text-green-300"
                            title="Approve Agent"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleVerifyAgent(agent.id, false)}
                            className="text-red-400 hover:text-red-300"
                            title="Reject Agent"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedAgent(agent);
                            setShowTransferModal(true);
                          }}
                          className="text-indigo-400 hover:text-indigo-300 text-sm"
                        >
                          Transfer Funds
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">
              Transfer Funds to Agent
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Agent
                </label>
                <p className="text-white">{selectedAgent?.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                />
              </div>
              {transferMessage && (
                <p className={`text-sm ${
                  transferMessage.includes('successful') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {transferMessage}
                </p>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setSelectedAgent(null);
                    setTransferAmount('');
                    setTransferMessage('');
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransferFunds}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg 
                    hover:bg-indigo-600"
                >
                  Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManagement;