import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import useAuth from '../Auth/useAuth';

const NotificationContext = createContext();

const notificationSound = new Audio('/notification.mp3');
notificationSound.volume = 0.5;

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const { user } = useAuth();
  const lastNotificationRef = React.useRef(null);
  const previousCount = React.useRef(0);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Enable sound after user interaction
  useEffect(() => {
    const enableSound = () => {
      setSoundEnabled(true);
      document.removeEventListener('click', enableSound);
      document.removeEventListener('touchstart', enableSound);
    };

    document.addEventListener('click', enableSound);
    document.addEventListener('touchstart', enableSound);

    return () => {
      document.removeEventListener('click', enableSound);
      document.removeEventListener('touchstart', enableSound);
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    // Query only for the current user's deposit transactions
    const notificationsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      where('type', '==', 'deposit'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(notificationsQuery, {
      next: (snapshot) => {
        const newNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timeAgo: getTimeAgo(doc.data().createdAt?.toDate())
        }));

        // Check for new notifications
        const latestNotification = newNotifications[0];
        if (latestNotification && 
            lastNotificationRef.current !== latestNotification.id && 
            newNotifications.length > previousCount.current) {
          
          if (soundEnabled) {
            notificationSound.currentTime = 0;
            notificationSound.play().catch(() => {
              console.log('Sound will be enabled after user interaction');
            });
          }
          
          setHasUnread(true);
        }

        lastNotificationRef.current = latestNotification?.id;
        previousCount.current = newNotifications.length;
        setNotifications(newNotifications);
      },
      error: (error) => {
        console.error("Notification listener error:", error);
      }
    });

    return () => unsubscribe();
  }, [user, soundEnabled]);

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

  const markNotificationsAsRead = () => {
    setHasUnread(false);
  };

  return (
    <NotificationContext.Provider 
      value={{
        notifications,
        hasUnread,
        markNotificationsAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};