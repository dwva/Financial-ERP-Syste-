import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Employee } from './DataContext';

interface User {
  email: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, employees: Employee[]) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (email: string, password: string, employees: Employee[]): boolean => {
    // Check if it's an admin
    if (email === 'admin@company.com' && password === 'admin123') {
      const userData = { email, role: 'admin' as const };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    }

    // Check if it's a regular user
    const employee = employees.find(
      (emp) => emp.email === email && emp.password === password
    );

    if (employee) {
      const userData = { email: employee.email, role: 'user' as const };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
