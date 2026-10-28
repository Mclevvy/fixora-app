// src/pages/customer/TrackMechanic.tsx
import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonSpinner,
  IonButton,
} from '@ionic/react';
import {
  arrowBackOutline,
  chatbubbleOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  constructOutline,
  locationOutline, // ✅ IDINAGDAG
} from 'ionicons/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subscribeToBooking } from '../../api/firebaseService';
import { Booking, BookingStatus } from '../../types';
import InteractiveMap from '../../components/InteractiveMap';
import './TrackMechanic.css';

// ✅ HELPER PARA SA DISTANCE
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

const TrackMechanic: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;

    const unsubscribe = subscribeToBooking(bookingId, (data) => {
      setBooking(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [bookingId]);

  const getStatusInfo = (status?: BookingStatus) => {
    switch (status) {
      case 'accepted':
        return { text: 'On the way', eta: 'Est. 10-15 mins', cssClass: 'accepted', icon: timeOutline };
      case 'in-progress':
        return { text: 'Service in progress', eta: 'Mechanic is working', cssClass: 'in-progress', icon: constructOutline };
      case 'completed':
        return { text: 'Service Completed', eta: 'Done', cssClass: 'completed', icon: checkmarkCircleOutline };
      case 'cancelled':
        return { text: 'Cancelled', eta: 'Booking cancelled', cssClass: 'cancelled', icon: closeCircleOutline };
      default:
        return { text: 'Pending', eta: 'Waiting for mechanic', cssClass: 'pending', icon: timeOutline };
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="track-page">
          <div className="track-loading">
            <IonSpinner name="crescent" />
            <p style={{ marginTop: 12 }}>Loading tracking data...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!booking) {
    return (
      <IonPage>
        <IonContent className="track-page">
          <div className="track-loading">
            <h3>Booking not found</h3>
            <IonButton className="track-action-btn primary" onClick={() => navigate('/customer/bookings')} style={{ marginTop: 16 }}>
              Go Back
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const mechanicLoc = booking.mechanicLocation || {
    latitude: booking.location.latitude,
    longitude: booking.location.longitude,
  };

  // ✅ KALKULAHIN ANG LIVE DISTANCE
  const distance = booking.mechanicLocation 
    ? calculateDistance(
        booking.mechanicLocation.latitude, 
        booking.mechanicLocation.longitude,
        booking.location.latitude, 
        booking.location.longitude
      )
    : null;

  const statusInfo = getStatusInfo(booking.status);

  return (
    <IonPage>
      <IonContent className="track-page" fullscreen>
        <div className="track-map-container">
          <button className="track-back-btn" onClick={() => navigate('/customer/bookings')}>
            <IonIcon icon={arrowBackOutline} />
          </button>

          <InteractiveMap
            latitude={mechanicLoc.latitude}
            longitude={mechanicLoc.longitude}
            draggable={false}
            height="100%"
            zoom={16}
            secondaryLatitude={booking.location.latitude}
            secondaryLongitude={booking.location.longitude}
          />
        </div>

        <div className="track-info-card">
          <div className="track-header-row">
            <div className={`track-status-badge ${statusInfo.cssClass}`}>
              <span className="pulse-dot"></span>
              {statusInfo.text}
            </div>
            <div className="track-eta">
              <IonIcon icon={timeOutline} />
              <span>{statusInfo.eta}</span>
            </div>
          </div>

          <h2 className="track-mechanic-name">{booking.mechanicName || 'Mechanic'}</h2>
          <p className="track-vehicle-info">
            {booking.vehicle.make} {booking.vehicle.model} • {booking.serviceType === 'repair' ? 'Repair' : 'Roadside'}
          </p>

          {/* ✅ LIVE DISTANCE DISPLAY */}
          {distance && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', background: '#f0f9ff', padding: '8px 12px', borderRadius: '8px' }}>
              <IonIcon icon={locationOutline} style={{ color: '#0ea5e9', fontSize: '18px' }} />
              <span style={{ fontSize: '13px', color: '#0369a1', fontWeight: '600' }}>
                {distance} km away from you
              </span>
            </div>
          )}

          <div className="track-divider"></div>

          <div className="track-actions">
            <button 
              className="track-action-btn primary" 
              onClick={() => navigate(`/customer/chat/${booking.id}`)}
              style={{ 
                background: '#00b4d8', 
                boxShadow: '0 8px 20px -5px rgba(0, 180, 216, 0.4)' 
              }}
            >
              <IonIcon icon={chatbubbleOutline} />
              Chat with Mechanic
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TrackMechanic;