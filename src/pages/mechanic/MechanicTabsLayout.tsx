// src/pages/mechanic/MechanicTabsLayout.tsx
import React, { useEffect, useRef, useState } from 'react';
import { IonTabs, IonRouterOutlet, IonToast } from '@ionic/react';
import { Route, Navigate } from 'react-router-dom';
import MechanicTabs from '../../components/MechanicTabs';
import MechanicDashboard from './MechanicDashboard';
import MechanicJobs from './MechanicJobs';
import MechanicJobDetail from './MechanicJobDetail';
import MechanicInventory from './MechanicInventory';
import MechanicProfile from './MechanicProfile';
import MechanicChat from './MechanicChat'; // ✅ IDINAGDAG ANG TOTOONG CHAT COMPONENT
import '../UserPages.css';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToMechanicBookings,
  updateMechanicLiveLocation,
} from '../../api/firebaseService';

const MechanicTabsLayout: React.FC = () => {
  const { user } = useAuth();
  const watchIdRef = useRef<number | null>(null);
  const [activeJobIds, setActiveJobIds] = useState<string[]>([]);
  const [showGpsToast, setShowGpsToast] = useState(false);
  const [gpsToastMsg, setGpsToastMsg] = useState('');
  const [gpsToastColor, setGpsToastColor] = useState('success');
  const [permissionAsked, setPermissionAsked] = useState(false);

  // ✅ Subscribe sa active jobs ng mechanic
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToMechanicBookings(user.id, (bookings) => {
      const activeIds = bookings
        .filter((b) => b.status === 'accepted' || b.status === 'in-progress')
        .map((b) => b.id);
      setActiveJobIds(activeIds);
    });
    return () => unsub();
  }, [user]);

  // ✅ Auto-start GPS kapag may active job
  useEffect(() => {
    // Walang active job → itigil ang watch
    if (activeJobIds.length === 0) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        console.log('🛑 Auto-track stopped (no active jobs)');
      }
      return;
    }

    // Naka-watch na → huwag i-duplicate
    if (watchIdRef.current !== null) return;

    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    // Start GPS watch
    console.log('🟢 Auto-track starting for', activeJobIds.length, 'job(s)');
    setGpsToastMsg('Live tracking active');
    setGpsToastColor('success');
    setShowGpsToast(true);
    setPermissionAsked(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // I-save sa lahat ng active bookings
        for (const bookingId of activeJobIds) {
          try {
            await updateMechanicLiveLocation(bookingId, { latitude, longitude });
            console.log(`📍 Location saved for booking ${bookingId.slice(0, 6)}`);
          } catch (e) {
            console.error('Location save failed:', e);
          }
        }
      },
      (error) => {
        console.error('GPS error:', error);
        let msg = 'GPS unavailable';
        if (error.code === 1) msg = 'Allow GPS to enable live tracking';
        else if (error.code === 2) msg = 'GPS signal not found';
        else if (error.code === 3) msg = 'GPS timeout';
        setGpsToastMsg(msg);
        setGpsToastColor('danger');
        setShowGpsToast(true);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );

    // Cleanup
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJobIds.join(','), user?.id]);

  // Cleanup kapag umalis sa app
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <>
      <IonTabs>
        <IonRouterOutlet>
          <Route path="/mechanic/dashboard" element={<MechanicDashboard />} />
          <Route path="/mechanic/jobs" element={<MechanicJobs />} />
          <Route path="/mechanic/job/:jobId" element={<MechanicJobDetail />} />
          
          {/* ✅ PINALITAN NA NG TOTOONG CHAT COMPONENT */}
          <Route path="/mechanic/chat/:bookingId" element={<MechanicChat />} />
          
          <Route path="/mechanic/inventory" element={<MechanicInventory />} />
          <Route path="/mechanic/profile" element={<MechanicProfile />} />
          <Route
            path="/mechanic"
            element={<Navigate to="/mechanic/dashboard" replace />}
          />
        </IonRouterOutlet>
        <MechanicTabs />
      </IonTabs>

      {/* Toast notification kapag auto-track active */}
      <IonToast
        isOpen={showGpsToast}
        onDidDismiss={() => setShowGpsToast(false)}
        message={gpsToastMsg}
        duration={2500}
        color={gpsToastColor}
        position="top"
      />
    </>
  );
};

export default MechanicTabsLayout;