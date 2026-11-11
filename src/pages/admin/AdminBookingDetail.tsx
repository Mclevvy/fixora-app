// src/pages/admin/AdminBookingDetail.tsx
import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonSpinner } from '@ionic/react';
import { 
  arrowBackOutline, personOutline, constructOutline, 
  carSportOutline, documentTextOutline, locationOutline, 
  timeOutline, cashOutline 
} from 'ionicons/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingById } from '../../api/firebaseService';
import { Booking } from '../../types';
import './Admin.css';

const AdminBookingDetail: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      if (bookingId) {
        const data = await getBookingById(bookingId);
        setBooking(data);
      }
      setIsLoading(false);
    };
    fetchBooking();
  }, [bookingId]);

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-green';
    if (status === 'cancelled') return 'bg-red';
    if (status === 'in-progress') return 'bg-blue';
    return 'bg-yellow';
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="admin-page">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!booking) {
    return (
      <IonPage>
        <IonContent className="admin-page">
          <div className="admin-container">
            <div 
              className="admin-header" 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '16px',
                background: 'linear-gradient(135deg, #00b4d8 0%, #06b6d4 100%)',
                boxShadow: '0 10px 30px -10px rgba(0, 180, 216, 0.5)'
              }}
            >
              <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>
                <IonIcon icon={arrowBackOutline} />
              </button>
              <h1>Booking Not Found</h1>
            </div>
            <div className="admin-content">
              <p style={{ textAlign: 'center', color: '#6b7280' }}>The booking you are looking for does not exist.</p>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="admin-page" fullscreen>
        <div className="admin-container">
          
          {/* ✅ HEADER: Cyan/Blue Gradient */}
          <div 
            className="admin-header" 
            style={{ 
              display: 'flex', alignItems: 'flex-start', gap: '16px', paddingBottom: '32px',
              background: 'linear-gradient(135deg, #00b4d8 0%, #06b6d4 100%)',
              boxShadow: '0 10px 30px -10px rgba(0, 180, 216, 0.5)'
            }}
          >
            <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', cursor: 'pointer', flexShrink: 0 }}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <div>
              <h1 style={{ margin: 0 }}>Booking Details</h1>
              {/* ✅ BINAGO: ID pinalitan ng descriptive text */}
              <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '14px' }}>
                View and manage all customer bookings and their status.
              </p>
            </div>
          </div>

          <div className="admin-content" style={{ marginTop: '-20px' }}>
            
            {/* STATUS & PRICE */}
            <div className="admin-card" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>STATUS</p>
                <span className={`admin-badge ${getStatusColor(booking.status)}`} style={{ marginTop: '4px', display: 'inline-block' }}>
                  {booking.status.toUpperCase()}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>TOTAL PRICE</p>
                <h2 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 800, color: '#0ea5e9' }}>
                  ₱{booking.price > 0 ? booking.price.toLocaleString() : 'TBD'}
                </h2>
              </div>
            </div>

            {/* CUSTOMER INFO */}
            <div className="admin-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
                <IonIcon icon={personOutline} style={{ color: '#0ea5e9', fontSize: '20px' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Customer</h3>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{booking.customerName}</p>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>{booking.customerPhone || 'No phone provided'}</p>
              </div>
            </div>

            {/* MECHANIC INFO */}
            <div className="admin-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
                <IonIcon icon={constructOutline} style={{ color: '#0ea5e9', fontSize: '20px' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Assigned Mechanic</h3>
              </div>
              <div>
                {booking.mechanicName ? (
                  <>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{booking.mechanicName}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>{booking.mechanicPhone || 'No phone provided'}</p>
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', color: '#ef4444', fontStyle: 'italic' }}>No mechanic assigned yet</p>
                )}
              </div>
            </div>

            {/* VEHICLE & SERVICE */}
            <div className="admin-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
                <IonIcon icon={carSportOutline} style={{ color: '#0ea5e9', fontSize: '20px' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Vehicle & Service</h3>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                  {booking.vehicle?.make} {booking.vehicle?.model} ({booking.vehicle?.year})
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
                  Plate: {booking.vehicle?.plateNumber} • Color: {booking.vehicle?.color}
                </p>
                <div style={{ marginTop: '8px', display: 'inline-block', background: '#e0f2fe', color: '#0ea5e9', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                  {booking.serviceType === 'repair' ? 'Repair Service' : 'Roadside Assistance'}
                </div>
              </div>
            </div>

            {/* ISSUE DESCRIPTION */}
            <div className="admin-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
                <IonIcon icon={documentTextOutline} style={{ color: '#0ea5e9', fontSize: '20px' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Issue Description</h3>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', lineHeight: 1.5 }}>
                "{booking.issueDescription || 'No additional notes.'}"
              </p>
            </div>

            {/* LOCATION */}
            <div className="admin-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
                <IonIcon icon={locationOutline} style={{ color: '#0ea5e9', fontSize: '20px' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Location</h3>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>
                {booking.location?.address || 'No address provided'}
              </p>
            </div>

            {/* DATES */}
            <div className="admin-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
                <IonIcon icon={timeOutline} style={{ color: '#0ea5e9', fontSize: '20px' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Timeline</h3>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4b5563' }}>
                <span>Created At:</span>
                <span style={{ fontWeight: 600 }}>{formatDate(booking.createdAt)}</span>
              </div>
              {booking.updatedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4b5563' }}>
                  <span>Last Updated:</span>
                  <span style={{ fontWeight: 600 }}>{formatDate(booking.updatedAt)}</span>
                </div>
              )}
            </div>

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminBookingDetail;