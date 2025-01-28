import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Clock, Users, Smile } from 'lucide-react';
import { useChat } from './ChatContext';
import { auth, db } from '../firebase';
import EmojiPicker from 'emoji-picker-react';
import { getDoc } from 'firebase/firestore';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  addDoc,
  where,
  getDocs,
  doc,
  setDoc
} from 'firebase/firestore';
import StatisticsModal from '../IntroPage/StatisticsModal';

// Theme Colors
const THEME = {
  bg: {
    primary: '#0B1622',
    secondary: '#131E2B',
    accent: '#6366F1'
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#94A3B8'
  }
};

// VIP Configuration with Filled Icons
const vipLevels = {
  none: {
    color: 'from-gray-700 to-gray-800',
    textColor: 'text-gray-400',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    messageColor: 'bg-gray-800/20'
  },
  bronze: {
    color: 'from-amber-600 to-amber-800',
    textColor: 'text-amber-500',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
      </svg>
    ),
    messageColor: 'bg-amber-500/10'
  },
  silver: {
    color: 'from-gray-300 to-gray-400',
    textColor: 'text-gray-300',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28z" />
      </svg>
    ),
    messageColor: 'bg-gray-300/10'
  },
  gold: {
    color: 'from-yellow-400 to-amber-500',
    textColor: 'text-yellow-400',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M17 3H7l-4 6 9 13 9-13-4-6zM3.81 7l2.5-3.66L8.87 7H3.81zM12 18L6.1 9h11.8L12 18z" />
      </svg>
    ),
    messageColor: 'bg-yellow-400/10'
  },
  platinum: {
    color: 'from-cyan-400 to-cyan-600',
    textColor: 'text-cyan-400',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
      </svg>
    ),
    messageColor: 'bg-cyan-400/10'
  },
  diamond: {
    color: 'from-blue-400 to-blue-600',
    textColor: 'text-blue-400',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2L2 8l10 6 10-6-10-6zM2 15l10 6 10-6M2 12l10 6 10-6" />
      </svg>
    ),
    messageColor: 'bg-blue-400/10'
  }
};

const SPAM_TIMEOUT = 2000;
const MESSAGE_LIMIT = 50;

