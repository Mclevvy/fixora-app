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
          
          {/* ✅ SAPILITANG CYAN/BLUE GRADIENT (Inline Style) */}
          <div 
            className="notif-header"
            style={{ 
              background: 'linear-gradient(135deg, #00b4d8 0%, #06b6d4 100%)', // Blue/Cyan Theme
              boxShadow: '0 10px 30px -10px rgba(0, 180, 216, 0.5)',
              width: '100%',
              padding: '24px 20px',
              borderBottomLeftRadius: '28px',
              borderBottomRightRadius: '28px'
            }}
          >
            <div className="notif-header-top" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="notif-back-btn"
                onClick={() => navigate('/customer/home')}
                style={{ 
                  color: 'white', 
                  background: 'rgba(255, 255, 255, 0.2)', 
                  border: 'none', 
                  width: '40px', height: '40px', borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <IonIcon icon={arrowBackOutline} style={{ fontSize: '20px' }} />
              </button>
              <div className="notif-header-title">
                <h1 style={{ color: 'white', margin: 0, fontSize: '22px', fontWeight: 800 }}>Notifications</h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '2px 0 0 0', fontSize: '13px' }}>
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
            </div>
          </div>

          {/* ACTIONS BAR */}
          {notifications.length > 0 && (
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '16px 20px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                {unreadCount} unread
              </span>

              <div style={{ display: 'flex', gap: '16px' }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{ 
                      color: '#00b4d8', background: 'transparent', border: 'none', 
                      fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0
                    }}
                  >
                    <IonIcon icon={checkmarkDoneOutline} style={{ fontSize: '16px' }} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={clearAll}
                  style={{ 
                    color: '#ef4444', background: 'transparent', border: 'none', 
                    fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0
                  }}
                >
                  <IonIcon icon={trashOutline} style={{ fontSize: '16px' }} />
                  Clear all
                </button>
              </div>
            </div>
          )}

          {/* LIST */}
          <div style={{ width: '100%', padding: '0 20px 20px 20px', boxSizing: 'border-box' }}>
            {notifications.length === 0 ? (
              <div className="notif-empty" style={{ marginTop: '20px' }}>
                <IonIcon icon={notificationsOffOutline} />
                <h3>No notifications yet</h3>
                <p>Updates about your bookings, chats, and payments will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                    onClick={() => handleClick(n)}
                    style={{ 
                      width: '100%', 
                      boxSizing: 'border-box',
                      background: n.isRead ? 'white' : '#f0f9ff', // Light blue for unread
                      borderLeft: n.isRead ? '3px solid transparent' : '3px solid #00b4d8' // Cyan accent
                    }}
                  >
                    <div
                      style={{
                        background: getBg(n.type),
                        color: getColor(n.type),
                        width: '42px', height: '42px', minWidth: '42px',
                        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px'
                      }}
                    >
                      <IonIcon icon={getIcon(n.type)} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</h3>
                        <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>{formatTime(n.createdAt)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: 1.4 }}>{n.message}</p>
                    </div>
                    {!n.isRead && <span style={{ position: 'absolute', top: '16px', right: '12px', width: '8px', height: '8px', borderRadius: '50%', background: '#00b4d8' }} />}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Notifications;