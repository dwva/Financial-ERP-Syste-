import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Employee {
  id: string;
  email: string;
  password: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  description: string;
  file: string | null;
  fileName: string | null;
  timestamp: string;
}

interface DataContextType {
  employees: Employee[];
  expenses: Expense[];
  addEmployee: (email: string, password: string) => void;
  deleteEmployee: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', email: 'admin@company.com', password: 'admin123' },
  { id: '2', email: 'user@company.com', password: 'user123' },
  { id: '3', email: 'john.doe@company.com', password: 'pass123' },
  { id: '4', email: 'jane.smith@company.com', password: 'pass123' },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: '1',
    userId: 'user@company.com',
    amount: 200,
    description: 'Team Lunch',
    file: null,
    fileName: 'receipt.pdf',
    timestamp: '2025-09-28',
  },
  {
    id: '2',
    userId: 'john.doe@company.com',
    amount: 450,
    description: 'Office Supplies',
    file: null,
    fileName: 'invoice.pdf',
    timestamp: '2025-09-29',
  },
  {
    id: '3',
    userId: 'user@company.com',
    amount: 120,
    description: 'Transport',
    file: null,
    fileName: 'ticket.jpg',
    timestamp: '2025-09-30',
  },
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const addEmployee = (email: string, password: string) => {
    const newEmployee: Employee = {
      id: Date.now().toString(),
      email,
      password,
    };
    const updated = [...employees, newEmployee];
    setEmployees(updated);
    localStorage.setItem('employees', JSON.stringify(updated));
  };

  const deleteEmployee = (id: string) => {
    const updated = employees.filter((emp) => emp.id !== id);
    setEmployees(updated);
    localStorage.setItem('employees', JSON.stringify(updated));
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'timestamp'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      timestamp: new Date().toISOString().split('T')[0],
    };
    const updated = [...expenses, newExpense];
    setExpenses(updated);
    localStorage.setItem('expenses', JSON.stringify(updated));
  };

  return (
    <DataContext.Provider
      value={{
        employees,
        expenses,
        addEmployee,
        deleteEmployee,
        addExpense,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
