import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './App.css';
import { BalanceProvider } from './IntroPage/BalanceContext';
import { LiveBetsProvider } from './IntroPage/LiveBetsContext';
import { SidebarProvider } from './SidebarContext';
import AdminDashboard from './Admin/AdminDashboard';
import { auth, db } from './firebase';
import { useAdmin } from './Admin/AdminContext';
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc } from 'firebase/firestore';
import TransactionNotificationModal from './IntroPage/TransactionNotificationModal';
// Import components
import NavBar from './IntroPage/Navbar';
import Sidebar from './IntroPage/Sidebar';
import HeroSection from './IntroPage/HeroSection';
import CasinoBanner from './IntroPage/CasinoBanner';
import FeatureItem from "./IntroPage/FeatureItem";
import PaymentOptions from "./IntroPage/PaymentOptions";
import VIPSection from './IntroPage/VipFeatures';
import SupportSection from './IntroPage/SupportSection';
import LiveBetsSection from './IntroPage/LiveBetSection';
import FAQSection from './IntroPage/FaqSection';
import Footer from './IntroPage/Footer';

import useAuth from './Auth/useAuth';
import VipProgress from "./Lobby/VipProgress";
import Games from "./Lobby/GamesSlide";
import Trending from './Lobby/Trending';
import LiveBetLobby from './Lobby/LiveBetLobby';
import MasterMineGame from './Games/MasterMineGame';
import Limbo from "./Games/Limbo";
import Crash from "./Games/Crash";
import Wheel from "./Games/Wheel";
import TransactionsPage from './OptionsPages/Transactions';
import MyBetsPage from './OptionsPages/MyBets';
import Settings from "./Settings/Settings";
import { useSidebar } from './SidebarContext';
import { ChatProvider } from './Chat/ChatContext';
import { AdminProvider } from './Admin/AdminContext';
import AdminLogin from './Admin/AdminLogin';
import { ADMIN_CONFIG } from './Admin/AdminConfig';
import { NotificationProvider } from './IntroPage/NotificationContext';
import AgentLogin from './Agent/AgentLogin';
import AgentDashboard from './Agent/AgentDashboard';
import AgentRegistration from './Agent/AgentRegistration';
import { LoadingProvider } from './LoadingContext';
import { LoadingSpinner } from './LoadingComponents';
import LiveSupportWidget from './LiveSupportSystem/LiveSupportWidget';
import SupportAgentRegistration from './LiveSupportSystem/SupportRegister';
import SupportAgentDashboard from './LiveSupportSystem/SupportAgentDashboard';
import SupportAgentLogin from './LiveSupportSystem/SupportAgentLogin';
import { useLocation } from 'react-router-dom';
import VerificationRoute from './VerificationRoute';
import DiceGame from './Games/Dice';
import { ErrorProvider } from './Error/ErrorContext';
import AnimatedHelpWidget from './LiveSupportSystem/AnimatedHelpWidget';
import MaintenancePage from './ForNow';
import { serverTimestamp } from 'firebase/firestore';
import RouletteGame from './Games/Wheel';
import Keno from "./Games/Keno"


const NoLayoutRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!loading) {
        if (!user) {
          navigate('/', { replace: true });
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          // Check if path is agent dashboard and user is an agent
          if (window.location.pathname === '/agent/dashboard') {
            if (userData?.role !== 'agent') {
              navigate('/', { replace: true });
              return;
            }
          }
          
          // Existing support agent check
          if (window.location.pathname === '/support-agent/dashboard') {
            const agentDoc = await getDoc(doc(db, 'supportAgents', user.uid));
            if (!agentDoc.exists() || agentDoc.data().status !== 'approved') {
              navigate('/support-agent/login', { replace: true });
              return;
            }
          }
        } finally {
          setIsChecking(false);
        }
      }
    };

    checkAccess();
  }, [user, loading, navigate]);

  if (loading || isChecking) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  // Return children directly without Layout wrapper
  return <>{children}</>;
};




