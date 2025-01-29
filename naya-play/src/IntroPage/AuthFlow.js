import React, { useState } from 'react';
import { Mail, Chrome, Facebook } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc 
} from 'firebase/firestore';
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
      sessionStorage.setItem('registrationInProgress', 'true');
      
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
  
      sessionStorage.setItem('userId', user.uid);
      sessionStorage.setItem('userEmail', formData.email);
  
      await setDoc(doc(db, 'users', user.uid), {
        email: formData.email,
        username: formData.username,
        dateOfBirth: formData.dateOfBirth,
        createdAt: serverTimestamp(),
        emailVerified: false,
        balance: 0,
        lastActive: serverTimestamp(),
        status: 'active',
        emailOffers: true  // Explicitly set to true
      });
  
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
  
      setCurrentModal(null);
      window.location.replace('/verify-email');
  
    } catch (error) {
      sessionStorage.clear();
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsRegistering(false);
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



  const handleGoogleSignIn = async () => {
    try {
      setIsRegistering(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        username: user.email.split('@')[0].toLowerCase(),
        displayUsername: user.displayName || user.email.split('@')[0],
        dateOfBirth: '',
        createdAt: serverTimestamp(),
        emailVerified: true,
        balance: 0,
        lastActive: serverTimestamp(),
        status: 'active',
        notifications: [],
        notificationsEnabled: true,
        emailOffers: true  // Explicitly set to true
      }, { merge: true });
  
  
      // Then create googleUsers document
      await setDoc(doc(db, 'googleUsers', user.uid), {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp()
      });
  
      navigate('/app', { replace: true });
      
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setIsRegistering(false);
    }
  };
  
  // Helper function to generate referral code
  const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };




  const handleFacebookSignIn = async () => {
    try {
      setIsRegistering(true);
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create user document in facebookUsers collection
      await setDoc(doc(db, 'facebookUsers', user.uid), {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        status: 'active',
        balance: 0,
        totalBets: 0,
        totalWagered: 0,
        totalWon: 0,
        vipLevel: 0,
        vipPoints: 0
      });

      // Also create in main users collection
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        username: user.email.split('@')[0].toLowerCase(),
        displayUsername: user.displayName || user.email.split('@')[0],
        authProvider: 'facebook',
        createdAt: serverTimestamp(),
        emailVerified: user.emailVerified,
        balance: 0,
        lastActive: serverTimestamp(),
        status: 'active'
      });

      navigate('/app', { replace: true });
    } catch (error) {
      console.error('Facebook sign in error:', error);
      throw error;
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

      {/* Social Login Section */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-900 text-gray-400">Or Sign up with</span>
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          <button 
            onClick={handleGoogleSignIn}
            disabled={isRegistering}
            className="flex items-center justify-center gap-2 px-6 py-2.5 border border-red-600 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Chrome className="w-5 h-5" />
            <span>Google</span>
          </button>
          <button 
            onClick={handleFacebookSignIn}
            disabled={isRegistering}
            className="flex items-center justify-center gap-2 px-6 py-2.5 border border-blue-600 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Facebook className="w-5 h-5" />
            <span>Facebook</span>
          </button>
        </div>
      </div>
    
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