// src/api/firebaseService.ts
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc, query, where, orderBy, onSnapshot,
} from 'firebase/firestore';
import {
  EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import {
  Mechanic, Booking, Review, ChatMessage, InventoryItem, BookingStatus, User, Vehicle, MechanicStatus,
} from '../types';

// ============ HELPERS ============
const removeUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const cleaned: Record<string, any> = {};
  for (const key in obj) {
    const value = obj[key];
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as Partial<T>;
};

const now = () => new Date().toISOString();

// ============ MECHANICS ============
export const getAllMechanics = async (): Promise<Mechanic[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'mechanic'));
    const snapshot = await getDocs(q);

    const mechanics: Mechanic[] = [];

    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      const mechDoc = await getDoc(doc(db, 'mechanics', userDoc.id));
      const mechData = mechDoc.exists() ? mechDoc.data() : {};

      mechanics.push({
        id: userDoc.id,
        fullName: userData.fullName || 'Mechanic',
        email: userData.email,
        phone: userData.phone || '',
        profileImage: userData.profileImage,
        specialization: mechData.specialization || 'General Repair',
        category: mechData.category || 'repair',
        status: mechData.status || 'offline',
        accountStatus: userData.accountStatus || (userData.isActive === false ? 'suspended' : 'active'), // ✅ IDINAGDAG ITO
        rating: mechData.rating ?? 4.5,
        totalReviews: mechData.totalReviews ?? 0,
        hourlyRate: mechData.hourlyRate ?? 250,
        services: mechData.services || [], 
        location: mechData.location || { latitude: 0, longitude: 0 },
        schedule: mechData.schedule || { days: [], startTime: '08:00', endTime: '18:00' },
      });
    }

    return mechanics;
  } catch (error) {
    console.error('Error fetching mechanics:', error);
    return [];
  }
};

export const getTopRatedMechanics = async (limit: number = 5): Promise<Mechanic[]> => {
  const all = await getAllMechanics();
  return all
    .filter((m) => m.status === 'available') 
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
};

