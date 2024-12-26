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
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity, 
  AlertCircle,
  Users,
  Search,
  Headphones,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, color = "blue" }) => {
  const colorVariants = {
    blue: "from-blue-500/20 to-transparent border-blue-500/20 text-blue-400",
    green: "from-green-500/20 to-transparent border-green-500/20 text-green-400",
    yellow: "from-yellow-500/20 to-transparent border-yellow-500/20 text-yellow-400",
    red: "from-red-500/20 to-transparent border-red-500/20 text-red-400"
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
            <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
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

const StatusBadge = ({ status }) => {
  const variants = {
    approved: "bg-green-500/10 text-green-400 border-green-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
  };

  const icons = {
    approved: CheckCircle,
    rejected: XCircle,
    pending: Clock
  };

  const Icon = icons[status] || AlertCircle;

  return (
    <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full 
      text-xs font-medium border ${variants[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
      <Icon size={12} />
      <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </div>
  );
};

const ActionButton = ({ onClick, variant, children }) => {
  const variants = {
    approve: "bg-green-500/10 hover:bg-green-500/20 text-green-400",
    reject: "bg-red-500/10 hover:bg-red-500/20 text-red-400",
    default: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium
        flex items-center space-x-2 ${variants[variant] || variants.default}`}
    >
      {children}
    </button>
  );
};

const SupportAgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
      setAgents(agentData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (agentId, newStatus) => {
    try {
      const agentRef = doc(db, 'supportAgents', agentId);
      await updateDoc(agentRef, {
        status: newStatus,
        approvedAt: newStatus === 'approved' ? serverTimestamp() : null
      });
    } catch (error) {
      console.error('Error updating agent status:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.seconds ? 
      new Date(timestamp.seconds * 1000).toLocaleDateString() :
      timestamp instanceof Date ? 
        timestamp.toLocaleDateString() : 'N/A';
  };

  const filteredAgents = agents.filter(agent => {
    const matchesStatus = selectedStatus === 'all' || agent.status === selectedStatus;
    const matchesSearch = !searchQuery || 
      agent.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Agents"
          value={agents.length}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Active Agents"
          value={agents.filter(a => a.status === 'approved' && a.isOnline).length}
          icon={UserCheck}
          color="green"
        />
        <MetricCard
          title="Pending Approval"
          value={agents.filter(a => a.status === 'pending').length}
          icon={Clock}
          color="yellow"
        />
        <MetricCard
          title="Rejected"
          value={agents.filter(a => a.status === 'rejected').length}
          icon={UserX}
          color="red"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-[#1a1b1e] rounded-2xl border border-white/5 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Headphones className="text-blue-400" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Support Agents</h2>
          </div>
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 bg-[#101114] text-white pl-10 pr-4 py-2 rounded-xl 
                  border border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#101114] text-white px-4 py-2 rounded-xl border border-white/5
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Agents</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Agents Table */}
        <div className="mt-6 overflow-x-auto">
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
                  Registered
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
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 
                        flex items-center justify-center">
                        <Shield className="text-blue-400" size={20} />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {agent.fullName || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {agent.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={agent.status || 'pending'} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Clock size={16} />
                      <span>{formatDate(agent.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {(!agent.status || agent.status === 'pending') && (
                        <>
                          <ActionButton
                            onClick={() => handleStatusChange(agent.id, 'approved')}
                            variant="approve"
                          >
                            <CheckCircle size={16} />
                            <span>Approve</span>
                          </ActionButton>
                          <ActionButton
                            onClick={() => handleStatusChange(agent.id, 'rejected')}
                            variant="reject"
                          >
                            <XCircle size={16} />
                            <span>Reject</span>
                          </ActionButton>
                        </>
                      )}
                      {agent.status === 'approved' && (
                        <ActionButton
                          onClick={() => handleStatusChange(agent.id, 'rejected')}
                          variant="reject"
                        >
                          <Shield size={16} />
                          <span>Deactivate</span>
                        </ActionButton>
                      )}
                      {agent.status === 'rejected' && (
                        <ActionButton
                          onClick={() => handleStatusChange(agent.id, 'approved')}
                          variant="approve"
                        >
                          <Shield size={16} />
                          <span>Reactivate</span>
                        </ActionButton>
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
    </div>
  );
};

export default SupportAgentManagement;