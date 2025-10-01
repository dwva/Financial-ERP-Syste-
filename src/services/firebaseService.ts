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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Employee, Expense } from '@/contexts/DataContext';

// Collection references
const employeesCollection = collection(db, 'employees');
const expensesCollection = collection(db, 'expenses');

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

export const createEmployeeUser = async (email: string, password: string) => {
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Add user to employees collection in Firestore
    const employeeData = {
      email: email,
      name: '',
      sector: '',
      age: 0,
      status: 'employee'
    };
    
    await addDoc(employeesCollection, employeeData);
    
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