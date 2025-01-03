import React, { useState } from 'react';
import { Mail, MessageCircle } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import PhoneVerificationSteps from './PhoneVerificationSteps';
import { RegisterModal } from './Navbar';
import { serverTimestamp } from 'firebase/firestore';

const AuthFlow = () => {
  const [currentModal, setCurrentModal] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleRegisterSubmit = async (formData) => {
    try {
      setIsRegistering(true);
      sessionStorage.clear();
  
      // Set flags BEFORE any async operations
      sessionStorage.setItem('registrationInProgress', 'true');
      
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
  
      // Store user info
      sessionStorage.setItem('userId', user.uid);
      sessionStorage.setItem('userEmail', formData.email);
  
      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        email: formData.email,
        username: formData.username.toLowerCase(),
        displayUsername: formData.username,
        dateOfBirth: formData.dateOfBirth,
        createdAt: serverTimestamp(),
        emailVerified: false,
        balance: 0,
        lastActive: serverTimestamp(),
        status: 'active'
      });
  
      // Send verification email
      await fetch(`${process.env.REACT_APP_API_URL}/api/generate-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          userId: user.uid,
          username: formData.username
        })
      });
  
      // Close modal and redirect
      setCurrentModal(null);
      window.location.replace('/verify-email');
  
    } catch (error) {
      sessionStorage.clear();
      console.error('Registration error:', error);
      throw error;
    }
  };

  const handlePhoneRegistrationComplete = async (data) => {
    try {
      setIsRegistering(true);
      
      // Create unique ID for phone users
      const timestamp = Date.now();
      const phoneEmail = `phone_${data.phone.replace(/\D/g, '')}${timestamp}@nayaplay.co`;
      
      const userCredential = await createUserWithEmailAndPassword(auth, phoneEmail, data.password);
      const user = userCredential.user;
  
      await setDoc(doc(db, 'users', user.uid), {
        username: data.username.toLowerCase(),
        displayUsername: data.username,
        phone: data.phone,
        createdAt: serverTimestamp(),
        emailVerified: true,
        phoneVerified: true,
        balance: 0,
        totalBets: 0,
        totalWagered: 0,
        totalWon: 0,
        vipLevel: 0,
        vipPoints: 0,
        lastActive: serverTimestamp(),
        status: 'active'
      });
  
      // Close modal before navigation
      setCurrentModal(null);
      navigate('/app', { replace: true });
      
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleModalClose = () => {
    localStorage.removeItem('registrationInProgress');
    setCurrentModal(null);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-sm font-medium text-white/50 mb-3">
        Choose how to continue
      </div>
      
      <button 
        onClick={() => setCurrentModal('email')}
        disabled={isRegistering}
        className="w-full group flex items-center justify-between px-4 py-3 rounded-xl
          bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3">
          <Mail size={20} className="text-white/70" />
          <div className="text-left">
            <div className="font-medium text-white">Continue with Email</div>
            <div className="text-sm text-white/50">Using your email address</div>
          </div>
        </div>
        <div className="text-white/30 group-hover:text-white/70 transition-colors duration-200">→</div>
      </button>
      
      <button 
        onClick={() => setCurrentModal('phone')}
        disabled={isRegistering}
        className="w-full group flex items-center justify-between px-4 py-3 rounded-xl
          bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3">
          <MessageCircle size={20} className="text-white/70" />
          <div className="text-left">
            <div className="font-medium text-white">Continue with Phone</div>
            <div className="text-sm text-white/50">Using your phone number</div>
          </div>
        </div>
        <div className="text-white/30 group-hover:text-white/70 transition-colors duration-200">→</div>
      </button>

      <div className="text-sm text-white/40 text-center mt-6">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </div>

      {/* Modals */}
      {currentModal === 'email' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <RegisterModal
            onSubmit={handleRegisterSubmit}
            onClose={handleModalClose}
          />
        </div>
      )}

      {currentModal === 'phone' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <PhoneVerificationSteps
            onBack={handleModalClose}
            onComplete={handlePhoneRegistrationComplete}
          />
        </div>
      )}
    </div>
  );
};

export default AuthFlow;