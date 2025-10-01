// Script to test if a user exists in Firebase Authentication
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const testUser = async () => {
  try {
    const email = 'adminxyz@gmail.com';
    const password = 'adminxyz';
    
    console.log('Testing user authentication...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User authenticated successfully!');
    console.log('User UID:', userCredential.user.uid);
    console.log('User Email:', userCredential.user.email);
    
    // Sign out after testing
    await auth.signOut();
    console.log('User signed out.');
  } catch (error: any) {
    console.error('Authentication test failed:', error.message);
    console.error('Error code:', error.code);
  }
};

// Run the script
testUser();