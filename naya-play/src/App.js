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

const Layout = ({ children }) => {
  const { isExpanded } = useSidebar();
  const { user } = useAuth();

  return (
    <>
      <Sidebar />
      <div className={`
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'ml-64' : 'ml-20'}
      `}>
        <NavBar />
        {user && <LiveSupportWidget />}
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
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          // Check if email is verified in Firestore
          if (!userData?.emailVerified && !localStorage.getItem('setupChoice')) {
            navigate('/verify-email', { replace: true });
            return;
          }

          // Role checks
          if (requiredRole === 'support_agent') {
            const agentDoc = await getDoc(doc(db, 'supportAgents', user.uid));
            if (!agentDoc.exists() || agentDoc.data().status !== 'approved') {
              navigate('/support-agent/login', { replace: true });
              return;
            }
          }

          const role = userData?.role;

          if (requiredRole === 'agent' && role !== 'agent') {
            navigate('/', { replace: true });
            return;
          }

          if (window.location.pathname.includes('admin') && !isAdmin) {
            navigate('/', { replace: true });
            return;
          }

          if (role === 'agent' && window.location.pathname === '/app') {
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

  // Show loading spinner only during initial check
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
    if (!user) {
      console.log('No user logged in');
      return () => {};
    }
  
    try {
      console.log('Setting up notification listener for user:', user.uid);
  
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('seen', '==', false),
        where('type', '==', 'payment_received')
      );
  
      const unsubscribe = onSnapshot(notificationsQuery, {
        next: async (snapshot) => {
          console.log('Notification snapshot received:', snapshot.docs.length, 'docs');
          if (!snapshot.empty) {
            const notification = snapshot.docs[0];
            const notificationData = notification.data();
            console.log('Found notification:', notificationData);
  
            setCurrentTransaction(notificationData.data);
            setShowNotification(true);
  
            try {
              await updateDoc(doc(db, 'notifications', notification.id), {
                seen: true
              });
            } catch (error) {
              console.error('Error updating notification:', error);
            }
          }
        },
        error: (error) => {
          console.error('Notification listener error:', error);
        }
      });
  
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up notification listener:', error);
      return () => {};
    }
  }, [user]);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Route */}
          <Route path="/" element={
            user ? (
              <Navigate to="/app" replace />
            ) : (
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
    !user ? (
      <Navigate to="/" replace />
    ) : user?.emailVerified ? (
      <Navigate to="/app" replace />
    ) : (
      <VerificationRoute />
    )
  } 
/>

          {/* Protected Routes */}
          <Route path="/app" element={
            <ProtectedRoute>
              <>
                <VipProgress />
                <Games />
                <Trending />
                <LiveBetLobby />
              </>
            </ProtectedRoute>
          } />

          {/* Game Routes */}
          <Route path="/mines" element={
            <ProtectedRoute>
              <>
                <MasterMineGame />
                <LiveBetLobby />
              </>
            </ProtectedRoute>
          } />


<Route path="/dice" element={
            <ProtectedRoute>
              <>
               <DiceGame />
                <LiveBetLobby />
              </>
            </ProtectedRoute>
          } />

          


          <Route path="/limbo" element={
            <ProtectedRoute>
              <>
                <Limbo />
                <LiveBetLobby />
              </>
            </ProtectedRoute>
          } />

          <Route path="/crash" element={
            <ProtectedRoute>
              <>
                <Crash />
                <LiveBetLobby />
              </>
            </ProtectedRoute>
          } />

          <Route path="/wheel" element={
            <ProtectedRoute>
              <>
                <Wheel />
                <LiveBetLobby />
              </>
            </ProtectedRoute>
          } />

          <Route path="/settings/*" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="/transactions" element={
            <ProtectedRoute>
              <TransactionsPage />
            </ProtectedRoute>
          } />

          <Route path="/my-bets" element={
            <ProtectedRoute>
              <MyBetsPage />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path={ADMIN_CONFIG.SECURE_PATH} element={<AdminLogin />} />
          <Route 
            path={`${ADMIN_CONFIG.SECURE_PATH}/dashboard/*`} 
            element={<AdminDashboard />} 
          />

          {/* Agent Routes */}
          <Route path="/agent/dashboard" element={
            <ProtectedRoute requiredRole="agent">
              <AgentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/agent/login" element={<AgentLogin />} />
          <Route path="/agent/register" element={<AgentRegistration />} />

          {/* Support Agent Routes */}
          <Route path="/support-agent/dashboard" element={
            <ProtectedRoute requiredRole="support_agent">
              <SupportAgentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/support-agent/login" element={<SupportAgentLogin />} />
          <Route path="/support-agent/register" element={<SupportAgentRegistration />} />
          <Route path="/verify-email" element={<VerificationRoute />} />
          {/* Catch all other routes and redirect to home */}
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
  );
}

export default App;