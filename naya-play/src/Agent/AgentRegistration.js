import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Shield, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { getDocs, query, collection, where } from 'firebase/firestore';

const AgentRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Starting registration process...'); // Debug log

      // Create auth account first
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      console.log('Auth account created:', userCredential.user.uid); // Debug log

      // Create the user document with all required fields
      const userData = {
        username: formData.username,
        email: formData.email,
        role: 'agent', // Make sure this is exactly 'agent'
        verified: false,
        balance: 0,
        online: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      console.log('Preparing to save user data:', userData); // Debug log

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      console.log('User document created successfully'); // Debug log

      setSuccess(true);
      await auth.signOut();
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
};
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 text-center">
          <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Registration Successful</h2>
          <p className="text-gray-400 mb-6">
            Your agent account is pending verification. Please wait for admin approval.
          </p>
          <Link
            to="/agent/login"
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Agent Registration</h2>
          <p className="text-gray-400">Create your agent account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
              placeholder="Enter your password"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
              placeholder="Confirm your password"
              minLength={6}
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-400 bg-red-400/10 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 text-white py-2 px-4 rounded-lg
              hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>

          <div className="text-center">
            <span className="text-gray-400">Already have an account? </span>
            <Link
              to="/agent/login"
              className="text-indigo-400 hover:text-indigo-300"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgentRegistration;