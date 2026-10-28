// src/pages/customer/CustomerMechanicDetail.tsx
import React, { useState, useEffect } from 'react';
import {
  IonContent, IonPage, IonIcon, IonSpinner, IonButton, IonToast, useIonRouter,
} from '@ionic/react';
import {
  arrowBackOutline, star, locationOutline, constructOutline, checkmarkCircle,
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
    if (!selectedService || !mechanic) {
      setShowToast(true);
      return;
    }
    router.push(`/customer/book?mechanic=${mechanic.id}&serviceId=${selectedService.id}`, 'forward', 'push');
  };

  /// ✅ Idinagdag lang ang blur() para mawala ang "Blocked aria-hidden" warning
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
              <div className={`status-badge ${mechanic.status}`}>{mechanic.status.toUpperCase()}</div>
            </div>
          </div>

          <div className="detail-section">
            <h2 className="detail-section-title">Select a Service</h2>
            {mechanic.services && mechanic.services.length > 0 ? (
              <div className="services-list">
                {mechanic.services.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <div key={service.id} className={`service-item ${isSelected ? 'active' : ''}`} onClick={() => setSelectedService(service)}>
                      <div className="service-icon"><IonIcon icon={constructOutline} /></div>
                      <div className="service-info">
                        <h3>{service.name}</h3>
                        <p>Fixed Price</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="service-price">₱{service.price}</div>
                        {isSelected && (<IonIcon icon={checkmarkCircle} style={{ color: '#0ea5e9', fontSize: '24px' }} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-card"><p>No services listed yet.</p></div>
            )}
          </div>

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
            <button className="book-now-btn-full" onClick={handleBookNow} style={{ opacity: !selectedService ? 0.7 : 1 }}>
              {mechanic.status !== 'available' ? 'Currently Offline' : !selectedService ? 'Select a Service First' : 'Book Now'}
            </button>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Please select a service first."
          duration={2000}
          color="warning"
        />
      </IonContent>
    </IonPage>
  );
};

export default CustomerMechanicDetail;