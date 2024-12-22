import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, updateDoc, doc, where, orderBy, limit, serverTimestamp, addDoc } from 'firebase/firestore';
import { Search, Ban, Clock, Shield, AlertTriangle, Eye } from 'lucide-react';

const BlockDurations = [
  { label: '1 Hour', value: 60 * 60 * 1000 },
  { label: '24 Hours', value: 24 * 60 * 60 * 1000 },
  { label: '7 Days', value: 7 * 24 * 60 * 60 * 1000 },
  { label: '30 Days', value: 30 * 24 * 60 * 60 * 1000 },
  { label: 'Permanent', value: -1 }
];

const BlockUserModal = ({ user, onClose, onBlock }) => {
  const [duration, setDuration] = useState(BlockDurations[1].value); // Default 24h
  const [reason, setReason] = useState('');

  const handleBlock = () => {
    onBlock({
      duration,
      reason: reason.trim() || 'Violation of terms',
      endTime: duration === -1 ? -1 : Date.now() + duration
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-white mb-4">Block User</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              User Email
            </label>
            <div className="text-white bg-gray-700/50 p-2 rounded">
              {user.email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Block Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600"
            >
              {BlockDurations.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for blocking..."
              className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 min-h-[100px]"
            />
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={handleBlock}
              className="flex-1 bg-red-500/10 text-red-400 py-2 rounded-lg
                hover:bg-red-500/20 transition-colors"
            >
              Block User
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 text-white py-2 rounded-lg
                hover:bg-gray-600 transition-colors"
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
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
      <h3 className="text-xl font-bold text-white mb-4">User Details</h3>
      
      <div className="space-y-4">
        {/* User Info */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-white">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Username</p>
              <p className="text-white">{user.username || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Balance</p>
              <p className="text-white">${user.balance?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <p className={user.isBlocked ? 'text-red-400' : 'text-green-400'}>
                {user.isBlocked ? 'Blocked' : 'Active'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Statistics</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400">Total Wagered</p>
              <p className="text-white font-medium">${user.stats?.wagered?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Bets</p>
              <p className="text-white font-medium">{user.stats?.totalBets || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Win Rate</p>
              <p className="text-white font-medium">
                {((user.stats?.wins || 0) / (user.stats?.totalBets || 1) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Block Status */}
        {user.isBlocked && (
          <div className="bg-red-500/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="text-red-400" size={20} />
              <h4 className="text-white font-medium">Block Information</h4>
            </div>
            <p className="text-sm text-gray-300">Reason: {user.blockReason}</p>
            <p className="text-sm text-gray-300">
              Duration: {user.blockEndTime === -1 ? 'Permanent' : 
                `Until ${new Date(user.blockEndTime).toLocaleString()}`}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4 mt-6">
          {user.isBlocked ? (
            <button
              onClick={() => onUnblock(user.id)}
              className="flex-1 bg-green-500/10 text-green-400 py-2 rounded-lg
                hover:bg-green-500/20 transition-colors"
            >
              Unblock User
            </button>
          ) : (
            <button
              onClick={() => onBlock(user.id)}
              className="flex-1 bg-red-500/10 text-red-400 py-2 rounded-lg
                hover:bg-red-500/20 transition-colors"
            >
              Block User
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 text-white py-2 rounded-lg
              hover:bg-gray-600 transition-colors"
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

      // Create a notification for the user
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

      // Create an unblock notification
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">User Management</h2>
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search users by email or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg
              border border-gray-700 focus:border-indigo-500 focus:ring-1"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users
              .filter(user => 
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.username?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(user => (
                <tr key={user.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-white">{user.email}</div>
                      <div className="text-sm text-gray-400">
                        {user.username || 'No username'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white">${user.balance?.toFixed(2) || '0.00'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${user.isBlocked 
                        ? 'bg-red-500/10 text-red-400' 
                        : 'bg-green-500/10 text-green-400'}`
                    }>
                      {user.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowBlockModal(false);
                        }}
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Eye size={18} className="text-gray-400" />
                        </button>
                        {user.isBlocked ? (
                          <button
                            onClick={() => handleUnblockUser(user.id)}
                            className="p-2 hover:bg-green-500/10 rounded-lg transition-colors"
                          >
                            <Shield size={18} className="text-green-400" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowBlockModal(true);
                            }}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Ban size={18} className="text-red-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
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