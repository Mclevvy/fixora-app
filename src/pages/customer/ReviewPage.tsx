// src/pages/customer/ReviewPage.tsx
import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import {
  arrowBackOutline,
  star,
  starOutline,
} from 'ionicons/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getBookingById, submitReview } from '../../api/firebaseService';
import { Booking } from '../../types';
import './ReviewPage.css';

const ReviewPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (bookingId) {
      getBookingById(bookingId).then((data) => {
        setBooking(data);
        setIsLoading(false);
      });
    }
  }, [bookingId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setToastMsg('Please select a star rating.');
      setShowToast(true);
      return;
    }

    if (!booking || !user || !booking.mechanicId) return;

    setIsSubmitting(true);
    try {
      await submitReview({
        customerId: user.id,
        customerName: user.fullName,
        mechanicId: booking.mechanicId,
        bookingId: booking.id,
        rating: rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      });

      setToastMsg('Review submitted successfully!');
      setShowToast(true);

      setTimeout(() => {
        navigate('/customer/bookings', { replace: true });
      }, 1500);

    } catch (error) {
      console.error(error);
      setToastMsg('Failed to submit review.');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="review-page">
          <div className="review-loading"><IonSpinner name="crescent" /></div>
        </IonContent>
      </IonPage>
    );
  }

  if (!booking) {
    return (
      <IonPage>
        <IonContent className="review-page">
          <div className="review-loading"><p>Booking not found.</p></div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      {/* ✅ INLINE STYLE PARA PWERSAHIN ANG LIGHT BLUE BACKGROUND */}
      <IonContent 
        className="review-page" 
        fullscreen
        style={{ '--background': 'linear-gradient(180deg, #f0f9ff 0%, #bae6fd 100%)' } as React.CSSProperties}
      >
        <div className="review-container">
          
          {/* ✅ INLINE STYLE PARA TRANSPARENT ANG HEADER */}
          <div className="review-header" style={{ background: 'transparent' }}>
            <button className="back-btn" onClick={() => navigate(-1)}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <h1>Leave a Review</h1>
          </div>

          <div className="review-content">
            <div className="review-card">
              
              <div className="review-mechanic-info">
                <img 
                  src="https://ionicframework.com/docs/img/demos/avatar.svg" 
                  alt="Mechanic" 
                  className="review-avatar"
                />
                {/* ✅ NAME SA BAGONG LINYA, NAKA-CENTER SA CARD */}
                <h2>
                  How was your experience with<br />
                  <strong>{booking.mechanicName}</strong>?
                </h2>
              </div>

              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    className="star-btn"
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <IonIcon 
                      icon={(hoverRating || rating) >= starVal ? star : starOutline} 
                      className={(hoverRating || rating) >= starVal ? 'star-filled' : 'star-empty'}
                    />
                  </button>
                ))}
              </div>

              <textarea
                className="review-textarea"
                placeholder="Share details of your experience (optional)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />

              <button 
                className="review-submit-btn" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={2500}
          color={toastMsg.includes('success') ? 'success' : 'danger'}
        />
      </IonContent>
    </IonPage>
  );
};

export default ReviewPage;