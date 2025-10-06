import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getEmployees, 
  getExpenses, 
  createExpense, 
  createEmployeeUser,
  updateEmployee as updateEmployeeService,
  deleteEmployee as deleteEmployeeService,
  deleteExpense as deleteExpenseService,
  updateExpense as updateExpenseService,
  getInvoices,
  createInvoice as createInvoiceService,
  getServiceCharges,
  createServiceCharge as createServiceChargeService,
  updateServiceCharge as updateServiceChargeService,
  deleteServiceCharge as deleteServiceChargeService
} from '@/services/firebaseService';

export interface Employee {
  id: string;
  email: string;
  username?: string;
  mobile?: string;
  password?: string;
  name?: string;
  sector?: string;
  age?: number;
  status?: 'employee' | 'founder' | 'manager' | 'intern' | 'admin';
  created_at?: string;
  profilePicture?: string;
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
  // Additional fields that can be added later
  [key: string]: any;
}

export interface InvoiceItem {
  id: string;
  description: string;
  service: string;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  companyName: string;
  businessName: string;
  businessTagline: string;
  businessAddress: string;
  businessCity: string;
  businessCountry: string;
  businessEmail: string;
  businessPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  description?: string;
  createdAt: string;
}

export interface ServiceCharge {
  id: string;
  name: string;
  amount: number;
}

interface DataContextType {
  employees: Employee[];
  expenses: Expense[];
  invoices: Invoice[];
  serviceCharges: ServiceCharge[];
  loading: boolean;
  error: string | null;
  addEmployee: (email: string, password: string, username?: string, mobile?: string) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => Promise<void>;
  updateEmployee: (updatedEmployee: Employee) => Promise<void>;
  updateEmployeeStatus: (id: string, status: 'employee' | 'admin') => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  refreshData: () => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Promise<void>;
  addServiceCharge: (serviceCharge: Omit<ServiceCharge, 'id'>) => Promise<void>;
  updateServiceCharge: (id: string, serviceCharge: Partial<ServiceCharge>) => Promise<void>;
  deleteServiceCharge: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [serviceCharges, setServiceCharges] = useState<ServiceCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      const [employeesData, expensesData, invoicesData, serviceChargesData] = await Promise.all([
        getEmployees(),
        getExpenses(),
        getInvoices(),
        getServiceCharges()
      ]);
      setEmployees(employeesData);
      setExpenses(expensesData);
      setInvoices(invoicesData);
      setServiceCharges(serviceChargesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (email: string, password: string, username?: string, mobile?: string) => {
    try {
      // Create user in Firebase Authentication and Firestore
      await createEmployeeUser(email, password, username, mobile);
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

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    try {
      await updateExpenseService(id, expense);
      setExpenses(prev => 
        prev.map(exp => exp.id === id ? { ...exp, ...expense } : exp)
      );
    } catch (err) {
      console.error('Error updating expense:', err);
      setError('Failed to update expense');
      throw err;
    }
  };

  const addInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
      const newInvoice = {
        ...invoice,
        createdAt: new Date().toISOString(),
      };
      const createdInvoice = await createInvoiceService(newInvoice);
      setInvoices(prev => [...prev, createdInvoice as Invoice]);
    } catch (err) {
      console.error('Error adding invoice:', err);
      setError('Failed to add invoice');
      throw err;
    }
  };

  const addServiceCharge = async (serviceCharge: Omit<ServiceCharge, 'id'>) => {
    try {
      const newServiceCharge = {
        ...serviceCharge
      };
      const createdServiceCharge = await createServiceChargeService(newServiceCharge);
      setServiceCharges(prev => [...prev, createdServiceCharge as ServiceCharge]);
    } catch (err) {
      console.error('Error adding service charge:', err);
      setError('Failed to add service charge');
      throw err;
    }
  };

  const updateServiceCharge = async (id: string, serviceCharge: Partial<ServiceCharge>) => {
    try {
      await updateServiceChargeService(id, serviceCharge);
      setServiceCharges(prev => 
        prev.map(sc => sc.id === id ? { ...sc, ...serviceCharge } : sc)
      );
    } catch (err) {
      console.error('Error updating service charge:', err);
      setError('Failed to update service charge');
      throw err;
    }
  };

  const deleteServiceCharge = async (id: string) => {
    try {
      await deleteServiceChargeService(id);
      setServiceCharges(prev => prev.filter(sc => sc.id !== id));
    } catch (err) {
      console.error('Error deleting service charge:', err);
      setError('Failed to delete service charge');
      throw err;
    }
  };

  return (
    <DataContext.Provider
      value={{
        employees,
        expenses,
        invoices,
        serviceCharges,
        loading,
        error,
        addEmployee,
        deleteEmployee,
        addExpense,
        updateEmployee,
        updateEmployeeStatus,
        updateExpense,
        refreshData,
        deleteExpense,
        addInvoice,
        addServiceCharge,
        updateServiceCharge,
        deleteServiceCharge
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