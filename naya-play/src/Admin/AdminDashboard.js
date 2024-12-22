import React, { useState } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { useAdmin } from './AdminContext';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Gamepad2,
  Settings,
  Shield,
  LogOut,
  Bell,
  Gift,
  HeadphonesIcon
} from 'lucide-react';
import DashboardOverview from './components/Dashboard';
import UserManagement from './components/UserManagement';
import FinancialOverview from './FinancialOverview';
import AdminSupportDashboard from './components/AdminSupportDashboard';
import AdminBonusManager from './components/BonusManager';
import { auth } from '../firebase';
import { ADMIN_CONFIG } from './AdminConfig';
import AgentManagement from '../Agent/AgentManagement';
import SupportAgentManagement from '../LiveSupportSystem/SupportAgentManagement';
import {doc, updateDoc, serverTimestamp} from "firebase/firestore"
import { db } from '../firebase';
import { useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Bitcoin, Building, CreditCard, Check, X } from 'lucide-react';
const MENU_ITEMS = [
  {
    title: 'Overview',
    icon: LayoutDashboard,
    path: `${ADMIN_CONFIG.SECURE_PATH}/dashboard`,
    baseRoute: 'overview'
  },
  {
    title: 'Users',
    icon: Users,
    path: `${ADMIN_CONFIG.SECURE_PATH}/dashboard/users`,
    baseRoute: 'users'
  },
  {
    title: 'Finances',
    icon: DollarSign,
    path: `${ADMIN_CONFIG.SECURE_PATH}/dashboard/finances`,
    baseRoute: 'finances',
    badge: '5'
  },
  {
    title: 'Support',
    icon: HeadphonesIcon,
    path: `${ADMIN_CONFIG.SECURE_PATH}/dashboard/support`,
    baseRoute: 'support'
  },
  {
    title: 'Games',
    icon: Gamepad2,
    path: `${ADMIN_CONFIG.SECURE_PATH}/dashboard/games`,
    baseRoute: 'games'
  },
  {
    title: 'Bonus Codes',
    icon: Gift,
    path: `${ADMIN_CONFIG.SECURE_PATH}/dashboard/bonus`,
    baseRoute: 'bonus'
  },
  {
    title: 'Settings',
    icon: Settings,
    path: `${ADMIN_CONFIG.SECURE_PATH}/dashboard/settings`,
    baseRoute: 'settings'
  },
  {
    title: 'Agents',
    icon: Users,
    path: `${ADMIN_CONFIG.SECURE_PATH}/dashboard/agents`,
    baseRoute: 'agents'
  },
  {
    title: 'Support Agents',
    icon: HeadphonesIcon,
    path: `${ADMIN_CONFIG.SECURE_PATH}/dashboard/support-agents`,
    baseRoute: 'support-agents'
  }
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, adminRole } = useAdmin();
  const [showNotifications, setShowNotifications] = useState(false);

  // Get the current route from the path
  const getCurrentRoute = () => {
    const path = location.pathname;
    const dashboardIndex = path.indexOf('dashboard');
    if (dashboardIndex === -1) return 'overview';
    
    const routeParts = path.slice(dashboardIndex).split('/');
    return routeParts[1] || 'overview';
  };

  const [activePage, setActivePage] = useState(getCurrentRoute());



  const WithdrawalRequests = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
  
    useEffect(() => {
      fetchWithdrawals();
    }, [activeTab]);
  
    const fetchWithdrawals = async () => {
      try {
        const withdrawalsRef = collection(db, 'transactions');
        const q = query(
          withdrawalsRef,
          where('type', '==', 'withdrawal'),
          where('status', '==', activeTab),
          orderBy('createdAt', 'desc')
        );
  
        const querySnapshot = await getDocs(q);
        const withdrawalData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setWithdrawals(withdrawalData);
      } catch (error) {
        console.error('Error fetching withdrawals:', error);
      } finally {
        setLoading(false);
      }
    };
  
    const handleWithdrawalAction = async (withdrawalId, action) => {
      try {
        const withdrawalRef = doc(db, 'transactions', withdrawalId);
        
        await updateDoc(withdrawalRef, {
          status: action === 'approve' ? 'completed' : 'rejected',
          processedAt: new Date(),
        });
  
        // Refresh the list
        fetchWithdrawals();
      } catch (error) {
        console.error('Error updating withdrawal:', error);
      }
    };
  
    const getWithdrawalMethodIcon = (withdrawal) => {
      if (withdrawal.method === 'crypto' || withdrawal.network) return Bitcoin;
      if (withdrawal.bankName) return Building;
      if (withdrawal.provider) return CreditCard;
      return DollarSign;
    };
  
    const getMethodDisplay = (withdrawal) => {
      if (withdrawal.method === 'crypto') {
        return `USDT (${withdrawal.network})`;
      }
      if (withdrawal.provider) {
        return withdrawal.provider.charAt(0).toUpperCase() + withdrawal.provider.slice(1);
      }
      if (withdrawal.bankName) {
        return `Bank - ${withdrawal.bankName}`;
      }
      return withdrawal.method;
    };
  
    const WithdrawalCard = ({ withdrawal }) => {
      const MethodIcon = getWithdrawalMethodIcon(withdrawal);
      
      return (
        <div className="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center">
                  <MethodIcon size={20} className="text-gray-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Withdrawal Request</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(withdrawal.createdAt?.toDate()).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">${withdrawal.amount?.toFixed(2)}</p>
                <p className="text-sm text-gray-400">{getMethodDisplay(withdrawal)}</p>
              </div>
            </div>
  
            {/* Details */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">User ID</span>
                <span className="text-white font-medium">{withdrawal.userId}</span>
              </div>
              
              {withdrawal.walletAddress && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Wallet Address</span>
                  <span className="text-white font-medium">{withdrawal.walletAddress}</span>
                </div>
              )}
              
              {withdrawal.accountNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Account Number</span>
                  <span className="text-white font-medium">{withdrawal.accountNumber}</span>
                </div>
              )}
              
              {withdrawal.accountTitle && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Account Title</span>
                  <span className="text-white font-medium">{withdrawal.accountTitle}</span>
                </div>
              )}
            </div>
  
            {/* Actions */}
            {activeTab === 'pending' && (
              <div className="flex space-x-3 pt-3 border-t border-gray-700/50">
                <button
                  onClick={() => handleWithdrawalAction(withdrawal.id, 'approve')}
                  className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 
                    py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Check size={18} />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleWithdrawalAction(withdrawal.id, 'reject')}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 
                    py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <X size={18} />
                  <span>Reject</span>
                </button>
              </div>
            )}
          </div>
        </div>
      );
    };
  
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Withdrawal Requests</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'pending'
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'completed'
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'rejected'
                  ? 'bg-red-500/20 text-red-400'
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>
  
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 
              rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading withdrawals...</p>
          </div>
        ) : withdrawals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {withdrawals.map(withdrawal => (
              <WithdrawalCard key={withdrawal.id} withdrawal={withdrawal} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <DollarSign size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No {activeTab} withdrawal requests found</p>
          </div>
        )}
      </div>
    );
  };
  
  const FinancialOverview = () => {
    return (
      <div className="space-y-8">
        <WithdrawalRequests />
      </div>
    );
  };

  const handleApproveAgent = async (agentId) => {
    try {
      const agentRef = doc(db, 'supportAgents', agentId);
      await updateDoc(agentRef, {
        status: 'approved', // Make sure this is exactly 'approved'
        approvedAt: serverTimestamp(),
        approvedBy: auth.currentUser.uid
      });
      console.log('Agent approved successfully');
    } catch (error) {
      console.error('Error approving agent:', error);
    }
  };

  // Mock notifications - replace with real data
  const notifications = [
    { id: 1, type: 'withdrawal', message: 'New withdrawal request', time: '5m ago' },
    { id: 2, type: 'user', message: 'Suspicious activity detected', time: '10m ago' },
    { id: 3, type: 'system', message: 'System update completed', time: '1h ago' },
  ];

  const renderContent = () => (
    <Routes>
      <Route index element={<DashboardOverview />} />
      <Route path="users" element={<UserManagement />} />
      <Route path="finances" element={<FinancialOverview />} />
      <Route path="games" element={<div>Games Management</div>} />
      <Route path="bonus" element={<AdminBonusManager />} />
      <Route path="support" element={<AdminSupportDashboard />} />
      <Route path="settings" element={<div>Settings</div>} />
      <Route path="agents" element={<AgentManagement />} />
      <Route path="support-agents" element={<SupportAgentManagement />} />
    </Routes>
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this area.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>

          {/* Admin Info */}
          <div className="mb-8 p-3 bg-gray-900 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {adminRole === 'super' ? 'Super Admin' : 'Admin'}
                </p>
                <p className="text-xs text-gray-400">Online</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setActivePage(item.baseRoute);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg
                  transition-colors ${
                  activePage === item.baseRoute
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon size={20} />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-indigo-500/20 
                    text-indigo-400 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-0 w-64 p-4">
          <button
            onClick={() => {
              auth.signOut();
              navigate('/');
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2
              bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Bar */}
        <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
          <h2 className="text-xl font-bold text-white capitalize">
            {activePage === 'overview' ? 'Overview' : activePage}
          </h2>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors relative"
            >
              <Bell size={20} className="text-gray-400" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-400 rounded-full" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg
                border border-gray-700 py-2 z-50">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="px-4 py-3 hover:bg-gray-700/50 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-white">{notification.message}</p>
                      <span className="text-xs text-gray-400">{notification.time}</span>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-2 border-t border-gray-700 mt-2">
                  <button className="text-sm text-indigo-400 hover:text-indigo-300 w-full text-center">
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;