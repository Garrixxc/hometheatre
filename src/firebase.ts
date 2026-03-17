/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, import.meta.env.VITE_FIREBASE_FIRESTORE_DB_ID);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    console.log("Attempting Google Sign-In...");
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Sign-In successful:", result.user.email);
    return result;
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    if (error.code === 'auth/popup-blocked') {
      alert("Popup blocked! Please allow popups for this site to sign in.");
    } else {
      alert(`Login failed: ${error.message}`);
    }
    throw error;
  }
};

export const logout = () => signOut(auth);
