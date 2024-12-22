import React, { useEffect, useRef, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Bell, ArrowDown, Check } from 'lucide-react';
import useAuth from '../Auth/useAuth';

// Notification sound

const NotificationDropdown = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const dropdownRef = useRef(null);
  const { user } = useAuth();
  const lastNotificationRef = useRef(null);
  const autoCloseTimerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (!user) return;

    // Query only for successful deposits
    const notificationsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      where('type', '==', 'deposit'),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timeAgo: getTimeAgo(doc.data().createdAt?.toDate())
      }));

      // Check for new notifications
      const latestNotification = newNotifications[0];
      if (latestNotification && lastNotificationRef.current !== latestNotification.id) {
        // Play sound for new notification
       
        
        // Auto show dropdown
        handleNewNotification();
        
        lastNotificationRef.current = latestNotification.id;
        setHasUnread(true);
      }

      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle new notification arrival
  const handleNewNotification = () => {
    // Clear any existing timer
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }

    // Open the dropdown
    onClose(false); // Show dropdown

    // Set timer to close after 3 seconds
    autoCloseTimerRef.current = setTimeout(() => {
      onClose(true); // Hide dropdown
    }, 3000);
  };

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  const getTimeAgo = (date) => {
    if (!date) return '';
    
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
      }
    }
    
    return 'Just now';
  };

  return (
    <div 
      ref={dropdownRef}
      className={`absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg 
        shadow-lg border border-gray-700 transform transition-all duration-300 ease-in-out 
        ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`}
      style={{ zIndex: 1000 }}
    >
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Notifications</h3>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-gray-700/50 last:border-0 
                hover:bg-gray-700/50 transition-colors`}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-gray-700 rounded-lg">
                  <Check size={16} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">
                    {notification.cryptocurrency 
                      ? `${notification.amount} ${notification.cryptocurrency} Deposit`
                      : `$${notification.amount} Deposit`}
                  </p>
                  <p className="text-sm text-green-400">
                    Deposit Successful
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{notification.timeAgo}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-400">
            No notifications yet
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;