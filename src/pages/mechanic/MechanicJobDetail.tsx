// src/pages/mechanic/MechanicJobDetail.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonSpinner,
  IonAlert,
  IonToast,
  IonButton,
} from '@ionic/react';
import {
  arrowBackOutline,
  constructOutline,
  locationOutline,
  carSportOutline,
  documentTextOutline,
  chatbubbleOutline,
  cashOutline,
  checkmarkCircleOutline,
  closeOutline,
  radioButtonOn,
  radioButtonOff,
} from 'ionicons/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToBooking,
  updateBookingStatus,
  acceptBooking,
  rejectBooking,
  updateMechanicLiveLocation,
} from '../../api/firebaseService';
import { Booking, BookingStatus } from '../../types';
import InteractiveMap from '../../components/InteractiveMap';
import './MechanicJobDetail.css';

const MechanicJobDetail: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [showCompleteAlert, setShowCompleteAlert] = useState(false);
  const [showRejectAlert, setShowRejectAlert] = useState(false);
  
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  
  const watchIdRef = useRef<number | null>(null);
  const [toast, setToast] = useState({
    show: false,
    msg: '',
    color: 'success',
  });

  useEffect(() => {
    if (!jobId) return;

    setIsLoading(true);
    const unsubscribe = subscribeToBooking(jobId, (data) => {
      if (data) {
        setBooking(data);
      } else {
        setBooking(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [jobId]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleStatusChange = async (status: BookingStatus) => {
    if (!jobId || booking?.status === status || isUpdating) return;
    setIsUpdating(true);
    try {
      await updateBookingStatus(jobId, status);
      setToast({ show: true, msg: `Status updated to ${status}`, color: 'success' });
    } catch (e) {
      console.error(e);
      setToast({ show: true, msg: 'Update failed', color: 'danger' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !booking || isUpdating) return;
    setIsUpdating(true);
    try {
      await acceptBooking(booking.id, user.id, user.fullName || 'Mechanic');
      setToast({ show: true, msg: 'Job accepted', color: 'success' });
    } catch (e) {
      console.error(e);
      setToast({ show: true, msg: 'Accept failed', color: 'danger' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!jobId || isUpdating) return;
    setIsUpdating(true);
    try {
      await rejectBooking(jobId);
      setToast({ show: true, msg: 'Job rejected', color: 'warning' });
      navigate('/mechanic/jobs');
    } catch (e) {
      console.error(e);
      setToast({ show: true, msg: 'Reject failed', color: 'danger' });
    } finally {
      setIsUpdating(false);
      setShowRejectAlert(false);
    }
  };

  const toggleLocationSharing = () => {
    if (!booking) return;

    if (isSharingLocation) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsSharingLocation(false);
      setToast({ show: true, msg: 'Location sharing stopped', color: 'medium' });
      return;
    }

    if (!navigator.geolocation) {
      setToast({ show: true, msg: 'Geolocation not supported', color: 'danger' });
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await updateMechanicLiveLocation(booking.id, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        } catch (e) {
          console.error('Location update failed:', e);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setToast({
          show: true,
          msg: 'Unable to get location. Allow GPS access.',
          color: 'danger',
        });
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    setIsSharingLocation(true);
    setToast({ show: true, msg: 'Sharing live location', color: 'success' });
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="job-detail">
          <div className="mech-center">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!booking) {
    return (
      <IonPage>
        <IonContent className="job-detail">
          <div className="mech-center" style={{ flexDirection: 'column', gap: 12 }}>
            <p style={{ color: '#6b7280' }}>Job not found.</p>
            <IonButton onClick={() => navigate('/mechanic/jobs')}>
              Back to Jobs
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="job-detail" fullscreen>
        <div className="job-detail-header">
          <div className="header-top">
            <button className="job-back" onClick={() => navigate('/mechanic/jobs')}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <div className="job-detail-title">
              <h1>
                {booking.serviceType === 'repair'
                  ? 'Repair Service'
                  : 'Roadside Assistance'}
              </h1>
              <p>#{booking.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <span className={`job-status-badge ${booking.status}`}>
              {booking.status.replace('-', ' ')}
            </span>
          </div>
        </div>

        {/* Customer */}
        <div className="job-section">
          <h2>Customer</h2>
          <div className="job-card">
            <div className="job-customer">
              <div className="job-customer-avatar">
                {booking.customerName?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div className="job-customer-info">
                <h3>{booking.customerName || 'Customer'}</h3>
                <p>{booking.customerPhone || 'No phone'}</p>
              </div>
              <button
                className="job-icon-btn"
                onClick={() => navigate(`/mechanic/chat/${booking.id}`)}
              >
                <IonIcon icon={chatbubbleOutline} />
              </button>
            </div>
          </div>
        </div>

        {/* Vehicle */}
        <div className="job-section">
          <h2>Vehicle</h2>
          <div className="job-card">
            <div className="job-info-row">
              <IonIcon icon={carSportOutline} />
              <span>
                {booking.vehicle?.make} {booking.vehicle?.model} ({booking.vehicle?.year})
              </span>
            </div>
            <div className="job-info-row">
              <IonIcon icon={documentTextOutline} />
              <span>
                {booking.vehicle?.plateNumber} • {booking.vehicle?.color}
              </span>
            </div>
          </div>
        </div>

        {/* Issue */}
        <div className="job-section">
          <h2>Issue Description</h2>
          <div className="job-card">
            <p className="job-desc">{booking.issueDescription}</p>
          </div>
        </div>

        {/* Location */}
        <div className="job-section">
          <h2>Customer Location</h2>
          <div className="job-card">
            <div className="job-info-row">
              <IonIcon icon={locationOutline} />
              <span>{booking.location?.address || 'No address provided'}</span>
            </div>
          </div>
          {booking.location && booking.location.latitude !== 0 && (
            <div style={{ marginTop: 12 }}>
              <InteractiveMap
                latitude={booking.location.latitude}
                longitude={booking.location.longitude}
                draggable={false}
                height="180px"
                zoom={16}
              />
            </div>
          )}
        </div>

        {/* Price (Display Only) */}
        <div className="job-section">
          <h2>Service Fee</h2>
          <div className="job-card job-price-card">
            <div className="job-info-row">
              <IonIcon icon={cashOutline} />
              <span className="job-price">
                {booking.price > 0 ? `₱${booking.price.toLocaleString()}` : 'TBD'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="job-actions-section">
          {booking.status === 'pending' && (
            <div className="action-row">
              <button 
                className="job-action-btn danger" 
                onClick={() => setShowRejectAlert(true)}
                disabled={isUpdating}
              >
                <IonIcon icon={closeOutline} />
                Reject
              </button>
              <button 
                className="job-action-btn primary" 
                onClick={handleAccept}
                disabled={isUpdating}
              >
                {isUpdating ? <IonSpinner name="crescent" /> : <IonIcon icon={checkmarkCircleOutline} />}
                Accept
              </button>
            </div>
          )}

          {booking.status === 'accepted' && (
            <>
              <button
                className={`job-action-btn ${isSharingLocation ? 'sharing' : 'secondary'}`}
                onClick={toggleLocationSharing}
              >
                <IonIcon icon={isSharingLocation ? radioButtonOn : radioButtonOff} />
                {isSharingLocation ? 'Stop Sharing Location' : 'Share Live Location'}
              </button>
              <button
                className="job-action-btn primary"
                onClick={() => handleStatusChange('in-progress')}
                disabled={isUpdating}
              >
                {isUpdating ? <IonSpinner name="crescent" /> : <IonIcon icon={constructOutline} />}
                Start Job (In Progress)
              </button>
            </>
          )}

          {booking.status === 'in-progress' && (
            <>
              <button
                className={`job-action-btn ${isSharingLocation ? 'sharing' : 'secondary'}`}
                onClick={toggleLocationSharing}
              >
                <IonIcon icon={isSharingLocation ? radioButtonOn : radioButtonOff} />
                {isSharingLocation ? 'Stop Sharing Location' : 'Share Live Location'}
              </button>
              <button
                className="job-action-btn success"
                onClick={() => setShowCompleteAlert(true)}
                disabled={isUpdating}
              >
                {isUpdating ? <IonSpinner name="crescent" /> : <IonIcon icon={checkmarkCircleOutline} />}
                Mark as Completed
              </button>
            </>
          )}

          {booking.status === 'completed' && (
            <div className="job-completed-note">
              ✅ Job completed on{' '}
              {booking.updatedAt
                ? new Date(booking.updatedAt).toLocaleString()
                : 'N/A'}
            </div>
          )}
        </div>

        <IonAlert
          isOpen={showCompleteAlert}
          onDidDismiss={() => setShowCompleteAlert(false)}
          header="Complete Job"
          message="Mark this job as completed?"
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { 
              text: 'Yes', 
              handler: () => {
                setShowCompleteAlert(false);
                handleStatusChange('completed');
              } 
            },
          ]}
        />

        <IonAlert
          isOpen={showRejectAlert}
          onDidDismiss={() => setShowRejectAlert(false)}
          header="Reject Job"
          message="Are you sure you want to reject this job?"
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { 
              text: 'Reject', 
              role: 'destructive', 
              handler: () => {
                setShowRejectAlert(false);
                handleReject();
              } 
            },
          ]}
        />

        <IonToast
          isOpen={toast.show}
          onDidDismiss={() => setToast({ ...toast, show: false })}
          message={toast.msg}
          duration={2500}
          color={toast.color}
        />
      </IonContent>
    </IonPage>
  );
};

export default MechanicJobDetail;