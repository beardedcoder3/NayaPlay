// src/Admin/AdminLogin.js
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { ADMIN_CONFIG } from './AdminConfig';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in and is admin
    if (auth.currentUser?.email && ADMIN_CONFIG.ADMIN_EMAILS.includes(auth.currentUser.email)) {
      console.log('Admin user detected');
    }
  }, []);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!auth.currentUser) {
      setError('You must be logged in first');
      return;
    }

    if (!ADMIN_CONFIG.ADMIN_EMAILS.includes(auth.currentUser.email)) {
      setError('Unauthorized access');
      return;
    }

    if (password === ADMIN_CONFIG.ADMIN_PASSWORD) {
      navigate(`${ADMIN_CONFIG.SECURE_PATH}/dashboard`);
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl p-8 w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 mx-auto mb-4 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">Admin Access</h2>
          {auth.currentUser?.email && (
            <p className="mt-2 text-sm text-gray-400">
              Logged in as: {auth.currentUser.email}
            </p>
          )}
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg
                border border-gray-600 focus:border-indigo-500 focus:ring-1"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium
              hover:bg-indigo-500 transition-colors"
          >
            Access Admin Panel
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;