// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBbTsM5_sXlv812LeL2P3qjz03jduA5wfY",
  authDomain: "split-sync-p.firebaseapp.com",
  projectId: "split-sync-p",
  storageBucket: "split-sync-p.firebasestorage.app",
  messagingSenderId: "62467912889",
  appId: "1:62467912889:web:08049b6f3e5d5a2b371768",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
