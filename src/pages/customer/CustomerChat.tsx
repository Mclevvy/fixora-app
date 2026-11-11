// src/pages/customer/CustomerChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import {
  chatbubbleOutline,
  arrowBackOutline,
  sendOutline,
} from 'ionicons/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getCustomerBookings,
  subscribeToChat,
  sendChatMessage,
  getUserProfile, // ✅ IDINAGDAG PARA MAKUNIN ANG PICTURE NG MECHANIC
} from '../../api/firebaseService';
import { ChatMessage } from '../../types';
import './CustomerChat.css';

const CustomerChat: React.FC = () => {
  const { bookingId } = useParams<{ bookingId?: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!bookingId) {
      navigate('/customer/bookings', { replace: true });
    }
  }, [bookingId, navigate]);

  if (!bookingId) {
    return (
      <IonPage>
        <IonContent className="customer-chat-page" fullscreen>
          <div className="chat-loading">
            <IonSpinner name="crescent" />
            <p>Redirecting...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return <ChatRoom bookingId={bookingId} />;
};

const ChatRoom: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [mechanicName, setMechanicName] = useState('Mechanic');
  const [mechanicId, setMechanicId] = useState('');
  const [mechanicImage, setMechanicImage] = useState(''); // ✅ BAGONG STATE PARA SA PICTURE
  const contentRef = useRef<HTMLIonContentElement>(null);

  useEffect(() => {
    if (!user) return;

    const loadBookingInfo = async () => {
      try {
        const bookings = await getCustomerBookings(user.id);
        const booking = bookings.find((b) => b.id === bookingId);
        if (booking) {
          setMechanicName(booking.mechanicName || 'Mechanic');
          setMechanicId(booking.mechanicId || '');
          
          // ✅ KUNIN ANG PICTURE NG MECHANIC DIREKTA SA DATABASE
          if (booking.mechanicId) {
            const profile = await getUserProfile(booking.mechanicId);
            if (profile && profile.profileImage) {
              setMechanicImage(profile.profileImage);
            }
          }
        }
      } catch (error) {
        console.error('Error loading booking:', error);
      }
    };

    loadBookingInfo();

    const unsubscribe = subscribeToChat(bookingId, (msgs) => {
      // ✅ DEBUG LOG: Tingnan sa console (F12) kung may pumapasok na messages
      console.log(`📩 [Customer Chat] Received ${msgs.length} messages for booking: ${bookingId}`, msgs);
      
      setMessages(msgs);
      setIsLoading(false);
      setTimeout(() => {
        contentRef.current?.scrollToBottom(200);
      }, 100);
    });

    return () => unsubscribe();
  }, [user, bookingId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !mechanicId) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      await sendChatMessage({
        senderId: user.id,
        receiverId: mechanicId,
        bookingId,
        message: messageText,
        timestamp: new Date().toISOString(),
        isRead: false,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  return (
    <IonPage>
      <IonContent 
        className="customer-chat-page" 
        ref={contentRef} 
        fullscreen
        style={{ '--background': 'linear-gradient(180deg, #f0f9ff 0%, #bae6fd 100%)' } as React.CSSProperties}
      >
        <div className="chat-room-header">
          <div className="header-content">
            <button
              className="back-btn"
              onClick={() => navigate(`/customer/booking/${bookingId}`)}
            >
              <IonIcon icon={arrowBackOutline} />
            </button>
            
            {/* ✅ BINAGO: Ginamit ang mechanicImage na may fallback */}
            <img
              src={mechanicImage || "https://ionicframework.com/docs/img/demos/avatar.svg"}
              alt={mechanicName}
              className="chat-room-avatar"
              style={{ objectFit: 'cover' }}
            />

            <div className="chat-room-info">
              <h3>{mechanicName}</h3>
              <div className="chat-room-status">
                <span className="status-dot" />
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="chat-loading">
            <IonSpinner name="crescent" />
            <p>Loading messages...</p>
          </div>
        ) : (
          <div className="messages-area">
            {messages.length === 0 ? (
              <div className="empty-conversation">
                <IonIcon icon={chatbubbleOutline} />
                <p>Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`message-row ${isOwn ? 'own' : ''}`}
                  >
                    {!isOwn && (
                      // ✅ BINAGO: Ginamit din ang mechanicImage dito
                      <img
                        src={mechanicImage || "https://ionicframework.com/docs/img/demos/avatar.svg"}
                        alt="Avatar"
                        className="message-avatar"
                        style={{ objectFit: 'cover' }}
                      />
                    )}
                    <div 
                      className="message-bubble"
                      style={isOwn ? { 
                        background: '#00b4d8', 
                        boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)' 
                      } : {}}
                    >
                      {msg.message}
                      <span className="message-time">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        <div className="chat-input-wrapper">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!newMessage.trim()}
            style={{ 
              background: '#00b4d8', 
              boxShadow: '0 4px 12px rgba(0, 180, 216, 0.4)' 
            }}
          >
            <IonIcon icon={sendOutline} />
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CustomerChat;