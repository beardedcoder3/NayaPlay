import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Clock, Users, AtSign } from 'lucide-react';
import { useChat } from './ChatContext';
import { auth, db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  addDoc,
  where,
  getDocs 
} from 'firebase/firestore';
import StatisticsModal from '../IntroPage/StatisticsModal';

const SPAM_TIMEOUT = 2000;
const MESSAGE_LIMIT = 50;

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

const UserStatsPopup = ({ userId, position, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRef = collection(db, 'userStats');
        const q = query(statsRef, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          setStats(snapshot.docs[0].data());
        }
      } catch (error) {
        console.error("Error fetching user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="absolute z-50 bg-[#0f1923] rounded-lg border border-[#2a2a2a]
        shadow-xl p-4 min-w-[200px]" style={position}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-[#1a2730] rounded w-3/4"></div>
          <div className="h-4 bg-[#1a2730] rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="absolute z-50 bg-[#0f1923] rounded-lg border border-[#2a2a2a]
      shadow-xl p-4 min-w-[250px]" style={position}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white font-medium">{stats.username}</h3>
          <p className="text-sm text-[#888]">
            Total Bets: {stats.totalBets?.toLocaleString() || 0}
          </p>
        </div>
        <button onClick={onClose} className="text-[#888] hover:text-white transition-colors p-1">
          <X size={16} />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1a2730] p-3 rounded-lg">
          <p className="text-[#888] text-sm">Win Rate</p>
          <p className="text-white font-medium">
            {((stats.wins / (stats.totalBets || 1)) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-[#1a2730] p-3 rounded-lg">
          <p className="text-[#888] text-sm">Total Wagered</p>
          <p className="text-white font-medium">
            ${stats.totalWagered?.toLocaleString() || 0}
          </p>
        </div>
      </div>
    </div>
  );
};

const MentionSuggestions = ({ users, onSelect, inputRect }) => {
  if (!users.length) return null;

  return (
    <div 
      className="absolute bottom-full mb-2 left-0 right-0 bg-[#0f1923] rounded-lg 
        border border-[#2a2a2a] shadow-xl overflow-hidden max-h-48 overflow-y-auto"
    >
      {users.map(user => (
        <button
          key={user.id}
          onClick={() => onSelect(user.username)}
          className="w-full px-4 py-2.5 text-left hover:bg-[#1a2730] 
            flex items-center space-x-3 group transition-colors"
        >
          <div className="w-7 h-7 rounded bg-[#2a2a2a] flex items-center justify-center
            text-[12px] font-medium text-white">
            {user.username[0].toUpperCase()}
          </div>
          <span className="text-[14px] text-white group-hover:text-white/90">
            {user.username}
          </span>
        </button>
      ))}
    </div>
  );
};

const Chat = () => {
  const { isChatOpen, setIsChatOpen } = useChat();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [mentionUsers, setMentionUsers] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [statsPosition, setStatsPosition] = useState({ x: 0, y: 0 });
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (isChatOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isChatOpen]);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOnlineUsers(users);
    });
    return () => unsubscribe();
  }, []);

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

  useEffect(() => {
    const words = message.split(' ');
    const lastWord = words[words.length - 1].toLowerCase();
    
    if (lastWord.startsWith('@')) {
      const searchTerm = lastWord.slice(1);
      const filteredUsers = onlineUsers.filter(user => 
        user.username?.toLowerCase().startsWith(searchTerm.toLowerCase())
      );
      setMentionUsers(filteredUsers);
      setShowMentions(filteredUsers.length > 0);
    } else {
      setShowMentions(false);
    }
  }, [message, onlineUsers]);

  const handleUserClick = (userId, event) => {
    event.preventDefault();
    const rect = event.target.getBoundingClientRect();
    setStatsPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY
    });
    setSelectedUser(userId);
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
      await addDoc(collection(db, 'chat'), {
        text: message.trim(),
        userId: currentUser.uid,
        username: currentUser.displayName || currentUser.email.split('@')[0],
        timestamp: serverTimestamp(),
        mentions: message.match(/@(\w+)/g)?.map(m => m.slice(1)) || []
      });

      setMessage('');
      setLastMessageTime(now);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error sending message:', error);
    }
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
          bg-[#0f1923]
          border-l border-[#2a2a2a]
          shadow-2xl
          transition-transform duration-300 ease-out
          ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col z-50
        `}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2a2a2a] bg-[#1a2730]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-medium text-white flex items-center">
                Global Chat
                <span className="ml-2 px-2 py-0.5 bg-[#2a2a2a] rounded text-[#888] 
                  text-[11px] font-medium">
                  LIVE
                </span>
              </h2>
              <div className="flex items-center mt-1 text-[13px] text-[#888]">
                <Users size={14} className="mr-1.5" />
                <span>{onlineUsers.length} online</span>
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
        <div className="flex-1 overflow-y-auto scrollbar-none">
          <div className="p-6 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="transition-opacity duration-200">
                <div className="flex items-center mb-2">
                  <div className="w-7 h-7 rounded flex items-center justify-center 
                    bg-[#1a2730] text-[12px] font-medium text-white">
                    {msg.username[0].toUpperCase()}
                  </div>
                  <button 
                    onClick={(e) => handleUserClick(msg.userId, e)}
                    className="ml-2 text-[13px] font-medium text-[#888] hover:text-white
                      transition-colors"
                  >
                    {msg.username}
                    {msg.userId === currentUser?.uid && (
                      <span className="ml-2 text-[11px] text-white/50">(you)</span>
                    )}
                  </button>
                  <span className="ml-2 text-[11px] text-[#888]">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                
                <div className="pl-9">
                  <div className="max-w-[85%] rounded-lg px-4 py-2.5 
                    bg-[#1a2730] break-words">
                    <p className="text-[14px] text-white/90 leading-relaxed whitespace-pre-wrap">
                      {msg.text.split(' ').map((word, i) => (
                        word.startsWith('@') ? (
                          <button
                            key={i}
                            onClick={(e) => {
                              const username = word.slice(1);
                              const user = onlineUsers.find(u => u.username === username);
                              if (user) handleUserClick(user.id, e);
                            }}
                            className="text-white/50 font-medium hover:text-white"
                          >
                            {word}&nbsp;
                          </button>
                        ) : word + ' '
                      ))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="p-5 border-t border-[#2a2a2a] bg-[#1a2730]">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a message..."
                maxLength={200}
                className="w-full bg-[#0f1923] text-white/90 px-4 py-2.5 pr-12
                  text-[14px] rounded-lg placeholder:text-[#888]
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

              <button
                type="submit"
                disabled={!message.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 
                  p-1.5 rounded-md
                  bg-[#2a2a2a] hover:bg-[#3a3a3a]
                  disabled:opacity-30 disabled:hover:bg-[#2a2a2a]
                  transition-colors"
              >
                <Send size={16} className="text-white" />
              </button>
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

      {/* Statistics Modal */}
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

export default Chat;