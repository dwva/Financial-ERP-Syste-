// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAS8o8Rb9Lb4mtTCN1xShuQG1EoYpoXrUY",
  authDomain: "financial-erp-system.firebaseapp.com",
  projectId: "financial-erp-system",
  storageBucket: "financial-erp-system.firebasestorage.app",
  messagingSenderId: "938104418245",
  appId: "1:938104418245:web:a0553bd4582f69179fa5ac",
  measurementId: "G-7QFMG7R60R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Only initialize analytics in browser environment
export let analytics;
if (typeof window !== 'undefined') {
  try {
    const { getAnalytics } = await import('firebase/analytics');
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

export default app;