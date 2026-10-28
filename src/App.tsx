// src/App.tsx
import React from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact, IonSpinner } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import CustomerTabs from './pages/customer/CustomerTabs';
import MechanicTabsLayout from './pages/mechanic/MechanicTabsLayout';
import AdminTabs from './pages/admin/AdminTabs';

setupIonicReact();

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <IonApp>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <IonSpinner name="crescent" />
        </div>
      </IonApp>
    );
  }

  const getDefaultRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'customer': return '/customer/home';
      case 'mechanic': return '/mechanic/dashboard';
      case 'admin': return '/admin/users';
      default: return '/login';
    }
  };

  return (
    <IonReactRouter>
      <IonRouterOutlet>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <LoginPage />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <RegisterPage />
        } />

        {/* Customer Routes (Tabs) */}
        <Route path="/customer/*" element={
          isAuthenticated && user?.role === 'customer'
            ? <CustomerTabs />
            : <Navigate to="/login" replace />
        } />

        {/* Mechanic Routes */}
        <Route path="/mechanic/*" element={
          isAuthenticated && user?.role === 'mechanic'
            ? <MechanicTabsLayout />
            : <Navigate to="/login" replace />
        } />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          isAuthenticated && user?.role === 'admin'
            ? <AdminTabs />
            : <Navigate to="/login" replace />
        } />
        
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </IonRouterOutlet>
    </IonReactRouter>
  );
};

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </AuthProvider>
  </IonApp>
);

export default App;