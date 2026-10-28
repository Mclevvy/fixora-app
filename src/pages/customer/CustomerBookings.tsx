// src/pages/customer/CustomerBookings.tsx
import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonAlert,
  IonToast,
} from '@ionic/react';
import {
  constructOutline,
  carSportOutline,
  locationOutline,
  timeOutline,
  documentTextOutline,
  calendarOutline,
  starOutline,
  closeOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCustomerBookings, updateBookingStatus } from '../../api/firebaseService';
import { Booking, BookingStatus } from '../../types';
import './CustomerBookings.css';

type FilterType = 'all' | 'active' | 'completed' | 'cancelled';

const CustomerBookings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('danger');
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');

  useEffect(() => {
    if (user) loadBookings();
  }, [user]);

  useEffect(() => {
    applyFilter();
  }, [activeFilter, bookings]);

  const loadBookings = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getCustomerBookings(user.id);
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...bookings];

    switch (activeFilter) {
      case 'active':
        filtered = filtered.filter((b) =>
          ['pending', 'accepted', 'in-progress'].includes(b.status)
        );
        break;
      case 'completed':
        filtered = filtered.filter((b) => b.status === 'completed');
        break;
      case 'cancelled':
        filtered = filtered.filter((b) => b.status === 'cancelled');
        break;
      default:
        break;
    }

    setFilteredBookings(filtered);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadBookings();
    (event.target as HTMLIonRefresherElement).complete();
  };

  const getStatusClass = (status: BookingStatus) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'accepted': return 'status-accepted';
      case 'in-progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const getStatusLabel = (status: BookingStatus) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatDate = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'N/A';
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBookingId) return;
    try {
      await updateBookingStatus(selectedBookingId, 'cancelled');
      setToastMessage('Booking cancelled successfully');
      setToastColor('success');
      setShowToast(true);
      loadBookings();
    } catch (error) {
      setToastMessage('Failed to cancel booking');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setShowCancelAlert(false);
      setSelectedBookingId('');
    }
  };

  const goToDetail = (bookingId: string) => {
    navigate(`/customer/booking/${bookingId}`);
  };

  const counts = {
    all: bookings.length,
    active: bookings.filter((b) => ['pending', 'accepted', 'in-progress'].includes(b.status)).length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };

  return (
    <IonPage>
      <IonContent className="bookings-page" fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="bookings-container">
          {/* HEADER */}
          <div className="bookings-header">
            <h1>My Bookings</h1>
            <p>Track all your service requests</p>
          </div>

          {/* FILTERS */}
          <div className="filter-tabs">
            <div
              className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All <span className="filter-count">{counts.all}</span>
            </div>
            <div
              className={`filter-tab ${activeFilter === 'active' ? 'active' : ''}`}
              onClick={() => setActiveFilter('active')}
            >
              Active <span className="filter-count">{counts.active}</span>
            </div>
            <div
              className={`filter-tab ${activeFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveFilter('completed')}
            >
              Completed <span className="filter-count">{counts.completed}</span>
            </div>
            <div
              className={`filter-tab ${activeFilter === 'cancelled' ? 'active' : ''}`}
              onClick={() => setActiveFilter('cancelled')}
            >
              Cancelled <span className="filter-count">{counts.cancelled}</span>
            </div>
          </div>

          {/* BOOKINGS LIST */}
          {isLoading ? (
            <div className="loading-state">
              <IonSpinner name="crescent" />
              <p style={{ marginTop: 12 }}>Loading your bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="empty-state">
              <IonIcon icon={calendarOutline} />
              <h3>No {activeFilter !== 'all' ? activeFilter : ''} bookings yet</h3>
              <p>Book your first service and we'll connect you with a mechanic.</p>
              {activeFilter === 'all' && (
                <button onClick={() => navigate('/customer/book')}>Book a Service</button>
              )}
            </div>
          ) : (
            <div className="bookings-list">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="booking-card"
                  onClick={() => goToDetail(booking.id)}
                >
                  {/* Card Header */}
                  <div className="booking-card-header">
                    <div className="booking-type">
                      <div className="booking-type-icon">
                        <IonIcon
                          icon={booking.serviceType === 'repair' ? constructOutline : carSportOutline}
                        />
                      </div>
                      <div className="booking-type-info">
                        <h3>
                          {booking.serviceType === 'repair' ? 'Repair Service' : 'Roadside Assistance'}
                        </h3>
                        <p>
                          {booking.vehicle?.make} {booking.vehicle?.model} ({booking.vehicle?.year})
                        </p>
                      </div>
                    </div>
                    <span className={`status-badge ${getStatusClass(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="booking-body">
                    <div className="booking-issue">
                      <IonIcon icon={documentTextOutline} />
                      <span>{booking.issueDescription}</span>
                    </div>
                    <div className="booking-detail">
                      <IonIcon icon={locationOutline} />
                      <span>{booking.location?.address}</span>
                    </div>
                    <div className="booking-detail">
                      <IonIcon icon={timeOutline} />
                      <span>{formatDate(booking.createdAt)}</span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="booking-footer">
                    <div className="booking-price">
                      <span className="label">Total Price</span>
                      <span className="amount">
                        {booking.price > 0 ? `₱${booking.price.toLocaleString()}` : 'TBD'}
                      </span>
                    </div>

                    <div className="booking-actions">
                      {booking.status === 'completed' && (
                        <button
                          className="action-btn success"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customer/review/${booking.id}`);
                          }}
                        >
                          <IonIcon icon={starOutline} /> Review
                        </button>
                      )}

                      {booking.status === 'pending' && (
                        <button
                          className="action-btn danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBookingId(booking.id);
                            setShowCancelAlert(true);
                          }}
                        >
                          <IonIcon icon={closeOutline} /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <IonAlert
          isOpen={showCancelAlert}
          onDidDismiss={() => setShowCancelAlert(false)}
          header="Cancel Booking"
          message="Are you sure you want to cancel this booking?"
          buttons={[
            { text: 'No', role: 'cancel' },
            { text: 'Yes, Cancel', role: 'destructive', handler: handleCancelBooking },
          ]}
        />

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

export default CustomerBookings;