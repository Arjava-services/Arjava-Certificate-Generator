import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyD5n_pgrTZnKEPQoPmlTHDw5pqdzE_u1Q0",
  authDomain: "certificategenerator-ceb1a.firebaseapp.com",
  projectId: "certificategenerator-ceb1a",
  storageBucket: "certificategenerator-ceb1a.firebasestorage.app",
  messagingSenderId: "1005312812391",
  appId: "1:1005312812391:web:6610da11c1e4542a817bc2",
  measurementId: "G-VKNPWNFYW0"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and Storage
export const db = getFirestore(app);
export const storage = getStorage(app);
