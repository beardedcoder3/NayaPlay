import React, { useState } from 'react';
import {
  Menu,
  User,
  Gift,
  Crown,
  Newspaper,
  ChevronDown,
  Wallet,
  LineChart,
  History,
  DollarSign,
  Settings,
  HeadphonesIcon,
  LogOut,
  MessageSquare,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from "../firebase";
import WalletModal from './WalletModal';
import VipModal from './VipModal';
import StatisticsModal from './StatisticsModal';
import { useSidebar } from "../SidebarContext";

// Coming Soon Modal with enhanced design
const ComingSoonModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm m-4 animate-scale-in border border-gray-800">
        <div className="p-8">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400 hover:text-gray-300" />
          </button>
          
          <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Coming Soon
          </h3>
          <p className="text-gray-400">
            We're working hard to bring this feature to you. Stay tuned for updates!
          </p>
          
          <button
            onClick={onClose}
            className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 transform hover:scale-[1.02]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Sidebar Item Component
const SidebarItem = ({ 
  icon: Icon, 
  text, 
  hasDropdown, 
  isOpen, 
  children, 
  isActive, 
  onClick, 
  comingSoon, 
  badge 
}) => {
  const { isExpanded } = useSidebar();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative group py-1"
      onMouseEnter={() => !isExpanded && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div 
        onClick={onClick}
        className={`
          flex items-center px-4 py-3 cursor-pointer
          transition-all duration-300 ease-out
          hover:bg-gray-800/50 hover:backdrop-blur-sm
          rounded-xl mx-2
          ${isActive ? 'bg-indigo-500/10 text-indigo-300' : ''}
          border border-transparent hover:border-gray-700/50
          relative overflow-hidden group
          ${comingSoon ? 'opacity-75' : ''}
          animate-fade-in
        `}
      >
        <div className="min-w-[20px] flex items-center justify-center">
          <Icon size={20} className={`
            transition-colors duration-300
            ${isActive ? 'text-indigo-400' : 'text-gray-400 group-hover:text-gray-200'}
          `} />
        </div>
        
        <div className={`
          flex items-center justify-between
          transition-all duration-300 ease-out
          ${isExpanded ? 'w-[180px] ml-3 opacity-100' : 'w-0 opacity-0'}
        `}>
          <span className={`
            whitespace-nowrap font-medium
            transition-colors duration-300
            ${isActive ? 'text-gray-100' : 'text-gray-400 group-hover:text-gray-200'}
          `}>
            {text}
          </span>
          
          {badge && (
            <span className="ml-2 px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-300 rounded-full">
              {badge}
            </span>
          )}
          
          {hasDropdown && (
            <ChevronDown 
              size={16} 
              className={`
                transition-transform duration-300
                ${isOpen ? 'rotate-180 text-indigo-400' : 'text-gray-400'}
                group-hover:text-gray-200 ml-2
              `} 
            />
          )}
        </div>
      </div>

      {/* Enhanced Tooltip */}
      {showTooltip && !isExpanded && (
        <div className="absolute left-16 top-1/2 -translate-y-1/2 z-50 
          bg-gray-800 text-gray-100 px-3 py-2 rounded-lg text-sm 
          whitespace-nowrap border border-gray-700 shadow-xl animate-fade-in">
          {text}
          {comingSoon && (
            <span className="ml-2 text-xs bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded-full">
              Soon
            </span>
          )}
        </div>
      )}

      {/* Enhanced Dropdown */}
      {isExpanded && isOpen && (
        <div className="mt-2 mx-2 overflow-hidden animate-scale-in">
          <div className="
            bg-gray-800/90 backdrop-blur-sm
            rounded-xl border border-gray-700
            shadow-xl
            transition-all duration-300 ease-in-out
          ">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Sidebar Component
const Sidebar = () => {
  const { isExpanded, setIsExpanded } = useSidebar();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isVipOpen, setIsVipOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [showFeatureDialog, setShowFeatureDialog] = useState(false);
  const navigate = useNavigate();

  const handleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleComingSoonFeature = () => {
    setShowFeatureDialog(true);
  };

  const profileOptions = [
    { icon: Wallet, label: 'Wallet', action: () => setIsWalletOpen(true) },
    { icon: Crown, label: 'VIP', action: () => setIsVipOpen(true) },
    { icon: LineChart, label: 'Statistics', action: () => setIsStatsOpen(true) },
    { icon: History, label: 'Transactions', route: '/transactions' },
    { icon: DollarSign, label: 'My Bets', route: '/my-bets' },
    { icon: Settings, label: 'Settings', route: '/settings' },
    { icon: HeadphonesIcon, label: 'Live Support', route: '/support' },
    { icon: LogOut, label: 'Logout', action: handleLogout, danger: true }
  ];

  return (
    <>
      <div className={`
        fixed left-0 top-0 h-screen
        transition-[width] duration-300 ease-in-out
        ${isExpanded ? 'w-64' : 'w-20'}
        flex flex-col
        bg-gradient-to-b from-gray-900 via-gray-900 to-gray-900/95
        backdrop-blur-xl
        border-r border-gray-800/50
        shadow-2xl shadow-black/20
        z-50
      `}>
        {/* Enhanced Hamburger Menu */}
        <div className="flex items-center p-5 border-b border-gray-800/50">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              w-10 h-10 flex items-center justify-center
              rounded-xl
              transition-all duration-300 ease-in-out
              hover:bg-gray-800/50
              border border-transparent hover:border-gray-700
              group
            `}
          >
            <Menu 
              size={20} 
              className={`
                text-gray-400 group-hover:text-gray-200
                transition-all duration-300
                ${isExpanded ? 'rotate-180' : 'rotate-0'}
              `} 
            />
          </button>
        </div>

        {/* Menu Items Container */}
        <div className="flex-1 py-4 flex flex-col overflow-y-auto scrollbar-none">
          <SidebarItem
            icon={User}
            text="Profile"
            hasDropdown={true}
            isOpen={activeDropdown === 'profile'}
            isActive={activeDropdown === 'profile'}
            onClick={() => handleDropdown('profile')}
          >
            <div className="py-2">
              {profileOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (option.action) option.action();
                    if (option.route) navigate(option.route);
                  }}
                  className={`
                    w-full px-4 py-2.5 text-left
                    transition-all duration-200
                    flex items-center space-x-3
                    hover:bg-gray-700/30
                    ${option.danger ? 'text-red-400 hover:text-red-300' : 'text-gray-400 hover:text-gray-200'}
                    group
                  `}
                >
                  <option.icon size={18} className="group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </SidebarItem>

          <SidebarItem
            icon={Gift}
            text="Promotions"
            badge="Soon"
            comingSoon={true}
            onClick={handleComingSoonFeature}
          />

          <SidebarItem
            icon={Crown}
            text="VIP Club"
            onClick={() => setIsVipOpen(true)}
          />

          <SidebarItem
            icon={Newspaper}
            text="Blog"
            badge="Soon"
            comingSoon={true}
            onClick={handleComingSoonFeature}
          />

          <SidebarItem
            icon={MessageSquare}
            text="Forum"
            badge="Soon"
            comingSoon={true}
            onClick={handleComingSoonFeature}
          />

          <SidebarItem
            icon={HeadphonesIcon}
            text="Live Support"
            onClick={() => navigate('/support')}
          />
        </div>
      </div>

      {/* Modals */}
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      <VipModal isOpen={isVipOpen} onClose={() => setIsVipOpen(false)} />
      <StatisticsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
      <ComingSoonModal 
        isOpen={showFeatureDialog} 
        onClose={() => setShowFeatureDialog(false)} 
      />
    </>
  );
};

export default Sidebar;