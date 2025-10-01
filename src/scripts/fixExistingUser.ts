// Script to add an existing Firestore user to Firebase Authentication
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

const fixExistingUser = async () => {
  try {
    const email = 'deva123@gmail.com';
    // Firebase requires at least 6 characters for passwords
    const password = 'deva123'; // Updated to meet minimum requirements
    
    console.log(`Fixing user: ${email}`);
    
    // Check if user already exists in Authentication
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log('User successfully added to Firebase Authentication!');
      console.log('NOTE: The password has been set to "deva123" (minimum 6 characters required by Firebase)');
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-in-use') {
        console.log('User already exists in Firebase Authentication');
      } else {
        throw authError;
      }
    }
    
    console.log('User fix completed!');
  } catch (error) {
    console.error('Error fixing user:', error);
  }
};

// Run the script
fixExistingUser();