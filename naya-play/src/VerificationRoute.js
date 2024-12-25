import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const VerificationRoute = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('email'); // 'email' or 'phone'
  const inputs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkVerification = async () => {
      // Check if it's a phone verification
      const isPhoneVerification = localStorage.getItem('phoneVerification');
      if (isPhoneVerification === 'true') {
        setVerificationMethod('phone');
      }

      // Check if already verified
      const isVerified = localStorage.getItem('emailVerified');
      if (isVerified === 'true') {
        navigate('/app', { replace: true });
      }

      // If no verification is required, redirect to home
      if (!localStorage.getItem('requiresVerification')) {
        navigate('/', { replace: true });
      }
    };
    checkVerification();
  }, [navigate]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    setCode([...code.map((d, idx) => (idx === index ? element.value : d))]);
    
    if (element.value) {
      if (index < 5) {
        inputs.current[index + 1].focus();
      }
    }
  };

  const handleSubmit = async () => {
    const verificationCode = code.join('');
    const storedUserId = localStorage.getItem('userId');
  
    setLoading(true);
    setError('');
  
    try {
      const endpoint = verificationMethod === 'phone' 
        ? '/api/verify-phone-code'
        : '/api/verify-code';

      const response = await fetch(`${process.env.REACT_APP_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: verificationCode,
          userId: storedUserId,
          phoneNumber: localStorage.getItem('phoneNumber') // for phone verification
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }
  
      // Clear verification data from localStorage
      localStorage.removeItem('requiresVerification');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
      localStorage.removeItem('phoneNumber');
      localStorage.removeItem('phoneVerification');
      
      if (verificationMethod === 'email') {
        localStorage.setItem('emailVerified', 'true');
      }
      
      navigate('/app', { replace: true });
    } catch (error) {
      console.error('Verification error:', error);
      setError(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Enter Verification Code
        </h2>
        
        <p className="text-gray-400 text-sm text-center mb-6">
          {verificationMethod === 'phone' 
            ? `We sent a code to ${localStorage.getItem('phoneNumber')}`
            : `We sent a code to ${localStorage.getItem('userEmail')}`
          }
        </p>
        
        <div className="flex justify-center space-x-4 mb-8">
          {code.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              maxLength="1"
              value={digit}
              ref={el => inputs.current[idx] = el}
              onChange={e => handleChange(e.target, idx)}
              className="w-12 h-12 text-center text-2xl font-bold bg-gray-700 text-white rounded-lg border-2 border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-center mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || code.some(d => !d)}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl 
            font-medium hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 
            transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed 
            disabled:transform-none flex items-center justify-center"
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            `Verify ${verificationMethod === 'phone' ? 'Phone' : 'Email'}`
          )}
        </button>

        <p className="text-gray-400 text-sm text-center mt-4">
          Didn't receive the code? Check your spam folder or try registering again.
        </p>
      </div>
    </div>
  );
};

export default VerificationRoute;