export const getMechanicProfile = async (mechanicId: string): Promise<any | null> => {
  try {
    const ref = doc(db, 'mechanics', mechanicId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (e) {
    console.error('getMechanicProfile error:', e);
    return null;
  }
};

export const saveMechanicProfile = async (
  mechanicId: string,
  data: Partial<Mechanic>
): Promise<void> => {
  const ref = doc(db, 'mechanics', mechanicId);
  const cleaned = removeUndefined(data);
  await setDoc(ref, cleaned, { merge: true });
};

export const setMechanicAvailability = async (
  mechanicId: string,
  status: MechanicStatus 
): Promise<void> => {
  await updateDoc(doc(db, 'mechanics', mechanicId), { status });
};

// ============ BOOKINGS ============
export const createBooking = async (booking: Omit<Booking, 'id'>): Promise<string> => {
  const cleaned = removeUndefined(booking);
  const docRef = await addDoc(collection(db, 'bookings'), cleaned);
  return docRef.id;
};

export const getCustomerBookings = async (customerId: string): Promise<Booking[]> => {
  try {
    const q = query(collection(db, 'bookings'), where('customerId', '==', customerId));
    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Booking[];
    return bookings.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

export const getMechanicBookings = async (mechanicId: string): Promise<Booking[]> => {
  try {
    const q = query(collection(db, 'bookings'), where('mechanicId', '==', mechanicId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Booking[];
  } catch (error) {
    console.error('Error fetching mechanic bookings:', error);
    return [];
  }
};

export const getPendingBookings = async (): Promise<Booking[]> => {
  try {
    const q = query(collection(db, 'bookings'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Booking[];
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    return [];
  }
};

export const getBookingById = async (bookingId: string): Promise<Booking | null> => {
  try {
    const ref = doc(db, 'bookings', bookingId);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Booking) : null;
  } catch (e) {
    console.error('getBookingById error:', e);
    return null;
  }
};

export const acceptBooking = async (
  bookingId: string,
  mechanicId: string,
  mechanicName: string
) => {
  await updateDoc(doc(db, 'bookings', bookingId), {
    mechanicId,
    mechanicName,
    status: 'accepted',
    updatedAt: now(),
  });
};

export const rejectBooking = async (bookingId: string) => {
  await updateDoc(doc(db, 'bookings', bookingId), {
    status: 'cancelled',
    updatedAt: now(),
  });
};

export const updateBookingStatus = async (
  bookingId: string,
  status: BookingStatus
) => {
  await updateDoc(doc(db, 'bookings', bookingId), { status, updatedAt: now() });
};

export const updateBookingPrice = async (bookingId: string, price: number) => {
  await updateDoc(doc(db, 'bookings', bookingId), {
    price,
    updatedAt: now(),
  });
};

export const updateMechanicLiveLocation = async (
  bookingId: string,
  location: { latitude: number; longitude: number }
) => {
  await updateDoc(doc(db, 'bookings', bookingId), {
    mechanicLocation: {
      latitude: location.latitude,
      longitude: location.longitude,
      updatedAt: now(),
    },
  });
};

// ============ REVIEWS ============
export const submitReview = async (review: Omit<Review, 'id'>): Promise<string> => {
  const cleaned = removeUndefined(review);
  
  const docRef = await addDoc(collection(db, 'reviews'), cleaned);

  try {
    const q = query(
      collection(db, 'reviews'),
      where('mechanicId', '==', review.mechanicId)
    );
    const snapshot = await getDocs(q);
    
    let totalRating = 0;
    snapshot.docs.forEach((doc) => {
      totalRating += doc.data().rating || 0;
    });

    const totalReviews = snapshot.docs.length;
    const averageRating = totalRating / totalReviews;

    await updateDoc(doc(db, 'mechanics', review.mechanicId), {
      rating: averageRating,
      totalReviews: totalReviews,
    });

  } catch (error) {
    console.error('Error updating mechanic rating:', error);
  }

  return docRef.id;
};

// ============ CHAT ============
export const sendChatMessage = async (message: Omit<ChatMessage, 'id'>): Promise<void> => {
  const cleaned = removeUndefined(message);
  await addDoc(collection(db, 'chats'), cleaned);
};

export const subscribeToChat = (
  bookingId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  const q = query(
    collection(db, 'chats'),
    where('bookingId', '==', bookingId)
  );

  return onSnapshot(
    q, 
    (snapshot) => {
      const messages = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ChatMessage[];
      
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      callback(messages);
    },
    (error) => {
      console.error("❌ Firestore Chat Subscription Error:", error.message);
    }
  );
};

// ============ REAL-TIME BOOKINGS ============
export const subscribeToMechanicBookings = (
  mechanicId: string,
  callback: (bookings: Booking[]) => void
) => {
  const q = query(collection(db, 'bookings'), where('mechanicId', '==', mechanicId));
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Booking[];
    callback(bookings);
  });
};

export const subscribeToPendingBookings = (
  callback: (bookings: Booking[]) => void
) => {
  const q = query(collection(db, 'bookings'), where('status', '==', 'pending'));
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Booking[];
    callback(bookings);
  });
};

export const subscribeToBooking = (
  bookingId: string,
  callback: (booking: Booking | null) => void
) => {
  return onSnapshot(doc(db, 'bookings', bookingId), (snap) => {
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Booking) : null);
  });
};

// ============ INVENTORY ============
export const subscribeToInventory = (
  mechanicId: string,
  callback: (items: InventoryItem[]) => void
) => {
  const q = query(
    collection(db, 'inventory'),
    where('mechanicId', '==', mechanicId)
  );
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as InventoryItem[];
    callback(items);
  });
};

export const addInventoryItem = async (
  mechanicId: string,
  item: Omit<InventoryItem, 'id' | 'mechanicId' | 'updatedAt'>
): Promise<string> => {
  const cleaned = removeUndefined(item);
  const docRef = await addDoc(collection(db, 'inventory'), {
    ...cleaned,
    mechanicId,
    updatedAt: now(),
  });
  return docRef.id;
};

export const updateInventoryItem = async (
  itemId: string,
  updates: Partial<InventoryItem>
): Promise<void> => {
  const cleaned = removeUndefined(updates);
  await updateDoc(doc(db, 'inventory', itemId), {
    ...cleaned,
    updatedAt: now(),
  });
};

