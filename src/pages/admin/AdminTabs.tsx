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
  logOutOutline, // ✅ IDINAGDAG PARA SA LOGOUT ICON
} from 'ionicons/icons';
import { useAuth } from '../../context/AuthContext'; // ✅ IDINAGDAG

import AdminUsers from './AdminUsers';
import AdminBookings from './AdminBookings';
import AdminReports from './AdminReports';
import AdminNotifications from './AdminNotifications';

const AdminTabs: React.FC = () => {
  const { logout } = useAuth(); // ✅ IDINAGDAG
  const navigate = useNavigate(); // ✅ IDINAGDAG

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
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

        {/* ✅ ITO ANG LOGOUT TAB BUTTON */}
        <IonTabButton tab="logout" onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <IonIcon icon={logOutOutline} color="danger" />
          <IonLabel color="danger">Logout</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default AdminTabs;