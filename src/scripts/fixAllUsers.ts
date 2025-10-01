// Script to add all existing Firestore users to Firebase Authentication
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

const fixAllUsers = async () => {
  try {
    console.log('Fetching all users from Firestore...');
    
    // Get all employees from Firestore
    const employeesCollection = collection(db, 'employees');
    const snapshot = await getDocs(employeesCollection);
    
    console.log(`Found ${snapshot.size} users in Firestore`);
    
    let fixedCount = 0;
    
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      const email = userData.email;
      
      // Skip if email is missing
      if (!email) {
        console.log(`Skipping document ${doc.id} (no email)`);
        continue;
      }
      
      // Generate a default password (email prefix + fixed suffix)
      // This is just for initial setup - users should change their passwords
      const defaultPassword = email.split('@')[0].substring(0, 10) + '123!';
      
      try {
        await createUserWithEmailAndPassword(auth, email, defaultPassword);
        console.log(`✓ Added ${email} to Firebase Authentication (password: ${defaultPassword})`);
        fixedCount++;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          console.log(`→ ${email} already exists in Firebase Authentication`);
        } else {
          console.log(`✗ Error adding ${email}: ${authError.message}`);
        }
      }
    }
    
    console.log(`\nUser fix process completed!`);
    console.log(`Added ${fixedCount} users to Firebase Authentication`);
    console.log(`\nNOTE: All new users have default passwords based on their email.`);
    console.log(`Users should change their passwords after first login.`);
    
  } catch (error) {
    console.error('Error fixing users:', error);
  }
};

// Run the script
fixAllUsers();