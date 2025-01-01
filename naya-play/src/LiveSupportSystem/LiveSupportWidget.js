import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc,
  getDocs,
  limit,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import notificationSound from './assets/notification.mp3';
import useSound from 'use-sound';
import { 
  MessageCircle, 
  X, 
  Send, 
  Paperclip,
  ChevronLeft,
  AlertCircle,
  Clock,
  CheckCircle,
  Loader,
  Star,
  Image as ImageIcon,
  Smile,
  Mic,
  Search,
  MoreHorizontal,
  Filter,
  ArrowLeft,
  Upload,
  Camera,
  File,
  RefreshCw,
  XCircle,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Check,
  CheckCheck,
  HelpCircle,
  AlertTriangle,
  Shield,
  Settings,
  Zap,
  Sparkles,
  Ghost,
 PcCase,
  Lock
} from 'lucide-react';
import useAuth from '../Auth/useAuth';
import { uploadFileToS3 } from '../Aws/uploadService';

const CATEGORIES = [
  { 
    id: 'payment', 
    label: 'Payment & Billing',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-violet-500 to-purple-600',
    description: 'Resolve payment issues, billing inquiries, and subscription management'
  },
  { 
    id: 'technical', 
    label: 'Technical Support',
    icon: <PcCase className="w-6 h-6" />,
    color: 'from-blue-500 to-indigo-600',
    description: 'Get help with technical problems, bugs, and system performance'
  },
  { 
    id: 'account', 
    label: 'Account & Security',
    icon: <Lock className="w-6 h-6" />,
    color: 'from-emerald-500 to-teal-600',
    description: 'Manage account settings, security, and access controls'
  },
  { 
    id: 'general', 
    label: 'General Inquiries',
    icon: <HelpCircle className="w-6 h-6" />,
    color: 'from-pink-500 to-rose-600',
    description: 'Ask questions about our products, services, and features'
  }
];

const PRIORITIES = [
  { 
    id: 'low', 
    label: 'Low Priority',
    color: 'bg-emerald-900/40 text-emerald-200 border-emerald-500/20',
    description: 'General inquiries and non-urgent matters'
  },
  { 
    id: 'medium', 
    label: 'Medium Priority',
    color: 'bg-amber-900/40 text-amber-200 border-amber-500/20',
    description: 'Important issues affecting your work'
  },
  { 
    id: 'high', 
    label: 'High Priority',
    color: 'bg-rose-900/40 text-rose-200 border-rose-500/20',
    description: 'Critical issues requiring immediate attention'
  }
];

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

const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: {
      color: 'bg-emerald-900/40 text-emerald-200 border-emerald-500/20',
      icon: <Zap className="w-3 h-3 mr-1" />
    },
    waiting: {
      color: 'bg-amber-900/40 text-amber-200 border-amber-500/20',
      icon: <Clock className="w-3 h-3 mr-1" />
    },
    closed: {
      color: 'bg-gray-800/40 text-gray-300 border-gray-600/20',
      icon: <CheckCircle className="w-3 h-3 mr-1" />
    }
  };

  const config = statusConfig[status] || statusConfig.closed;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`px-2 py-1 rounded-full text-xs font-medium border
        inline-flex items-center ${config.color}`}
    >
      {config.icon}
      {status}
    </motion.span>
  );
};

