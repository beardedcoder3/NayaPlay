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
        <p className="text-sm text-red-400 mt-1">{error}</p>
      )}
    </div>
  </div>
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
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+380');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          setPhone(userDoc.data().phone || '');
          setCountryCode(userDoc.data().countryCode || '+380');
        }
      }
    };
    fetchUserData();
  }, [user]);

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

  const handleResendVerification = async () => {
    try {
      await sendEmailVerification(user);
      alert('Verification email sent! Please check your inbox.');
    } catch (error) {
      alert('Error sending verification email. Please try again later.');
    }
  };

  return (
    <div className="space-y-8">
      <Card title="Email Settings" icon={Mail}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <InputField
              label="Email Address"
              value={user?.email}
              disabled
              icon={Mail}
              className="flex-1 mr-4"
            />
            {user?.emailVerified ? (
              <Badge variant="success" className="h-fit mt-8">Verified</Badge>
            ) : (
              <Button 
                variant="secondary" 
                onClick={handleResendVerification}
                className="mt-8"
              >
                Resend Verification
              </Button>
            )}
          </div>
        </div>
      </Card>

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

  const handleRedeemCode = async (code, type) => {
    setLoading(true);
    try {
      // Add your bonus code redemption logic here
      console.log('Redeeming', type, 'code:', code);
    } catch (error) {
      console.error('Error redeeming code:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card title="Welcome Offer" icon={Crown}>
        <div className="space-y-6">
          <p className="text-white/60">
            To claim your welcome offer, please enter your code within 24 hours of signing up.
          </p>
          <InputField
            value={welcomeCode}
            onChange={(e) => setWelcomeCode(e.target.value)}
            placeholder="Enter welcome code"
            icon={Gift}
          />
          <Button
            onClick={() => handleRedeemCode(welcomeCode, 'welcome')}
            loading={loading}
            disabled={!welcomeCode}
          >
            Claim Welcome Offer
          </Button>
        </div>
      </Card>

      <Card title="Bonus Drop" icon={Gift}>
        <div className="space-y-6">
          <p className="text-white/60">
            Find bonus drop codes on our social media's such as Twitter & Telegram.
          </p>
          <InputField
            value={bonusCode}
            onChange={(e) => setBonusCode(e.target.value.toUpperCase())}
            placeholder="Enter bonus code"
            icon={Gift}
          />
          <Button
            onClick={() => handleRedeemCode(bonusCode, 'bonus')}
            loading={loading}
            disabled={!bonusCode}
          >
            Redeem Bonus
          </Button>
        </div>
      </Card>
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