import React, { useState, useEffect } from 'react';
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
  HeadphonesIcon,
  Search,
  MessageCircle,
  Menu,
  Bitcoin,
  Building,
  CreditCard,
  Check,
  X
} from 'lucide-react';
import DashboardOverview from './components/Dashboard';
import UserManagement from './components/UserManagement';
import AdminSupportDashboard from './components/AdminSupportDashboard';
import AdminBonusManager from './components/BonusManager';
import { auth } from '../firebase';
import { ADMIN_CONFIG } from './AdminConfig';
import AgentManagement from '../Agent/AgentManagement';
import SupportAgentManagement from '../LiveSupportSystem/SupportAgentManagement';
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

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
      <div className="bg-[#1a1b1e] rounded-xl border border-white/5 overflow-hidden backdrop-blur-xl shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <MethodIcon size={20} className="text-blue-400" />
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
              <p className="text-sm text-blue-400">{getMethodDisplay(withdrawal)}</p>
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
            <div className="flex space-x-3 pt-3 border-t border-white/5">
              <button
                onClick={() => handleWithdrawalAction(withdrawal.id, 'approve')}
                className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 
                  py-2 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2
                  hover:scale-[1.02]"
              >
                <Check size={18} />
                <span>Approve</span>
              </button>
              <button
                onClick={() => handleWithdrawalAction(withdrawal.id, 'reject')}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 
                  py-2 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2
                  hover:scale-[1.02]"
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
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'pending'
                ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10'
                : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'completed'
                ? 'bg-green-500/20 text-green-400 shadow-lg shadow-green-500/10'
                : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'rejected'
                ? 'bg-red-500/20 text-red-400 shadow-lg shadow-red-500/10'
                : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 
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
        <div className="text-center py-12 bg-[#1a1b1e] rounded-xl border border-white/5">
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, adminRole } = useAdmin();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getCurrentRoute = () => {
    const path = location.pathname;
    const dashboardIndex = path.indexOf('dashboard');
    if (dashboardIndex === -1) return 'overview';
    const routeParts = path.slice(dashboardIndex).split('/');
    return routeParts[1] || 'overview';
  };

  const [activePage, setActivePage] = useState(getCurrentRoute());

  const handleApproveAgent = async (agentId) => {
    try {
      const agentRef = doc(db, 'supportAgents', agentId);
      await updateDoc(agentRef, {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: auth.currentUser.uid
      });
      console.log('Agent approved successfully');
    } catch (error) {
      console.error('Error approving agent:', error);
    }
  };

  const notifications = [
    { id: 1, type: 'withdrawal', message: 'New withdrawal request', time: '5m ago' },
    { id: 2, type: 'user', message: 'Suspicious activity detected', time: '10m ago' },
    { id: 3, type: 'system', message: 'System update completed', time: '1h ago' },
  ];

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0f1012] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="w-20 h-20 mx-auto text-red-500 animate-pulse" />
          <h1 className="text-3xl font-bold text-white tracking-wider">ACCESS DENIED</h1>
          <p className="text-gray-400 text-lg">You don't have permission to access this area</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full 
              transition-all duration-300 transform hover:scale-105"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1012] text-white">
      {/* Top Navigation Bar */}
      <div className="h-16 bg-[#1a1b1e]/80 backdrop-blur-xl border-b border-white/5 
        flex items-center justify-between px-6 fixed top-0 w-full z-50">
        <div className="flex items-center space-x-4">
          <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-2 hover:bg-white/10 rounded-full transition-all duration-300"
        >
          <Menu size={24} />
        </button>
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/5 rounded-full 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all duration-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 hover:bg-white/10 rounded-full transition-all duration-300 relative">
          <MessageCircle size={24} className="text-gray-400" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" />
        </button>
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="p-2 hover:bg-white/10 rounded-full transition-all duration-300 relative"
        >
          <Bell size={24} className="text-gray-400" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {showNotifications && (
          <div className="absolute right-4 top-16 w-80 bg-[#1a1b1e] rounded-xl shadow-lg
            border border-white/5 py-2 z-50 backdrop-blur-xl">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="px-4 py-3 hover:bg-white/5 transition-all duration-300 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <p className="text-sm text-white">{notification.message}</p>
                  <span className="text-xs text-gray-400">{notification.time}</span>
                </div>
              </div>
            ))}
            <div className="px-4 py-2 border-t border-white/5 mt-2">
              <button className="text-sm text-blue-400 hover:text-blue-300 w-full text-center
                transition-all duration-300">
                View All Notifications
              </button>
            </div>
          </div>
        )}

        <div className="h-8 w-px bg-white/5" />
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Shield size={16} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {adminRole === 'super' ? 'Super Admin' : 'Admin'}
            </p>
            <p className="text-xs text-green-400">Online</p>
          </div>
        </div>
      </div>
    </div>

    {/* Main Layout */}
    <div className="pt-16 flex">
      {/* Sidebar */}
      <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-[#1a1b1e]/80 backdrop-blur-xl 
        transition-all duration-300 border-r border-white/5
        ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="p-4">
          <nav className="space-y-1">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setActivePage(item.baseRoute);
                }}
                className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-300
                  ${activePage === item.baseRoute
                    ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon size={20} />
                  {!isSidebarCollapsed && <span>{item.title}</span>}
                </div>
                {!isSidebarCollapsed && item.badge && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 
                    text-blue-400 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-4 w-full px-4">
          <button
            onClick={() => {
              auth.signOut();
              navigate('/');
            }}
            className={`w-full flex items-center space-x-2 px-4 py-2.5 rounded-xl
              bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-300
              ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6 text-white capitalize">
            {activePage === 'overview' ? 'Dashboard Overview' : activePage}
          </h1>
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
        </div>
      </div>
    </div>
  </div>
);
};

export default AdminDashboard;