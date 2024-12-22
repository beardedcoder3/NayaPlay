import React, { useState, useEffect } from 'react';
import { X, Wallet, Search, Bell, MessageCircle, User, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../Auth/useAuth';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from "../firebase";
import NotificationDropdown from './NotificationDropdown';
import { useNotifications } from './NotificationContext';
import ProfileDropdown from './ProfileDropdown';
import WalletModal from './WalletModal';
import { useBalance } from "./BalanceContext";
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Logo from "./Logo2.png";
import { useChat } from '../Chat/ChatContext';
import Chat from '../Chat/Chat';
import { useRef } from 'react';
import checkVerificationStatus from "../Auth/useAuth"


// GameSearch Component
const GameSearch = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const GAME_ROUTES = {
    "Cyberpunk 2077": "/mines",
    "God of War Ragnarök": "/limbo",
    "Elden Ring": "/crash",
    "Horizon Forbidden West": "/plinko",
    "Spider-Man 2": "/wheel"
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);

    if (term.trim() === '') {
      setSearchResults([]);
      return;
    }

    const results = Object.keys(GAME_ROUTES).filter(game =>
      game.toLowerCase().includes(term.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleGameSelect = (game) => {
    navigate(GAME_ROUTES[game]);
    setSearchTerm('');
    setSearchResults([]);
    onClose();
  };

  return (
    <div 
      ref={searchRef}
      className={`absolute right-0 top-16 mt-1 transition-all duration-300
        ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      style={{ zIndex: 1000 }}
    >
      <div className="w-64 px-2">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search games..."
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autoFocus={isOpen}
        />
        
        {searchResults.length > 0 && (
          <div className="absolute mt-2 w-60 bg-gray-800 rounded-lg shadow-xl 
            border border-gray-700 overflow-hidden">
            {searchResults.map((game) => (
              <button
                key={game}
                onClick={() => handleGameSelect(game)}
                className="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-700 
                  transition-colors"
              >
                {game}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


const VerificationModal = ({ email, onClose }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const checkVerification = async () => {
    try {
      setIsChecking(true);
      const { verified } = await checkVerificationStatus();
      
      if (verified) {
        localStorage.removeItem('requiresVerification');
        onClose();
        window.location.reload();
      } else {
        alert('Email not yet verified. Please check your inbox and click the verification link.');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsChecking(false);
    }
  };

 

  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl w-full max-w-md p-8 shadow-2xl">
      <button onClick={onClose} className="absolute top-4 right-4">
        <X size={20} className="text-gray-300" />
      </button>
      
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto">
          <Mail size={32} className="text-indigo-400" />
        </div>

        <h2 className="text-2xl font-bold text-white">Verify your email</h2>
        
        <p className="text-gray-300">
          We've sent a verification link to:<br/>
          <span className="text-indigo-400 font-medium">{email}</span>
        </p>
        
        <div className="text-sm text-gray-400 space-y-2">
          <p>Please check your inbox and click the verification link.</p>
          <p>After verification, you can start playing!</p>
        </div>

        <div className="space-y-3 pt-4">
          <button
            onClick={checkVerification}
            disabled={isChecking}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 
              transition-colors disabled:opacity-50"
          >
            {isChecking ? 'Checking...' : 'Ive verified my email'}
          </button>
          
          <button
            
            disabled={countdown > 0}
            className="w-full bg-gray-700 text-gray-300 py-2 rounded-lg hover:bg-gray-600 
              transition-colors disabled:opacity-50"
          >
            {countdown > 0 
              ? `Resend available in ${countdown}s` 
              : 'Resend verification email'}
          </button>
        </div>
      </div>
    </div>
  );
};
// Register Modal Component
const RegisterModal = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    dateOfBirth: '',
    phone: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-gray-900 rounded-2xl w-full max-w-md p-8 shadow-2xl border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Create Account
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
          <X size={20} className="text-gray-400 hover:text-gray-300" />
        </button>
      </div>

      <p className="text-gray-400 mb-8">Join the ultimate gaming experience</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="w-full bg-gray-800/50 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none placeholder:text-gray-500"
          />
        </div>

        <div className="space-y-1">
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            required
            className="w-full bg-gray-800/50 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none placeholder:text-gray-500"
          />
        </div>

        <div className="space-y-1">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
            className="w-full bg-gray-800/50 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none placeholder:text-gray-500"
          />
        </div>

        <div className="space-y-1">
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
            className="w-full bg-gray-800/50 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none placeholder:text-gray-500"
          />
        </div>

        <div className="space-y-1">
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone (Optional)"
            className="w-full bg-gray-800/50 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none placeholder:text-gray-500"
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 transform hover:scale-[1.02]"
        >
          Create Account
        </button>

        <p className="text-sm text-gray-400 text-center mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </form>
    </div>
  );
};


// Welcome Modal Component
const WelcomeModal = ({ onSetupWallet, onSkip }) => (
  <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all duration-300">
    <div className="relative px-8 pt-8 pb-8">
      <div className="relative w-3/5 aspect-square mx-auto mb-8">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl" />
        <div className="relative bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full aspect-square flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Wallet size={48} className="text-white/90 transform -rotate-12" />
        </div>
      </div>
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Welcome to NayaPlay!</h3>
        <p className="text-gray-300 leading-relaxed">
          We know you're eager to get started, so let's quickly set up your wallet.
        </p>
      </div>
      <div className="flex flex-col space-y-3">
        <button
          onClick={onSetupWallet}
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/20"
        >
          Setup Wallet
        </button>
        <button
          onClick={onSkip}
          className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl transition-colors duration-200"
        >
          Skip for Later
        </button>
      </div>
    </div>
  </div>
);

// Login Modal Component
const LoginModal = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl w-full max-w-md p-8 shadow-2xl">
      <button onClick={onClose} className="absolute top-4 right-4">
        <X size={20} className="text-gray-300" />
      </button>
      <h2 className="text-2xl font-bold text-white mb-4">Welcome Back</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
          className="w-full bg-gray-800 text-white px-4 py-2 rounded"
        />
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          required
          className="w-full bg-gray-800 text-white px-4 py-2 rounded"
        />
        <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors">
          Login
        </button>
      </form>
    </div>
  );
};

// Main NavBar component
const NavBar = () => {
  const { isChatOpen, setIsChatOpen } = useChat();
  const { balance } = useBalance();
  const { hasUnread } = useNotifications();
  const { user, loading } = useAuth();
  const [modalState, setModalState] = useState('closed');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !user.emailVerified && !localStorage.getItem('setupChoice')) {
      setModalState('welcome');
    }
  }, [user]);

  const showAuthenticatedNav = user && 
    (user.emailVerified || localStorage.getItem('setupChoice') === 'skipped');

  const handleLogin = async (formData) => {
    try {
      const { email, password } = formData;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified && localStorage.getItem('setupChoice') !== 'skipped') {
        localStorage.setItem('userEmail', email);
        localStorage.setItem('requiresVerification', 'true');
        setModalState('welcome');
      } else {
        setModalState('closed');
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert(error.message);
    }
  };

  const handleRegisterSubmit = async (formData) => {
    try {
      const { email, username, password, dateOfBirth, phone } = formData;
      
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store user data
      await setDoc(doc(db, 'users', user.uid), {
        email,
        username,
        dateOfBirth,
        phone: phone || '',
        createdAt: new Date().toISOString(),
        emailVerified: false,
        balance: 0,
        totalBets: 0,
        totalWagered: 0,
        totalWon: 0,
        vipLevel: 0,
        vipPoints: 0,
      });
  
      // Log full request details
      console.log('Making request to:', 'http://localhost:3002/api/generate-verification');
      
      const response = await fetch('http://localhost:3003/api/generate-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          userId: user.uid,
          username
        })
      });
  
      // Log raw response
      const rawText = await response.text();
      console.log('Raw server response:', rawText);
  
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Server returned invalid response');
      }
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email');
      }
      
      localStorage.setItem('requiresVerification', 'true');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userId', user.uid);
      
      setModalState('closed');
      navigate('/verify-email');
      
    } catch (error) {
      console.error('Full registration error:', error);
      console.error('Error details:', error.message);
      alert(error.message);
    }
  };


  const handleSetupWallet = async () => {
    try {
      if (!auth.currentUser) {
        alert('No user found. Please try logging in again.');
        return;
      }

      // Check if email is already verified
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        localStorage.setItem('setupChoice', 'wallet');
        setModalState('closed');
        window.location.reload();
        return;
      }

      // Check when the last verification email was sent
      const lastEmailTime = localStorage.getItem('lastVerificationEmailTime');
      const now = Date.now();
      
      if (lastEmailTime && now - parseInt(lastEmailTime) < 60000) {
        const timeLeft = Math.ceil((60000 - (now - parseInt(lastEmailTime))) / 1000);
        alert(`Please wait ${timeLeft} seconds before requesting another verification email.`);
        return;
      }

      await sendEmailVerification(auth.currentUser, {
        url: window.location.origin,
        handleCodeInApp: true,
      });

      localStorage.setItem('lastVerificationEmailTime', now.toString());
      localStorage.setItem('setupChoice', 'wallet');
      setModalState('verification');

    } catch (error) {
      console.error('Error sending verification:', error);
      
      if (error.code === 'auth/too-many-requests') {
        alert('Too many verification attempts. Please wait a few minutes before trying again.');
      } else {
        alert('Error sending verification email. Please try again later.');
      }
    }
  };

  const handleSkip = () => {
    localStorage.setItem('setupChoice', 'skipped');
    localStorage.removeItem('requiresVerification');
    setModalState('closed');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <>
      <nav className="bg-gray-800 text-white shadow-lg z-50 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <img 
                src={Logo} 
                alt="NayaPlay"
                className="h-15 w-12" 
              />
            </div>
            
            {showAuthenticatedNav ? (
              <>
                <div className="flex justify-center items-center">
                  <div className="flex items-center space-x-3">
                    <div className="px-4 py-1.5 bg-gray-700 rounded-lg">
                      Balance: ${balance.toFixed(2)}
                    </div>
                    <button 
                      onClick={() => setIsWalletOpen(true)}
                      className="bg-indigo-600 px-4 py-1.5 rounded-lg hover:bg-indigo-700 
                        transition-colors flex items-center space-x-2">
                      <Wallet size={16} />
                      <span>Wallet</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <button 
                      onClick={() => {
                        setIsSearchOpen(!isSearchOpen);
                        setIsNotificationsOpen(false);
                        setIsProfileOpen(false);
                      }}
                      className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Search 
                        size={20} 
                        className={`transition-colors duration-200 ${
                          isSearchOpen ? 'text-indigo-400' : 'text-gray-300 hover:text-white'
                        }`}
                      />
                    </button>
                    <GameSearch 
                      isOpen={isSearchOpen} 
                      onClose={() => setIsSearchOpen(false)} 
                    />
                  </div>

                  <div className="relative">
                    <button 
                      onClick={() => {
                        setIsNotificationsOpen(!isNotificationsOpen);
                        setIsSearchOpen(false);
                        setIsProfileOpen(false);
                      }}
                      className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Bell 
                        size={20} 
                        className={`transition-colors duration-200 ${
                          isNotificationsOpen ? 'text-indigo-400' : 'text-gray-300 hover:text-white'
                        }`}
                      />
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </button>
                    <NotificationDropdown 
                      isOpen={isNotificationsOpen} 
                      onClose={() => setIsNotificationsOpen(false)} 
                    />
                  </div>

                  <button 
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <MessageCircle 
                      size={20} 
                      className={`transition-colors duration-200 ${
                        isChatOpen ? 'text-indigo-400' : 'text-gray-300 hover:text-white'
                      }`}
                    />
                  </button>

                  <div className="relative">
                    <button 
                      onClick={() => {
                        setIsProfileOpen(!isProfileOpen);
                        setIsSearchOpen(false);
                        setIsNotificationsOpen(false);
                      }}
                      className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <User 
                        size={20} 
                        className={`transition-colors duration-200 ${
                          isProfileOpen ? 'text-indigo-400' : 'text-gray-300 hover:text-white'
                        }`}
                      />
                    </button>

                    <Chat />

                    <ProfileDropdown 
                      isOpen={isProfileOpen} 
                      onClose={() => setIsProfileOpen(false)} 
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex justify-end">
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setModalState('login')}
                    className="px-4 py-1.5 hover:text-indigo-400 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setModalState('register')}
                    className="px-4 py-1.5 bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
                  >
                    Register
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Modals */}
      {modalState !== 'closed' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {modalState === 'login' && (
            <LoginModal
              onSubmit={handleLogin}
              onClose={() => setModalState('closed')}
            />
          )}
          {modalState === 'register' && (
            <RegisterModal
              onSubmit={handleRegisterSubmit}
              onClose={() => setModalState('closed')}
            />
          )}
          {modalState === 'welcome' && (
            <WelcomeModal
              onSetupWallet={handleSetupWallet}
              onSkip={handleSkip}
            />
          )}
          {modalState === 'verification' && (
            <VerificationModal
              email={localStorage.getItem('userEmail')}
              onClose={() => setModalState('closed')}
            />
          )}
        </div>
      )}
      <WalletModal 
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
      />
    </>
  );
};

export default NavBar;