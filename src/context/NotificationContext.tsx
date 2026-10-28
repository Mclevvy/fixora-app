// src/context/NotificationContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { Preferences } from '@capacitor/preferences';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from 'firebase/firestore';
import { IonToast } from '@ionic/react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import {
  Booking,
  ChatMessage,
  BookingStatus,
  AppNotification,
} from '../types';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  latestToast: AppNotification | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [latestToast, setLatestToast] = useState<AppNotification | null>(null);

  // Track previous state to avoid notifying on initial load
  const prevStatusesRef = useRef<Record<string, BookingStatus>>({});
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const isInitialBookingsLoadRef = useRef(true);
  const isInitialChatLoadRef = useRef(true);
  const prevBookingDataRef = useRef<Record<string, Booking>>({});

  // Load persisted notifications on user change
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const load = async () => {
      const { value } = await Preferences.get({
        key: `notifications_${user.id}`,
      });
      if (value) {
        try {
          const parsed = JSON.parse(value) as AppNotification[];
          setNotifications(parsed);
        } catch (e) {
          console.error('Failed to parse notifications:', e);
        }
      }
    };
    load();
  }, [user?.id]);

  // Persist notifications
  const persistNotifications = async (items: AppNotification[]) => {
    if (!user) return;
    await Preferences.set({
      key: `notifications_${user.id}`,
      value: JSON.stringify(items.slice(0, 50)),
    });
  };

  const addNotification = (n: AppNotification) => {
    setNotifications((prev) => {
      const updated = [n, ...prev].slice(0, 50);
      persistNotifications(updated);
      return updated;
    });
    setLatestToast(n);
  };

  // ==================
  // Listen to booking changes
  // ==================
  useEffect(() => {
    if (!user || user.role !== 'customer') return;

    const q = query(
      collection(db, 'bookings'),
      where('customerId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // First load: store data without notifying
      if (isInitialBookingsLoadRef.current) {
        snapshot.docs.forEach((d) => {
          const data = d.data() as Booking;
          const booking: Booking = { ...data, id: d.id };
          prevStatusesRef.current[d.id] = data.status;
          prevBookingDataRef.current[d.id] = booking;
        });
        isInitialBookingsLoadRef.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        const bookingId = change.doc.id;
        const data = change.doc.data() as Booking;
        const booking: Booking = { ...data, id: bookingId };

        if (change.type === 'added') {
          // New booking created - just track it, no notification needed
          prevStatusesRef.current[bookingId] = data.status;
          prevBookingDataRef.current[bookingId] = booking;
          return;
        }

        if (change.type === 'modified') {
          const prevStatus = prevStatusesRef.current[bookingId];
          const newStatus = data.status;

          // Status change notifications
          if (prevStatus !== newStatus) {
            const notification = buildStatusNotification(booking, newStatus);
            if (notification) {
              addNotification(notification);
            }
          }

          // Mechanic assigned (mechanicId newly added)
          const prevBooking = prevBookingDataRef.current[bookingId];
          if (
            !prevBooking?.mechanicId &&
            booking.mechanicId &&
            booking.mechanicName
          ) {
            addNotification({
              id: `assigned_${bookingId}_${Date.now()}`,
              type: 'booking_accepted',
              title: 'Mechanic Assigned',
              message: `${booking.mechanicName} is now assigned to your booking.`,
              bookingId,
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          }

          // Payment success notification
          if (
            prevBooking?.paymentStatus !== 'paid' &&
            booking.paymentStatus === 'paid'
          ) {
            addNotification({
              id: `payment_${bookingId}_${Date.now()}`,
              type: 'payment_success',
              title: 'Payment Successful',
              message: `Your payment of ₱${booking.price.toLocaleString()} has been confirmed.`,
              bookingId,
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          }

          prevStatusesRef.current[bookingId] = newStatus;
          prevBookingDataRef.current[bookingId] = booking;
        }
      });
    });

    return () => unsubscribe();
  }, [user?.id]);

    // ==================
  // Listen to chat messages (to customer)
  // ==================
  useEffect(() => {
    if (!user || user.role !== 'customer') return;

    // ✅ TINANGGAL ANG orderBy AT limit PARA HINDI MAG-ERROR SA FIREBASE INDEX
    const q = query(
      collection(db, 'chats'),
      where('receiverId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isInitialChatLoadRef.current) {
        snapshot.docs.forEach((d) => {
          seenMessageIdsRef.current.add(d.id);
        });
        isInitialChatLoadRef.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const msgId = change.doc.id;
          if (seenMessageIdsRef.current.has(msgId)) return;
          seenMessageIdsRef.current.add(msgId);

          const msg: ChatMessage = { ...change.doc.data(), id: msgId } as ChatMessage;
          addNotification({
            id: `chat_${msgId}`,
            type: 'chat_message',
            title: 'New Message',
            message:
              msg.message.length > 60
                ? msg.message.substring(0, 60) + '...'
                : msg.message,
            bookingId: msg.bookingId,
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      });
    });

    return () => unsubscribe();
  }, [user?.id]);

  const buildStatusNotification = (
    booking: Booking,
    newStatus: BookingStatus
  ): AppNotification | null => {
    const nowIso = new Date().toISOString();
    const mechanicName = booking.mechanicName || 'Your mechanic';

    switch (newStatus) {
      case 'accepted':
        return {
          id: `status_${booking.id}_${nowIso}`,
          type: 'booking_accepted',
          title: 'Booking Accepted',
          message: `${mechanicName} has accepted your booking and is preparing to assist you.`,
          bookingId: booking.id,
          isRead: false,
          createdAt: nowIso,
        };
      case 'in-progress':
        return {
          id: `status_${booking.id}_${nowIso}`,
          type: 'mechanic_arriving',
          title: 'Mechanic On The Way',
          message: `${mechanicName} is now en route to your location.`,
          bookingId: booking.id,
          isRead: false,
          createdAt: nowIso,
        };
      case 'completed':
        return {
          id: `status_${booking.id}_${nowIso}`,
          type: 'booking_completed',
          title: 'Service Completed',
          message: `${mechanicName} has completed your service. Please rate your experience.`,
          bookingId: booking.id,
          isRead: false,
          createdAt: nowIso,
        };
      case 'cancelled':
        return {
          id: `status_${booking.id}_${nowIso}`,
          type: 'booking_cancelled',
          title: 'Booking Cancelled',
          message: `Your booking has been cancelled.`,
          bookingId: booking.id,
          isRead: false,
          createdAt: nowIso,
        };
      default:
        return null;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      persistNotifications(updated);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      persistNotifications(updated);
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    persistNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        latestToast,
      }}
    >
      {children}

      {/* Global Toast */}
      <IonToast
        isOpen={!!latestToast}
        onDidDismiss={() => setLatestToast(null)}
        message={latestToast ? latestToast.title : ''}
        duration={3500}
        position="top"
        color="success"
        buttons={[
          {
            text: 'OK',
            role: 'cancel',
            handler: () => setLatestToast(null),
          },
        ]}
      />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      'useNotifications must be used within NotificationProvider'
    );
  }
  return ctx;
};