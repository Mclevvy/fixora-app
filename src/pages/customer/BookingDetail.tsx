// src/pages/customer/BookingDetail.tsx
import React, { useState, useEffect } from 'react';
import {
  IonContent, IonPage, IonIcon, IonSpinner, IonAlert, IonToast,
  IonRefresher, IonRefresherContent, IonModal, 
} from '@ionic/react';
import {
  arrowBackOutline, constructOutline, carSportOutline, documentTextOutline,
  locationOutline, timeOutline, cardOutline, starOutline, closeOutline,
  navigateOutline, checkmarkCircleOutline, alertCircleOutline, hourglassOutline,
  printOutline, receiptOutline // ✅ IDINAGDAG PARA SA RECEIPT
} from 'ionicons/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getCustomerBookings, updateBookingStatus, markBookingAsPaid, getUserProfile,
} from '../../api/firebaseService';
import { Booking, BookingStatus } from '../../types';
import InteractiveMap from '../../components/InteractiveMap';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import './BookingDetail.css';

const BookingDetail: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('danger');
  
  const [mechanicImage, setMechanicImage] = useState<string | null>(null);

  // ✅ BAGONG STATE PARA SA RECEIPT MODAL
  const [showReceipt, setShowReceipt] = useState(false);

  // Custom Card Modal States
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [isProcessingCard, setIsProcessingCard] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [bookingId, user]);

  const loadBooking = async () => {
    if (!user || !bookingId) return;
    setIsLoading(true);
    try {
      const bookings = await getCustomerBookings(user.id);
      const found = bookings.find((b) => b.id === bookingId);
      if (found) {
        setBooking(found);
        if (found.mechanicId) {
          const profile = await getUserProfile(found.mechanicId);
          if (profile && profile.profileImage) {
            setMechanicImage(profile.profileImage);
          }
        }
      } else {
        setToastMessage('Booking not found');
        setToastColor('danger');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!bookingId) return;
    try {
      await updateBookingStatus(bookingId, 'cancelled');
      setToastMessage('Booking cancelled successfully');
      setToastColor('success');
      setShowToast(true);
      await loadBooking();
    } catch (error) {
      setToastMessage('Failed to cancel booking');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setShowCancelAlert(false);
    }
  };

  const handlePayPalSuccess = async (details: any) => {
    if (!bookingId) return;
    try {
      const mockTransactionId = `PAYPAL-${details.id}`;
      await markBookingAsPaid(bookingId, mockTransactionId, 'paypal');
      setToastMessage('PayPal Payment successful! Thank you.');
      setToastColor('success');
      setShowToast(true);
      await loadBooking();
      setShowReceipt(true); // ✅ BUBUKAS ANG RECEIPT PAGKATAPOS MAGBAYAD
    } catch (e) {
      console.error(e);
      setToastMessage('Payment recorded but save failed.');
      setToastColor('warning');
      setShowToast(true);
    }
  };

  const handleCustomCardPay = async () => {
    if (cardNumber.length < 5) {
      setToastMessage('Please enter any card number');
      setToastColor('danger');
      setShowToast(true);
      return;
    }
    
    setIsProcessingCard(true);
    setTimeout(async () => {
      if (!bookingId) return;
      try {
        const mockTxnId = `CARD-${Date.now()}`;
        await markBookingAsPaid(bookingId, mockTxnId, 'card');
        setShowCardModal(false);
        setCardNumber('');
        setToastMessage('Card Payment successful! Thank you.');
        setToastColor('success');
        setShowToast(true);
        await loadBooking();
        setShowReceipt(true); // ✅ BUBUKAS ANG RECEIPT PAGKATAPOS MAGBAYAD
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessingCard(false);
      }
    }, 1500); 
  };

  const formatDate = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      });
    } catch {
      return 'N/A';
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

  const doRefresh = (event: any) => {
    loadBooking().finally(() => event.detail.complete());
  };

  // ✅ FUNCTION PARA SA PAG-PRINT NG RECEIPT
  const handlePrintReceipt = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="detail-page" fullscreen>
          <div className="detail-center"><IonSpinner name="crescent" /></div>
        </IonContent>
      </IonPage>
    );
  }

  if (!booking) {
    return (
      <IonPage>
        <IonContent className="detail-page" fullscreen>
          <div className="detail-container">
            <div className="detail-empty" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <p>Booking not found.</p>
              <button className="detail-action-btn primary" onClick={() => navigate('/customer/bookings')} style={{ margin: '0 auto', width: 'auto' }}>
                Back to Bookings
              </button>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const canPay = booking.status === 'completed' && booking.paymentStatus === 'pending' && booking.price > 0;
  const isPaid = booking.paymentStatus === 'paid';
  const isPaymentFailed = booking.paymentStatus === 'failed';
  const isOngoing = booking.status === 'accepted' || booking.status === 'in-progress';
  const isPending = booking.status === 'pending';
  const isCancelled = booking.status === 'cancelled';
  const isCompleted = booking.status === 'completed';

  return (
    <IonPage>
      <IonContent 
        className="detail-page" 
        fullscreen
        style={{ '--background': 'linear-gradient(180deg, #f0f9ff 0%, #bae6fd 100%)' } as React.CSSProperties}
      >
        <IonRefresher slot="fixed" onIonRefresh={doRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="detail-container">
          {/* HEADER */}
          <div className="detail-header">
            <div className="detail-header-top">
              <button className="back-btn-detail" onClick={() => navigate('/customer/bookings')}>
                <IonIcon icon={arrowBackOutline} />
              </button>
              <div className="detail-header-title">
                <h1>{booking.serviceType === 'repair' ? 'Repair Service' : 'Roadside Assistance'}</h1>
                <p>Booking #{booking.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <span className={`detail-status-badge ${booking.status}`}>
                {getStatusLabel(booking.status)}
              </span>
            </div>
          </div>

          <div className="detail-sections-grid">
            {/* 1. PAYMENT SECTION */}
            <div className="detail-section">
              <h2 className="detail-section-title">Payment</h2>

              <div className="detail-card payment-card">
                <div className="payment-card-header">
                  <div className={`payment-status-icon ${isPaid ? 'paid' : isPaymentFailed ? 'failed' : canPay ? 'due' : 'waiting'}`}>
                    <IonIcon icon={isPaid ? checkmarkCircleOutline : isPaymentFailed ? alertCircleOutline : canPay ? cardOutline : hourglassOutline} />
                  </div>

                  <div className="payment-info">
                    <div className="payment-label">
                      {isPaid ? 'Payment Complete' : isPaymentFailed ? 'Payment Failed' : canPay ? 'Payment Due' : 'Payment Pending'}
                    </div>
                    <div className="payment-value">
                      {booking.price > 0 ? `₱${booking.price.toLocaleString()}` : 'Amount TBD'}
                    </div>
                    <div className="payment-subtext">
                      {isPaid && booking.paidAt ? `Paid on ${formatDate(booking.paidAt)}` :
                      isPaymentFailed ? 'Please try again' :
                      canPay ? 'Service completed — payment is now due' :
                      isOngoing ? 'Estimated cost — pay once service is complete' :
                      isPending ? 'Waiting for mechanic to accept' :
                      isCancelled ? 'Booking cancelled — no payment needed' : ''}
                    </div>
                  </div>

                  {isPaid && (
                    <div className="payment-paid-badge">
                      <IonIcon icon={checkmarkCircleOutline} /> PAID
                    </div>
                  )}
                </div>

                {/* ✅ BAGONG "VIEW RECEIPT" BUTTON KAPAG BAYAD NA */}
                {isPaid && (
                  <button 
                    onClick={() => setShowReceipt(true)}
                    style={{ 
                      width: '100%', marginTop: '12px', padding: '12px', background: '#f0f9ff', 
                      color: '#0ea5e9', border: '1px solid #bae6fd', borderRadius: '12px', 
                      fontWeight: 700, fontSize: '14px', display: 'flex', justifyContent: 'center', 
                      alignItems: 'center', gap: '8px', cursor: 'pointer' 
                    }}
                  >
                    <IonIcon icon={receiptOutline} style={{ fontSize: '18px' }} />
                    View Receipt
                  </button>
                )}

                {/* PAYPAL BUTTONS */}
                {canPay && (
                  <div className="paypal-button-wrapper">
                    <PayPalScriptProvider options={{ clientId: "test", currency: "PHP", disableFunding: "card" }}>
                      <PayPalButtons
                        style={{ layout: "vertical", shape: "rect", color: "blue", label: "pay" }}
                        createOrder={(data, actions) => {
                          return actions.order.create({
                            intent: "CAPTURE",
                            purchase_units: [{ amount: { currency_code: "PHP", value: booking.price.toString() }, description: `Fixora Booking #${booking.id.slice(0, 8)}` }],
                          });
                        }}
                        onApprove={async (data, actions) => {
                          if (actions.order) {
                            const details = await actions.order.capture();
                            await handlePayPalSuccess(details);
                          }
                        }}
                        onError={(err) => {
                          console.error("PayPal Error:", err);
                          setToastMessage('PayPal error. Please try again.');
                          setToastColor('danger');
                          setShowToast(true);
                        }}
                      />
                    </PayPalScriptProvider>

                    <button className="custom-card-btn" onClick={() => setShowCardModal(true)}>
                      <IonIcon icon={cardOutline} /> Debit or Credit Card
                    </button>
                  </div>
                )}
              </div>

              {isPaid && booking.transactionId && (
                <div className="payment-txn">
                  <span>Transaction ID:</span>
                  <code>{booking.transactionId}</code>
                </div>
              )}
            </div>

            {/* ASSIGNED MECHANIC */}
            {booking.mechanicId && booking.mechanicName && (
              <div className="detail-section">
                <h2 className="detail-section-title">Assigned Mechanic</h2>
                <div className="mechanic-card-detail">
                  <img 
                    src={mechanicImage || "https://ionicframework.com/docs/img/demos/avatar.svg"} 
                    alt={booking.mechanicName} 
                    className="mechanic-avatar-detail" 
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="mechanic-info-detail">
                    <h3>{booking.mechanicName}</h3>
                    <p>Assigned to your booking</p>
                    <div className="rating-row">
                      <IonIcon icon={starOutline} />
                      <span>Verified Mechanic</span>
                    </div>
                  </div>
                  {isCompleted && (
                    <button className="mechanic-review-btn" onClick={() => navigate(`/customer/review/${booking.id}`)}>
                      <IonIcon icon={starOutline} />
                      <span>Leave a Review</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* SERVICE DETAILS, VEHICLE, LOCATION */}
            <div className="detail-section">
              <h2 className="detail-section-title">Service Details</h2>
              <div className="detail-card">
                <div className="detail-row">
                  <div className="detail-icon"><IonIcon icon={booking.serviceType === 'repair' ? constructOutline : carSportOutline} /></div>
                  <div className="detail-content">
                    <div className="detail-label">Service Type</div>
                    <div className="detail-value primary">{booking.serviceType === 'repair' ? 'Repair Service' : 'Roadside Assistance'}</div>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-icon"><IonIcon icon={documentTextOutline} /></div>
                  <div className="detail-content">
                    <div className="detail-label">Issue Description</div>
                    <div className="detail-value">{booking.issueDescription}</div>
                  </div>
                </div>
                <div className="detail-row" style={{ borderBottom: 'none' }}>
                  <div className="detail-icon"><IonIcon icon={timeOutline} /></div>
                  <div className="detail-content">
                    <div className="detail-label">Booked On</div>
                    <div className="detail-value">{formatDate(booking.createdAt)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h2 className="detail-section-title">Vehicle</h2>
              <div className="detail-card">
                <div className="detail-row">
                  <div className="detail-icon"><IonIcon icon={carSportOutline} /></div>
                  <div className="detail-content">
                    <div className="detail-label">Vehicle</div>
                    <div className="detail-value">{booking.vehicle.make} {booking.vehicle.model} ({booking.vehicle.year})</div>
                  </div>
                </div>
                <div className="detail-row" style={{ borderBottom: 'none' }}>
                  <div className="detail-icon"><IonIcon icon={documentTextOutline} /></div>
                  <div className="detail-content">
                    <div className="detail-label">Plate Number</div>
                    <div className="detail-value">{booking.vehicle.plateNumber} • {booking.vehicle.color}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-section location-section">
              <h2 className="detail-section-title">Location</h2>
              <div className="detail-card">
                <div className="detail-row" style={{ borderBottom: 'none' }}>
                  <div className="detail-icon"><IonIcon icon={locationOutline} /></div>
                  <div className="detail-content">
                    <div className="detail-label">Service Address</div>
                    <div className="detail-value">{booking.location.address}</div>
                  </div>
                </div>
              </div>
              {booking.location.latitude !== 0 && (
                <div className="map-wrapper-detail">
                  <InteractiveMap latitude={booking.location.latitude} longitude={booking.location.longitude} draggable={false} height="200px" zoom={16} />
                </div>
              )}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="detail-actions">
            {isPending && (
              <div className="pending-chat-notice">
                <IonIcon icon={timeOutline} />
                <span>Waiting for a mechanic to accept your booking. You can chat via the Track page once accepted.</span>
              </div>
            )}
            {isPending && (
              <button className="detail-action-btn danger" onClick={() => setShowCancelAlert(true)}>
                <IonIcon icon={closeOutline} /> Cancel Booking
              </button>
            )}
            {(booking.status === 'accepted' || booking.status === 'in-progress') && (
              <button className="detail-action-btn primary" onClick={() => navigate(`/customer/track/${booking.id}`)}>
                <IonIcon icon={navigateOutline} /> Track Mechanic
              </button>
            )}
            {isCancelled && (
              <div className="cancelled-note">
                <IonIcon icon={closeOutline} /> This booking was cancelled
              </div>
            )}
          </div>
        </div>

        {/* ✅ CUSTOM CARD MODAL */}
        <IonModal isOpen={showCardModal} onDidDismiss={() => setShowCardModal(false)} className="card-modal">
          <div className="card-modal-content">
            <div className="card-modal-header">
              <h2>Pay with Card</h2>
              <button onClick={() => setShowCardModal(false)}><IonIcon icon={closeOutline} /></button>
            </div>
            <p>Enter any mock card number for testing.</p>
            
            <div className="card-input-group">
              <label>Card Number</label>
              <input type="text" placeholder="1234 5678 9012 3456" maxLength={19} value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
            </div>
            
            <div className="card-row">
              <div className="card-input-group"><label>Expiry</label><input type="text" placeholder="MM/YY" maxLength={5} /></div>
              <div className="card-input-group"><label>CVV</label><input type="text" placeholder="123" maxLength={4} /></div>
            </div>

            <button className="card-pay-btn" onClick={handleCustomCardPay} disabled={isProcessingCard}>
              {isProcessingCard ? <IonSpinner name="crescent" /> : `Pay ₱${booking.price.toLocaleString()}`}
            </button>
          </div>
        </IonModal>

        {/* ✅ BAGONG DAGDAG: RECEIPT MODAL */}
        <IonModal isOpen={showReceipt} onDidDismiss={() => setShowReceipt(false)} style={{ '--border-radius': '24px' }}>
          <div style={{ padding: '24px', background: '#ffffff', height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            {/* Receipt Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '60px', height: '60px', background: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '32px', color: '#0ea5e9' }} />
              </div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Payment Successful</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Receipt #{booking.transactionId || 'N/A'}</p>
            </div>

            {/* Amount */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Total Paid</p>
              <h1 style={{ margin: '4px 0 0 0', fontSize: '36px', fontWeight: 900, color: '#0ea5e9' }}>
                ₱{booking.price.toLocaleString()}
              </h1>
            </div>

            <div style={{ height: '1px', borderBottom: '1px dashed #cbd5e1', margin: '0 0 24px 0' }}></div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Customer</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{booking.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Mechanic</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{booking.mechanicName || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Service</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{booking.serviceType === 'repair' ? 'Repair Service' : 'Roadside Assistance'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Date & Time</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{formatDate(booking.paidAt || new Date().toISOString())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Payment Method</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>{booking.paymentMethod || 'Card'}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowReceipt(false)} 
                style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
              <button 
                onClick={handlePrintReceipt} 
                style={{ flex: 1, padding: '14px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <IonIcon icon={printOutline} style={{ fontSize: '18px' }} /> Print
              </button>
            </div>

          </div>
        </IonModal>

        <IonAlert
          isOpen={showCancelAlert}
          onDidDismiss={() => setShowCancelAlert(false)}
          header="Cancel Booking"
          message="Are you sure you want to cancel this booking? This cannot be undone."
          buttons={[{ text: 'No', role: 'cancel' }, { text: 'Yes, Cancel', role: 'destructive', handler: handleCancel }]}
        />

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={2500} color={toastColor} />
      </IonContent>
    </IonPage>
  );
};

export default BookingDetail;