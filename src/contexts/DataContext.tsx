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
  deleteServiceCharge as deleteServiceChargeService,
  getInvoiceHistory,
  createInvoiceHistory as createInvoiceHistoryService,
  deleteInvoiceHistory as deleteInvoiceHistoryService,
  getProfitLossReports,
  createProfitLossReport as createProfitLossReportService,
  updateProfitLossReport as updateProfitLossReportService,
  deleteProfitLossReport as deleteProfitLossReportService,
  getAllMessages as getAllMessagesService
} from '@/services/firebaseService';
import { 
  sendMessage as sendMsg,
  getUserMessages as getUserMsgs,
  getAdminMessages as getAdminMsgs,
  markMessageAsRead as markMsgRead,
  uploadFile as uploadMsgFile
} from '@/services/messageService';
import { Message } from '@/services/messageService';

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
  clientName?: string; // Make clientName optional for backward compatibility
  candidateName?: string; // Add candidateName field
  serviceName?: string; // Add serviceName field
  created_at?: string;
  // Additional fields that can be added later
  [key: string]: any;
}

export interface InvoiceItem {
  id: string;
  description: string;
  service: string;
  amount: number;
  quantity?: number; // Add optional quantity field
  sector?: string;  // Add optional sector field
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
  candidateName?: string;
}

export interface ProfitLossReport {
  id: string;
  period: 'monthly' | 'yearly';
  month?: string;
  year: string;
  revenue: number;
  expenses: number;
  profit: number;
  createdAt: string;
  reportData: any[];
}

export interface ServiceCharge {
  id: string;
  name: string;
  amount: number;
  sector?: string; // Add optional sector field
}

interface DataContextType {
  employees: Employee[];
  expenses: Expense[];
  invoices: Invoice[];
  serviceCharges: ServiceCharge[];
  invoiceHistory: Invoice[];
  profitLossReports: ProfitLossReport[];
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
  addInvoiceHistory: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Promise<void>;
  deleteInvoiceHistory: (id: string) => Promise<void>; // Add deleteInvoiceHistory function
  // Message functions
  sendMessage: (message: Omit<Message, 'id' | 'timestamp'>, file?: File) => Promise<Message>;
  getUserMessages: (userId: string) => Promise<Message[]>;
  getAdminMessages: (adminId: string) => Promise<Message[]>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  // Profit/Loss functions
  addProfitLossReport: (report: Omit<ProfitLossReport, 'id' | 'createdAt'>) => Promise<void>;
  updateProfitLossReport: (id: string, report: Partial<ProfitLossReport>) => Promise<void>;
  deleteProfitLossReport: (id: string) => Promise<void>;
  getAllMessages: () => Promise<any[]>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [serviceCharges, setServiceCharges] = useState<ServiceCharge[]>([]);
  const [invoiceHistory, setInvoiceHistory] = useState<Invoice[]>([]);
  const [profitLossReports, setProfitLossReports] = useState<ProfitLossReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      const [employeesData, expensesData, invoicesData, serviceChargesData, invoiceHistoryData, profitLossReportsData] = await Promise.all([
        getEmployees(),
        getExpenses(),
        getInvoices(),
        getServiceCharges(),
        getInvoiceHistory(),
        getProfitLossReports()
      ]);
      setEmployees(employeesData);
      setExpenses(expensesData);
      setInvoices(invoicesData);
      setServiceCharges(serviceChargesData);
      setInvoiceHistory(invoiceHistoryData);
      setProfitLossReports(profitLossReportsData);
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
        timestamp: new Date().toISOString(), // Use full ISO string instead of just date part
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