const Layout = ({ children }) => {
  const { isExpanded } = useSidebar();
  const { user } = useAuth();

  return (
    <>
      <Sidebar />
      <div className={`
        transition-all duration-100 ease-in-out
        ${isExpanded ? 'ml-64' : 'ml-20'}
      `}>
        <NavBar />
        {user && (
  <>
    <LiveSupportWidget />
    <AnimatedHelpWidget />
  </>
)}
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
};
// Update your existing ProtectedRoute component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!loading) {
        if (!user) {
          navigate('/', { replace: true });
          return;
        }

        try {
          // First check if this is a support agent route
          if (requiredRole === 'support_agent') {
            const agentDoc = await getDoc(doc(db, 'supportAgents', user.uid));
            if (!agentDoc.exists() || agentDoc.data().status !== 'approved') {
              navigate('/support-agent/login', { replace: true });
              return;
            }
            // If it's a valid support agent, allow access without email verification check
            setIsChecking(false);
            return;
          }

          // For non-support agent routes, proceed with regular user checks
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          // Only check email verification for regular users
          if (!userData?.emailVerified && 
              !localStorage.getItem('setupChoice') && 
              !requiredRole && // Skip for special roles like 'agent'
              location.pathname !== '/verify-email') {
            navigate('/verify-email', { replace: true });
            return;
          }

          // Role-specific checks
          if (requiredRole === 'agent' && userData?.role !== 'agent') {
            navigate('/', { replace: true });
            return;
          }

          if (window.location.pathname.includes('admin') && !isAdmin) {
            navigate('/', { replace: true });
            return;
          }

          if (userData?.role === 'agent' && window.location.pathname === '/app') {
            navigate('/agent/dashboard', { replace: true });
            return;
          }
        } finally {
          setIsChecking(false);
        }
      }
    };

    checkAccess();
  }, [user, loading, navigate, requiredRole, isAdmin, location]);

  if (loading || isChecking) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  return <Layout>{children}</Layout>;
};

function AppContent() {
  const { user } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);

  useEffect(() => {
    let unsubscribe;
  
    const setupListener = async () => {
      const isRegistering = sessionStorage.getItem('registrationInProgress');
      if (!user?.uid || isRegistering) {
        return;
      }
  
      try {
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          where('seen', '==', false),
          where('type', 'in', ['payment_received', 'agent_transfer'])
        );
  
        unsubscribe = onSnapshot(notificationsQuery, {
          next: async (snapshot) => {
            if (!snapshot.empty) {
              const notification = snapshot.docs[0];
              const notificationData = notification.data();
              console.log('New notification received:', notificationData);

              // Set the transaction data directly from the notification
              // instead of trying to fetch the agentTransaction
              const transactionData = {
                id: notification.id,
                amount: notificationData.amount,
                timestamp: notificationData.timestamp?.toDate?.() || new Date(),
                agentUsername: notificationData.agentUsername || 'Anonymous',
                type: notificationData.type,
                status: 'completed'
              };

              console.log('Setting current transaction:', transactionData);
              
              setCurrentTransaction(transactionData);
              setShowNotification(true);

              // Mark notification as seen
              try {
                await updateDoc(doc(db, 'notifications', notification.id), {
                  seen: true,
                  seenAt: serverTimestamp()
                });
              } catch (error) {
                console.error('Error marking notification as seen:', error);
              }
            }
          },
          error: (error) => {
            console.error('Notification listener error:', error);
          }
        });
      } catch (error) {
        console.error('Error setting up notification listener:', error);
      }
    };
  
    setupListener();
  
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);


  // Helper function to check verification status
  const needsVerification = () => {
    const requiresVerification = sessionStorage.getItem('requiresVerification') === 'true';
    const registrationTimestamp = parseInt(sessionStorage.getItem('registrationTimestamp') || '0');
    const isRecentRegistration = Date.now() - registrationTimestamp < 300000; // 5 minutes
    return requiresVerification && isRecentRegistration;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Route */}
          <Route path="/" element={
  user ? (
    needsVerification() ? (
      <Navigate to="/verify-email" replace />
    ) : (
      <Navigate to="/app" replace />
    )
  ) : (
    // <MaintenancePage />
    <Layout>
      <HeroSection />
      <CasinoBanner />
      <FeatureItem />
      <PaymentOptions />
      <VIPSection />
      <SupportSection />
      <LiveBetLobby />
      <FAQSection />
    </Layout>
  )
} />
          {/* Verification Route */}
       
          <Route 
  path="/verify-email" 
  element={
    !sessionStorage.getItem('registrationInProgress') ? (
      <Navigate to="/" replace />
    ) : (
      <VerificationRoute />
    )
  } 