export const deleteInventoryItem = async (itemId: string): Promise<void> => {
  await deleteDoc(doc(db, 'inventory', itemId));
};

// ============ PAYMENTS ============
export const markBookingAsPaid = async (
  bookingId: string,
  transactionId: string,
  paymentMethod: string = 'card'
) => {
  await updateDoc(doc(db, 'bookings', bookingId), {
    paymentStatus: 'paid',
    transactionId,
    paymentMethod,
    paidAt: now(),
    updatedAt: now(),
  });
};

export const markBookingPaymentFailed = async (bookingId: string) => {
  await updateDoc(doc(db, 'bookings', bookingId), {
    paymentStatus: 'failed',
    updatedAt: now(),
  });
};

// ============ USER PROFILE MANAGEMENT ============
export const updateUserProfile = async (
  userId: string,
  data: Partial<User>
): Promise<void> => {
  const cleaned = removeUndefined(data);
  await updateDoc(doc(db, 'users', userId), {
    ...cleaned,
    updatedAt: now(),
  });
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// ============ PASSWORD MANAGEMENT ============
export const changeUserPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) {
    throw new Error('No user is currently logged in.');
  }

  const credential = EmailAuthProvider.credential(
    currentUser.email,
    currentPassword
  );
  await reauthenticateWithCredential(currentUser, credential);
  await updatePassword(currentUser, newPassword);
};

export const sendUserPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

// ============ USER VEHICLES ============
export const getUserVehicles = async (userId: string): Promise<Vehicle[]> => {
  try {
    const q = query(collection(db, 'vehicles'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Vehicle[];
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
};

export const addUserVehicle = async (
  userId: string,
  vehicle: Omit<Vehicle, 'id'>
): Promise<string> => {
  const cleaned = removeUndefined(vehicle);
  const docRef = await addDoc(collection(db, 'vehicles'), {
    ...cleaned,
    userId,
    createdAt: now(),
  });
  return docRef.id;
};

export const updateUserVehicle = async (
  vehicleId: string,
  data: Partial<Vehicle>
): Promise<void> => {
  const cleaned = removeUndefined(data);
  await updateDoc(doc(db, 'vehicles', vehicleId), {
    ...cleaned,
    updatedAt: now(),
  });
};

export const deleteUserVehicle = async (vehicleId: string): Promise<void> => {
  await deleteDoc(doc(db, 'vehicles', vehicleId));
};

// ============ ADMIN FUNCTIONS ============
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as User));
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};

export const toggleUserStatus = async (userId: string, isActive: boolean): Promise<void> => {
  await updateDoc(doc(db, 'users', userId), { isActive });
};

export const getAllBookingsAdmin = async (): Promise<Booking[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'bookings'));
    const bookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
    return bookings.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    return [];
  }
};

export const getAllInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'inventory'));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryItem));
  } catch (error) {
    console.error('Error fetching all inventory:', error);
    return [];
  }
};

export const updateUserAccountStatus = async (
  userId: string,
  status: 'active' | 'suspended' | 'blocked',
  reason: string = '',
  daysToSuspend: number = 0
): Promise<void> => {
  const data: any = {
    accountStatus: status,
    statusReason: reason,
    isActive: status === 'active', 
  };

  if (status === 'suspended' && daysToSuspend > 0) {
    const until = new Date();
    until.setDate(until.getDate() + daysToSuspend);
    data.suspendUntil = until.toISOString();
  } else {
    data.suspendUntil = null; 
  }

  await updateDoc(doc(db, 'users', userId), data);
};

export const deleteUserAccount = async (userId: string, role: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId));
    if (role === 'mechanic') {
      await deleteDoc(doc(db, 'mechanics', userId));
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// ✅ BAGONG DAGDAG PARA SA IMGBB UPLOAD
export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    //API NG IMAGE UPLOAD
    // ⚠️ PALITAN ITO NG API KEY MO GALING SA IMGBB.COM
    const IMGBB_API_KEY = '18181ce218f2f62e972e050b1c5eec1e'; 
    
    //IMAGE
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    if (!data.success) throw new Error('ImgBB upload failed');

    const downloadURL = data.data.url;
    
    // I-save ang URL sa Firestore users collection
    await updateDoc(doc(db, 'users', userId), { profileImage: downloadURL });
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};