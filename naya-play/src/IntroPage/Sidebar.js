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
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from "../firebase";
import WalletModal from './WalletModal';
import VipModal from './VipModal';
import StatisticsModal from './StatisticsModal';
import { useSidebar } from "../SidebarContext";

// SidebarItem Component
const SidebarItem = ({ 
  icon: Icon, 
  text, 
  hasDropdown, 
  isOpen, 
  children, 
  onClick,
  isDropdownItem = false
}) => {
  const { isExpanded } = useSidebar();

  return (
    <div className="relative">
      <div 
        onClick={onClick}
        className={`
          flex items-center cursor-pointer
          transition-all duration-200 ease-out
          hover:bg-[#1a2730]
          ${isOpen ? 'bg-[#1a2730]' : ''}
          ${isDropdownItem ? 'pl-8 py-2' : 'px-6 py-2.5'}
          ${isExpanded ? 'opacity-100' : 'opacity-80 hover:opacity-100'}
        `}
      >
        <div className={`
          min-w-[24px] flex items-center justify-center
          transition-transform duration-200 ease-out
          ${!isExpanded && 'transform scale-110'}
        `}>
          <Icon size={20} className={`
            transition-all duration-200
            ${isOpen ? 'text-gray-200' : 'text-gray-400'}
          `} />
        </div>
        
        <div className={`
          flex items-center justify-between flex-1
          transition-all duration-200 ease-out
          ${isExpanded ? 'opacity-100 ml-3 translate-x-0' : 'opacity-0 -translate-x-5 overflow-hidden w-0'}
        `}>
          <span className={`
            text-sm whitespace-nowrap
            transition-colors duration-200
            ${isOpen ? 'text-gray-200' : 'text-gray-400'}
          `}>
            {text}
          </span>
          
          {hasDropdown && (
            <ChevronDown 
              size={16} 
              className={`
                transition-all duration-200 ease-out
                ${isOpen ? 'rotate-180 text-gray-200' : 'text-gray-500'}
                ml-2
              `} 
            />
          )}
        </div>
      </div>

      {isExpanded && children && (
        <div className={`
          overflow-hidden transition-all duration-200 ease-out
          ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="bg-[#1a2730]/50">
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

  const profileOptions = [
    { icon: Wallet, label: 'Wallet', action: () => setIsWalletOpen(true) },
    { icon: Crown, label: 'VIP', action: () => setIsVipOpen(true) },
    { icon: LineChart, label: 'Statistics', action: () => setIsStatsOpen(true) },
    { icon: History, label: 'Transactions', route: '/transactions' },
    { icon: DollarSign, label: 'My Bets', route: '/my-bets' },
    { icon: Settings, label: 'Settings', route: '/settings' },
    { icon: HeadphonesIcon, label: 'Live Support', route: '/support' },
    { icon: LogOut, label: 'Logout', action: handleLogout, className: 'text-red-400' }
  ];

  return (
    <>
      <div 
        className={`
          fixed left-0 top-0 h-screen
          transition-all duration-200 ease-out
          flex flex-col
          bg-[#0f1923]
          border-r border-white/5
          z-50
          ${isExpanded ? 'w-64 translate-x-0' : 'w-20 translate-x-0'}
        `}
      >
        <div className="flex items-center h-16 px-6 border-b border-white/5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              w-8 h-8 flex items-center justify-center
              text-gray-400 hover:text-gray-300
              transition-transform duration-200 ease-out
              ${!isExpanded && 'transform hover:scale-110'}
            `}
          >
            <Menu size={24} className={`
              transition-transform duration-200 ease-out
              ${!isExpanded ? 'transform rotate-0' : 'transform rotate-180'}
            `} />
          </button>
        </div>

        <div className="flex-1 py-2 flex flex-col overflow-y-auto scrollbar-none">
          <SidebarItem
            icon={User}
            text="Profile"
            hasDropdown={true}
            isOpen={activeDropdown === 'profile'}
            onClick={() => handleDropdown('profile')}
          >
            <div className={`
              py-1
              transition-all duration-200 ease-out
              ${activeDropdown === 'profile' ? 'opacity-100' : 'opacity-0'}
            `}>
              {profileOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (option.action) option.action();
                    if (option.route) navigate(option.route);
                  }}
                  className={`
                    w-full px-4 py-2.5 text-left text-sm
                    flex items-center space-x-3
                    transition-all duration-200 ease-out
                    hover:bg-[#1a2730]
                    ${option.className || 'text-gray-400 hover:text-gray-300'}
                  `}
                >
                  <option.icon size={18} className="transition-transform duration-200 ease-out hover:scale-110" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </SidebarItem>

          <SidebarItem
            icon={Gift}
            text="Promotions"
            onClick={() => navigate('/promotions')}
          />

          <SidebarItem
            icon={Crown}
            text="VIP Club"
            onClick={() => setIsVipOpen(true)}
          />

          <SidebarItem
            icon={Newspaper}
            text="Blog"
            onClick={() => navigate('/blog')}
          />

          <SidebarItem
            icon={MessageSquare}
            text="Forum"
            onClick={() => navigate('/forum')}
          />

       

<SidebarItem
  icon={HeadphonesIcon}
  text="Live Support"
  onClick={() => {
    const event = new Event('openSupportWidget');
    document.dispatchEvent(event);
  }}
/>
        </div>
      </div>

      {/* Modals */}
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      <VipModal isOpen={isVipOpen} onClose={() => setIsVipOpen(false)} />
      <StatisticsModal 
        isOpen={isStatsOpen} 
        onClose={() => setIsStatsOpen(false)} 
        userId={auth.currentUser?.uid}
      />
    </>
  );
};

export default Sidebar;