  const addInvoiceHistory = async (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
      const newInvoice = {
        ...invoice,
        createdAt: new Date().toISOString(),
      };
      const createdInvoice = await createInvoiceHistoryService(newInvoice);
      setInvoiceHistory(prev => [...prev, createdInvoice as Invoice]);
    } catch (err) {
      console.error('Error adding invoice history:', err);
      setError('Failed to add invoice history');
      throw err;
    }
  };

  const deleteInvoiceHistory = async (id: string) => {
    try {
      await deleteInvoiceHistoryService(id);
      setInvoiceHistory(prev => prev.filter(invoice => invoice.id !== id));
    } catch (err) {
      console.error('Error deleting invoice history:', err);
      setError('Failed to delete invoice history');
      throw err;
    }
  };

  // Profit/Loss functions
  const addProfitLossReport = async (report: Omit<ProfitLossReport, 'id' | 'createdAt'>) => {
    try {
      const newReport = {
        ...report,
        createdAt: new Date().toISOString(),
      };
      const createdReport = await createProfitLossReportService(newReport);
      setProfitLossReports(prev => [...prev, createdReport as ProfitLossReport]);
    } catch (err) {
      console.error('Error adding profit/loss report:', err);
      setError('Failed to add profit/loss report');
      throw err;
    }
  };

  const updateProfitLossReport = async (id: string, report: Partial<ProfitLossReport>) => {
    try {
      await updateProfitLossReportService(id, report);
      setProfitLossReports(prev => 
        prev.map(r => r.id === id ? { ...r, ...report } : r)
      );
    } catch (err) {
      console.error('Error updating profit/loss report:', err);
      setError('Failed to update profit/loss report');
      throw err;
    }
  };

  const deleteProfitLossReport = async (id: string) => {
    try {
      await deleteProfitLossReportService(id);
      setProfitLossReports(prev => prev.filter(report => report.id !== id));
    } catch (err) {
      console.error('Error deleting profit/loss report:', err);
      setError('Failed to delete profit/loss report');
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

  // Message functions
  const sendMessage = async (message: Omit<Message, 'id' | 'timestamp'>, file?: File) => {
    try {
      let fileUrl = '';
      let fileName = '';
      
      if (file) {
        console.log('Uploading file:', file.name);
        fileUrl = await uploadMsgFile(file, file.name);
        fileName = file.name;
        console.log('File uploaded:', { fileUrl, fileName });
      }
      
      const messageToSend: any = {
        ...message
      };
      
      // Only add fileUrl and fileName if they have values
      if (fileUrl) {
        messageToSend.fileUrl = fileUrl;
      }
      
      if (fileName) {
        messageToSend.fileName = fileName;
      }
      
      console.log('Sending message to service:', messageToSend);
      const result = await sendMsg(messageToSend);
      console.log('Message sent result:', result);
      return result;
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      throw new Error(err.message || err.toString() || 'Failed to send message. Please try again.');
    }
  };

  const getUserMessages = async (userId: string) => {
    try {
      console.log('Fetching user messages for receiverId:', userId);
      const result = await getUserMsgs(userId);
      console.log('Fetched user messages:', result);
      return result;
    } catch (err) {
      console.error('Error fetching user messages:', err);
      setError('Failed to fetch messages');
      throw err;
    }
  };

  const getAdminMessages = async (adminId: string) => {
    try {
      console.log('Fetching admin messages for senderId:', adminId);
      const result = await getAdminMsgs(adminId);
      console.log('Fetched admin messages:', result);
      return result;
    } catch (err: any) {
      console.error('Error fetching admin messages:', err);
      // Provide more specific error message
      if (err.message && err.message.includes('query requires an index')) {
        // This is a common Firebase requirement, don't show as an error to user
        console.log('Firebase index being created. Returning empty message list for now.');
        return [];
      }
      const errorMessage = err.message || 'Failed to fetch messages';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await markMsgRead(messageId);
    } catch (err) {
      console.error('Error marking message as read:', err);
      setError('Failed to mark message as read');
      throw err;
    }
  };

  const getAllMessages = async () => {
    try {
      console.log('Fetching all messages');
      const result = await getAllMessagesService();
      console.log('Fetched all messages:', result);
      return result;
    } catch (err) {
      console.error('Error fetching all messages:', err);
      setError('Failed to fetch messages');
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
        invoiceHistory,
        profitLossReports,
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
        addInvoiceHistory,
        deleteInvoiceHistory, // Add deleteInvoiceHistory to provider value
        addServiceCharge,
        updateServiceCharge,
        deleteServiceCharge,
        // Message functions
        sendMessage,
        getUserMessages,
        getAdminMessages,
        markMessageAsRead,
        // Profit/Loss functions
        addProfitLossReport,
        updateProfitLossReport,
        deleteProfitLossReport,
        getAllMessages,
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