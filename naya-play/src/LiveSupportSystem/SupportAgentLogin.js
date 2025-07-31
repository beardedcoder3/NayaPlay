import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { Mail, Loader } from 'lucide-react';

const SupportAgentLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPendingMessage, setShowPendingMessage] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Clear any existing session data
      sessionStorage.clear();
      localStorage.removeItem('registrationInProgress');

      // Sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check agent status
      const agentRef = doc(db, 'supportAgents', userCredential.user.uid);
      const agentDoc = await getDoc(agentRef);

      if (!agentDoc.exists()) {
        console.error('No support agent document found');
        await auth.signOut();
        setError('No support agent account found');
        setLoading(false);
        return;
      }

      const agentData = agentDoc.data();
      
      if (agentData.status !== 'approved') {
        console.error('Agent not approved. Status:', agentData.status);
        await auth.signOut();
        setShowPendingMessage(true);
        setLoading(false);
        return;
      }

      // For approved agents, update their status and navigate
      await updateDoc(agentRef, {
        isOnline: true,
        lastActive: serverTimestamp()
      });

      // Set a flag to identify this as a support agent session
      sessionStorage.setItem('userType', 'support_agent');
      
      // Navigate directly to dashboard
      navigate('/support-agent/dashboard', { replace: true });
      
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  if (showPendingMessage) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-slate-800/50 p-8 rounded-xl border border-white/10">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Application Under Review</h2>
            <p className="text-white/70">
              Thank you for your interest in joining our support team. Your application is currently under review. 
              We will notify you via email once your account has been approved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Support Agent Login</h2>
          <p className="mt-2 text-white/50">Sign in to access your support dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-slate-800/50 p-8 rounded-xl border border-white/10">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg bg-slate-900 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
                <Mail className="absolute right-3 top-3 h-5 w-5 text-white/30" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 rounded-lg bg-slate-900 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <Loader className="animate-spin h-5 w-5" />
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupportAgentLogin;