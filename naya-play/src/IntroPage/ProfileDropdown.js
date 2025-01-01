// In ProfileDropdown.jsx
import React, { useState } from 'react';
import { 
  Wallet, Crown, LineChart, History, DollarSign, 
  Settings, HeadphonesIcon, LogOut 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from "../firebase";
import WalletModal from './WalletModal';
import VipModal from './VipModal';
import StatisticsModal from './StatisticsModal';
import ModernSupportWidget from '../LiveSupportSystem/LiveSupportWidget';

const ProfileDropdown = ({ isOpen, onClose }) => {
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isVipOpen, setIsVipOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const navigate = useNavigate();

  const currentUser = auth.currentUser;

  const menuItems = [
    { icon: Wallet, label: 'Wallet', action: () => setIsWalletOpen(true) },
    { icon: Crown, label: 'VIP', action: () => setIsVipOpen(true) },
    { icon: LineChart, label: 'Statistics', action: () => setIsStatsOpen(true) },
    { icon: History, label: 'Transactions', route: '/transactions' },
    { icon: DollarSign, label: 'My Bets', route: '/my-bets' },
    { icon: Settings, label: 'Settings', route: '/settings' },
    
    // Update the Live Support to use isSupportOpen state
  
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      {/* Dropdown Menu */}
      <div 
        className={`absolute right-0 top-16 mt-1 transition-all duration-300 w-56
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ zIndex: 1000 }}
      >
        <div className="bg-[#0f1923] rounded-xl shadow-xl border border-white/10 overflow-hidden">
          <div className="py-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else if (item.route) {
                    navigate(item.route);
                  }
                  onClose();
                }}
                className="w-full px-4 py-2.5 text-left text-gray-300 hover:bg-[#1a2730] 
                  transition-colors flex items-center space-x-3"
              >
                <item.icon size={18} className="text-gray-400" />
                <span>{item.label}</span>
              </button>
            ))}

            <div className="px-2 pt-2">
              <div className="border-t border-white/5" />
            </div>

            <button
              onClick={() => {
                handleLogout();
                onClose();
              }}
              className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-[#1a2730] 
                transition-colors flex items-center space-x-3"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      <VipModal isOpen={isVipOpen} onClose={() => setIsVipOpen(false)} />
      <StatisticsModal 
        userId={auth.currentUser?.uid}
        isOpen={isStatsOpen} 
        onClose={() => setIsStatsOpen(false)}
      />
      
      {/* Support Widget with controlled open state */}
      <ModernSupportWidget 
  isOpen={isSupportOpen} 
  onClose={() => setIsSupportOpen(false)}
/>
    </>
  );
};

export default ProfileDropdown;