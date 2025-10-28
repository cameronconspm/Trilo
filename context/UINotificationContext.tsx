import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UINotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  showProgressBar?: boolean;
  progress?: number;
  duration?: number; // Auto-dismiss after this many milliseconds
}

interface UINotificationContextType {
  notifications: UINotification[];
  showNotification: (notification: Omit<UINotification, 'id'>) => string;
  dismissNotification: (id: string) => void;
  dismissAllNotifications: () => void;
}

const UINotificationContext = createContext<UINotificationContextType | undefined>(undefined);

export function UINotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<UINotification[]>([]);

  const showNotification = (notification: Omit<UINotification, 'id'>): string => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: UINotification = {
      ...notification,
      id,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss after duration if specified
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, notification.duration);
    }

    return id;
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const dismissAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <UINotificationContext.Provider
      value={{
        notifications,
        showNotification,
        dismissNotification,
        dismissAllNotifications,
      }}
    >
      {children}
    </UINotificationContext.Provider>
  );
}

export function useUINotifications() {
  const context = useContext(UINotificationContext);
  if (context === undefined) {
    throw new Error('useUINotifications must be used within a UINotificationProvider');
  }
  return context;
}
