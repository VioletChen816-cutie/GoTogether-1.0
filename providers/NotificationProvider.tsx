import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { NotificationType } from '../types';

interface NotificationContextType {
  showNotification: (notification: NotificationType) => void;
  notification: NotificationType & { visible: boolean } | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationType & { visible: boolean } | null>(null);
  // FIX: In browser environments, `setTimeout` returns a `number`. `NodeJS.Timeout` is for Node.js environments.
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  const showNotification = useCallback((newNotification: NotificationType) => {
    // If there's an existing timeout, clear it to reset the timer
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    setNotification({ ...newNotification, visible: true });

    const id = setTimeout(() => {
      setNotification(n => n ? { ...n, visible: false } : null);
    }, 5000); // Notification stays for 5 seconds

    setTimeoutId(id);
  }, [timeoutId]);

  const value = {
    showNotification,
    notification
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
