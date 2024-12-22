import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle } from 'lucide-react';
import { Link } from 'lucide-react';

const AgentLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Check if user is an agent
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists() || userDoc.data().role !== 'agent') {
        await auth.signOut();
        setError('Access denied. This portal is for agents only.');
        setLoading(false);
        return;
      }

      if (!userDoc.data().verified) {
        await auth.signOut();
        setError('Your account is pending verification. Please wait for admin approval.');
        setLoading(false);
        return;
      }

      // Update last login
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        lastLogin: new Date().toISOString(),
        online: true
      });

      navigate('/agent/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password');
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

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Agent Login</h2>
          <p className="text-gray-400">Access your agent dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            />
          </div>
          <div className="text-center mt-4">
  <span className="text-gray-400">Don't have an account? </span>
  <Link
    to="/agent/register"
    className="text-indigo-400 hover:text-indigo-300"
  >
    Register here
  </Link>
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgentLogin;