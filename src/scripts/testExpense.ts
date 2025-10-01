// Script to test expense creation
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const testExpense = async () => {
  try {
    console.log('Testing expense creation...');
    
    // Test expense data
    const testExpenseData = {
      userId: 'deva123@gmail.com',
      amount: 100.50,
      description: 'Test expense',
      date: '2025-10-01',
      company: 'Test Company',
      sector: 'Test Sector',
      file: null,
      fileName: null,
      timestamp: new Date().toISOString().split('T')[0]
    };
    
    // Add expense to Firestore
    const expensesCollection = collection(db, 'expenses');
    const docRef = await addDoc(expensesCollection, testExpenseData);
    
    console.log('Expense added successfully!');
    console.log('Document ID:', docRef.id);
    
    // Verify the expense was added
    const snapshot = await getDocs(expensesCollection);
    console.log(`Total expenses in database: ${snapshot.size}`);
    
  } catch (error) {
    console.error('Error testing expense creation:', error);
  }
};

// Run the script
testExpense();