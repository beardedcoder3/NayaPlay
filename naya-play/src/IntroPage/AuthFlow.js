import React, { useState } from 'react';
import { Mail, MessageCircle } from 'lucide-react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import PhoneVerificationSteps from './PhoneVerificationSteps';
import { RegisterModal } from './Navbar';
import { updateProfile } from 'firebase/auth';
import { data } from 'react-router-dom';
import { serverTimestamp } from 'firebase/firestore';

const AuthFlow = () => {
  const [currentModal, setCurrentModal] = useState(null);
  const navigate = useNavigate();

  // Handler for email registration - same as Navbar.js
  const handleRegisterSubmit = async (formData) => {
    try {
      // First create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
  
      // Then update Firestore with their data
      const userDoc = {
        email: formData.email,
        username: formData.username.toLowerCase(),
        displayUsername: formData.username,
        dateOfBirth: formData.dateOfBirth,
        createdAt: serverTimestamp(),
        emailVerified: false,
        balance: 0,
        lastActive: serverTimestamp(),
        status: 'active'
      };
  
      // Use set with merge option to avoid permission issues
      await setDoc(doc(db, 'users', user.uid), userDoc, { merge: true });
  
      // Send verification email through your backend
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/generate-verification`, {
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
  
      if (!response.ok) {
        throw new Error('Failed to send verification email');
      }
  
      // Set verification flags
      localStorage.setItem('requiresVerification', 'true');
      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('userId', user.uid);
  
      // Navigate to verification page
      return navigate('/verify-email');
    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email already registered. Please login instead.');
      }
      throw new Error('Registration failed. Please try again.');
    }
  };


  // Handler for phone registration
  const handlePhoneRegistrationComplete = async (data) => {
    try {
      // Create unique ID for phone users
      const timestamp = Date.now();
      const phoneEmail = `phone_${data.phone.replace(/\D/g, '')}${timestamp}@nayaplay.co`;
      
      const userCredential = await createUserWithEmailAndPassword(auth, phoneEmail, data.password);
      const user = userCredential.user;
  
      await setDoc(doc(db, 'users', user.uid), {
        username: data.username.toLowerCase(),
        displayUsername: data.username,
        phone: data.phone,
        createdAt: new Date().toISOString(),
        emailVerified: true, // Phone users are pre-verified
        phoneVerified: true,
        balance: 0,
        totalBets: 0,
        totalWagered: 0,
        totalWon: 0,
        vipLevel: 0,
        vipPoints: 0,
        lastActive: new Date().toISOString(),
        status: 'active'
      });
  
      // Navigate directly to app for phone users
      navigate('/app');
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Registration failed. Please try again.');
    }
  };


  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-sm font-medium text-white/50 mb-3">
        Choose how to continue
      </div>
      
      {/* Email Registration Button */}
      <button 
        onClick={() => setCurrentModal('email')}
        className="w-full group flex items-center justify-between px-4 py-3 rounded-xl
          bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
          transition-all duration-200"
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
      
      {/* Phone Registration Button */}
      <button 
        onClick={() => setCurrentModal('phone')}
        className="w-full group flex items-center justify-between px-4 py-3 rounded-xl
          bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
          transition-all duration-200"
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
            onClose={() => setCurrentModal(null)}
          />
        </div>
      )}

      {currentModal === 'phone' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <PhoneVerificationSteps
            onBack={() => setCurrentModal(null)}
            onComplete={handlePhoneRegistrationComplete}
          />
        </div>
      )}
    </div>
  );
};

export default AuthFlow;