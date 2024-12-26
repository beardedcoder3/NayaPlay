import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, updateDoc, doc, where, orderBy, limit, serverTimestamp, addDoc } from 'firebase/firestore';
import { 
  Search, 
  Ban, 
  Shield, 
  AlertTriangle, 
  Eye,
  ChevronRight,
  UserCircle,
  Timer,
  AlertCircle
} from 'lucide-react';

const BlockDurations = [
  { label: '1 Hour', value: 60 * 60 * 1000 },
  { label: '24 Hours', value: 24 * 60 * 60 * 1000 },
  { label: '7 Days', value: 7 * 24 * 60 * 60 * 1000 },
  { label: '30 Days', value: 30 * 24 * 60 * 60 * 1000 },
  { label: 'Permanent', value: -1 }
];

const BlockUserModal = ({ user, onClose, onBlock }) => {
  const [duration, setDuration] = useState(BlockDurations[1].value);
  const [reason, setReason] = useState('');

  const handleBlock = () => {
    onBlock({
      duration,
      reason: reason.trim() || 'Violation of terms',
      endTime: duration === -1 ? -1 : Date.now() + duration
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1b1e] rounded-2xl max-w-md w-full p-6 border border-white/5">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-xl bg-red-500/10">
            <Ban className="text-red-400" size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">Block User</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              User Email
            </label>
            <div className="text-white bg-[#101114] border border-white/5 p-3 rounded-xl">
              {user.email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Block Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-[#101114] text-white rounded-xl p-3 border border-white/5
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {BlockDurations.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for blocking..."
              className="w-full bg-[#101114] text-white rounded-xl p-3 border border-white/5
                focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            />
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleBlock}
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 px-4 rounded-xl
                transition-all duration-300 font-medium"
            >
              Block User
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

const UserDetailsModal = ({ user, onClose, onBlock, onUnblock }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-[#1a1b1e] rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto 
      border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-500/10">
            <UserCircle className="text-blue-400" size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">User Details</h3>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* User Info */}
        <div className="bg-[#101114] rounded-xl p-4 border border-white/5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-white font-medium">{user.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Username</p>
              <p className="text-white font-medium">{user.username || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Balance</p>
              <p className="text-white font-medium">${user.balance?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Status</p>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium
                ${user.isBlocked ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}
              >
                {user.isBlocked ? 'Blocked' : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-[#101114] rounded-xl p-4 border border-white/5">
          <h4 className="text-white font-medium mb-4">Statistics</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Total Wagered</p>
              <p className="text-white font-medium">${user.stats?.wagered?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Total Bets</p>
              <p className="text-white font-medium">{user.stats?.totalBets || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Win Rate</p>
              <p className="text-white font-medium">
                {((user.stats?.wins || 0) / (user.stats?.totalBets || 1) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Block Status */}
        {user.isBlocked && (
          <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="text-red-400" size={20} />
              <h4 className="text-white font-medium">Block Information</h4>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <p>Reason: {user.blockReason}</p>
              <p>
                Duration: {user.blockEndTime === -1 ? 'Permanent' : 
                  `Until ${new Date(user.blockEndTime).toLocaleString()}`}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 mt-6">
          {user.isBlocked ? (
            <button
              onClick={() => onUnblock(user.id)}
              className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 
                py-3 px-4 rounded-xl transition-all duration-300 font-medium"
            >
              Unblock User
            </button>
          ) : (
            <button
              onClick={() => onBlock(user.id)}
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 
                py-3 px-4 rounded-xl transition-all duration-300 font-medium"
            >
              Block User
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white 
              py-3 px-4 rounded-xl transition-all duration-300 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
);

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(userData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleBlockUser = async (blockData) => {
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        isBlocked: true,
        blockReason: blockData.reason,
        blockEndTime: blockData.endTime,
        blockedAt: serverTimestamp(),
        blockDuration: blockData.duration
      });

      await addDoc(collection(db, `users/${selectedUser.id}/notifications`), {
        type: 'block',
        title: 'Account Blocked',
        message: `Your account has been blocked. Reason: ${blockData.reason}`,
        duration: blockData.duration,
        endTime: blockData.endTime,
        createdAt: serverTimestamp(),
        read: false
      });

      setUsers(users.map(user => {
        if (user.id === selectedUser.id) {
          return { 
            ...user, 
            isBlocked: true,
            blockEndTime: blockData.endTime,
            blockReason: blockData.reason
          };
        }
        return user;
      }));

      setShowBlockModal(false);
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isBlocked: false,
        blockEndTime: null,
        blockReason: null,
        blockedAt: null,
        blockDuration: null
      });

      await addDoc(collection(db, `users/${userId}/notifications`), {
        type: 'unblock',
        title: 'Account Unblocked',
        message: 'Your account has been unblocked. You can now resume normal activity.',
        createdAt: serverTimestamp(),
        read: false
      });

      setUsers(users.map(user => {
        if (user.id === userId) {
          return { 
            ...user, 
            isBlocked: false,
            blockEndTime: null,
            blockReason: null
          };
        }
        return user;
      }));

      setSelectedUser(null);
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin" />
          <div className="mt-4 text-sm text-gray-400">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1b1e] text-white pl-10 pr-4 py-2.5 rounded-xl
              border border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#1a1b1e] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
              <thead>
                <tr className="bg-[#101114] border-b border-white/5">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Balance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users
                  .filter(user => 
                    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(user => (
                    <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                              <UserCircle className="text-blue-400" size={20} />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-white">{user.email}</div>
                            <div className="text-sm text-gray-400">
                              {user.username || 'No username'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">
                          ${user.balance?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium
                          ${user.isBlocked 
                            ? 'bg-red-500/10 text-red-400' 
                            : 'bg-green-500/10 text-green-400'}`
                        }>
                          <span className="w-1 h-1 rounded-full 
                            ${user.isBlocked ? 'bg-red-400' : 'bg-green-400'}" />
                          <span>{user.isBlocked ? 'Blocked' : 'Active'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowBlockModal(false);
                            }}
                            className="p-2 hover:bg-white/5 rounded-xl transition-colors group-hover:text-white
                              text-gray-400"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {user.isBlocked ? (
                            <button
                              onClick={() => handleUnblockUser(user.id)}
                              className="p-2 hover:bg-green-500/10 rounded-xl transition-colors
                                text-green-400"
                              title="Unblock User"
                            >
                              <Shield size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowBlockModal(true);
                              }}
                              className="p-2 hover:bg-red-500/10 rounded-xl transition-colors
                                text-red-400"
                              title="Block User"
                            >
                              <Ban size={18} />
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

        {/* User Details Modal */}
        {selectedUser && !showBlockModal && (
          <UserDetailsModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onBlock={() => setShowBlockModal(true)}
            onUnblock={handleUnblockUser}
          />
        )}

        {/* Block User Modal */}
        {showBlockModal && (
          <BlockUserModal
            user={selectedUser}
            onClose={() => {
              setShowBlockModal(false);
              setSelectedUser(null);
            }}
            onBlock={handleBlockUser}
          />
        )}
      </div>
    );
};

export default UserManagement;