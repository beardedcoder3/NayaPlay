import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, updateDoc, doc, orderBy, where } from 'firebase/firestore';
import { Search, Ban, Clock, Shield, AlertTriangle } from 'lucide-react';

const BanDurations = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  'permanent': -1
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banDuration, setBanDuration] = useState('1h');

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
    }
  };

  const handleBanUser = async (userId, duration) => {
    try {
      const userRef = doc(db, 'users', userId);
      const banEndTime = duration === -1 ? -1 : Date.now() + duration;
      
      await updateDoc(userRef, {
        isBanned: true,
        banEndTime: banEndTime,
        banReason: 'Administrative Action'
      });

      // Update local state
      setUsers(users.map(user => {
        if (user.id === userId) {
          return { ...user, isBanned: true, banEndTime };
        }
        return user;
      }));
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isBanned: false,
        banEndTime: null,
        banReason: null
      });

      // Update local state
      setUsers(users.map(user => {
        if (user.id === userId) {
          return { ...user, isBanned: false, banEndTime: null };
        }
        return user;
      }));
    } catch (error) {
      console.error('Error unbanning user:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">User Management</h2>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg
                border border-gray-700 focus:border-indigo-500 focus:ring-1"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-750">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-white">{user.username || user.email}</div>
                    <div className="text-sm text-gray-400">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-white">
                  ${user.balance?.toFixed(2) || '0.00'}
                </td>
                <td className="px-6 py-4">
                  {user.isBanned ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900 text-red-300">
                      Banned
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    {user.isBanned ? (
                      <button
                        onClick={() => handleUnbanUser(user.id)}
                        className="text-green-400 hover:text-green-300"
                      >
                        <Shield size={20} />
                      </button>
                    ) : (
                      <>
                        <select
                          value={banDuration}
                          onChange={(e) => setBanDuration(e.target.value)}
                          className="bg-gray-700 text-white text-sm rounded-lg px-2 py-1"
                        >
                          <option value="1h">1 Hour</option>
                          <option value="24h">24 Hours</option>
                          <option value="7d">7 Days</option>
                          <option value="permanent">Permanent</option>
                        </select>
                        <button
                          onClick={() => handleBanUser(user.id, BanDurations[banDuration])}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Ban size={20} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-gray-400 hover:text-white"
                    >
                      <AlertTriangle size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;