// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (role?: string) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    role: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

    if (!userDoc.exists()) {
      throw new Error('User profile not found in database.');
    }

    const userData = { id: userCredential.user.uid, ...userDoc.data() } as User;
    setUser(userData);
    return userData;
  };

  const loginWithGoogle = async (role: string = 'customer'): Promise<User> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    const result = await signInWithPopup(auth, provider);
    const firebaseUser: FirebaseUser = result.user;

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    let userData: User;

    if (userDoc.exists()) {
      userData = { id: firebaseUser.uid, ...userDoc.data() } as User;
    } else {
      userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        fullName: firebaseUser.displayName || 'User',
        phone: '',
        role: role as any,
        profileImage: firebaseUser.photoURL || undefined,
        createdAt: new Date().toISOString(),
      };

      await setDoc(userDocRef, userData);

      if (role === 'mechanic') {
        await setDoc(doc(db, 'mechanics', firebaseUser.uid), {
          isAvailable: false,
          rating: 0,
          totalReviews: 0,
          specialization: 'General Repair',
          location: { latitude: 0, longitude: 0 },
        });
      }
    }

    setUser(userData);
    return userData;
  };

  const register = async (formData: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    role: string;
  }): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      formData.email,
      formData.password
    );
    const uid = userCredential.user.uid;

    const newUser: User = {
      id: uid,
      email: formData.email,
      fullName: formData.fullName,
      phone: formData.phone,
      role: formData.role as any,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', uid), newUser);

    if (formData.role === 'mechanic') {
      await setDoc(doc(db, 'mechanics', uid), {
        isAvailable: false,
        rating: 0,
        totalReviews: 0,
        specialization: 'General Repair',
        location: { latitude: 0, longitude: 0 },
      });
    }

    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // Update user state locally (para hindi na kailangan mag-refresh)
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Refresh user data mula sa Firestore
  const refreshUser = async () => {
    if (!auth.currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUser({ id: auth.currentUser.uid, ...userDoc.data() } as User);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};