/>
          {/* Protected Routes with verification check */}
          <Route path="/app" element={
            !user ? (
              <Navigate to="/" replace />
            ) : needsVerification() ? (
              <Navigate to="/verify-email" replace />
            ) : (
              <ProtectedRoute>
                <>
                  <VipProgress />
                  <Games />
                  <Trending />
                  <LiveBetLobby />
                </>
              </ProtectedRoute>
            )
          } />

          {/* Keep all remaining routes the same */}
          <Route path="/mines" element={<ProtectedRoute><><MasterMineGame /><LiveBetLobby /></></ProtectedRoute>} />
          <Route path="/keno" element={<ProtectedRoute><><Keno /><LiveBetLobby /></></ProtectedRoute>} />
          <Route path="/wheel" element={<ProtectedRoute><><RouletteGame /><LiveBetLobby /></></ProtectedRoute>} />
          <Route path="/dice" element={<ProtectedRoute><><DiceGame /><LiveBetLobby /></></ProtectedRoute>} />
          <Route path="/limbo" element={<ProtectedRoute><><Limbo /><LiveBetLobby /></></ProtectedRoute>} />
          <Route path="/crash" element={<ProtectedRoute><><Crash /><LiveBetLobby /></></ProtectedRoute>} />
          <Route path="/wheel" element={<ProtectedRoute><><Wheel /><LiveBetLobby /></></ProtectedRoute>} />
          <Route path="/settings/*" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
          <Route path="/my-bets" element={<ProtectedRoute><MyBetsPage /></ProtectedRoute>} />
          <Route path={ADMIN_CONFIG.SECURE_PATH} element={<AdminLogin />} />
          <Route path={`${ADMIN_CONFIG.SECURE_PATH}/dashboard/*`} element={<AdminDashboard />} />
     
          <Route path="/agent/login" element={<AgentLogin />} />
          <Route path="/agent/register" element={<AgentRegistration />} />

          <Route 
            path="/agent/dashboard" 
            element={
              <NoLayoutRoute>
                <AgentDashboard />
              </NoLayoutRoute>
            } 
          />



          <Route 
    path="/support-agent/dashboard" 
    element={
      <NoLayoutRoute>
        <SupportAgentDashboard />
      </NoLayoutRoute>
    } 
  />
  <Route path="/support-agent/login" element={<SupportAgentLogin />} />
  <Route path="/support-agent/register" element={<SupportAgentRegistration />} />
         
          <Route path="/support-agent/register" element={<SupportAgentRegistration />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <TransactionNotificationModal
          isOpen={showNotification}
          onClose={() => setShowNotification(false)}
          transaction={currentTransaction}
        />
      </div>
    </Router>
  );
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorProvider>
      <NotificationProvider>
        <AdminProvider>
          <ChatProvider>
            <LiveBetsProvider>
              <BalanceProvider>
                <SidebarProvider>
                  <LoadingProvider>
                    <AppContent />
                  </LoadingProvider>
                </SidebarProvider>
              </BalanceProvider>
            </LiveBetsProvider>
          </ChatProvider>
        </AdminProvider>
      </NotificationProvider>
    </ErrorProvider>
  );
}

export default App;