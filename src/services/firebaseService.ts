// Firebase service for handling employees and expenses data
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  getDoc,
  onSnapshot // Add this import for real-time listeners
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Employee, Expense } from '@/contexts/DataContext';

// Collection references
const employeesCollection = collection(db, 'employees');
const expensesCollection = collection(db, 'expenses');
const invoicesCollection = collection(db, 'invoices');
const serviceChargesCollection = collection(db, 'serviceCharges');
const invoiceHistoryCollection = collection(db, 'invoiceHistory');
const profitLossCollection = collection(db, 'profitLossReports');
const messagesCollection = collection(db, 'messages');

// Authentication operations
export const createAdminUser = async (email: string, password: string) => {
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Add user to employees collection in Firestore
    const employeeData = {
      email: email,
      name: 'Admin User',
      sector: 'Administration',
      age: 35,
      status: 'admin'
    };
    
    await addDoc(employeesCollection, employeeData);
    
    return userCredential.user;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

// Store admin credentials temporarily
let adminCredentials: { email: string; password: string } | null = null;

// Function to set admin credentials
export const setAdminCredentials = (email: string, password: string) => {
  adminCredentials = { email, password };
};

// Function to re-authenticate as admin
export const reauthenticateAsAdmin = async () => {
  if (adminCredentials && auth.currentUser?.email !== adminCredentials.email) {
    try {
      await signInWithEmailAndPassword(auth, adminCredentials.email, adminCredentials.password);
    } catch (error) {
      console.error('Error re-authenticating as admin:', error);
    }
  }
};

export const createEmployeeUser = async (email: string, password: string, username?: string, mobile?: string) => {
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Add user to employees collection in Firestore
    const employeeData: any = {
      email: email,
      name: '',
      sector: '',
      age: 0,
      status: 'employee'
    };
    
    // Add username if provided
    if (username) {
      employeeData.username = username;
    }
    
    // Add mobile if provided
    if (mobile) {
      employeeData.mobile = mobile;
    }
    
    await addDoc(employeesCollection, employeeData);
    
    // Re-authenticate as admin if we were logged in as admin
    setTimeout(async () => {
      await reauthenticateAsAdmin();
    }, 100);
    
    return userCredential.user;
  } catch (error) {
    console.error('Error creating employee user:', error);
    throw error;
  }
};

// Employee operations
export const createEmployee = async (employee: Omit<Employee, 'id'>) => {
  try {
    const docRef = await addDoc(employeesCollection, employee);
    return { id: docRef.id, ...employee };
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
};

export const getEmployees = async () => {
  try {
    const querySnapshot = await getDocs(employeesCollection);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    })) as unknown as Employee[];
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

export const getEmployeeById = async (id: string) => {
  try {
    const employeeDoc = doc(db, 'employees', id);
    const docSnap = await getDoc(employeeDoc);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as any) } as Employee;
    } else {
      throw new Error('Employee not found');
    }
  } catch (error) {
    console.error('Error fetching employee:', error);
    throw error;
  }
};

export const updateEmployee = async (id: string, employee: Partial<Employee>) => {
  try {
    const employeeDoc = doc(db, 'employees', id);
    await updateDoc(employeeDoc, employee);
    return { id, ...employee };
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

export const deleteEmployee = async (id: string) => {
  try {
    const employeeDoc = doc(db, 'employees', id);
    await deleteDoc(employeeDoc);
    return id;
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

// Expense operations
export const createExpense = async (expense: any) => {
  try {
    const docRef = await addDoc(expensesCollection, expense);
    return { id: docRef.id, ...expense };
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

// Add real-time listener for expenses
export const onExpensesChange = (callback: (expenses: Expense[]) => void) => {
  return onSnapshot(expensesCollection, 
    (querySnapshot) => {
      const expenses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as unknown as Expense[];
      callback(expenses);
    },
    (error) => {
      console.error('Error in expenses listener:', error);
    }
  );
};

export const getExpenses = async () => {
  try {
    const querySnapshot = await getDocs(expensesCollection);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    })) as unknown as Expense[];
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

export const getExpensesByUser = async (userId: string) => {
  try {
    const q = query(expensesCollection, where('userId', '==', userId), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    })) as unknown as Expense[];
  } catch (error) {
    console.error('Error fetching user expenses:', error);
    throw error;
  }
};

export const getExpenseById = async (id: string) => {
  try {
    const expenseDoc = doc(db, 'expenses', id);
    const docSnap = await getDoc(expenseDoc);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as any) } as Expense;
    } else {
      throw new Error('Expense not found');
    }
  } catch (error) {
    console.error('Error fetching expense:', error);
    throw error;
  }
};

export const updateExpense = async (id: string, expense: Partial<Expense>) => {
  try {
    const expenseDoc = doc(db, 'expenses', id);
    await updateDoc(expenseDoc, expense);
    return { id, ...expense };
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

export const deleteExpense = async (id: string) => {
  try {
    const expenseDoc = doc(db, 'expenses', id);
    await deleteDoc(expenseDoc);
    return id;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// Invoice operations
export const createInvoice = async (invoice: any) => {
  try {
    const docRef = await addDoc(invoicesCollection, invoice);
    return { id: docRef.id, ...invoice };
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

export const getInvoices = async () => {
  try {
    const querySnapshot = await getDocs(invoicesCollection);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    }));
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

export const getInvoiceById = async (id: string) => {
  try {
    const invoiceDoc = doc(db, 'invoices', id);
    const docSnap = await getDoc(invoiceDoc);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as any) };
    } else {
      throw new Error('Invoice not found');
    }
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
};

export const updateInvoice = async (id: string, invoice: Partial<any>) => {
  try {
    const invoiceDoc = doc(db, 'invoices', id);
    await updateDoc(invoiceDoc, invoice);
    return { id, ...invoice };
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
};

export const deleteInvoice = async (id: string) => {
  try {
    const invoiceDoc = doc(db, 'invoices', id);
    await deleteDoc(invoiceDoc);
    return id;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};

// Service Charges operations
export const createServiceCharge = async (serviceCharge: any) => {
  try {
    const docRef = await addDoc(serviceChargesCollection, serviceCharge);
    return { id: docRef.id, ...serviceCharge };
  } catch (error) {
    console.error('Error creating service charge:', error);
    throw error;
  }
};

export const getServiceCharges = async () => {
  try {
    const querySnapshot = await getDocs(serviceChargesCollection);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    }));
  } catch (error) {
    console.error('Error fetching service charges:', error);
    throw error;
  }
};

export const updateServiceCharge = async (id: string, serviceCharge: Partial<any>) => {
  try {
    const serviceChargeDoc = doc(db, 'serviceCharges', id);
    await updateDoc(serviceChargeDoc, serviceCharge);
    return { id, ...serviceCharge };
  } catch (error) {
    console.error('Error updating service charge:', error);
    throw error;
  }
};

export const deleteServiceCharge = async (id: string) => {
  try {
    const serviceChargeDoc = doc(db, 'serviceCharges', id);
    await deleteDoc(serviceChargeDoc);
    return id;
  } catch (error) {
    console.error('Error deleting service charge:', error);
    throw error;
  }
};

// Invoice History operations
export const createInvoiceHistory = async (invoice: any) => {
  try {
    const docRef = await addDoc(invoiceHistoryCollection, invoice);
    return { id: docRef.id, ...invoice };
  } catch (error) {
    console.error('Error creating invoice history:', error);
    throw error;
  }
};

// Add real-time listener for invoice history
export const onInvoiceHistoryChange = (callback: (invoices: any[]) => void) => {
  return onSnapshot(invoiceHistoryCollection, 
    (querySnapshot) => {
      const invoices = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));
      callback(invoices);
    },
    (error) => {
      console.error('Error in invoice history listener:', error);
    }
  );
};

export const getInvoiceHistory = async () => {
  try {
    const querySnapshot = await getDocs(invoiceHistoryCollection);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    }));
  } catch (error) {
    console.error('Error fetching invoice history:', error);
    throw error;
  }
};

export const getInvoiceHistoryById = async (id: string) => {
  try {
    const invoiceDoc = doc(db, 'invoiceHistory', id);
    const docSnap = await getDoc(invoiceDoc);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as any) };
    } else {
      throw new Error('Invoice history not found');
    }
  } catch (error) {
    console.error('Error fetching invoice history:', error);
    throw error;
  }
};

export const updateInvoiceHistory = async (id: string, invoice: Partial<any>) => {
  try {
    const invoiceDoc = doc(db, 'invoiceHistory', id);
    await updateDoc(invoiceDoc, invoice);
    return { id, ...invoice };
  } catch (error) {
    console.error('Error updating invoice history:', error);
    throw error;
  }
};

export const deleteInvoiceHistory = async (id: string) => {
  try {
    const invoiceDoc = doc(db, 'invoiceHistory', id);
    await deleteDoc(invoiceDoc);
    return id;
  } catch (error) {
    console.error('Error deleting invoice history:', error);
    throw error;
  }
};

// Profit/Loss operations
export const createProfitLossReport = async (report: any) => {
  try {
    const docRef = await addDoc(profitLossCollection, report);
    return { id: docRef.id, ...report };
  } catch (error) {
    console.error('Error creating profit/loss report:', error);
    throw error;
  }
};

export const getProfitLossReports = async () => {
  try {
    const querySnapshot = await getDocs(profitLossCollection);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    }));
  } catch (error) {
    console.error('Error fetching profit/loss reports:', error);
    throw error;
  }
};

export const getProfitLossReportById = async (id: string) => {
  try {
    const reportDoc = doc(db, 'profitLossReports', id);
    const docSnap = await getDoc(reportDoc);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as any) };
    } else {
      throw new Error('Profit/Loss report not found');
    }
  } catch (error) {
    console.error('Error fetching profit/loss report:', error);
    throw error;
  }
};

export const updateProfitLossReport = async (id: string, report: Partial<any>) => {
  try {
    const reportDoc = doc(db, 'profitLossReports', id);
    await updateDoc(reportDoc, report);
    return { id, ...report };
  } catch (error) {
    console.error('Error updating profit/loss report:', error);
    throw error;
  }
};

export const deleteProfitLossReport = async (id: string) => {
  try {
    const reportDoc = doc(db, 'profitLossReports', id);
    await deleteDoc(reportDoc);
    return id;
  } catch (error) {
    console.error('Error deleting profit/loss report:', error);
    throw error;
  }
};

// Get all messages (for debugging purposes)
export const getAllMessages = async () => {
  try {
    const querySnapshot = await getDocs(messagesCollection);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    }));
  } catch (error) {
    console.error('Error fetching all messages:', error);
    throw error;
  }
};
