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
  getDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Employee, Expense } from '@/contexts/DataContext';

// Collection references
const employeesCollection = collection(db, 'employees');
const expensesCollection = collection(db, 'expenses');
const invoicesCollection = collection(db, 'invoices');
const serviceChargesCollection = collection(db, 'serviceCharges');

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