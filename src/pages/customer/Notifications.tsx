// src/pages/customer/Notifications.tsx
import React from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
} from '@ionic/react';
import {
  arrowBackOutline,
  checkmarkDoneOutline,
  trashOutline,
  notificationsOffOutline,
  checkmarkCircleOutline,
  constructOutline,
  chatbubbleOutline,
  cardOutline,
  navigateOutline,
  closeCircleOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { AppNotification } from '../../types';
import './Notifications.css';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, clearAll, unreadCount } =
    useNotifications();

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'booking_accepted':
      case 'mechanic_arriving':
        return constructOutline;
      case 'chat_message':
        return chatbubbleOutline;
      case 'payment_success':
        return cardOutline;
      case 'booking_completed':
        return checkmarkCircleOutline;
      case 'booking_cancelled':
        return closeCircleOutline;
      default:
        return navigateOutline;
    }
  };

  const getColor = (type: AppNotification['type']) => {
    switch (type) {
      case 'booking_completed':
      case 'payment_success':
        return '#065f46';
      case 'booking_cancelled':
        return '#991b1b';
      case 'chat_message':
        return '#1e40af';
      default:
        return '#1a4d3e';
    }
  };

  const getBg = (type: AppNotification['type']) => {
    switch (type) {
      case 'booking_completed':
      case 'payment_success':
        return '#d1fae5';
      case 'booking_cancelled':
        return '#fee2e2';
      case 'chat_message':
        return '#dbeafe';
      default:
        return '#e7f3ef';
    }
  };

  const handleClick = (n: AppNotification) => {
    markAsRead(n.id);
    if (n.bookingId) {
      if (n.type === 'chat_message') {
        navigate(`/customer/chat/${n.bookingId}`);
      } else {
        navigate(`/customer/booking/${n.bookingId}`);
      }
    }
  };

  const formatTime = (iso: string) => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <IonPage>
      <IonContent className="notif-page" fullscreen>
        <div className="notif-container">
          {/* Header */}
          <div className="notif-header">
            <div className="notif-header-top">
              <button
                className="notif-back-btn"
                onClick={() => navigate('/customer/home')}
              >
                <IonIcon icon={arrowBackOutline} />
              </button>
              <div className="notif-header-title">
                <h1>Notifications</h1>
                <p>
                  {unreadCount > 0
                    ? `${unreadCount} unread`
                    : 'All caught up'}
                </p>
              </div>
            </div>

            {notifications.length > 0 && (
              <div className="notif-actions">
                {unreadCount > 0 && (
                  <button
                    className="notif-action-btn"
                    onClick={markAllAsRead}
                  >
                    <IonIcon icon={checkmarkDoneOutline} />
                    Mark all read
                  </button>
                )}
                <button
                  className="notif-action-btn danger"
                  onClick={clearAll}
                >
                  <IonIcon icon={trashOutline} />
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div className="notif-empty">
              <IonIcon icon={notificationsOffOutline} />
              <h3>No notifications yet</h3>
              <p>
                Updates about your bookings, chats, and payments will appear here.
              </p>
            </div>
          ) : (
            <div className="notif-list">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => handleClick(n)}
                >
                  <div
                    className="notif-icon"
                    style={{
                      background: getBg(n.type),
                      color: getColor(n.type),
                    }}
                  >
                    <IonIcon icon={getIcon(n.type)} />
                  </div>
                  <div className="notif-content">
                    <div className="notif-row">
                      <h3 className="notif-title">{n.title}</h3>
                      <span className="notif-time">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="notif-message">{n.message}</p>
                  </div>
                  {!n.isRead && <span className="notif-dot" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Notifications;