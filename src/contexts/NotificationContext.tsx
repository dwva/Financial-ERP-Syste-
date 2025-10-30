import React, { createContext, useContext, useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'expense_added' | 'expense_updated' | 'new_message';
  expenseId?: string;
  userId?: string;
  messageId?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  deleteNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { expenses, messages } = useData(); // Add messages from DataContext
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem('admin_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects and validate data
        return parsed
          .map((notification: any) => {
            try {
              return {
                ...notification,
                timestamp: new Date(notification.timestamp),
                read: !!notification.read,
                title: notification.title || 'Unknown',
                message: notification.message || 'No message',
                type: notification.type || 'new_message'
              };
            } catch (e) {
              console.error('Error processing notification:', notification, e);
              return null;
            }
          })
          .filter((notification: any) => notification !== null);
      }
    } catch (e) {
      console.error('Error parsing notifications from localStorage:', e);
    }
    return [];
  });
  const [previousExpenses, setPreviousExpenses] = useState<any[]>([]);
  const [previousMessages, setPreviousMessages] = useState<any[]>([]); // Track previous messages

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      // Convert Date objects to strings for localStorage and validate data
      const notificationsToSave = notifications
        .map(notification => ({
          ...notification,
          timestamp: notification.timestamp instanceof Date 
            ? notification.timestamp.toISOString() 
            : new Date().toISOString(),
          read: !!notification.read,
          title: notification.title || 'Unknown',
          message: notification.message || 'No message',
          type: notification.type || 'new_message'
        }));
      localStorage.setItem('admin_notifications', JSON.stringify(notificationsToSave));
    } catch (e) {
      console.error('Error saving notifications to localStorage:', e);
    }
  }, [notifications]);

  // Detect expense changes and create notifications
  useEffect(() => {
    try {
      // Initialize previousExpenses on first render
      if (previousExpenses.length === 0 && expenses.length > 0) {
        setPreviousExpenses(expenses);
        return;
      }

      // Check for new expenses
      const newExpenses = expenses.filter(
        expense => !previousExpenses.some(prev => prev.id === expense.id)
      );

      // Check for updated expenses
      const updatedExpenses = expenses.filter(expense => {
        const prevExpense = previousExpenses.find(prev => prev.id === expense.id);
        return prevExpense && JSON.stringify(prevExpense) !== JSON.stringify(expense);
      });

      // Add notifications for new expenses
      newExpenses.forEach(expense => {
        try {
          addNotification({
            title: 'New Expense Added',
            message: `User ${expense.userId || 'Unknown'} added a new expense of $${expense.amount || 0}`,
            type: 'expense_added',
            expenseId: expense.id,
            userId: expense.userId
          });
        } catch (e) {
          console.error('Error creating new expense notification:', e);
        }
      });

      // Add notifications for updated expenses
      updatedExpenses.forEach(expense => {
        try {
          addNotification({
            title: 'Expense Updated',
            message: `User ${expense.userId || 'Unknown'} updated an expense`,
            type: 'expense_updated',
            expenseId: expense.id,
            userId: expense.userId
          });
        } catch (e) {
          console.error('Error creating updated expense notification:', e);
        }
      });

      // Update previous expenses
      setPreviousExpenses(expenses);
    } catch (e) {
      console.error('Error in expense notification effect:', e);
    }
  }, [expenses]);

  // Detect new messages and create notifications
  useEffect(() => {
    try {
      // Initialize previousMessages on first render
      if (previousMessages.length === 0 && messages.length > 0) {
        setPreviousMessages(messages);
        return;
      }

      // Check for new messages
      const newMessages = messages.filter(
        message => !previousMessages.some(prev => prev.id === message.id) && 
                  !message.read // Only notify about unread messages
      );

      // Add notifications for new messages
      newMessages.forEach(message => {
        try {
          addNotification({
            title: 'New Message Received',
            message: `You have a new message from ${message.senderName || 'Unknown'}`,
            type: 'new_message',
            messageId: message.id
          });
        } catch (e) {
          console.error('Error creating new message notification:', e);
        }
      });

      // Update previous messages
      setPreviousMessages(messages);
    } catch (e) {
      console.error('Error in message notification effect:', e);
    }
  }, [messages]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    try {
      const newNotification: Notification = {
        ...notification,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        read: false
      };
      
      setNotifications(prev => [newNotification, ...prev]);
    } catch (e) {
      console.error('Error adding notification:', e);
    }
  };

  const markAsRead = (id: string) => {
    try {
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  };

  const markAllAsRead = () => {
    try {
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (e) {
      console.error('Error marking all notifications as read:', e);
    }
  };

  const deleteNotification = (id: string) => {
    try {
      setNotifications(prev =>
        prev.filter(notification => notification.id !== id)
      );
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: notifications || [],
        unreadCount: unreadCount || 0,
        markAsRead,
        markAllAsRead,
        addNotification,
        deleteNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};