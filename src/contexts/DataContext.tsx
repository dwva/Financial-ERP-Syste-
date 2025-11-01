import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getEmployees, 
  getExpenses, 
  createExpense, 
  createEmployeeUser,
  updateEmployee as updateEmployeeService,
  deleteEmployee as deleteEmployeeService,
  updateExpense as updateExpenseService,
  deleteExpense as deleteExpenseService,
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
  onExpensesChange,
  onMessagesChange,
  // Add dropdown data imports
  getDropdownData,
  createDropdownData,
  updateDropdownData as updateDropdownDataService,
  deleteDropdownData as deleteDropdownDataService,
  onDropdownDataChange
} from '@/services/firebaseService';
import { Timestamp } from 'firebase/firestore';
import { 
  sendMessage as sendMsg, 
  getUserMessages as getUserMsgs, 
  getAdminMessages as getAdminMsgs,
  getMessageById as getMessageByIdService,
  markMessageAsRead as markMsgRead,
  deleteMessage as deleteMessageService,
  getAllMessages as getAllMessagesService,
  uploadMessageFile,
  uploadExpenseFile,
  Message
} from '@/services/messageService';

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
  overdue?: boolean; // Add overdue field
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

// Add this interface for dropdown data
export interface DropdownData {
  id: string;
  type: 'company' | 'client' | 'candidate' | 'sector';
  value: string;
  createdAt: string;
}

interface DataContextType {
  employees: Employee[];
  expenses: Expense[];
  invoices: Invoice[];
  serviceCharges: ServiceCharge[];
  invoiceHistory: Invoice[];
  profitLossReports: ProfitLossReport[];
  messages: Message[];
  dropdownData: DropdownData[]; // Add this line
  loading: boolean;
  error: string | null;
  addEmployee: (email: string, password: string, username?: string, mobile?: string, status?: 'employee' | 'admin') => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'timestamp'>, file?: File) => Promise<void>;
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
  // Add dropdown data functions
  addDropdownData: (data: Omit<DropdownData, 'id' | 'createdAt'>) => Promise<void>;
  updateDropdownData: (id: string, data: Partial<DropdownData>) => Promise<void>;
  deleteDropdownData: (id: string) => Promise<void>;
  // Message functions
  sendMessage: (message: Omit<Message, 'id' | 'timestamp'>, file?: File) => Promise<Message>;
  getUserMessages: (userId: string) => Promise<Message[]>;
  getAdminMessages: (adminId: string) => Promise<Message[]>;
  getMessageById: (messageId: string) => Promise<any>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [dropdownData, setDropdownData] = useState<DropdownData[]>([]); // Add this line
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribeExpenses, setUnsubscribeExpenses] = useState<(() => void) | null>(null);
  const [unsubscribeMessages, setUnsubscribeMessages] = useState<(() => void) | null>(null);

  // Fetch initial data and set up real-time listeners
  useEffect(() => {
    console.log('Initializing DataContext');
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      console.log('Refreshing data...');
      
      // Fetch all data concurrently
      const [employeesData, expensesData, invoicesData, serviceChargesData, invoiceHistoryData, profitLossReportsData, dropdownData] = await Promise.all([
        getEmployees(),
        getExpenses(),
        getInvoices(),
        getServiceCharges(),
        getInvoiceHistory(),
        getProfitLossReports(),
        getDropdownData()
      ]);

      console.log('Data fetched:', {
        employees: employeesData.length,
        expenses: expensesData.length,
        invoices: invoicesData.length,
        serviceCharges: serviceChargesData.length,
        invoiceHistory: invoiceHistoryData.length,
        profitLossReports: profitLossReportsData.length,
        dropdownData: dropdownData.length
      });

      setEmployees(employeesData);
      setExpenses(expensesData);
      setInvoices(invoicesData);
      setServiceCharges(serviceChargesData);
      setInvoiceHistory(invoiceHistoryData);
      setProfitLossReports(profitLossReportsData);
      setDropdownData(dropdownData);

      // Set up real-time listeners
      if (!unsubscribeExpenses) {
        const unsubscribeExp = onExpensesChange((updatedExpenses) => {
          console.log('Expenses updated via listener:', updatedExpenses.length);
          setExpenses(updatedExpenses);
        });
        setUnsubscribeExpenses(() => unsubscribeExp);
      }

      if (!unsubscribeMessages) {
        const unsubscribeMsg = onMessagesChange((updatedMessages) => {
          console.log('Messages updated via listener:', updatedMessages.length);
          setMessages(updatedMessages);
        });
        setUnsubscribeMessages(() => unsubscribeMsg);
      }

      // Set up dropdown data listener
      const unsubscribeDropdown = onDropdownDataChange((updatedData) => {
        console.log('Dropdown data updated via listener:', updatedData.length);
        setDropdownData(updatedData);
      });
      // We don't need to store this unsubscribe function as it's less critical

    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (email: string, password: string, username?: string, mobile?: string, status: 'employee' | 'admin' = 'employee') => {
    try {
      // Create user in Firebase Authentication and Firestore
      await createEmployeeUser(email, password, username, mobile, status);
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

  const addExpense = async (expense: Omit<Expense, 'id' | 'timestamp'>, file?: File) => {
    try {
      // Create the base expense data with timestamp
      const newExpense: any = {
        ...expense,
        timestamp: new Date().toISOString(), // Use full ISO string instead of just date part
      };
      
      // If a file is provided, upload it and add the file info to the expense
      if (file) {
        try {
          const fileUrl = await uploadExpenseFile(file, file.name);
          newExpense.file = fileUrl;
          newExpense.fileName = file.name;
        } catch (fileError: any) {
          console.error('Error uploading file:', fileError);
          throw new Error(`File upload failed: ${fileError.message || 'Unknown error'}. The expense was not added.`);
        }
      }
      
      const createdExpense = await createExpense(newExpense);
      // Don't add to local state immediately since the real-time listener will update it
      return createdExpense;
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
      // Create the base message data with timestamp
      const messageData: any = {
        ...message,
        timestamp: Timestamp.now(),
        read: false
      };
      
      // If a file is provided, upload it and add the file info to the message
      if (file) {
        try {
          const fileUrl = await uploadMessageFile(file, file.name);
          messageData.fileUrl = fileUrl;
          messageData.fileName = file.name;
        } catch (fileError: any) {
          console.error('Error uploading file:', fileError);
          // Since we're using only local storage now, we don't need a fallback
          throw new Error(`File upload failed: ${fileError.message || 'Unknown error'}. The message was not sent.`);
        }
      }
      
      const result = await sendMsg(messageData);
      return result;
    } catch (err: any) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
      // More specific error message
      const errorMessage = err.message || err.toString() || 'Failed to send message. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const getUserMessages = async (userId: string) => {
    try {
      const result = await getUserMsgs(userId);
      return result;
    } catch (err) {
      setError('Failed to fetch messages');
      throw err;
    }
  };

  const getAdminMessages = async (adminId: string) => {
    try {
      const result = await getAdminMsgs(adminId);
      return result;
    } catch (err: any) {
      // Provide more specific error message
      if (err.message && err.message.includes('query requires an index')) {
        // This is a common Firebase requirement, re-throw the error so the UI can handle it properly
        console.log('Firebase index being created. Throwing error for proper handling.');
        // Provide a more user-friendly error message
        throw new Error('Setting up message history for the first time. This may take a moment. Please try again in a few seconds.');
      }
      const errorMessage = err.message || 'Failed to fetch messages';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getMessageById = async (messageId: string) => {
    try {
      const result = await getMessageByIdService(messageId);
      return result;
    } catch (err) {
      setError('Failed to fetch message');
      throw err;
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await markMsgRead(messageId);
    } catch (err) {
      setError('Failed to mark message as read');
      throw err;
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await deleteMessageService(messageId);
    } catch (err) {
      setError('Failed to delete message');
      throw err;
    }
  };

  const getAllMessages = async () => {
    try {
      const result = await getAllMessagesService();
      return result;
    } catch (err) {
      setError('Failed to fetch messages');
      throw err;
    }
  };

  // Add dropdown data functions
  const addDropdownData = async (data: Omit<DropdownData, 'id' | 'createdAt'>) => {
    try {
      const newData = {
        ...data,
        createdAt: new Date().toISOString(),
      };
      const createdData = await createDropdownData(newData);
      setDropdownData(prev => [...prev, createdData as DropdownData]);
    } catch (err) {
      console.error('Error adding dropdown data:', err);
      setError('Failed to add dropdown data');
      throw err;
    }
  };

  const updateDropdownData = async (id: string, data: Partial<DropdownData>) => {
    try {
      await updateDropdownDataService(id, data);
      setDropdownData(prev => 
        prev.map(item => item.id === id ? { ...item, ...data } : item)
      );
    } catch (err) {
      console.error('Error updating dropdown data:', err);
      setError('Failed to update dropdown data');
      throw err;
    }
  };

  const deleteDropdownData = async (id: string) => {
    try {
      await deleteDropdownDataService(id);
      setDropdownData(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting dropdown data:', err);
      setError('Failed to delete dropdown data');
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
        messages,
        dropdownData, // Add this line
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
        deleteInvoiceHistory,
        addServiceCharge,
        updateServiceCharge,
        deleteServiceCharge,
        // Add dropdown data functions to provider value
        addDropdownData,
        updateDropdownData,
        deleteDropdownData,
        // Message functions
        sendMessage,
        getUserMessages,
        getAdminMessages,
        getMessageById,
        markMessageAsRead,
        deleteMessage,
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