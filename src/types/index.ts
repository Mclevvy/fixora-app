// src/types/index.ts
export type UserRole = 'customer' | 'mechanic' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  profileImage?: string;
  createdAt: string;
  isActive?: boolean;
  
  // ✅ BAGONG DAGDAG PARA SA ADMIN MODERATION
  accountStatus?: 'active' | 'suspended' | 'blocked';
  suspendUntil?: string; 
  statusReason?: string; 
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  color: string;
}

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

export type ServiceType = 'repair' | 'roadside';
export type ServiceCategory =
  | 'all'
  | 'repair'
  | 'roadside'
  | 'both'
  | 'maintenance'
  | 'electrical'
  | 'engine';

export type MechanicStatus = 'available' | 'busy' | 'offline';

export interface MechanicSchedule {
  days: string[];
  startTime: string;
  endTime: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
}

export interface Mechanic {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  profileImage?: string;
  specialization: string;
  specializations?: string[];
  category: ServiceCategory;
  status: MechanicStatus;
  accountStatus?: 'active' | 'suspended' | 'blocked'; // ✅ IDINAGDAG ITO
  rating: number;
  totalReviews: number;
  hourlyRate: number; 
  services?: ServiceItem[]; 
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  schedule?: MechanicSchedule;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerProfileImage?: string; // ✅ BAGONG DAGDAG PARA SA PROFILE PICTURE
  mechanicId?: string;
  mechanicName?: string;
  mechanicPhone?: string;
  serviceType: ServiceType;
  serviceName?: string;
  vehicle: Vehicle;
  issueDescription: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: BookingStatus;
  price: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paidAt?: string;
  transactionId?: string;
  paymentMethod?: string;
  mechanicLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  bookingId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  mechanicId: string;
  bookingId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  mechanicId: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  unit: string;
  lowStockThreshold: number;
  updatedAt: string;
}

export type NotificationType =
  | 'booking_accepted'
  | 'booking_in_progress'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'chat_message'
  | 'payment_success'
  | 'mechanic_arriving';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  bookingId?: string;
  isRead: boolean;
  createdAt: string;
}