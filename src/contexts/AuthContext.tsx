import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
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
  passwordResetRequired?: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const navigate = useNavigate();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
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
        setShouldRedirect(true);
      } else {
        setUser(null);
        setShouldRedirect(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handle redirection after manual login
  useEffect(() => {
    if (user && shouldRedirect) {
      // Automatically redirect to appropriate dashboard
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      setShouldRedirect(false);
    }
  }, [user, shouldRedirect, navigate]);

  // Function to find user email by identifier (email, mobile, or username)
  const findUserByEmailOrIdentifier = async (identifier: string): Promise<{email: string, passwordResetRequired?: boolean} | null> => {
    try {
      // If it's already a valid email format
      if (identifier.includes('@')) {
        // Check if user exists in Firestore
        const employeesCollection = collection(db, 'employees');
        const q = query(employeesCollection, where('email', '==', identifier));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data() as EmployeeData;
          return {
            email: userData.email,
            passwordResetRequired: userData.passwordResetRequired
          };
        }
        
        // If not found in Firestore, check if it's an admin user
        if (identifier === 'admin@company.com' || identifier === 'adminxyz@gmail.com') {
          return {
            email: identifier,
            passwordResetRequired: false
          };
        }
        
        // If not found, return null
        return null;
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
        return {
          email: userData.email,
          passwordResetRequired: userData.passwordResetRequired
        };
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
      const userResult = await findUserByEmailOrIdentifier(identifier);
      
      if (!userResult) {
        throw new Error('User not found');
      }
      
      const { email, passwordResetRequired } = userResult;
      
      // Check if user needs to reset password
      if (passwordResetRequired) {
        throw new Error('Password reset required. Please contact admin.');
      }
      
      try {
        // Try to sign in with the found email and password
        await signInWithEmailAndPassword(auth, email, password);
        
        // If this is an admin logging in, store their credentials
        if (email === 'admin@company.com' || email === 'adminxyz@gmail.com') {
          setAdminCredentials(email, password);
        }
        
        // Set flag to trigger redirection
        setShouldRedirect(true);
        
        return true;
      } catch (authError: any) {
        // Re-throw the original error
        throw authError;
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
      setShouldRedirect(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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