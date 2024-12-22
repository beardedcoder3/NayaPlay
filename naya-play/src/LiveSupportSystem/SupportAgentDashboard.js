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
  getDocs,
  limit,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { 
  LogOut, 
  MessageSquare, 
  Clock,
  CheckCircle, 
  XCircle,
  Send,
  Loader,
  User,
  Filter,
  AlertCircle,
  FileText,
  Smile,
  Paperclip,
  Star,
  List,
  Search,
  ChevronLeft,
  Settings,
  Bell,
  Plus,
  Check,
  CheckCheck,
  Upload,
  File
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';

const CATEGORIES = [
  { id: 'payment', label: 'Payment Issue', icon: '💳', color: 'from-violet-500 to-purple-600' },
  { id: 'technical', label: 'Technical Support', icon: '🔧', color: 'from-blue-500 to-indigo-600' },
  { id: 'account', label: 'Account Help', icon: '👤', color: 'from-emerald-500 to-teal-600' },
  { id: 'general', label: 'General Question', icon: '❓', color: 'from-pink-500 to-rose-600' }
];

const PRIORITIES = {
  high: {
    label: 'High Priority',
    color: 'bg-rose-900 text-rose-200',
    icon: '🔴'
  },
  medium: {
    label: 'Medium Priority',
    color: 'bg-amber-900 text-amber-200',
    icon: '🟡'
  },
  low: {
    label: 'Low Priority',
    color: 'bg-emerald-900 text-emerald-200',
    icon: '🟢'
  }
};

const QUICK_REPLIES = [
  {
    id: 'greeting',
    text: "Hi! How can I help you today?",
    icon: '👋'
  },
  {
    id: 'understanding',
    text: "I understand your concern. Let me help you with that.",
    icon: '👍'
  },
  {
    id: 'details',
    text: "Could you please provide more details?",
    icon: '🤔'
  },
  {
    id: 'checking',
    text: "Let me check that for you.",
    icon: '🔍'
  },
  {
    id: 'followup',
    text: "Is there anything else I can help you with?",
    icon: '✨'
  }
];

const StatusBadge = ({ status }) => {
  const statusStyles = {
    active: 'bg-emerald-900 text-emerald-200',
    waiting: 'bg-amber-900 text-amber-200',
    closed: 'bg-gray-800 text-gray-300'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.closed}`}>
      {status}
    </span>
  );
};

const MessageStatus = ({ status }) => {
  const statusMap = {
    sent: <Clock className="h-3 w-3 text-gray-400" />,
    delivered: <Check className="h-3 w-3 text-gray-400" />,
    seen: <CheckCheck className="h-3 w-3 text-blue-400" />
  };

  return (
    <div className="inline-flex items-center">
      {statusMap[status]}
    </div>
  );
};

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
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  

  // Verify agent authentication and status
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
      } catch (error) {
        console.error('Error verifying agent:', error);
        navigate('/support-agent/login');
      }
    };

    fetchAgentData();
  }, [navigate]);

  // Load and filter tickets
  useEffect(() => {
    if (!auth.currentUser || !agentData) return;

    let q = query(
      collection(db, 'supportTickets'),
      where('status', 'in', ['waiting', 'active']),
      orderBy('priority', 'desc'),
      orderBy('createdAt', 'desc')
    );

    if (selectedCategory !== 'all') {
      q = query(q, where('category', '==', selectedCategory));
    }

    if (selectedPriority !== 'all') {
      q = query(q, where('priority', '==', selectedPriority));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply search filter if exists
      const filteredTickets = searchTerm 
        ? ticketData.filter(ticket => 
            ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : ticketData;

      setTickets(filteredTickets);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser, agentData, selectedCategory, selectedPriority, searchTerm]);

  // Load messages and user info for selected ticket
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

      // Update message status to seen for user messages
      const batch = writeBatch(db);
      const unreadMessages = messageData.filter(
        msg => msg.senderType === 'user' && !msg.seen
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

    // Fetch user info and activity
    const fetchUserInfo = async () => {
      try {
        const [userDoc, ticketsQuery] = await Promise.all([
          getDoc(doc(db, 'users', selectedTicket.userId)),
          getDocs(query(
            collection(db, 'supportTickets'),
            where('userId', '==', selectedTicket.userId),
            orderBy('createdAt', 'desc'),
            limit(5)
          ))
        ]);

        if (userDoc.exists()) {
          setUserInfo({
            ...userDoc.data(),
            previousTickets: ticketsQuery.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
          });
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
    return () => unsubscribe();
  }, [selectedTicket]);

  // Update agent online status
  useEffect(() => {
    if (!auth.currentUser || !agentData) return;

    const updateAgentStatus = async () => {
      try {
        await updateDoc(doc(db, 'supportAgents', auth.currentUser.uid), {
          isOnline: true,
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
  }, [auth.currentUser, agentData]);

  const handleStatusChange = async (newStatus) => {
    if (!auth.currentUser) return;
    
    try {
      setAgentStatus(newStatus);
      await updateDoc(doc(db, 'supportAgents', auth.currentUser.uid), {
        status: newStatus,
        lastActive: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating agent status:', error);
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
        status: 'sent',
        read: false
      });

      // Update to delivered after sending
      setTimeout(async () => {
        await updateDoc(doc(db, 'supportMessages', messageRef.id), {
          status: 'delivered'
        });
      }, 1000);

      await updateDoc(doc(db, 'supportTickets', selectedTicket.id), {
        lastUpdated: serverTimestamp(),
        status: 'active',
        lastAgentResponse: serverTimestamp(),
        assignedAgent: auth.currentUser.uid,
        lastMessage: newMessage.trim()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket || !auth.currentUser) return;

    try {
      await updateDoc(doc(db, 'supportTickets', selectedTicket.id), {
        status: 'closed',
        closedAt: serverTimestamp(),
        closedBy: auth.currentUser.uid,
        resolution: 'resolved'
      });

      const messageRef = await addDoc(collection(db, 'supportMessages'), {
        ticketId: selectedTicket.id,
        content: 'Ticket closed. Thank you for contacting support!',
        sender: auth.currentUser.uid,
        senderType: 'system',
        timestamp: serverTimestamp(),
        status: 'sent'
      });

      // Update to delivered after sending
      setTimeout(async () => {
        await updateDoc(doc(db, 'supportMessages', messageRef.id), {
          status: 'delivered'
        });
      }, 1000);

      setSelectedTicket(null);
    } catch (error) {
      console.error('Error closing ticket:', error);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    if (!selectedTicket) return;

    try {
      await updateDoc(doc(db, 'supportTickets', selectedTicket.id), {
        priority: newPriority,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating priority:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="p-4 bg-gray-800 rounded-full">
          <Loader className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Fixed Header */}
      <nav className="h-16 bg-gray-800 border-b border-gray-700">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-white text-xl font-bold">Support Dashboard</h1>
            <div className="relative">
              <input 
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={agentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="online">👋 Online</option>
              <option value="away">🌙 Away</option>
              <option value="busy">⏳ Busy</option>
            </select>
            <button
              onClick={() => auth.signOut()}
              className="flex items-center px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area - Fixed Height */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tickets */}
        <div className="w-80 flex flex-col bg-gray-800 border-r border-gray-700">
          {/* Filter Section */}
          <div className="p-4 border-b border-gray-700">
            <div className="space-y-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Priorities</option>
                {Object.entries(PRIORITIES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.icon} {value.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tickets List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedTicket?.id === ticket.id
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-gray-700 border-gray-600 hover:border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITIES[ticket.priority].color}`}>
                    {PRIORITIES[ticket.priority].icon} {ticket.priority}
                  </span>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="text-white text-sm font-medium mt-1">#{ticket.id.slice(-6)}</p>
                <p className="text-gray-300 text-sm truncate">{ticket.subject}</p>
                <p className="text-gray-400 text-xs mt-1">{formatTime(ticket.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Center - Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-white font-medium">
                    #{selectedTicket.id.slice(-6)} - {selectedTicket.subject}
                  </h2>
                  <p className="text-sm text-gray-400">
                    Priority: {PRIORITIES[selectedTicket.priority].icon} {selectedTicket.priority}
                  </p>
                </div>
                <button
                  onClick={handleCloseTicket}
                  className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                >
                  Close Ticket
                </button>
              </div>

              {/* Messages Area - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderType === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] p-3 rounded-xl ${
                      message.senderType === 'agent'
                        ? 'bg-blue-600 text-white'
                        : message.senderType === 'system'
                          ? 'bg-gray-700/50 text-white text-center w-full'
                          : 'bg-gray-700 text-white'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-end space-x-2 mt-1">
                        <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                        {message.senderType === 'agent' && <MessageStatus status={message.status || 'sent'} />}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Fixed Input Area */}
              <div className="h-24 border-t border-gray-700 p-4">
                <div className="flex space-x-2 mb-2">
                  {QUICK_REPLIES.slice(0, 3).map((reply) => (
                    <button
                      key={reply.id}
                      onClick={() => setNewMessage(reply.text)}
                      className="px-3 py-1 bg-gray-700 text-white rounded-full hover:bg-gray-600 text-sm"
                    >
                      {reply.icon} {reply.text}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleSendMessage} className="relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg pl-4 pr-24 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Type your message..."
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1.5 text-gray-400 hover:text-white"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="p-1.5 text-blue-500 hover:text-blue-400 disabled:opacity-50"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2">
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setNewMessage(prev => prev + emojiData.emoji);
                          setShowEmojiPicker(false);
                        }}
                        width={320}
                        height={400}
                        theme="dark"
                      />
                    </div>
                  )}
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-300">Select a ticket to start chatting</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - User Info */}
        {selectedTicket && userInfo && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
            <div className="p-4">
              <div className="mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{userInfo.email}</h3>
                    <p className="text-sm text-gray-400">
                      Member since {new Date(userInfo.createdAt?.seconds * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Previous Tickets */}
                <div>
                  <h4 className="text-white font-medium mb-2">Previous Tickets</h4>
                  <div className="space-y-2">
                    {userInfo.previousTickets?.slice(0, 3).map((ticket) => (
                      <div
                        key={ticket.id}
                        className="p-2 bg-gray-700 rounded-lg"
                      >
                        <p className="text-sm text-white">{ticket.subject}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(ticket.createdAt?.seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h4 className="text-white font-medium mb-2">Notes</h4>
                  <textarea
                    className="w-full bg-gray-700 text-white rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    placeholder="Add notes about this user..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportAgentDashboard;