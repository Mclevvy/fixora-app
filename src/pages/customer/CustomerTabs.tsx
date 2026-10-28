// src/pages/customer/CustomerTabs.tsx
import React from 'react';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
} from '@ionic/react';
import { Route, Navigate } from 'react-router-dom';
import {
  homeOutline,
  calendarOutline,
  personOutline,
} from 'ionicons/icons';
import { useLocation } from 'react-router-dom';

import CustomerHome from './CustomerHome';
import CustomerBookings from './CustomerBookings';
import BookingDetail from './BookingDetail';
import BookService from './BookService';
import CustomerChat from './CustomerChat';
import CustomerProfile from './CustomerProfile';
import Notifications from './Notifications';
import TrackMechanic from './TrackMechanic';
import ReviewPage from './ReviewPage'; // ✅ Nandito na
import CustomerMechanicDetail from './CustomerMechanicDetail';
import '../UserPages.css';

const CustomerTabs: React.FC = () => {
  const location = useLocation();
  const isMechanicDetail = location.pathname.startsWith('/customer/mechanic/');

  return (
    <IonTabs>
      <IonRouterOutlet>
        {/* Main tabs */}
        <Route path="/customer/home" element={<CustomerHome />} />
        <Route path="/customer/bookings" element={<CustomerBookings />} />
        <Route path="/customer/profile" element={<CustomerProfile />} />

        {/* Sub-pages */}
        <Route path="/customer/book" element={<BookService />} />
        <Route path="/customer/booking/:bookingId" element={<BookingDetail />} />
        <Route path="/customer/chat" element={<CustomerChat />} />
        <Route path="/customer/chat/:bookingId" element={<CustomerChat />} />
        <Route path="/customer/notifications" element={<Notifications />} />
        <Route path="/customer/track/:bookingId" element={<TrackMechanic />} />
        
        {/* ✅ ITO ANG KULANG NA ROUTE PARA SA REVIEW */}
        <Route path="/customer/review/:bookingId" element={<ReviewPage />} />
        <Route path="/customer/mechanic/:mechanicId" element={<CustomerMechanicDetail />} />

        <Route path="/customer" element={<Navigate to="/customer/home" replace />} />
      </IonRouterOutlet>

      {!isMechanicDetail && (
        <IonTabBar className="customer-tab-bar" slot="bottom">
          <IonTabButton tab="home" href="/customer/home">
            <IonIcon icon={homeOutline} />
            <IonLabel>Home</IonLabel>
          </IonTabButton>

          <IonTabButton tab="bookings" href="/customer/bookings">
            <IonIcon icon={calendarOutline} />
            <IonLabel>Bookings</IonLabel>
          </IonTabButton>

          <IonTabButton tab="profile" href="/customer/profile">
            <IonIcon icon={personOutline} />
            <IonLabel>Profile</IonLabel>
          </IonTabButton>
        </IonTabBar>
      )}
    </IonTabs>
  );
};

export default CustomerTabs;