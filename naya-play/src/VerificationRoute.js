import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const VerificationRoute = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkVerification = async () => {
      const isVerified = localStorage.getItem('emailVerified');
      if (isVerified === 'true') {
        navigate('/app', { replace: true });
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
      // Call your API first
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: verificationCode,
          userId: storedUserId
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }
  
      // If API call succeeds, proceed with local updates
      localStorage.setItem('emailVerified', 'true');
      localStorage.removeItem('requiresVerification');
      localStorage.removeItem('userEmail');
      
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
          <p className="text-red-500 text-center mb-4">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || code.some(d => !d)}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>

        <p className="text-gray-400 text-sm text-center mt-4">
          Didn't receive the code? Check your spam folder or try registering again.
        </p>
      </div>
    </div>
  );
};

export default VerificationRoute;