const MentionSuggestions = ({ users, onSelect }) => {
  if (!users.length) return null;

  return (
    <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#0B1622] rounded 
      border border-[#6366F1] shadow-xl overflow-hidden max-h-48 overflow-y-auto">
      {users.map(user => (
        <button
          key={user.id}
          onClick={() => onSelect(user.username)}
          className="w-full px-4 py-2.5 text-left hover:bg-[#131E2B] 
            flex items-center space-x-3 group transition-colors"
        >
          <span className="text-[14px] text-white group-hover:text-white/90">
            {user.username}
          </span>
        </button>
      ))}
    </div>
  );
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

const GlobalChat = () => {
  const { isChatOpen, setIsChatOpen } = useChat();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeChatUsers, setActiveChatUsers] = useState([]);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [mentionUsers, setMentionUsers] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [userVipLevels, setUserVipLevels] = useState({});
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const currentUser = auth.currentUser;

  // Track active chat users with open chat
  useEffect(() => {
    const activeChatRef = collection(db, 'activeChats');
    
    // Update user's active status
    const updateActiveStatus = async () => {
      if (!currentUser) return;
      
      const userRef = doc(db, 'activeChats', currentUser.uid);
      await setDoc(userRef, {
        userId: currentUser.uid,
        lastActive: serverTimestamp(), // Make sure we're using serverTimestamp()
        chatOpen: isChatOpen
      }, { merge: true }); // Add merge option for smoother updates
    };

    // Initial update and setup interval
    updateActiveStatus();
    const interval = setInterval(updateActiveStatus, 30000);

    // Listen for active users
    const q = query(activeChatRef);
    const cleanup = onSnapshot(q, (snapshot) => {
      const activeUsers = snapshot.docs
        .filter(doc => {
          const data = doc.data();
          const lastActive = data.lastActive?.toDate();
          return lastActive && 
            (new Date() - lastActive) < 300000 && 
            data.chatOpen === true;
        })
        .map(doc => doc.data().userId);
      setActiveChatUsers(activeUsers);
    });

    // Cleanup
    return () => {
      cleanup();
      clearInterval(interval);
      if (currentUser) {
        setDoc(doc(activeChatRef, currentUser.uid), {
          userId: currentUser.uid,
          lastActive: serverTimestamp(),
          chatOpen: false
        });
      }
    };
  }, [currentUser, isChatOpen]);

  // Load VIP levels for all users
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const levels = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const totalWagered = data.totalWagered || 0; // Changed from stats.wagered to totalWagered
        let vipLevel = 'none';
        
        if (totalWagered >= 25000) vipLevel = 'diamond';
        else if (totalWagered >= 10000) vipLevel = 'platinum';
        else if (totalWagered >= 5000) vipLevel = 'gold';
        else if (totalWagered >= 1000) vipLevel = 'silver';
        else if (totalWagered > 0) vipLevel = 'bronze';
        
        levels[doc.id] = vipLevel;
      });
      setUserVipLevels(levels);
    });
    
    return () => unsubscribe();
  }, []);

  // Load chat messages
  useEffect(() => {
    const q = query(
      collection(db, 'chat'),
      orderBy('timestamp', 'desc'),
      limit(MESSAGE_LIMIT)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .reverse();
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, []);

  // Handle mentions
  useEffect(() => {
    const words = message.split(' ');
    const lastWord = words[words.length - 1].toLowerCase();
    
    if (lastWord.startsWith('@')) {
      const searchTerm = lastWord.slice(1);
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      
      const fetchUsers = async () => {
        const snapshot = await getDocs(q);
        const allUsers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filter users who are in activeChatUsers
        const activeUsers = allUsers.filter(user => 
          activeChatUsers.includes(user.id) &&
          user.username?.toLowerCase().startsWith(searchTerm.toLowerCase())
        );
        
        setMentionUsers(activeUsers);
        setShowMentions(activeUsers.length > 0);
      };
      
      fetchUsers();
    } else {
      setShowMentions(false);
    }
  }, [message, activeChatUsers]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isScrolledToBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    setIsAutoScrollEnabled(isScrolledToBottom);
  };

  useEffect(() => {
    if (isAutoScrollEnabled && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isAutoScrollEnabled]);

  const onEmojiClick = (emojiObject) => {
    setMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };


  const handleUserClick = async (clickedUserId, event) => {
    event.preventDefault();
    
    try {
      // Fetch user data directly from users collection
      const userRef = doc(db, 'users', clickedUserId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Just pass the userId to open the modal
        setSelectedUser(clickedUserId);
      } else {
        console.error("User not found");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };


  const handleMention = (username) => {
    const words = message.split(' ');
    words[words.length - 1] = `@${username}`;
    setMessage(words.join(' ') + ' ');
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
  
    const now = Date.now();
    if (now - lastMessageTime < SPAM_TIMEOUT) {
      alert('Please wait a moment before sending another message');
      return;
    }
  
    try {
      // Get user data first
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
  
      await addDoc(collection(db, 'chat'), {
        text: message.trim(),
        userId: currentUser.uid,
        username: userData.username || currentUser.email.split('@')[0],
        timestamp: serverTimestamp(),
        mentions: message.match(/@(\w+)/g)?.map(m => m.slice(1)) || []
      });
  
      setMessage('');
      setLastMessageTime(now);
      if (isAutoScrollEnabled) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  
  const getMessageStyle = (msg) => {
    const isOwnMessage = msg.userId === currentUser?.uid;
    const isMentioned = msg.mentions?.some(mention => 
      mention.toLowerCase() === currentUser?.displayName?.toLowerCase()
    );
    const senderVipLevel = userVipLevels[msg.userId]?.toLowerCase() || 'none';
    
    // If mentioned, use mentioned user's VIP color
    if (isMentioned) {
      const mentionedVipLevel = userVipLevels[currentUser?.uid]?.toLowerCase() || 'none';
      return `bg-${vipLevels[mentionedVipLevel].color}/10`; // Use semi-transparent background
    }
    
    // If own message, use sender's VIP color
    if (isOwnMessage) {
      return `bg-${vipLevels[senderVipLevel].color}/10`; // Use semi-transparent background
    }
    
    // Default style
    return 'bg-[#131E2B]';
  };

  
  return (
    <>
      {isChatOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={() => setIsChatOpen(false)}
        />
      )}

      <div 
        className={`
          fixed right-0 top-16 h-[calc(100vh-64px)] w-[400px]
          bg-[#0B1622] border-l border-[#2a2a2a] shadow-2xl
          transition-transform duration-300 ease-out
          ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col z-50
        `}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2a2a2a] bg-[#131E2B]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-medium text-white flex items-center">
                Global Chat
                <span className="ml-2 px-2 py-0.5 bg-[#6366F1] rounded text-white 
                  text-[11px] font-medium">
                  LIVE
                </span>
              </h2>
              <div className="flex items-center mt-1 text-[13px] text-[#888]">
                <Users size={14} className="mr-1.5" />
                <span>{activeChatUsers.length} chatting</span>
              </div>
            </div>
            <button 
              onClick={() => setIsChatOpen(false)}
              className="p-2 -mr-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
            >
              <X size={18} className="text-[#888]" />
            </button>
          </div>
        </div>

        {/* Messages */}
      {/* Messages */}
<div 
  ref={chatContainerRef}
  onScroll={handleScroll}
  className="flex-1 overflow-y-auto overflow-x-auto scrollbar-none"
>
  <div className="p-4">
    {messages.map((msg) => {
      const vipLevel = userVipLevels[msg.userId]?.toLowerCase() || 'none';
      const VipIcon = vipLevels[vipLevel].icon;
      
      return (
        <div key={msg.id} className="mb-3">
          <div className="flex items-start">
            <div className={`bg-gradient-to-r ${vipLevels[vipLevel].color} 
              rounded p-1.5 flex items-center justify-center flex-shrink-0`}>
              <VipIcon />
            </div>
            
            <div className="ml-2 flex-1 min-w-0"> {/* Added min-w-0 for proper wrapping */}
              <div className="flex items-baseline gap-2">
                <button 
                  onClick={(e) => handleUserClick(msg.userId, e)}
                  className={`text-[13px] font-medium ${vipLevels[vipLevel].textColor} 
                    hover:text-white transition-colors`}
                >
                  {msg.username}
                </button>
                <span className="text-[11px] text-[#888]">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              
              <div className={`mt-1 rounded p-3 ${getMessageStyle(msg)} break-words`}>
                <p className="text-[14px] text-white/90 whitespace-pre-wrap overflow-wrap-break">
                  {msg.text}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    })}
    <div ref={messagesEndRef} />
  </div>
</div>

{/* Input */}
<div className="p-5 border-t border-[#2a2a2a] bg-[#131E2B]">
  <form onSubmit={handleSubmit}>
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write a message..."
        maxLength={200}
        className="w-full bg-[#0B1622] text-white/90 px-4 py-2.5 pr-24
          text-[14px] rounded placeholder:text-[#888]
          focus:outline-none
          border border-[#2a2a2a] hover:border-[#3a3a3a]
          transition-colors"
      />
      
      {showMentions && (
        <MentionSuggestions
          users={mentionUsers}
          onSelect={handleMention}
        />
      )}

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1.5 rounded hover:bg-[#2a2a2a] transition-colors"
        >
          <Smile size={16} className="text-white" />
        </button>
        
        <button
          type="submit"
          disabled={!message.trim()}
          className="p-1.5 rounded
            bg-[#6366F1] hover:bg-[#6366F1]/80
            disabled:opacity-30 disabled:hover:bg-[#6366F1]
            transition-colors"
        >
          <Send size={16} className="text-white" />
        </button>
      </div>

      {showEmojiPicker && (
        <div className="absolute bottom-full right-0 mb-2">
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme="dark"
            width={300}
            height={400}
          />
        </div>
      )}
    </div>

    <div className="mt-2 px-1 flex justify-between text-[11px] text-[#888]">
      <div className="flex items-center">
        <Clock size={11} className="mr-1" />
        <span>{SPAM_TIMEOUT/1000}s delay</span>
      </div>
      <span>{message.length}/200</span>
    </div>
  </form>
</div>
      </div>

 {selectedUser && (
  <StatisticsModal 
    userId={selectedUser}
    isOpen={!!selectedUser}
    onClose={() => setSelectedUser(null)}
  />
)}
    </>
  );
};

export default GlobalChat;