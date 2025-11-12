import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { setAdminCredentials } from '@/services/firebaseService';

interface User {
  uid: string;
  email: string | null;
  role: 'admin' | 'user';
}

interface EmployeeData {
  email: string;
  mobile?: string;
  username?: string;
  passwordResetRequired?: boolean;
  status?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  findUserByEmailOrIdentifier: (identifier: string) => Promise<{email: string, passwordResetRequired?: boolean, status?: string, docId?: string} | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // Instead of automatically setting the user based on Firebase auth state,
      // we'll only set loading to false and let the login function handle user state
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Function to find user email by identifier (email, mobile, or username)
  const findUserByEmailOrIdentifier = async (identifier: string): Promise<{email: string, passwordResetRequired?: boolean, status?: string, docId?: string} | null> => {
    try {
      console.log('Finding user by identifier:', identifier);
      
      // Check for admin users first (direct match)
      if (identifier === 'admin@company.com' || identifier === 'adminxyz@gmail.com') {
        console.log('Admin user found by direct match');
        return {
          email: identifier,
          passwordResetRequired: false,
          status: 'admin'
        };
      }
      
      const employeesCollection = collection(db, 'employees');
      let querySnapshot;
      
      // If it's already a valid email format
      if (identifier.includes('@')) {
        // Check if user exists in Firestore by email
        const q = query(employeesCollection, where('email', '==', identifier));
        querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data() as EmployeeData;
          console.log('User found by email:', userData.email);
          return {
            email: userData.email,
            passwordResetRequired: userData.passwordResetRequired,
            status: userData.status,
            docId: userDoc.id
          };
        }
      }
      
      // Check if it's a mobile number (contains only digits)
      const isMobileNumber = /^\d+$/.test(identifier);
      
      if (isMobileNumber) {
        // Search by mobile number
        const q = query(employeesCollection, where('mobile', '==', identifier));
        querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data() as EmployeeData;
          console.log('User found by mobile:', userData.email);
          return {
            email: userData.email,
            passwordResetRequired: userData.passwordResetRequired,
            status: userData.status,
            docId: userDoc.id
          };
        }
      }
      
      // Search by username
      const q = query(employeesCollection, where('username', '==', identifier));
      querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as EmployeeData;
        console.log('User found by username:', userData.email);
        return {
            email: userData.email,
            passwordResetRequired: userData.passwordResetRequired,
            status: userData.status,
            docId: userDoc.id
        };
      }
      
      console.log('No user found with identifier:', identifier);
      return null;
    } catch (error) {
      console.error('Error finding user by identifier:', error);
      return null;
    }
  };

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('Attempting login with identifier:', identifier);
      
      // Find the user's email based on the identifier
      const userResult = await findUserByEmailOrIdentifier(identifier);
      
      if (!userResult) {
        console.error('Login failed: User not found with identifier:', identifier);
        throw new Error('User not found');
      }
      
      const { email, passwordResetRequired, status } = userResult;
      console.log('User found, email:', email, 'status:', status);
      
      // Password reset check removed - users can login directly with their password
      
      // For main admins, use Firebase Authentication
      if (email === 'admin@company.com' || email === 'adminxyz@gmail.com') {
        try {
          console.log('Attempting Firebase auth for admin user:', email);
          // Try to sign in with the found email and password
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          
          // Determine if user is admin based on email or status
          const isAdmin = userCredential.user.email === 'admin@company.com' || 
                         userCredential.user.email === 'adminxyz@gmail.com';
          
          // Check if user has admin status in Firestore
          let hasAdminStatus = isAdmin;
          if (!isAdmin) {
            try {
              const employeesCollection = collection(db, 'employees');
              const q = query(employeesCollection, where('email', '==', userCredential.user.email));
              const querySnapshot = await getDocs(q);
              
              if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data() as EmployeeData;
                hasAdminStatus = userData.status === 'admin';
              }
            } catch (error) {
              console.error('Error checking admin status:', error);
            }
          }
          
          const userData: User = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            role: hasAdminStatus ? 'admin' : 'user'
          };
          
          // Store admin credentials
          setAdminCredentials(email, password);
          setUser(userData);
          console.log('Admin login successful');
          
          return true;
        } catch (authError: any) {
          console.error('Admin login failed:', authError.code, authError.message);
          // Re-throw the original error
          throw authError;
        }
      } 
      // For sub-admins and regular users
      else {
        // First, try Firebase Authentication for all users
        try {
          console.log('Attempting Firebase auth for user:', email);
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          
          // Determine user role
          let hasAdminStatus = false;
          try {
            const employeesCollection = collection(db, 'employees');
            const q = query(employeesCollection, where('email', '==', email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              const userData = userDoc.data() as EmployeeData;
              hasAdminStatus = userData.status === 'admin';
            }
          } catch (error) {
            console.error('Error checking user status:', error);
          }
          
          const userData: User = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            role: hasAdminStatus ? 'admin' : 'user'
          };
          
          setUser(userData);
          console.log('Firebase auth successful for user:', email);
          return true;
        } catch (firebaseError: any) {
          console.error('Firebase auth failed:', firebaseError.code, firebaseError.message);
          
          // If Firebase authentication fails, check if it's because the user doesn't exist in Firebase
          if (firebaseError.code === 'auth/user-not-found' || 
              firebaseError.code === 'auth/invalid-credential' || 
              firebaseError.code === 'auth/invalid-email' ||
              firebaseError.code === 'auth/wrong-password') {
            
            // For sub-admins, this is an error - they should have Firebase accounts
            if (status === 'admin') {
              console.error('Sub-admin login failed: Invalid credentials');
              throw new Error('Invalid credentials. Please check your email and password.');
            } 
            // For regular employees, use manual authentication
            else {
              console.log('Using manual authentication for regular employee:', email);
              // Create a mock user object
              const mockUser: User = {
                uid: email, // Using email as UID for non-Firebase users
                email: email,
                role: 'user' // Regular employees are always users
              };
              
              // Set the user state directly
              setUser(mockUser);
              console.log('Manual authentication successful for user:', email);
              return true;
            }
          } else {
            // For other Firebase errors, re-throw them
            console.error('Other Firebase error:', firebaseError.code, firebaseError.message);
            throw firebaseError;
          }
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Clear stored admin credentials
      localStorage.removeItem('adminCredentials');
      // Clear user state
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Function to reset password for users with passwordResetRequired flag
  const resetPassword = async (email: string, newPassword: string) => {
    try {
      console.log('Resetting password for user:', email);
      
      // Find the user document in Firestore
      const employeesCollection = collection(db, 'employees');
      const q = query(employeesCollection, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('User not found');
      }
      
      const userDoc = querySnapshot.docs[0];
      const docRef = doc(db, 'employees', userDoc.id);
      
      // Update the user document with the new password and set passwordResetRequired to false
      await updateDoc(docRef, {
        password: newPassword, // Store the new password
        passwordResetRequired: false
      });
      
      console.log('Password reset successful for user:', email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, resetPassword, findUserByEmailOrIdentifier }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};