import React, { createContext, useContext, useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'expense_added' | 'expense_updated';
  expenseId?: string;
  userId?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { expenses } = useData();
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('admin_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [previousExpenses, setPreviousExpenses] = useState<any[]>(expenses);

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('admin_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Detect expense changes and create notifications
  useEffect(() => {
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
      addNotification({
        title: 'New Expense Added',
        message: `User ${expense.userId} added a new expense of ${expense.amount}`,
        type: 'expense_added',
        expenseId: expense.id,
        userId: expense.userId
      });
    });

    // Add notifications for updated expenses
    updatedExpenses.forEach(expense => {
      addNotification({
        title: 'Expense Updated',
        message: `User ${expense.userId} updated an expense`,
        type: 'expense_updated',
        expenseId: expense.id,
        userId: expense.userId
      });
    });

    // Update previous expenses
    setPreviousExpenses(expenses);
  }, [expenses]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification
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