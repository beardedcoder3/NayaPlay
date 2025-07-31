import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { UserCircle, Calendar, Phone, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

const AgentRegistration = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
  
      const userData = {
        email: formData.email,
        username: formData.email.split('@')[0], // Generate a username from email
        displayUsername: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        createdAt: new Date(),
        emailVerified: false,
        balance: 0,
        lastActive: new Date(),
        status: 'pending',
        notifications: [],
        notificationsEnabled: true,
        role: 'agent',
        verified: false,
        phone: formData.phone
      };
  
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      
      // Redirect or show success message
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="bg-emerald-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Top-up Agent Registration</h2>
          <p className="text-gray-400">Join our Top-Up Agent Panel</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-gray-700/50 text-white rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Enter your email"
                  />
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-gray-700/50 text-white rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Enter your full name"
                  />
                  <UserCircle className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-gray-700/50 text-white rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Enter phone number"
                  />
                  <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="dateOfBirth"
                    required
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full bg-gray-700/50 text-white rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-gray-700/50 text-white rounded-lg pl-4 pr-10 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Create a strong password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-gray-700/50 text-white rounded-lg pl-4 pr-10 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Confirm your password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
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
              className="w-full bg-emerald-500 text-white py-3 px-4 rounded-lg
                hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>

            <p className="text-sm text-gray-400 text-center">
              By registering, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AgentRegistration;