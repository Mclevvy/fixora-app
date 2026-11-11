// src/pages/customer/CustomerMechanicDetail.tsx
import React, { useState, useEffect } from 'react';
import {
  IonContent, IonPage, IonIcon, IonSpinner, IonButton, IonToast, useIonRouter,
} from '@ionic/react';
import {
  arrowBackOutline, star, locationOutline, constructOutline, checkmarkCircle, timeOutline,
} from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { getAllMechanics } from '../../api/firebaseService';
import { Mechanic, ServiceItem } from '../../types';
import InteractiveMap from '../../components/InteractiveMap';
import './CustomerMechanicDetail.css';

const CustomerMechanicDetail: React.FC = () => {
  const { mechanicId } = useParams<{ mechanicId: string }>();
  const router = useIonRouter();
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [distance, setDistance] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('warning');

  useEffect(() => {
    const fetchMechanic = async () => {
      try {
        const all = await getAllMechanics();
        const found = all.find((m) => m.id === mechanicId);
        if (found) {
          setMechanic(found);
          if (navigator.geolocation && found.location) {
            navigator.geolocation.getCurrentPosition((pos) => {
              const lat1 = pos.coords.latitude;
              const lon1 = pos.coords.longitude;
              const lat2 = found.location.latitude;
              const lon2 = found.location.longitude;
              if (lat2 && lon2) {
                const R = 6371;
                const dLat = (lat2 - lat1) * (Math.PI / 180);
                const dLon = (lon2 - lon1) * (Math.PI / 180);
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                setDistance((R * c).toFixed(1));
              }
            }, (err) => console.error(err));
          }
        }
      } catch (error) {
        console.error('Error fetching mechanic:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMechanic();
  }, [mechanicId]);

  const handleBookNow = () => {
    // ✅ CHECK KUNG NAKA-SUSPEND O BLOCKED
    if (mechanic?.accountStatus === 'suspended' || mechanic?.accountStatus === 'blocked') {
      setToastMessage(`This mechanic's account is currently ${mechanic.accountStatus}.`);
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (mechanic?.status !== 'available') {
      setToastMessage('This mechanic is currently offline or busy. You cannot book right now.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!selectedService || !mechanic) {
      setToastMessage('Please select a service first.');
      setToastColor('warning');
      setShowToast(true);
      return;
    }
    
    router.push(`/customer/book?mechanic=${mechanic.id}&serviceId=${selectedService.id}`, 'forward', 'push');
  };

  const handleBackToHome = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    router.push('/customer/home', 'root', 'replace');
  };

  if (isLoading) {
    return (
      <IonPage><IonContent className="detail-page">
        <div className="detail-center"><IonSpinner name="crescent" /></div>
      </IonContent></IonPage>
    );
  }

  if (!mechanic) {
    return (
      <IonPage><IonContent className="detail-page">
        <div className="detail-center">
          <p>Mechanic not found.</p>
          <IonButton onClick={handleBackToHome}>Go Back</IonButton>
        </div>
      </IonContent></IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="detail-page" fullscreen>
        <div className="detail-header">
          <button className="back-btn-detail" onClick={handleBackToHome}>
            <IonIcon icon={arrowBackOutline} />
          </button>
          <h1>Mechanic Profile</h1>
        </div>

        <div className="detail-sections-grid">
          <div className="detail-section">
            <div className="detail-card profile-header-card">
              <div className="profile-avatar-large">
                <img src={mechanic.profileImage || 'https://ionicframework.com/docs/img/demos/avatar.svg'} alt={mechanic.fullName} />
                <div className={`availability-dot ${mechanic.status}`} />
              </div>
              <h2>{mechanic.fullName}</h2>
              <p>{mechanic.specialization}</p>
              <div className="profile-stats-row">
                <div className="stat">
                  <IonIcon icon={star} style={{ color: '#f59e0b' }} />
                  <span>{mechanic.rating.toFixed(1)} ({mechanic.totalReviews})</span>
                </div>
                <div className="stat">
                  <IonIcon icon={locationOutline} style={{ color: '#0ea5e9' }} />
                  <span>{distance ? `${distance} km away` : 'Distance unknown'}</span>
                </div>
              </div>
              
              {/* ✅ BAGONG DAGDAG: STATUS AT MODERATION BADGES */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div className={`status-badge ${mechanic.status}`}>{mechanic.status.toUpperCase()}</div>
                {mechanic.accountStatus && mechanic.accountStatus !== 'active' && (
                  <div style={{ 
                    background: mechanic.accountStatus === 'blocked' ? '#fee2e2' : '#fef3c7', 
                    color: mechanic.accountStatus === 'blocked' ? '#991b1b' : '#92400e', 
                    padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 
                  }}>
                    {mechanic.accountStatus.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h2 className="detail-section-title">Select a Service</h2>
            {mechanic.services && mechanic.services.length > 0 ? (
              <div className="detail-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {mechanic.services.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <label 
                      key={service.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '14px', 
                        border: isSelected ? '2px solid #0ea5e9' : '1px solid #e5e7eb', 
                        borderRadius: '12px', 
                        cursor: 'pointer',
                        background: isSelected ? '#f0f9ff' : '#ffffff',
                        transition: 'all 0.2s ease',
                        opacity: (mechanic.status !== 'available' || mechanic.accountStatus === 'suspended' || mechanic.accountStatus === 'blocked') ? 0.6 : 1 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="radio"
                          name="serviceSelection"
                          checked={isSelected}
                          onChange={() => setSelectedService(service)}
                          disabled={mechanic.status !== 'available' || mechanic.accountStatus === 'suspended' || mechanic.accountStatus === 'blocked'} 
                          style={{ width: '20px', height: '20px', accentColor: '#0ea5e9', cursor: 'pointer' }}
                        />
                        <div>
                          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>{service.name}</h3>
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>Fixed Price</p>
                        </div>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#0ea5e9' }}>
                        ₱{service.price}
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="empty-card"><p>No services listed yet.</p></div>
            )}
          </div>

          {mechanic.schedule && (
            <div className="detail-section">
              <h2 className="detail-section-title">Work Schedule</h2>
              <div className="detail-card" style={{ padding: '16px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Working Days</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                    const isActive = mechanic.schedule?.days?.includes(day);
                    return (
                      <span key={day} style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: isActive ? '#0ea5e9' : '#f1f5f9',
                        color: isActive ? 'white' : '#94a3b8',
                      }}>
                        {day}
                      </span>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Start Time</p>
                    <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700, color: '#1f2937' }}>{mechanic.schedule.startTime || 'N/A'}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>End Time</p>
                    <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700, color: '#1f2937' }}>{mechanic.schedule.endTime || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mechanic.location && 
           typeof mechanic.location.latitude === 'number' && 
           !isNaN(mechanic.location.latitude) && 
           mechanic.location.latitude !== 0 && 
           typeof mechanic.location.longitude === 'number' && 
           !isNaN(mechanic.location.longitude) && (
            <div className="detail-section">
              <h2 className="detail-section-title">Base Location</h2>
              <div className="map-wrapper">
                <InteractiveMap latitude={mechanic.location.latitude} longitude={mechanic.location.longitude} draggable={false} height="200px" zoom={15} />
              </div>
            </div>
          )}

          <div className="detail-actions">
            <button 
              className="book-now-btn-full" 
              onClick={handleBookNow} 
              style={{ 
                opacity: (mechanic.accountStatus === 'suspended' || mechanic.accountStatus === 'blocked' || mechanic.status !== 'available') ? 0.6 : (!selectedService ? 0.7 : 1),
                cursor: (mechanic.accountStatus === 'suspended' || mechanic.accountStatus === 'blocked' || mechanic.status !== 'available') ? 'not-allowed' : 'pointer'
              }}
            >
              {/* ✅ DYNAMIC BUTTON TEXT */}
              {mechanic.accountStatus === 'blocked' ? 'Account Blocked' : 
               mechanic.accountStatus === 'suspended' ? 'Account Suspended' : 
               mechanic.status !== 'available' ? 'Currently Offline' : 
               !selectedService ? 'Select a Service First' : 'Book Now'}
            </button>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2500}
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default CustomerMechanicDetail;