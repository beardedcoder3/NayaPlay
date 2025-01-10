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

import { updateEmail } from 'firebase/auth';

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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
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
    { id: 'verify', label: 'Verify', icon: Check },
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
  const { user, refreshUser } = useAuth();
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+380');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [emailError, setEmailError] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [password, setPassword] = useState('');
  const [showReauth, setShowReauth] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          // Refresh user data to get latest verification status
          await refreshUser();
          
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
            setPhone(userDoc.data().phone || '');
            setCountryCode(userDoc.data().countryCode || '+380');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    fetchUserData();
  }, [user, refreshUser]);

  const handlePhoneUpdate = async () => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', user.uid), {
        phone: phone,
        countryCode: countryCode
      });
      alert('Phone number updated successfully!');
    } catch (error) {
      console.error('Error updating phone:', error);
      alert('Error updating phone number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || newEmail === user?.email) return;
    
    setLoading(true);
    setEmailError('');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/generate-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newEmail,
          userId: user.uid,
          username: userData?.username || ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send verification code');
      }

      setShowVerification(true);
    } catch (error) {
      setEmailError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode) {
      setVerificationError('Please enter verification code');
      return;
    }

    setLoading(true);
    setVerificationError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: verificationCode,
          userId: user.uid
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowVerification(false);
        setShowReauth(true);
      } else {
        setVerificationError(data.error || 'Invalid verification code');
      }
    } catch (error) {
      setVerificationError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReauth = async () => {
    if (!password) {
      setVerificationError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      await updateEmail(auth.currentUser, newEmail);
      await updateDoc(doc(db, 'users', user.uid), {
        email: newEmail
      });

      // Refresh user data after email update
      await refreshUser();

      setShowReauth(false);
      setNewEmail('');
      setPassword('');
      setVerificationCode('');
      alert('Email updated successfully!');
    } catch (error) {
      setVerificationError('Invalid password or error updating email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card title="Email Settings" icon={Mail}>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Current Email</label>
            <div className="flex items-center space-x-2">
              <p className="text-white">{user?.email}</p>
              <Badge variant={user?.emailVerified ? "success" : "warning"}>
                {user?.emailVerified ? "Verified" : "Unverified"}
              </Badge>
            </div>
          </div>

          <InputField
            label="New Email Address"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            icon={Mail}
            placeholder="Enter new email address"
            error={emailError}
          />

          <Button
            onClick={handleEmailChange}
            loading={loading}
            disabled={!newEmail || loading || newEmail === user?.email}
            icon={Check}
          >
            Change Email
          </Button>
        </div>
      </Card>

      <Modal 
        isOpen={showVerification} 
        onClose={() => {
          setShowVerification(false);
          setVerificationCode('');
          setVerificationError('');
        }}
        title="Verify New Email"
      >
        <div className="space-y-6">
          <div className="text-center">
            <Mail className="mx-auto h-12 w-12 text-indigo-400" />
            <h3 className="mt-4 text-lg font-medium text-white">
              Verify Your New Email
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              We've sent a verification code to {newEmail}.<br/>
              Please enter the code below to verify your email.
            </p>
          </div>

          <InputField
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter verification code"
            error={verificationError}
          />

          <Button
            onClick={handleVerify}
            loading={loading}
            className="w-full"
            disabled={!verificationCode || loading}
          >
            Verify Email
          </Button>
        </div>
      </Modal>

      <Modal 
        isOpen={showReauth} 
        onClose={() => {
          setShowReauth(false);
          setPassword('');
          setVerificationError('');
        }}
        title="Confirm Password"
      >
        <div className="space-y-6">
          <div className="text-center">
            <p className="mt-2 text-sm text-gray-400">
              Please enter your current password to confirm the email change.
            </p>
          </div>

          <InputField
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            error={verificationError}
          />

          <Button
            onClick={handleReauth}
            loading={loading}
            className="w-full"
            disabled={!password || loading}
          >
            Confirm
          </Button>
        </div>
      </Modal>

      <Card title="Phone Number" icon={Phone}>
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <InputField
                label="Country Code"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                icon={Globe}
              />
            </div>
            <div className="col-span-3">
              <InputField
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={Phone}
                placeholder="Enter your phone number"
              />
            </div>
          </div>
          <Button 
            onClick={handlePhoneUpdate}
            loading={loading}
            icon={Check}
          >
            Update Phone
          </Button>
        </div>
      </Card>
    </div>
  );
};

export const SecuritySettings = () => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    old: '',
    new: '',
    confirm: ''
  });

  const handlePasswordChange = (field) => (e) => {
    setPasswords(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const updateUserPassword = async () => {
    if (passwords.new !== passwords.confirm) {
      alert("New passwords don't match!");
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      
      const credential = EmailAuthProvider.credential(
        user.email,
        passwords.old
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwords.new);
      
      alert('Password updated successfully!');
      setPasswords({ old: '', new: '', confirm: '' });
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
    <Card title="Change Password" icon={Key}>
      <div className="space-y-6">
        <InputField
          label="Current Password"
          type={showOldPassword ? 'text' : 'password'}
          value={passwords.old}
          onChange={handlePasswordChange('old')}
          icon={Key}
          placeholder="Enter your current password"
        />

        <InputField
          label="New Password"
          type={showNewPassword ? 'text' : 'password'}
          value={passwords.new}
          onChange={handlePasswordChange('new')}
          icon={Key}
          placeholder="Enter your new password"
        />

        <InputField
          label="Confirm New Password"
          type={showConfirmPassword ? 'text' : 'password'}
          value={passwords.confirm}
          onChange={handlePasswordChange('confirm')}
          icon={Key}
          placeholder="Confirm your new password"
        />

        <Button 
          onClick={updateUserPassword}
          loading={loading}
          disabled={!passwords.old || !passwords.new || !passwords.confirm}
        >
          Update Password
        </Button>
      </div>
    </Card>
  );
};

export const SessionsSettings = () => {
  const sessions = [
    {
      id: 1,
      browser: "Chrome (Unknown)",
      location: "UA, Kyiv",
      ip: "149.88.110.18",
      lastUsed: "17 minutes ago",
      isCurrent: true
    }
  ];

  return (
    <Card title="Active Sessions" icon={History}>
      <div className="space-y-4">
        {sessions.map((session) => (
          <div 
            key={session.id} 
            className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
          >
            <div className="space-y-1">
              <p className="font-medium text-white">{session.browser}</p>
              <p className="text-sm text-white/60">{session.location} • {session.ip}</p>
              <p className="text-sm text-white/40">Last active: {session.lastUsed}</p>
            </div>
            {session.isCurrent ? (
              <Badge variant="primary">Current Session</Badge>
            ) : (
              <Button variant="danger" size="sm">End Session</Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export const IgnoredUsersSettings = () => {
  const [ignoredUsers, setIgnoredUsers] = useState([]);

  return (
    <Card title="Ignored Users" icon={UserX}>
      {ignoredUsers.length > 0 ? (
        <div className="space-y-4">
          {ignoredUsers.map(user => (
            <div 
              key={user.id} 
              className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
            >
              <span className="font-medium text-white">{user.username}</span>
              <Button variant="danger" size="sm">Unignore</Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <UserX size={48} className="text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No ignored users to show</p>
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
          const userWager = userDoc.data().stats?.wagered || 0;
          if (userWager < validCode.minWager) {
            setBonusError(`Minimum wager requirement of ${validCode.minWager} not met`);
            return;
          }
        }
     
        await runTransaction(db, async (transaction) => {
          const codeRef = codeDoc.docs[0].ref;
          transaction.update(codeRef, {
            currentRedemptions: increment(1)
          });
     
          const currentBalance = userDoc.data().balance || 0;
          transaction.update(userRef, {
            balance: currentBalance + validCode.perUserAmount,
            lastBonus: serverTimestamp(),
            [`redeemedCodes.${code}`]: {
              amount: validCode.perUserAmount,
              redeemedAt: serverTimestamp()
            }
          });
     
          const redemptionRef = doc(collection(db, 'bonusRedemptions'));
          transaction.set(redemptionRef, {
            userId: user.uid,
            code: code,
            amount: validCode.perUserAmount,
            timestamp: serverTimestamp()
          });
        });
     
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
      setBonusError('Failed to redeem code. Please try again.');
      setModalConfig({
        show: true,
        title: 'Error',
        message: 'Failed to redeem code. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const [showWelcomeInput, setShowWelcomeInput] = useState(true);

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
        return <Card title="Preferences" icon={Settings2}>Coming soon</Card>;
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
    <div className="min-h-screen bg-gray-900">
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
  );
};

export default SettingsPage;