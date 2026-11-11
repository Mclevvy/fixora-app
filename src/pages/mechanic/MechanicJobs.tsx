// src/pages/mechanic/MechanicJobs.tsx
import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonToast,
} from '@ionic/react';
import {
  constructOutline,
  locationOutline,
  checkmarkOutline,
  closeOutline,
  playOutline,
  checkmarkDoneOutline,
  carSportOutline,
  documentTextOutline,
  timeOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToPendingBookings,
  subscribeToMechanicBookings,
  acceptBooking,
  updateBookingStatus,
} from '../../api/firebaseService';
import { Booking, BookingStatus } from '../../types';
import './MechanicJobs.css';

type FilterType = 'new' | 'active' | 'completed';

const MechanicJobs: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('new');
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('success');

  useEffect(() => {
    if (!user) return;

    const unsubPending = subscribeToPendingBookings((data) => {
      const unassigned = data.filter(
        (b) => !b.mechanicId && !dismissedIds.includes(b.id)
      );
      setPendingBookings(unassigned);
      setIsLoading(false);
    });

    const unsubMine = subscribeToMechanicBookings(user.id, (data) => {
      setMyBookings(data);
    });

    return () => {
      unsubPending();
      unsubMine();
    };
  }, [user, dismissedIds]);

  const handleAccept = async (e: React.MouseEvent, booking: Booking) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await acceptBooking(booking.id, user.id, user.fullName);
      showMessage('Job accepted successfully!', 'success');
      setFilter('active');
    } catch (error) {
      showMessage('Failed to accept job', 'danger');
    }
  };

  const handleReject = (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, bookingId]);
    showMessage('Job hidden from your list', 'warning');
  };

  const handleStatusUpdate = async (e: React.MouseEvent, bookingId: string, status: BookingStatus) => {
    e.stopPropagation();
    try {
      await updateBookingStatus(bookingId, status);
      showMessage(`Job marked as ${status}`, 'success');
    } catch (error) {
      showMessage('Failed to update status', 'danger');
    }
  };

  const showMessage = (msg: string, color: string) => {
    setToastMessage(msg);
    setToastColor(color);
    setShowToast(true);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const activeJobs = myBookings.filter((b) =>
    ['accepted', 'in-progress'].includes(b.status)
  );
  const completedJobs = myBookings.filter((b) => b.status === 'completed');
  
  const myPendingJobs = myBookings.filter((b) => b.status === 'pending');
  const newJobs = [...pendingBookings, ...myPendingJobs];

  const displayList =
    filter === 'new'
      ? newJobs
      : filter === 'active'
      ? activeJobs
      : completedJobs;

  const counts = {
    new: newJobs.length,
    active: activeJobs.length,
    completed: completedJobs.length,
  };
  
  return (
    <IonPage>
      <IonContent className="mech-dash" fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={(e) => e.detail.complete()}>
          <IonRefresherContent />
        </IonRefresher>

        {/* ✅ HEADER: Naka-left alignment at pinalitan ang text */}
        <div 
          className="mech-jobs-header" 
          style={{ 
            width: '100%', 
            padding: '24px 20px', 
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start' // Pilit na naka-align sa kaliwa
          }}
        >
          <h1 className="mech-name" style={{ margin: 0, fontSize: '28px', fontWeight: 800, textAlign: 'left' }}>
            Job Request Center
          </h1>
          <p className="mech-greeting" style={{ margin: '6px 0 0 0', fontSize: '14px', opacity: 0.9, lineHeight: 1.5, textAlign: 'left' }}>
            View, manage, and track all your submitted job requests in one place.
          </p>
        </div>

        <div 
          className="filter-tabs" 
          style={{ 
            width: '100%', 
            padding: '20px 20px 0 20px',
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '10px',
            boxSizing: 'border-box'
          }}
        >
          <div
            className={`filter-tab ${filter === 'new' ? 'active' : ''}`}
            onClick={() => setFilter('new')}
          >
            New <span className="filter-count">{counts.new}</span>
          </div>
          <div
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active <span className="filter-count">{counts.active}</span>
          </div>
          <div
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed <span className="filter-count">{counts.completed}</span>
          </div>
        </div>

        <div 
          className="mech-jobs-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
            width: '100%',
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          {isLoading ? (
            <div className="mech-center" style={{ height: '200px', gridColumn: '1 / -1' }}>
              <IonSpinner name="crescent" />
            </div>
          ) : displayList.length === 0 ? (
            <div className="mech-empty" style={{ gridColumn: '1 / -1' }}>
              <IonIcon icon={constructOutline} />
              <p>No {filter} jobs right now</p>
            </div>
          ) : (
            displayList.map((booking) => (
              <div 
                key={booking.id} 
                className="mech-job-card"
                onClick={() => navigate(`/mechanic/job/${booking.id}`)}
                style={{ cursor: 'pointer', width: '100%' }}
              >
                <div className="mech-job-card-header">
                  <div className="mech-job-type">
                    <div className="mech-job-icon" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {booking.customerProfileImage ? (
                        <img 
                          src={booking.customerProfileImage} 
                          alt={booking.customerName} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <IonIcon icon={carSportOutline} />
                      )}
                    </div>

                    <div className="mech-job-info">
                      <h4>{booking.customerName}</h4>
                      <p>{booking.vehicle.make} {booking.vehicle.model}</p>
                    </div>
                  </div>
                  <span className={`mech-job-status ${booking.status}`}>
                    {booking.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="mech-job-card-body">
                  <div className="mech-detail-row">
                    <IonIcon icon={locationOutline} />
                    <span>{booking.location.address}</span>
                  </div>
                  <div className="mech-detail-row">
                    <IonIcon icon={documentTextOutline} />
                    <span>"{booking.issueDescription}"</span>
                  </div>
                  <div className="mech-detail-row">
                    <IonIcon icon={timeOutline} />
                    <span>{formatDate(booking.createdAt)}</span>
                  </div>
                </div>

                <div className="mech-job-card-footer">
                  {booking.status === 'pending' && (
                    <>
                      <button className="action-btn danger" onClick={(e) => handleReject(e, booking.id)}>
                        <IonIcon icon={closeOutline} /> Reject
                      </button>
                      <button className="action-btn primary" onClick={(e) => handleAccept(e, booking)}>
                        <IonIcon icon={checkmarkOutline} /> Accept Job
                      </button>
                    </>
                  )}

                  {booking.status === 'accepted' && (
                    <button className="action-btn primary" onClick={(e) => handleStatusUpdate(e, booking.id, 'in-progress')}>
                      <IonIcon icon={playOutline} /> Start Job
                    </button>
                  )}

                  {booking.status === 'in-progress' && (
                    <button className="action-btn success" onClick={(e) => handleStatusUpdate(e, booking.id, 'completed')}>
                      <IonIcon icon={checkmarkDoneOutline} /> Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
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

export default MechanicJobs;