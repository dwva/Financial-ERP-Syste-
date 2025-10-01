// Script to create an admin user in Firebase
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';

const createAdmin = async () => {
  try {
    const email = 'adminxyz@gmail.com';
    const password = 'adminxyz';
    
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Add user to employees collection in Firestore
    const employeesCollection = collection(db, 'employees');
    const employeeData = {
      email: email,
      name: 'Admin User',
      sector: 'Administration',
      age: 35,
      status: 'admin'
    };
    
    await addDoc(employeesCollection, employeeData);
    
    console.log('Admin user created successfully!');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Run the script
createAdmin();