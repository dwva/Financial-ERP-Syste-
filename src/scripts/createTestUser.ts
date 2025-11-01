// Script to create a test user with username and mobile for testing login functionality
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

async function createTestUser() {
  try {
    console.log('Creating test user with username and mobile...');
    
    // Create a test user with username and mobile
    const testUser = {
      email: 'testuser@example.com',
      username: 'testuser',
      mobile: '9876543210',
      name: 'Test User',
      sector: 'Testing',
      age: 25,
      status: 'employee',
      passwordResetRequired: true // User will need to reset password on first login
    };
    
    const docRef = await addDoc(collection(db, 'employees'), testUser);
    console.log('Test user created with ID:', docRef.id);
    console.log('You can now test login with:');
    console.log('- Email: testuser@example.com');
    console.log('- Username: testuser');
    console.log('- Mobile: 9876543210');
    console.log('Password: The user will need to reset their password on first login');
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser();