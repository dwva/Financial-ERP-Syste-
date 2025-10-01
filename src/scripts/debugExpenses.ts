// Script to debug expense issues
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const debugExpenses = async () => {
  try {
    console.log('Debugging expenses...');
    
    // Get all expenses
    const expensesCollection = collection(db, 'expenses');
    const snapshot = await getDocs(expensesCollection);
    
    console.log(`Total expenses in database: ${snapshot.size}`);
    
    // Show all expenses
    snapshot.docs.forEach((doc, index) => {
      console.log(`Expense ${index + 1}:`, {
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Check expenses for a specific user
    const userQuery = query(expensesCollection, where('userId', '==', 'deva123@gmail.com'));
    const userSnapshot = await getDocs(userQuery);
    
    console.log(`\nExpenses for deva123@gmail.com: ${userSnapshot.size}`);
    
    userSnapshot.docs.forEach((doc, index) => {
      console.log(`User Expense ${index + 1}:`, {
        id: doc.id,
        ...doc.data()
      });
    });
    
  } catch (error) {
    console.error('Error debugging expenses:', error);
  }
};

// Run the script
debugExpenses();