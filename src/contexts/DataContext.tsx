import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getEmployees, 
  getExpenses, 
  createExpense, 
  createEmployeeUser,
  updateEmployee as updateEmployeeService,
  deleteEmployee as deleteEmployeeService,
  deleteExpense as deleteExpenseService
} from '@/services/firebaseService';

export interface Employee {
  id: string;
  email: string;
  password?: string;
  name?: string;
  sector?: string;
  age?: number;
  status?: 'employee' | 'founder' | 'manager' | 'intern' | 'admin';
  created_at?: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  description: string;
  file: string | null;
  fileName: string | null;
  timestamp: string;
  date: string;
  company: string;
  sector: string;
  created_at?: string;
}

interface DataContextType {
  employees: Employee[];
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  addEmployee: (email: string, password: string) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => Promise<void>;
  updateEmployee: (updatedEmployee: Employee) => Promise<void>;
  updateEmployeeStatus: (id: string, status: 'employee' | 'admin') => Promise<void>;
  refreshData: () => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      const [employeesData, expensesData] = await Promise.all([
        getEmployees(),
        getExpenses()
      ]);
      setEmployees(employeesData);
      setExpenses(expensesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (email: string, password: string) => {
    try {
      // Create user in Firebase Authentication and Firestore
      await createEmployeeUser(email, password);
      // Refresh data to show the new employee
      await refreshData();
    } catch (err) {
      console.error('Error adding employee:', err);
      setError('Failed to add employee');
      throw err;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await deleteEmployeeService(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError('Failed to delete employee');
      throw err;
    }
  };

  const updateEmployee = async (updatedEmployee: Employee) => {
    try {
      await updateEmployeeService(updatedEmployee.id, updatedEmployee);
      setEmployees(prev => 
        prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp)
      );
    } catch (err) {
      console.error('Error updating employee:', err);
      setError('Failed to update employee');
      throw err;
    }
  };

  const updateEmployeeStatus = async (id: string, status: 'employee' | 'admin') => {
    try {
      const employeeToUpdate = employees.find(emp => emp.id === id);
      if (employeeToUpdate) {
        const updatedEmployee = {
          ...employeeToUpdate,
          status
        };
        await updateEmployeeService(id, { status });
        setEmployees(prev => 
          prev.map(emp => emp.id === id ? updatedEmployee : emp)
        );
      }
    } catch (err) {
      console.error('Error updating employee status:', err);
      setError('Failed to update employee status');
      throw err;
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'timestamp'>) => {
    try {
      const newExpense = {
        ...expense,
        timestamp: new Date().toISOString().split('T')[0],
      };
      const createdExpense = await createExpense(newExpense);
      setExpenses(prev => [...prev, createdExpense as Expense]);
    } catch (err) {
      console.error('Error adding expense:', err);
      setError('Failed to add expense');
      throw err;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await deleteExpenseService(id);
      setExpenses(prev => prev.filter(exp => exp.id !== id));
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense');
      throw err;
    }
  };

  return (
    <DataContext.Provider
      value={{
        employees,
        expenses,
        loading,
        error,
        addEmployee,
        deleteEmployee,
        addExpense,
        updateEmployee,
        updateEmployeeStatus,
        refreshData,
        deleteExpense
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