const TicketHistory = ({ tickets, onSelectTicket, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ? true : ticket.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full bg-gray-900/95 backdrop-blur-sm"
    >
      <div className="p-4 border-b border-gray-800/80">
        <div className="flex items-center space-x-3 mb-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>
          <h3 className="text-lg font-semibold text-white">Ticket History</h3>
        </div>

        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 
                rounded-lg focus:ring-2 focus:ring-indigo-500 text-white 
                placeholder-gray-500 transition-colors"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg 
              text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="waiting">Waiting</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredTickets.map((ticket) => (
          <motion.div
            key={ticket.id}
            whileHover={{ x: 4, scale: 1.02 }}
            className="p-4 bg-gray-800/50 rounded-xl cursor-pointer 
              hover:bg-gray-800/80 border border-gray-700/50 
              hover:border-gray-600/50 transition-all duration-300"
            onClick={() => onSelectTicket(ticket)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium text-white">{ticket.subject}</p>
                <p className="text-sm text-gray-400">
                  #{ticket.id.slice(-6)} · {new Date(ticket.createdAt.seconds * 1000).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={ticket.status} />
            </div>
            {ticket.lastMessage && (
              <p className="text-sm text-gray-400 truncate">
                {ticket.lastMessage}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const Message = ({ message, isUser }) => {
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImagePreview(true);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm
          ${isUser 
            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white' 
            : message.senderType === 'system'
              ? 'bg-gray-800/80 text-gray-200 border border-gray-700'
              : 'bg-gray-800/80 text-gray-200 border border-gray-700'
          }`}
        >
          {message.senderType !== 'system' && (
            <p className="text-xs opacity-70 mb-1">
              {message.senderType === 'agent' ? message.agentName : 'You'}
            </p>
          )}
          
          {message.content && (
            <p className="text-sm leading-relaxed">{message.content}</p>
          )}
          
          {message.attachments?.length > 0 && (
            <div className={`grid ${
              message.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            } gap-2 mt-2`}>
              {message.attachments.map((file, i) => (
                <div key={i} className="relative group">
                  {file.type?.startsWith('image/') ? (
                    <div 
                      className="relative cursor-pointer overflow-hidden rounded-lg"
                      onClick={() => handleImageClick(file.url)}
                    >
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover aspect-square rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 
                        group-hover:opacity-100 transition-opacity 
                        flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ) : (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-2 bg-black/10 rounded-lg 
                        hover:bg-black/20 transition-colors"
                    >
                      <File className="h-4 w-4 mr-2" />
                      <span className="text-sm truncate">{file.name}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end space-x-1 mt-1">
            <p className="text-[10px] opacity-70">
              {message.timestamp?.seconds 
                ? new Date(message.timestamp.seconds * 1000).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })
                : ''}
            </p>
            {isUser && <MessageStatus status={message.status || 'sent'} />}
          </div>
        </div>
      </div>

      <ImagePreviewModal
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        imageUrl={selectedImage}
      />
    </div>
  );
};

const ImagePreviewModal = ({ isOpen, onClose, imageUrl }) => {
  const [scale, setScale] = useState(1);

  if (!isOpen) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-[90vw] h-[90vh] flex items-center justify-center">
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button 
            onClick={handleZoomIn}
            className="p-2 bg-gray-800/80 rounded-full text-white 
              hover:bg-gray-700/80 transition-colors"
          >
            <ZoomIn size={20} />
          </button>
          <button 
            onClick={handleZoomOut}
            className="p-2 bg-gray-800/80 rounded-full text-white 
              hover:bg-gray-700/80 transition-colors"
          >
            <ZoomOut size={20} />
          </button>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-800/80 rounded-full text-white 
            hover:bg-gray-700/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
          <img 
            src={imageUrl} 
            alt="Preview"
            style={{ transform: `scale(${scale})` }}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
          />
        </div>
      </div>
    </div>
  );
};

const FilePreview = ({ file, onRemove }) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  }, [file]);

  return (
    <div className="relative group">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-800/50 
        border border-gray-700/50">
        {file.type.startsWith('image/') ? (
          <img
            src={preview}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <File className="h-6 w-6 text-gray-400" />
          </div>
        )}
        <button
          onClick={onRemove}
          className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full 
            opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1 truncate max-w-[64px]">
        {file.name}
      </p>
    </div>
  );
};

const ModernSupportWidget = () => {
  
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [step, setStep] = useState('main');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [allTickets, setAllTickets] = useState([]);
  const [playNotification] = useSound(notificationSound);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    const handleOpenWidget = () => setIsOpen(true);
    document.addEventListener('openSupportWidget', handleOpenWidget);
    return () => document.removeEventListener('openSupportWidget', handleOpenWidget);
  }, []);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || !isOpen) return;

    const q = query(
      collection(db, 'supportTickets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllTickets(tickets);

      const active = tickets.find(t => t.status === 'active' || t.status === 'waiting');
      if (active) {
        setActiveTicket(active);
        setStep('chat');
      }
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  useEffect(() => {
    if (!activeTicket) return;

    const q = query(
      collection(db, 'supportMessages'),
      where('ticketId', '==', activeTicket.id),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        const messageData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(messageData);

        const unreadMessages = messageData.filter(
          msg => msg.senderType === 'agent' && !msg.read
        );

        if (unreadMessages.length > 0 && isOpen) {
          const batch = writeBatch(db);
          unreadMessages.forEach(msg => {
            const msgRef = doc(db, 'supportMessages', msg.id);
            batch.update(msgRef, { 
              read: true,
              status: 'seen'
            });
          });
          batch.commit().catch(error => {
            console.error('Error updating message status:', error);
          });
        }
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [activeTicket, isOpen]);

  const updateMessageStatus = async (messageId, status) => {
    try {
      await updateDoc(doc(db, 'supportMessages', messageId), { status });
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  const handleFileUpload = async (files) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB
  
    try {
      const validFiles = Array.from(files).filter(file => 
        allowedTypes.includes(file.type) && file.size <= maxSize
      );
  
      if (validFiles.length === 0) {
        console.error('Invalid file type or size');
        return;
      }
  
      setLoading(true);
  
      const uploadedFiles = await Promise.all(
        validFiles.map(file => uploadFileToS3(file, activeTicket.id))
      );
  
      const messageRef = await addDoc(collection(db, 'supportMessages'), {
        ticketId: activeTicket.id,
        content: message.trim() || 'Sent attachments',
        sender: user.uid,
        senderType: 'user',
        timestamp: serverTimestamp(),
        attachments: uploadedFiles,
        status: 'sent',
        read: false
      });

      setTimeout(() => updateMessageStatus(messageRef.id, 'delivered'), 1000);
  
      setMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Error handling files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!message.trim() && attachments.length === 0) || !activeTicket) return;

    setLoading(true);
    try {
      let uploadedFiles = [];
      if (attachments.length > 0) {
        uploadedFiles = await Promise.all(
          attachments.map(async (file) => {
            const result = await uploadFileToS3(file, activeTicket.id);
            return {
              name: file.name,
              url: result.url,
              type: file.type
            };
          })
        );
      }

      if (message.trim() || uploadedFiles.length > 0) {
        const messageRef = await addDoc(collection(db, 'supportMessages'), {
          ticketId: activeTicket.id,
          content: message.trim(),
          sender: user.uid,
          senderType: 'user',
          timestamp: serverTimestamp(),
          attachments: uploadedFiles,
          status: 'sent',
          read: false
        });

        setTimeout(() => updateMessageStatus(messageRef.id, 'delivered'), 1000);
      }

      await updateDoc(doc(db, 'supportTickets', activeTicket.id), {
        lastUpdated: serverTimestamp(),
        status: 'waiting',
        lastMessage: message.trim() || 'Sent attachments'
      });

      setMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
    setLoading(false);
  };

  const createNewTicket = async () => {
    if (!subject.trim() || !category) return;

    setLoading(true);
    try {
      const ticketRef = await addDoc(collection(db, 'supportTickets'), {
        userId: user.uid,
        userEmail: user.email,
        subject: subject.trim(),
        category,
        priority,
        status: 'waiting',
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        lastMessage: subject.trim()
      });

      const messageRef = await addDoc(collection(db, 'supportMessages'), {
        ticketId: ticketRef.id,
        content: subject.trim(),
        sender: user.uid,
        senderType: 'user',
        timestamp: serverTimestamp(),
        status: 'sent',
        read: false
      });

      setTimeout(() => updateMessageStatus(messageRef.id, 'delivered'), 1000);

      setActiveTicket({
        id: ticketRef.id,
        subject: subject.trim(),
        category,
        priority,
        status: 'waiting'
      });

      setStep('chat');
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
    setLoading(false);
  };

  const renderMainMenu = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full overflow-hidden bg-gray-900/95 backdrop-blur-lg"
    >
      <div className="px-6 py-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 
          bg-clip-text text-transparent mb-2">How can we help?</h2>
        <p className="text-gray-400">Choose a category to get started</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 grid grid-cols-1 gap-3">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => {
                setCategory(cat.id);
                setStep('newTicket');
              }}
              className="w-full p-4 rounded-xl bg-gray-800/50 
                hover:bg-gray-800/80 border border-gray-700/50 
                hover:border-gray-600/50 transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center 
                  justify-center bg-gradient-to-br ${cat.color}`}>
                  {cat.icon}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-base font-medium text-white mb-1">
                    {cat.label}
                  </h3>
                  <p className="text-sm text-gray-400">{cat.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {allTickets.length > 0 && (
          <div className="mt-8 px-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium bg-gradient-to-r 
                from-white to-gray-300 bg-clip-text text-transparent">
                Recent Tickets
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep('history')}
                className="text-sm text-indigo-400 hover:text-indigo-300 
                  transition-colors duration-200"
              >
                View All
              </motion.button>
            </div>
            
            <div className="space-y-3">
              {allTickets.slice(0, 3).map((ticket) => (
                <motion.div
                  key={ticket.id}
                  whileHover={{ x: 4, scale: 1.02 }}
                  className="p-4 bg-gray-800/50 rounded-xl cursor-pointer 
                    border border-gray-700/50 hover:border-gray-600/50 
                    hover:bg-gray-800/80 transition-all duration-300"
                  onClick={() => {
                    setActiveTicket(ticket);
                    setStep('chat');
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-white mb-1">
                        {ticket.subject}
                      </p>
                      <p className="text-sm text-gray-400">
                        Created {new Date(ticket.createdAt.seconds * 1000)
                          .toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderNewTicket = () => (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      className="flex flex-col h-full bg-gray-900"
    >
      <div className="flex-none p-4 border-b border-gray-800">
        <button
          onClick={() => setStep('main')}
          className="flex items-center text-gray-400 mb-2 hover:text-gray-200 
            transition-colors"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back
        </button>
        
        <div className="mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 
            bg-clip-text text-transparent mb-2">Create New Ticket</h2>
            <p className="text-gray-400">
            Describe your issue and we'll connect you with our support team.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                {CATEGORIES.find(c => c.id === category)?.icon}
                <span className="text-white">
                  {CATEGORIES.find(c => c.id === category)?.label}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-lg 
                focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-500 
                transition-colors"
              placeholder="Brief description of your issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-lg 
                focus:ring-2 focus:ring-indigo-500 text-white transition-colors"
            >
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id} className="bg-gray-800">
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-none p-4 border-t border-gray-800 bg-gray-900">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={createNewTicket}
          disabled={!subject.trim() || loading}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 
            text-white rounded-lg font-medium disabled:opacity-50 
            disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200"
        >
          {loading ? (
            <Loader className="animate-spin h-5 w-5 mx-auto" />
          ) : (
            'Start Chat'
          )}
        </motion.button>
      </div>
    </motion.div>
  );

  const renderChat = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full"
    >
      <div className="px-4 py-3 border-b border-gray-800/80 bg-gray-900/95 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setStep('main')}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-400" />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-white">Ticket #{activeTicket?.id.slice(-6)}</h3>
              <StatusBadge status={activeTicket?.status} />
            </div>
            <p className="text-sm text-gray-400">{activeTicket?.subject}</p>
          </div>
        </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-900 to-gray-900/95" 
        onDrop={handleFileDrop} 
        onDragOver={(e) => e.preventDefault()}
      >
        {messages.map((msg) => (
          <Message
            key={msg.id}
            message={msg}
            isUser={msg.senderType === 'user'}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-800/80 bg-gray-900/95 backdrop-blur-sm p-4">
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {attachments.map((file, index) => (
              <FilePreview
                key={index}
                file={file}
                onRemove={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
              />
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full pl-4 pr-28 py-3 bg-gray-800/50 border border-gray-700 
              rounded-full focus:ring-2 focus:ring-indigo-500 text-white 
              placeholder-gray-500 transition-colors"
          />
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const files = Array.from(e.target.files);
                setAttachments(prev => [...prev, ...files]);
              }}
              multiple
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <Smile className="h-5 w-5" />
            </button>
            <button
              type="submit"
              disabled={loading || (!message.trim() && attachments.length === 0)}
              className="p-2 text-indigo-400 hover:text-indigo-300 
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>

          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2">
              <EmojiPicker
                onEmojiClick={(emojiData) => {
                  setMessage(prev => prev + emojiData.emoji);
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
    </motion.div>
  );

  const renderContent = () => {
    switch (step) {
      case 'main':
        return renderMainMenu();
      case 'newTicket':
        return renderNewTicket();
      case 'chat':
        return renderChat();
      case 'history':
        return (
          <TicketHistory
            tickets={allTickets}
            onSelectTicket={(ticket) => {
              setActiveTicket(ticket);
              setStep('chat');
            }}
            onClose={() => setStep('main')}
          />
        );
      default:
        return null;
    }
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className={`${
            isOpen ? 'hidden' : 'flex'
          } items-center space-x-2 bg-gradient-to-r from-indigo-600 to-blue-600 
            text-white px-6 py-4 rounded-full shadow-lg hover:shadow-xl 
            transition-all duration-300`}
        >
          <MessageCircle className="h-6 w-6" />
          <span className="font-medium">Need Help?</span>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-1 w-5 h-5 bg-red-500 text-white text-xs 
                flex items-center justify-center rounded-full"
            >
              {unreadCount}
            </motion.div>
          )}
        </motion.button>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-gray-900 rounded-2xl shadow-2xl w-[400px] h-[600px] 
              flex flex-col overflow-hidden border border-gray-800"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 
              text-white px-6 py-4 flex items-center justify-between 
              backdrop-blur-lg shadow-lg">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <MessageCircle className="h-6 w-6" />
                </motion.div>
                <h3 className="font-semibold text-lg">Support</h3>
              </div>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  if (!activeTicket) {
                    setStep('main');
                    setCategory('');
                    setSubject('');
                  }
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {renderContent()}
              </AnimatePresence>
            </div>

            {loading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm 
                flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-gray-800/90 p-4 rounded-full shadow-lg"
                >
                  <Loader className="h-6 w-6 text-indigo-400 animate-spin" />
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};

export default ModernSupportWidget;

              