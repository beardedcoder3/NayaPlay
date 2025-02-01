import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, Shield, Settings2, History, UserX, Gift, Check,
  ChevronRight, Eye, EyeOff, X, AlertCircle, Crown, Sparkles,
  Phone, Mail, Key, Globe
} from 'lucide-react';
import useAuth from '../Auth/useAuth';
import { 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { runTransaction, increment, serverTimestamp } from 'firebase/firestore';
import { setDoc } from 'firebase/firestore';
import { updateEmail } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';
import { arrayRemove } from 'firebase/firestore';
import { 

  applyActionCode,
  checkActionCode
} from 'firebase/auth';
import { debounce } from "lodash"

import { Bell } from 'lucide-react';

// Base Input Component - Styled to match LiveBetLobby
const InputField = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  icon: Icon, 
  disabled = false,
  error,
  className = "" 
}) => (
  <div className={`space-y-2 ${className}`}>
    {label && (
      <label className="block text-sm font-medium text-gray-400">{label}</label>
    )}
    <div className="relative">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Icon size={20} className="text-gray-400" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full bg-gray-800/20 text-white px-4 ${Icon ? 'pl-12' : ''} py-3.5 rounded-xl 
          border border-gray-700/50 
          focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 
          transition-all duration-200 
          placeholder:text-gray-500
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:bg-gray-800/30
          ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
      />
      {error && (
        <p className="absolute top-full mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  </div>
);

// Move this to the top level, near your other component definitions (before GeneralSettings)
const BonusModal = ({ isOpen, onClose, title, message, type }) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-center mb-4">
        {type === 'success' ? (
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-500" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
        )}
      </div>
      <h3 className="text-xl font-semibold text-center text-white">
        {title}
      </h3>
      <p className="text-center text-gray-400">
        {message}
      </p>
      <Button
        onClick={onClose}
        variant={type === 'success' ? 'primary' : 'danger'}
        className="w-full"
      >
        Close
      </Button>
    </div>
  </Modal>
);

//Button component matching LiveBetLobby
const Button = ({ 
  children, 
  onClick, 
  variant = "primary", 
  loading = false, 
  disabled = false, 
  icon: Icon,
  className = "" 
}) => {
  const baseClasses = "px-6 py-3.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: `${baseClasses} bg-gradient-to-r from-indigo-600 to-purple-600 text-white 
      hover:from-indigo-500 hover:to-purple-500
      shadow-lg shadow-indigo-500/20`,
    secondary: `${baseClasses} bg-gray-800 text-gray-400 hover:bg-gray-800/80 
      border border-gray-700/50`,
    danger: `${baseClasses} bg-gradient-to-r from-red-600 to-red-500 text-white 
      hover:from-red-500 hover:to-red-400
      shadow-lg shadow-red-500/20`
  };

  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`${variants[variant]} ${(loading || disabled) ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {Icon && <Icon size={20} className={loading ? 'animate-spin' : ''} />}
      {loading ? 'Processing...' : children}
    </button>
  );
};



// Card Component - Styled to match LiveBetLobby
const Card = ({ children, title, icon: Icon, className = "" }) => (
  <div className={`relative bg-gray-800/20 backdrop-blur-sm rounded-2xl border border-gray-700/50 
    overflow-hidden transition-all duration-300 hover:bg-gray-800/30 ${className}`}>
    {/* Top Gradient Border */}
    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
    
    {title && (
      <div className="p-6 border-b border-gray-700/50 flex items-center gap-3">
        {Icon && <Icon size={20} className="text-indigo-400" />}
        <h3 className="text-lg font-medium bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          {title}
        </h3>
      </div>
    )}
    <div className="p-6">
      {children}
    </div>

    {/* Bottom Gradient Border */}
    <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
  </div>
);


const Badge = ({ children, variant = "primary", className = "" }) => {
  const variants = {
    primary: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    success: "bg-green-500/10 text-green-400 border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Modal - Styled to match LiveBetLobby
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-sm" onClick={onClose} />
      <div className="relative bg-gray-800/90 rounded-2xl border border-gray-700/50 shadow-2xl max-w-md w-full">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
        <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
      </div>
    </div>
  );
};

// Sidebar Navigation Component
const SettingsSidebar = ({ currentSection }) => {
  const navigate = useNavigate();
  const sections = [
    { id: 'general', label: 'General', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings2 },
    { id: 'sessions', label: 'Sessions', icon: History },
    { id: 'ignored-users', label: 'Ignored Users', icon: UserX },
    
    { id: 'offers', label: 'Offers', icon: Gift }
  ];

  return (
    <div className="w-80 border-r border-gray-700/50">
      <div className="p-6 space-y-1">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => navigate(`/settings/${section.id}`)}
              className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200
                ${currentSection === section.id 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                  : 'text-gray-400 hover:bg-gray-800/40 border border-gray-700/50'}`}
            >
              <Icon size={20} className="transition-colors duration-200" />
              <span className="ml-3 font-medium">{section.label}</span>
              <ChevronRight 
                size={16} 
                className={`ml-auto transition-transform duration-200
                  ${currentSection === section.id 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100'}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};


export const GeneralSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [usernameStatus, setUsernameStatus] = useState({
    isChecking: false,
    isAvailable: null,
    message: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    fetchUserData();
  }, [user]);

  const checkUsername = debounce(async (username) => {
    if (!username || username.length < 3) {
      setUsernameStatus({
        isChecking: false,
        isAvailable: null,
        message: username ? 'Username must be at least 3 characters' : ''
      });
      return;
    }
 
    if (userData?.displayUsername === username) {
      setUsernameStatus({
        isChecking: false,
        isAvailable: null,
        message: 'This is your current username'
      });
      return;
    }
 
    setUsernameStatus(prev => ({ ...prev, isChecking: true }));
 
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);
 
      setUsernameStatus({
        isChecking: false,
        isAvailable: querySnapshot.empty,
        message: querySnapshot.empty ? 'Username is available' : 'Username is already taken'
      });
    } catch (error) {
      setUsernameStatus({
        isChecking: false,
        isAvailable: false,
        message: 'Error checking username availability'
      });
    }
  }, 500);
 
  const handleUsernameUpdate = async () => {
    if (!newUsername || !usernameStatus.isAvailable) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username: newUsername.toLowerCase(),
        displayUsername: newUsername
      });
      
      const userDoc = await getDoc(userRef);
      setUserData(userDoc.data());
      setNewUsername('');
      setSuccessMessage('Username updated successfully');
      
      setTimeout(() => {
        setSuccessMessage('');
        setShowEditModal(false);
      }, 1500);
    } catch (error) {
      console.error('Error updating username:', error);
      setErrorMessage('Error updating username. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Username Card */}
      <Card title="Username Settings" icon={User}>
        <div className="flex justify-between items-center bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Current Username</label>
            {userData ? (
              <p className="text-xl font-medium bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {userData.displayUsername}
              </p>
            ) : (
              <div className="animate-pulse bg-gray-700 h-7 w-32 rounded" />
            )}
          </div>
          <Button
            onClick={() => setShowEditModal(true)}
            variant="secondary"
            className="px-4 py-2"
          >
            Edit
          </Button>
        </div>
      </Card>

      {/* Email Card */}
      <Card title="Email Settings" icon={Mail}>
        <div className="flex justify-between items-center bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Email Address</label>
            <div className="flex items-center gap-3">
              <p className="text-xl font-medium bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {user?.email}
              </p>
              <Badge variant="success" className="text-xs">Verified</Badge>
            </div>
          </div>
          <button
            disabled={true}
            className="px-4 py-2 rounded-xl font-medium transition-all duration-200 
              bg-gradient-to-r from-indigo-600/40 to-purple-600/40 text-white/50
              border border-gray-700/50 opacity-50 cursor-not-allowed"
          >
            Confirm Email
          </button>
        </div>
      </Card>
 
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSuccessMessage('');
          setErrorMessage('');
        }}
        title={successMessage ? 'Success!' : 'Change Username'}
      >
        {successMessage ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-green-500">{successMessage}</p>
          </div>
        ) : (
          <div className="min-w-[400px] p-6">
            <p className="text-gray-400 text-sm mb-6">
              This username will be visible to other players on NayaPlay.
            </p>
            
            <div className="space-y-4">
              <InputField
                type="text"
                value={newUsername}
                onChange={(e) => {
                  setNewUsername(e.target.value);
                  checkUsername(e.target.value);
                }}
                icon={User}
                placeholder="Enter new username"
              />

              {newUsername && (
                <p className={`text-sm flex items-center gap-2 ${
                  usernameStatus.isAvailable ? 'text-green-500' : 'text-red-500'
                }`}>
                  {usernameStatus.isAvailable ? <Check size={14} /> : <X size={14} />}
                  {usernameStatus.message}
                </p>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUsernameUpdate}
                  loading={loading}
                  disabled={!newUsername || !usernameStatus.isAvailable || loading}
                  className="flex-1"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

 // Separate PasswordInput component
const PasswordInput = ({ label, value, onChange, showPassword, onToggleVisibility, required }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    </div>
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        className="w-full bg-gray-900/50 text-white px-4 py-3 rounded-lg
          border border-gray-700/50
          focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 
          transition-all duration-200"
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
      >
        {showPassword ? (
          <EyeOff size={18} className="transition-all duration-200" />
        ) : (
          <Eye size={18} className="transition-all duration-200" />
        )}
      </button>
    </div>
  </div>
);

export const SecuritySettings = () => {
  const [loading, setLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateUserPassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("New passwords don't match!");
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      
      const credential = EmailAuthProvider.credential(
        user.email,
        oldPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      alert('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        alert('Current password is incorrect.');
      } else {
        alert('Error updating password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900/30 rounded-xl p-6">
      <h2 className="text-xl text-white font-medium mb-6">Password</h2>
      <div className="space-y-4">
        <PasswordInput
          label="Old Password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          showPassword={showOldPassword}
          onToggleVisibility={() => setShowOldPassword(!showOldPassword)}
          required
        />

        <PasswordInput
          label="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          showPassword={showNewPassword}
          onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
          required
        />

        <PasswordInput
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          showPassword={showConfirmPassword}
          onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
          required
        />

        <div className="flex justify-end pt-2">
          <button
            onClick={updateUserPassword}
            disabled={loading || !oldPassword || !newPassword || !confirmPassword}
            className="px-8 py-2.5 rounded-lg font-medium transition-all duration-200
              bg-gradient-to-r from-indigo-600 to-purple-600 text-white 
              hover:from-indigo-500 hover:to-purple-500
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:from-indigo-600 disabled:hover:to-purple-600"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};





const PreferencesSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    ghostMode: false,
    hideStats: false,
    hideRaceStats: false,
    excludeRain: false,
    emailOffers: true,
    smsOffers: true
  });

  // Use onSnapshot to listen for real-time updates
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    
    // Set up real-time listener for user preferences
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setPreferences({
            ghostMode: userData.ghostMode ?? false,
            hideStats: userData.hideStats ?? false,
            hideRaceStats: userData.hideRaceStats ?? false,
            excludeRain: userData.excludeRain ?? false,
            emailOffers: userData.emailOffers ?? true, // Default to true if not set
            smsOffers: userData.smsOffers ?? true
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching preferences:', error);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [user]);

  const handlePreferenceChange = async (key) => {
    if (!user) return;

    try {
      const newValue = !preferences[key];
      
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        [key]: newValue
      });

      // No need to manually update state as onSnapshot will handle it
    } catch (error) {
      console.error('Error updating preference:', error);
      // You could add error handling UI here if needed
    }
  };

  const ToggleSwitch = ({ checked, onChange }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none
        ${checked ? 'bg-indigo-600' : 'bg-gray-700'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
          ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );

  const PreferenceItem = ({ title, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-4">
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-white flex items-center">
          {title}
        </h4>
        <p className="text-sm text-gray-400 ml-0">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );

  if (loading) {
    return <div className="text-center text-gray-400">Loading preferences...</div>;
  }
  
  return (
    <div className="space-y-8">
      {/* Privacy Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-medium text-white">Privacy</h3>
          </div>
          <div className="space-y-4 divide-y divide-gray-700/50">
            <PreferenceItem
              title="Enable Ghost Mode"
              description="Your username will appear as 'Anonymous' in public bet feed"
              checked={preferences.ghostMode}
              onChange={() => handlePreferenceChange('ghostMode')}
            />
            <PreferenceItem
              title="Hide all your statistics"
              description="Other users won't be able to view your wins, losses and wagered statistics"
              checked={preferences.hideStats}
              onChange={() => handlePreferenceChange('hideStats')}
            />
          </div>
        </div>
      </Card>

      {/* Community Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-medium text-white">Community</h3>
          </div>
          <div className="space-y-4">
            <PreferenceItem
              title="Exclude from rain"
              description="Prevents you from receiving a rain in chat"
              checked={preferences.excludeRain}
              onChange={() => handlePreferenceChange('excludeRain')}
            />
          </div>
        </div>
      </Card>

      {/* Marketing Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-medium text-white">Marketing</h3>
          </div>
          <div className="space-y-4 divide-y divide-gray-700/50">
            <PreferenceItem
              title="Receive email offers from us"
              description="Choose if you wish to hear from us via email"
              checked={preferences.emailOffers}
              onChange={() => handlePreferenceChange('emailOffers')}
            />
            <PreferenceItem
              title="Receive Bonus offers from us"
              description="Choose if you wish to hear from us via SMS"
              checked={preferences.smsOffers}
              onChange={() => handlePreferenceChange('smsOffers')}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};


export const SessionsSettings = () => {
  const [filter, setFilter] = useState('All');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Initialize or update session
  useEffect(() => {
    const handleSession = async () => {
      if (!user) return;

      try {
        // Check for existing session from localStorage
        const existingSessionId = localStorage.getItem('currentSessionId');
        let sessionRef;

        if (existingSessionId) {
          // Try to get existing session
          sessionRef = doc(db, 'sessions', existingSessionId);
          const sessionDoc = await getDoc(sessionRef);

          if (sessionDoc.exists()) {
            // Update last active time
            await setDoc(sessionRef, {
              lastActive: serverTimestamp()
            }, { merge: true });
            return;
          }
        }

        // If no valid existing session, create new one
        const response = await fetch('https://api.ipify.org?format=json');
        const { ip } = await response.json();
        
        const sessionId = `${user.uid}_${Date.now()}`;
        sessionRef = doc(db, 'sessions', sessionId);
        
        await setDoc(sessionRef, {
          userId: user.uid,
          browser: 'Chrome (Unknown)',
          ip: ip,
          lastActive: serverTimestamp(),
          createdAt: serverTimestamp(),
          isActive: true
        });

        localStorage.setItem('currentSessionId', sessionId);
      } catch (error) {
        console.error('Error managing session:', error);
      }
    };

    handleSession();

    // Add visibility change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        const sessionData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          lastActive: doc.data().lastActive?.toDate(),
          createdAt: doc.data().createdAt?.toDate()
        }));

        // Sort sessions by last activity
        sessionData.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
        
        setSessions(sessionData);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setError('Error fetching sessions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  // Handle session removal
  const handleRemoveSession = async (sessionId) => {
    try {
      const currentSessionId = localStorage.getItem('currentSessionId');
      if (sessionId === currentSessionId) {
        alert("Cannot remove current session");
        return;
      }

      await setDoc(doc(db, 'sessions', sessionId), {
        isActive: false,
        removedAt: serverTimestamp()
      }, { merge: true });

      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, isActive: false, removedAt: new Date() }
          : session
      ));
    } catch (error) {
      console.error('Error removing session:', error);
    }
  };

  const formatLastActive = (date) => {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'Active') return session.isActive;
    if (filter === 'Inactive') return !session.isActive;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Session Filter</h2>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800/40 text-white px-4 py-2 rounded-lg border border-gray-700/50 
              focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 
              transition-all duration-200 appearance-none pr-10 cursor-pointer"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="bg-gray-800/40 px-6 py-3 border-b border-gray-700/50">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-sm font-medium text-gray-400">Browser</div>
            <div className="text-sm font-medium text-gray-400">IP Address</div>
            <div className="text-sm font-medium text-gray-400">Last Used</div>
            <div className="text-sm font-medium text-gray-400">Action</div>
          </div>
        </div>

        <div className="divide-y divide-gray-700/50">
          {filteredSessions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400">
              No sessions found
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isCurrentSession = session.id === localStorage.getItem('currentSessionId');
              return (
                <div 
                  key={session.id} 
                  className="px-6 py-4 bg-gray-800/20 hover:bg-gray-800/40 transition-colors duration-200"
                >
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <div className="text-sm text-white">{session.browser}</div>
                    <div className="text-sm text-white/60">{session.ip}</div>
                    <div className="text-sm text-white/60">
                      {session.lastActive ? formatLastActive(session.lastActive) : 'Unknown'}
                    </div>
                    <div>
                      {isCurrentSession ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Current
                        </span>
                      ) : session.isActive ? (
                        <button 
                          className="text-red-400 hover:text-red-300 transition-colors duration-200 text-sm"
                          onClick={() => handleRemoveSession(session.id)}
                        >
                          Remove Session
                        </button>
                      ) : (
                        <span className="text-gray-500">Removed</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export const IgnoredUsersSettings = () => {
  const [ignoredUsers, setIgnoredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchIgnoredUsers = async () => {
      try {
        // Get the user's ignored users list
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const ignoredIds = userDoc.data()?.ignoredUsers || [];

        // Fetch user details for each ignored user
        const usersData = await Promise.all(
          ignoredIds.map(async (userId) => {
            const ignoredUserDoc = await getDoc(doc(db, 'users', userId));
            if (ignoredUserDoc.exists()) {
              return {
                id: userId,
                ...ignoredUserDoc.data()
              };
            }
            return null;
          })
        );

        setIgnoredUsers(usersData.filter(Boolean));
      } catch (error) {
        console.error('Error fetching ignored users:', error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), () => {
      fetchIgnoredUsers();
    });

    return () => unsubscribe();
  }, [user]);

  const handleUnignore = async (userId) => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ignoredUsers: arrayRemove(userId)
      });
    } catch (error) {
      console.error('Error unignoring user:', error);
    }
  };

  return (
    <Card title="Ignored Users" icon={UserX}>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ignoredUsers.length > 0 ? (
        <div className="space-y-4">
          {ignoredUsers.map(user => (
            <div 
              key={user.id} 
              className="flex items-center justify-between p-4 bg-gray-800/40 
                rounded-xl border border-gray-700/50"
            >
              <div className="flex items-center space-x-3">
                <span className="font-medium text-white">{user.username}</span>
                <span className="text-sm text-gray-400">Ignored</span>
              </div>
              <Button
                variant="danger"
                onClick={() => handleUnignore(user.id)}
                className="px-4 py-2"
              >
                Unignore
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <UserX size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No ignored users</p>
          <p className="text-sm text-gray-500 mt-2">
            Users you ignore in chat will appear here
          </p>
        </div>
      )}
    </Card>
  );
};


export const OffersSettings = () => {
  const [welcomeCode, setWelcomeCode] = useState('');
  const [bonusCode, setBonusCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [bonusError, setBonusError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWelcomeInput, setShowWelcomeInput] = useState(true);
  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  const handleRedeemCode = async (code, type) => {
    if (!code) return;
    
    setLoading(true);
    setBonusError('');
 
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        setBonusError('User profile not found');
        return;
      }

      if (type === 'welcome') {
        // Check if user has already redeemed welcome bonus
        if (userDoc.data().hasRedeemedWelcome) {
          setBonusError('You have already redeemed your welcome bonus');
          setModalConfig({
            show: true,
            title: 'Error',
            message: 'You have already redeemed your welcome bonus',
            type: 'error'
          });
          return;
        }

        // Get current welcome bonus settings
        const welcomeBonusDoc = await getDoc(doc(db, 'welcomeBonus', 'current'));
        if (!welcomeBonusDoc.exists() || !welcomeBonusDoc.data().isActive) {
          setBonusError('Welcome bonus is not available');
          return;
        }

        const welcomeBonus = welcomeBonusDoc.data();
        if (code !== welcomeBonus.code) {
          setBonusError('Invalid welcome code');
          return;
        }

        // Process welcome bonus
        await runTransaction(db, async (transaction) => {
          const currentBalance = userDoc.data().balance || 0;
          transaction.update(userRef, {
            balance: currentBalance + welcomeBonus.perUserAmount,
            hasRedeemedWelcome: true,
            welcomeBonusRedeemedAt: serverTimestamp()
          });

          // Record the redemption
          const redemptionRef = doc(collection(db, 'bonusRedemptions'));
          transaction.set(redemptionRef, {
            userId: user.uid,
            type: 'welcome',
            code: code,
            amount: welcomeBonus.perUserAmount,
            timestamp: serverTimestamp()
          });
        });

        setWelcomeCode('');
        // Immediately hide the welcome bonus section
        setShowWelcomeInput(false);
        setModalConfig({
          show: true,
          title: 'Success!',
          message: `Welcome bonus of ${welcomeBonus.perUserAmount} credits redeemed!`,
          type: 'success'
        });
      } else {
        // Regular bonus code redemption
        const userRedeemedCodes = userDoc.data().redeemedCodes || {};
        if (userRedeemedCodes[code]) {
          setBonusError('You have already redeemed this code');
          setModalConfig({
            show: true,
            title: 'Error',
            message: 'You have already redeemed this code',
            type: 'error'
          });
          return;
        }
     
        const bonusCodesRef = collection(db, 'bonusCodes');
        const codeQuery = query(bonusCodesRef, where('code', '==', code));
        const codeDoc = await getDocs(codeQuery);
     
        if (codeDoc.empty) {
          setBonusError('Invalid code');
          return;
        }
     
        const validCode = codeDoc.docs[0].data();
        
        if (!validCode.active) {
          setBonusError('This code has expired');
          return;
        }
     
        if (validCode.currentRedemptions >= validCode.maxRedemptions) {
          setBonusError('This code has reached maximum redemptions');
          return;
        }
     
        if (validCode.minWager) {
          const userWager = userDoc.data().totalWagered || 0;
          if (userWager < validCode.minWager) {
            setBonusError(`Minimum wager requirement of ${validCode.minWager} not met`);
            setModalConfig({
              show: true,
              title: 'Error',
              message: `You need to wager at least ${validCode.minWager} credits before redeeming this bonus code. Current wager: ${userWager}`,
              type: 'error'
            });
            return;
          }
        }
     
        try {
          await runTransaction(db, async (transaction) => {
            // First update user document - this is specifically allowed in security rules
            const currentBalance = userDoc.data().balance || 0;
            transaction.update(userRef, {
              balance: currentBalance + validCode.perUserAmount,
              lastBonus: serverTimestamp(),
              [`redeemedCodes.${code}`]: {
                amount: validCode.perUserAmount,
                redeemedAt: serverTimestamp()
              }
            });
       
            // Create bonus redemption record - this is allowed for authenticated users
            const redemptionRef = doc(collection(db, 'bonusRedemptions'));
            transaction.set(redemptionRef, {
              userId: user.uid,
              code: code,
              amount: validCode.perUserAmount,
              timestamp: serverTimestamp(),
              type: 'bonus'
            });
          });
        } catch (error) {
          console.error('Transaction error:', error);
          setBonusError('Failed to process bonus code. Please try again.');
          setModalConfig({
            show: true,
            title: 'Error',
            message: 'Failed to process bonus code. Please try again.',
            type: 'error'
          });
          return;
        }
     
        setBonusCode('');
        setModalConfig({
          show: true,
          title: 'Success!',
          message: `Successfully redeemed ${validCode.perUserAmount} credits!`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error redeeming code:', error);
      
      // Handle Firebase permission errors specifically
      if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
        setBonusError('Permission denied. Please try again later.');
        setModalConfig({
          show: true,
          title: 'Error',
          message: 'You do not have permission to redeem this code. Please contact support if this persists.',
          type: 'error'
        });
      } else {
        setBonusError('Failed to redeem code. Please try again.');
        setModalConfig({
          show: true,
          title: 'Error',
          message: 'Failed to redeem code. Please try again.',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkWelcomeBonusStatus = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().hasRedeemedWelcome) {
          setShowWelcomeInput(false);
        }
      }
    };
    checkWelcomeBonusStatus();
  }, [user]);

  return (
    <div className="space-y-8">
      {showWelcomeInput && (
        <Card title="Welcome Offer" icon={Crown}>
          <div className="space-y-6">
            <p className="text-white/60">
              To claim your welcome offer, please enter your code within 24 hours of signing up.
            </p>
            <div className="relative">
              <InputField
                value={welcomeCode}
                onChange={(e) => setWelcomeCode(e.target.value.trim())}
                placeholder="Enter welcome code"
                icon={Gift}
                error={bonusError}
              />
            </div>
            <Button
              onClick={() => handleRedeemCode(welcomeCode, 'welcome')}
              loading={loading}
              disabled={!welcomeCode || loading}
            >
              Claim Welcome Offer
            </Button>
          </div>
        </Card>
      )}

      <Card title="Bonus Drop" icon={Gift}>
        <div className="space-y-6">
          <p className="text-white/60">
            Find bonus drop codes on our social media's such as Twitter & Telegram.
          </p>
          <div className="relative">
            <InputField
              value={bonusCode}
              onChange={(e) => setBonusCode(e.target.value.trim().toUpperCase())}
              placeholder="Enter bonus code"
              icon={Gift}
              error={bonusError}
            />
          </div>
          <Button
            onClick={() => handleRedeemCode(bonusCode, 'bonus')}
            loading={loading}
            disabled={!bonusCode || loading}
          >
            Redeem Bonus
          </Button>
        </div>
      </Card>

      <BonusModal 
        isOpen={modalConfig.show}
        onClose={() => setModalConfig(prev => ({ ...prev, show: false }))}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
};

const SettingsPage = () => {
  const location = useLocation();
  const currentSection = location.pathname.split('/')[2] || 'general';
 
  const renderSection = () => {
    switch (currentSection) {
      case 'security':
        return <SecuritySettings />;
      case 'preferences':
        return <PreferencesSettings />;
      case 'sessions':
        return <SessionsSettings />;
      case 'ignored-users':
        return <IgnoredUsersSettings />;
      case 'verify':
        return <Card title="Verify Account" icon={Check}>Coming soon</Card>;
      case 'offers':
        return <OffersSettings />;
      default:
        return <GeneralSettings />;
    }
  };
 
  return (
    <>
        <div className="fixed inset-0 min-h-screen bg-gray-900 z-0" />
    <div className="relative z-10 min-h-screen">
      <div className="h-40 bg-gradient-to-b from-indigo-500/10 to-transparent" />
      <div className="max-w-7xl mx-auto px-8 -mt-20">
        <div className="bg-gray-800/20 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl">

            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
            <div className="flex">
              <SettingsSidebar currentSection={currentSection} />
              <div className="flex-1 p-8 min-h-[calc(100vh-8rem)]">
                {renderSection()}
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;