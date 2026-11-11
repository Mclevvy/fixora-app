// src/pages/admin/AdminTabs.tsx
import React from 'react';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
} from '@ionic/react';
import { Route, Navigate, useNavigate } from 'react-router-dom';
import {
  peopleOutline,
  calendarOutline,
  barChartOutline,
  notificationsOutline,
  logOutOutline, 
} from 'ionicons/icons';
import { useAuth } from '../../context/AuthContext'; 

import AdminUsers from './AdminUsers';
import AdminBookings from './AdminBookings';
import AdminReports from './AdminReports';
import AdminNotifications from './AdminNotifications';
import AdminBookingDetail from './AdminBookingDetail'; // ✅ IMPORT NG BAGONG FILE

const AdminTabs: React.FC = () => {
  const { logout } = useAuth(); 
  const navigate = useNavigate(); 

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        {/* ✅ BAGONG ROUTE PARA SA DETAILS */}
        <Route path="/admin/bookings/:bookingId" element={<AdminBookingDetail />} />
        
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
        <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="users" href="/admin/users">
          <IonIcon icon={peopleOutline} />
          <IonLabel>Users</IonLabel>
        </IonTabButton>

        <IonTabButton tab="bookings" href="/admin/bookings">
          <IonIcon icon={calendarOutline} />
          <IonLabel>Bookings</IonLabel>
        </IonTabButton>

        <IonTabButton tab="reports" href="/admin/reports">
          <IonIcon icon={barChartOutline} />
          <IonLabel>Reports</IonLabel>
        </IonTabButton>

        <IonTabButton tab="notifications" href="/admin/notifications">
          <IonIcon icon={notificationsOutline} />
          <IonLabel>Alerts</IonLabel>
        </IonTabButton>

        <IonTabButton tab="logout" onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <IonIcon icon={logOutOutline} color="danger" />
          <IonLabel color="danger">Logout</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default AdminTabs;