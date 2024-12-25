import React, { useState } from 'react';
import { Mail, MessageCircle } from 'lucide-react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import PhoneVerificationSteps from './PhoneVerificationSteps';
import { RegisterModal } from './Navbar';

const AuthFlow = () => {
  const [currentModal, setCurrentModal] = useState(null);
  const navigate = useNavigate();

  // Handler for email registration - same as Navbar.js
  const handleRegisterSubmit = async (formData) => {
    try {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        throw new Error('You must be 18 or older to register.');
      }

      // Check username availability one last time
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', formData.username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('Username is already taken. Please choose a different username.');
      }
      
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      // Store user data
      await setDoc(doc(db, 'users', user.uid), {
        email: formData.email,
        username: formData.username.toLowerCase(),
        displayUsername: formData.username,
        dateOfBirth: formData.dateOfBirth,
        phone: formData.phone || '',
        createdAt: new Date().toISOString(),
        emailVerified: false,
        balance: 0,
        totalBets: 0,
        totalWagered: 0,
        totalWon: 0,
        vipLevel: 0,
        vipPoints: 0,
        lastActive: new Date().toISOString(),
        status: 'active',
        ageVerified: true
      });

      // Send verification email
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/generate-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          userId: user.uid,
          username: formData.username
        }),
        mode: 'cors',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to send verification email. Please try again.');
      }

      // Store verification info in localStorage
      localStorage.setItem('requiresVerification', 'true');
      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('userId', user.uid);
      localStorage.setItem('registrationTime', new Date().toISOString());
      
      // Close modal and redirect
      setCurrentModal(null);
      navigate('/verify-email');
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please try logging in instead.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please choose a stronger password.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      // If it's our custom error, throw it as is
      if (error.message.includes('Username') || error.message.includes('age')) {
        throw error;
      }
      
      // For any other errors
      throw new Error('Registration failed. Please try again later.');
    }
  };

  // Handler for phone registration
  const handlePhoneRegistrationComplete = async (data) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, `${data.phone}@temp.com`, data.password);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username: data.username.toLowerCase(),
        displayUsername: data.username,
        phone: data.phone,
        createdAt: new Date().toISOString(),
        emailVerified: true,
        balance: 0,
        totalBets: 0,
        totalWagered: 0,
        totalWon: 0,
        vipLevel: 0,
        vipPoints: 0,
        lastActive: new Date().toISOString(),
        status: 'active',
        ageVerified: true
      });
  
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