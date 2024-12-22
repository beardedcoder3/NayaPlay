import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDoc,
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, XCircle, Clock, Activity, AlertCircle } from 'lucide-react';

const SupportAgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    const q = query(
      collection(db, 'supportAgents'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const agentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Loaded agents:', agentData);
      setAgents(agentData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (agentId, newStatus) => {
    try {
      console.log('Updating agent status:', { agentId, newStatus });
      
      const agentRef = doc(db, 'supportAgents', agentId);
      const beforeDoc = await getDoc(agentRef);
      console.log('Before update:', beforeDoc.data());

      await updateDoc(agentRef, {
        status: newStatus,
        approvedAt: newStatus === 'approved' ? serverTimestamp() : null
      });

      const afterDoc = await getDoc(agentRef);
      console.log('After update:', afterDoc.data());

    } catch (error) {
      console.error('Error updating agent status:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Handle Firestore Timestamp
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    }
    
    // Handle regular Date objects
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    
    return 'N/A';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-400" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const filteredAgents = agents.filter(agent => 
    selectedStatus === 'all' ? true : agent.status === selectedStatus
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Agents</p>
              <p className="text-2xl font-bold text-white">{agents.length}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Agents</p>
              <p className="text-2xl font-bold text-white">
                {agents.filter(a => a.status === 'approved' && a.isOnline).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending Approval</p>
              <p className="text-2xl font-bold text-white">
                {agents.filter(a => a.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Rejected</p>
              <p className="text-2xl font-bold text-white">
                {agents.filter(a => a.status === 'rejected').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex space-x-2">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Agents</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Agents Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Registered</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredAgents.map((agent) => (
              <tr key={agent.id} className="hover:bg-gray-750">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-white">{agent.fullName || 'N/A'}</div>
                      <div className="text-sm text-gray-400">{agent.email || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(agent.status)}
                    <span className={`ml-2 text-sm ${getStatusColor(agent.status)}`}>
                      {(agent.status || 'pending').charAt(0).toUpperCase() + (agent.status || 'pending').slice(1)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatDate(agent.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {(!agent.status || agent.status === 'pending') && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusChange(agent.id, 'approved')}
                        className="px-3 py-1 bg-green-500/10 text-green-400 rounded-md hover:bg-green-500/20"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange(agent.id, 'rejected')}
                        className="px-3 py-1 bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {agent.status === 'approved' && (
                    <button
                      onClick={() => handleStatusChange(agent.id, 'rejected')}
                      className="px-3 py-1 bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20"
                    >
                      Deactivate
                    </button>
                  )}
                  {agent.status === 'rejected' && (
                    <button
                      onClick={() => handleStatusChange(agent.id, 'approved')}
                      className="px-3 py-1 bg-green-500/10 text-green-400 rounded-md hover:bg-green-500/20"
                    >
                      Reactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupportAgentManagement;