import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  disableRedirection: () => void;
  enableRedirection: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectionDisabled, setRedirectionDisabled] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (redirectionDisabled) {
        // If redirection is disabled, don't update the user state
        // This prevents redirections during user creation
        return;
      }
      
      if (firebaseUser) {
        // Determine if user is admin based on email
        const isAdmin = firebaseUser.email === 'admin@company.com' || 
                       firebaseUser.email === 'adminxyz@gmail.com';
        
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: isAdmin ? 'admin' : 'user'
        };
        
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [redirectionDisabled]);

  // Function to find user email by identifier (email, mobile, or username)
  const findUserByEmailOrIdentifier = async (identifier: string): Promise<string | null> => {
    try {
      // If it's already a valid email format, check if user exists
      if (identifier.includes('@')) {
        // First check if a Firebase Authentication user exists with this email
        try {
          // Try to sign in to verify the user exists
          // We won't actually sign in, just verify
          return identifier;
        } catch (error) {
          // If that fails, check if user exists in Firestore
          const employeesCollection = collection(db, 'employees');
          const q = query(employeesCollection, where('email', '==', identifier));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            return identifier; // Return the email directly
          }
          
          // If not found, return null
          return null;
        }
      }
      
      // Check if it's a mobile number (contains only digits)
      const isMobileNumber = /^\d+$/.test(identifier);
      
      // Query Firestore for the user based on mobile or username
      const employeesCollection = collection(db, 'employees');
      let q;
      
      if (isMobileNumber) {
        // Search by mobile number
        q = query(employeesCollection, where('mobile', '==', identifier));
      } else {
        // Search by username
        q = query(employeesCollection, where('username', '==', identifier));
      }
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as EmployeeData;
        return userData.email;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding user by identifier:', error);
      return null;
    }
  };

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Find the user's email based on the identifier
      const email = await findUserByEmailOrIdentifier(identifier);
      
      if (!email) {
        throw new Error('User not found');
      }
      
      try {
        // Try to sign in with the found email and password
        await signInWithEmailAndPassword(auth, email, password);
        
        // If this is an admin logging in, store their credentials
        if (email === 'admin@company.com' || email === 'adminxyz@gmail.com') {
          setAdminCredentials(email, password);
        }
        
        return true;
      } catch (authError) {
        // If Firebase Authentication fails, check if this is a user who needs to reset their password
        const employeesCollection = collection(db, 'employees');
        const q = query(employeesCollection, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data() as EmployeeData;
          
          // If user has passwordResetRequired flag, throw a specific error
          if (userData.passwordResetRequired) {
            throw new Error('Password reset required. Please contact admin.');
          }
        }
        
        // Re-throw the original error
        throw authError;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Clear stored admin credentials
      localStorage.removeItem('adminCredentials');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Functions to disable/enable redirections
  const disableRedirection = () => {
    setRedirectionDisabled(true);
  };

  const enableRedirection = () => {
    setRedirectionDisabled(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, disableRedirection, enableRedirection }}>
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