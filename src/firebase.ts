// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDgsCAYNW0GYuhKCBpjEMq6tks_e9yarQI",
  authDomain: "fixora-app-57df9.firebaseapp.com",
  projectId: "fixora-app-57df9",
  storageBucket: "fixora-app-57df9.firebasestorage.app",
  messagingSenderId: "132977563736",
  appId: "1:132977563736:web:e1bc6a8b5e177fd6d0d22d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);