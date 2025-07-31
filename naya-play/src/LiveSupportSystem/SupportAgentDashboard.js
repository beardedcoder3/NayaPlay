import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc,
  updateDoc,
  addDoc,
  orderBy,
  serverTimestamp,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { 
  LogOut, 
  MessageSquare,
  Send,
  Loader,
  User,
  Search,
  CheckCircle,
  Clock,
  X,
  MessageCircle,
  Calendar,
  Plus,
  AlertCircle
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: 'payment', label: 'Payment Issue', icon: '💳' },
  { id: 'technical', label: 'Technical Support', icon: '🔧' },
  { id: 'account', label: 'Account Help', icon: '👤' },
  { id: 'general', label: 'General Question', icon: '❓' }
];

const QUICK_REPLIES = [
  { id: 'greeting', text: "Hi! How can I help you today?", icon: '👋' },
  { id: 'understanding', text: "I understand your concern. Let me help you with that.", icon: '👍' },
  { id: 'checking', text: "Let me check that for you.", icon: '🔍' },
  { id: 'escalate', text: "I'll need to escalate this to our specialist team.", icon: '⚡' }
];

const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: MessageCircle },
    waiting: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Clock },
    closed: { bg: 'bg-gray-500/10', text: 'text-gray-400', icon: CheckCircle }
  };

  const config = statusConfig[status] || statusConfig.closed;
  const Icon = config.icon;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
};

const MessageStatus = ({ status }) => {
  if (status === 'seen') return <CheckCircle className="h-3 w-3 text-emerald-400" />;
  if (status === 'delivered') return <CheckCircle className="h-3 w-3 text-indigo-400" />;
  return <Clock className="h-3 w-3 text-gray-400" />;
};

const LoadingSpinner = () => (
  <div className="flex-1 flex items-center justify-center bg-[#1a1b1e] min-h-screen">
    <div className="flex flex-col items-center gap-3">
      <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
      <p className="text-gray-400 animate-pulse">Loading dashboard...</p>
    </div>
  </div>
);

const SupportAgentDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [agentData, setAgentData] = useState(null);
  const [agentStatus, setAgentStatus] = useState('online');
  const [userInfo, setUserInfo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('waiting');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();



  


  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/support-agent/login');
      return;
    }

    const fetchAgentData = async () => {
      try {
        const agentDoc = await getDoc(doc(db, 'supportAgents', auth.currentUser.uid));
        if (!agentDoc.exists()) {
          throw new Error('Agent not found');
        }

        const agentData = agentDoc.data();
        if (agentData.status !== 'approved') {
          throw new Error('Agent not approved');
        }

        setAgentData(agentData);
        setAgentStatus(agentData.status || 'online');
      } catch (error) {
        console.error('Error verifying agent:', error);
        navigate('/support-agent/login');
      }
    };

    fetchAgentData();
  }, [navigate]);

  useEffect(() => {
    if (!auth.currentUser || !agentData || agentStatus === 'busy') return;

    let q = query(
      collection(db, 'supportTickets'),
      where('status', '==', viewMode),
      orderBy('lastUpdated', 'desc')
    );

    if (selectedCategory !== 'all') {
      q = query(q, where('category', '==', selectedCategory));
    }

    if (agentStatus === 'online') {
      q = query(q, where('assignedAgent', 'in', [null, auth.currentUser.uid]));

      
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const filteredTickets = searchTerm 
        ? ticketData.filter(ticket => 
            ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : ticketData;

      setTickets(filteredTickets);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser, agentData, agentStatus, viewMode, selectedCategory, searchTerm]);

  useEffect(() => {
    if (!selectedTicket) return;
  
    const q = query(
      collection(db, 'supportMessages'),
      where('ticketId', '==', selectedTicket.id),
      orderBy('timestamp', 'asc')
    );
  
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      // Handle unread messages in a batch
      const batch = writeBatch(db);
      const unreadMessages = messageData.filter(
        msg => !msg.seen && 
        ((msg.senderType === 'user' && auth.currentUser.uid !== msg.sender) ||
         (msg.senderType === 'agent' && auth.currentUser.uid !== msg.sender))
      );
  
      unreadMessages.forEach(msg => {
        const msgRef = doc(db, 'supportMessages', msg.id);
        batch.update(msgRef, { 
          seen: true,
          status: 'seen'
        });
      });
  
      if (unreadMessages.length > 0) {
        await batch.commit();
      }
  
      setMessages(messageData);
    });
  
    // Keep the existing user info fetching
    const fetchUserInfo = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', selectedTicket.userId));
        if (userDoc.exists()) {
          setUserInfo({
            id: userDoc.id,
            ...userDoc.data(),
            // Ensure default values
            username: userDoc.data().username || 'N/A',
            status: userDoc.data().status || 'Active',
            balance: userDoc.data().balance || 0,
            lastActive: userDoc.data().lastActive || null,
            email: userDoc.data().email || 'N/A',
            createdAt: userDoc.data().createdAt || null
          });
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        setUserInfo(null);
      }
    };
  
    fetchUserInfo();
  }, [selectedTicket?.userId]);



  // Note: added auth.currentUser to dependencies
  useEffect(() => {
    if (!auth.currentUser || !agentData) return;

    const updateAgentStatus = async () => {
      try {
        await updateDoc(doc(db, 'supportAgents', auth.currentUser.uid), {
          isOnline: agentStatus === 'online',
          status: agentStatus,
          lastActive: serverTimestamp()
        });
      } catch (error) {
        console.error('Error updating agent status:', error);
      }
    };

    updateAgentStatus();
    const interval = setInterval(updateAgentStatus, 5 * 60 * 1000);

    const handleBeforeUnload = () => {
      const agentRef = doc(db, 'supportAgents', auth.currentUser.uid);
      updateDoc(agentRef, {
        isOnline: false,
        lastActive: serverTimestamp()
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (auth.currentUser) {
        const agentRef = doc(db, 'supportAgents', auth.currentUser.uid);
        updateDoc(agentRef, {
          isOnline: false,
          lastActive: serverTimestamp()
        });
      }
    };
  }, [auth.currentUser, agentData, agentStatus]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  const handleSignOut = async () => {
    try {
      if (auth.currentUser) {
        const agentRef = doc(db, 'supportAgents', auth.currentUser.uid);
        await updateDoc(agentRef, {
          isOnline: false,
          lastActive: serverTimestamp()
        });
      }
      await auth.signOut();
      navigate('/support-agent/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket || !auth.currentUser) return;

    try {
      const messageRef = await addDoc(collection(db, 'supportMessages'), {
        ticketId: selectedTicket.id,
        content: newMessage.trim(),
        sender: auth.currentUser.uid,
        senderType: 'agent',
        timestamp: serverTimestamp(),
        agentName: agentData?.fullName || 'Support Agent',
        status: 'sent'
      });

      await updateDoc(doc(db, 'supportTickets', selectedTicket.id), {
        lastUpdated: serverTimestamp(),
        status: 'active',
        lastAgentResponse: serverTimestamp(),
        assignedAgent: auth.currentUser.uid,
        lastMessage: newMessage.trim()
      });

      await updateDoc(doc(db, 'supportMessages', messageRef.id), {
        status: 'delivered'
      });

      setNewMessage('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket || !auth.currentUser) return;
  
    try {
      await updateDoc(doc(db, 'supportTickets', selectedTicket.id), {
        status: 'closed',
        lastUpdated: serverTimestamp(),
        closedBy: auth.currentUser.uid,
        closedAt: serverTimestamp()
      });
  
      await addDoc(collection(db, 'supportMessages'), {
        ticketId: selectedTicket.id,
        content: 'Ticket closed by support agent',
        senderType: 'system',
        timestamp: serverTimestamp(),
        status: 'sent'
      });
  
      setSelectedTicket(prev => ({
        ...prev,
        status: 'closed'
      }));
    } catch (error) {
      console.error('Error closing ticket:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000)
      : timestamp instanceof Date 
        ? timestamp 
        : new Date();

    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  if (!agentData || loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#1a1b1e]">
      {/* Header */}
      <nav className="h-16 flex-none bg-[#25262b] border-b border-gray-800 shadow-lg">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative group">
              <input 
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#2c2d31] text-white rounded-lg pl-10 pr-4 py-2 w-72 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200 border border-gray-700 hover:border-gray-600"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 group-hover:text-gray-300 transition-colors" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={agentStatus}
              onChange={(e) => setAgentStatus(e.target.value)}
              className="bg-[#2c2d31] text-white rounded-lg px-4 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <option value="online">👋 Online</option>
              <option value="busy">⏳ Busy</option>
            </select>
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tickets Sidebar */}
        <div className="w-80 flex flex-col bg-[#25262b] border-r border-gray-800">
          {/* Filters */}
          <div className="flex-none p-4 border-b border-gray-800">
            <div className="flex space-x-2 mb-3">
              <button
                onClick={() => setViewMode('waiting')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  viewMode === 'waiting'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-[#2c2d31] text-gray-300 hover:bg-[#34353a]'
                }`}
              >
                Waiting
              </button>
              <button
                onClick={() => setViewMode('active')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  viewMode === 'active'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-[#2c2d31] text-gray-300 hover:bg-[#34353a]'
                }`}
              >
                Active
              </button>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#2c2d31] text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tickets List */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              <div className="p-4 space-y-2">
                {tickets.map((ticket) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedTicket?.id === ticket.id
                        ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20'
                        : 'bg-[#2c2d31] hover:bg-[#34353a]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-gray-300">
                        #{ticket.id.slice(-6)}
                      </span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <p className="text-white text-sm font-medium mb-2 line-clamp-2">{ticket.subject}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs flex items-center gap-1">
                        {CATEGORIES.find(cat => cat.id === ticket.category)?.icon}
                        {CATEGORIES.find(cat => cat.id === ticket.category)?.label}
                      </span>
                      <span className="text-gray-400 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatTime(ticket.lastUpdated || ticket.createdAt)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#1a1b1e] min-w-0">
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="flex-none h-16 px-6 bg-[#25262b] border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h2 className="text-white font-medium flex items-center gap-2">
                    #{selectedTicket.id.slice(-6)} - {selectedTicket.subject}
                  </h2>
                  <p className="text-sm text-gray-400 flex items-center gap-1.5">
                    {CATEGORIES.find(cat => cat.id === selectedTicket.category)?.icon}
                    {CATEGORIES.find(cat => cat.id === selectedTicket.category)?.label}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {selectedTicket.status !== 'closed' && (
                    <button
                      onClick={handleCloseTicket}
                      className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors duration-200 flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Close Ticket
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-4">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex ${message.senderType === 'agent' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-4 rounded-xl shadow-lg ${
                            message.senderType === 'agent'
                              ? 'bg-indigo-600 text-white'
                              : message.senderType === 'system'
                                ? 'bg-[#2c2d31] text-white text-center w-full'
                                : 'bg-[#2c2d31] text-white'
                          }`}
                        >
                          {message.senderType !== 'system' && (
                            <div className="text-xs opacity-70 mb-1">
                              {message.senderType === 'agent' ? message.agentName : 'User'}
                            </div>
                          )}
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <div className="flex items-center justify-end space-x-2 mt-2">
                            <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                            {message.senderType === 'agent' && <MessageStatus status={message.status || 'sent'} />}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <div className="flex-none p-4 bg-[#25262b] border-t border-gray-800">
                <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply.id}
                      onClick={() => setNewMessage(reply.text)}
                      className="px-4 py-2 bg-[#2c2d31] text-white rounded-full hover:bg-[#34353a] transition-colors duration-200 text-sm whitespace-nowrap flex items-center gap-2"
                    >
                      <span>{reply.icon}</span>
                      <span>{reply.text}</span>
                    </button>
                  ))}
                </div>
                <form onSubmit={handleSendMessage} className="relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full bg-[#2c2d31] text-white rounded-lg pl-4 pr-24 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none border border-gray-700 hover:border-gray-600 transition-colors"
                    placeholder="Type your message..."
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors duration-200"
                    >
                      {showEmojiPicker ? <X className="h-5 w-5" /> : '😊'}
                    </button>
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="p-2 text-indigo-500 hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                      >
                        <EmojiPicker
                          onEmojiClick={(emojiData) => {
                            setNewMessage(prev => prev + emojiData.emoji);
                            setShowEmojiPicker(false);
                          }}
                          width={320}
                          height={400}
                          theme="dark"
                        />
                      </motion.div>
                    </div>
                  )}
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[#25262b]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <MessageSquare className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-white text-lg font-medium mb-2">No Ticket Selected</h3>
                <p className="text-gray-400">Select a ticket from the list to start chatting</p>
              </motion.div>
            </div>
          )}
        </div>

        {/* User Info Sidebar */}
        {selectedTicket && userInfo && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex flex-col bg-[#25262b] border-l border-gray-800"
          >
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-indigo-600/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{userInfo.email}</h3>
                      <p className="text-sm text-gray-400">
                        Member since {userInfo.createdAt?.seconds ? new Date(userInfo.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* User Info Cards */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#2c2d31] rounded-lg p-4 border border-gray-700"
                  >
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-400" />
                      Account Details
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Username</span>
                        <span className="text-white font-medium">{userInfo.username}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Status</span>
                        <span className="text-white font-medium">{userInfo.status || 'Active'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Balance</span>
                        <span className="text-white font-medium">${userInfo.balance?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Last Active</span>
                        <span className="text-white font-medium">{formatTime(userInfo.lastActive)}</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Additional User Info Sections can be added here */}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SupportAgentDashboard;