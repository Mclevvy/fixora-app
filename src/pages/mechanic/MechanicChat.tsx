// src/pages/mechanic/MechanicChat.tsx
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
  getBookingById,
  subscribeToChat,
  sendChatMessage,
} from '../../api/firebaseService';
import { ChatMessage, Booking } from '../../types';
import './MechanicChat.css';

const MechanicChat: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef<HTMLIonContentElement>(null);

  useEffect(() => {
    if (!user || !bookingId) return;

    // Kunin ang detalye ng booking para malaman kung sino ang customer
    const loadBooking = async () => {
      try {
        const data = await getBookingById(bookingId);
        setBooking(data);
      } catch (error) {
        console.error('Error loading booking:', error);
      }
    };
    loadBooking();

    // Makinig sa mga chat messages
    const unsubscribe = subscribeToChat(bookingId, (msgs) => {
      setMessages(msgs);
      setIsLoading(false);
      setTimeout(() => {
        contentRef.current?.scrollToBottom(200);
      }, 100);
    });

    return () => unsubscribe();
  }, [user, bookingId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !booking) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      await sendChatMessage({
        senderId: user.id,
        receiverId: booking.customerId, // ✅ Ipinapadala sa Customer ID
        bookingId: booking.id,
        message: messageText,
        timestamp: new Date().toISOString(),
        isRead: false,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Ibalik kung nag-fail
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
      <IonContent className="mechanic-chat-page" ref={contentRef} fullscreen>
        {/* Header */}
        <div className="chat-room-header">
          <div className="header-content">
            <button
              className="back-btn"
              onClick={() => navigate(`/mechanic/job/${bookingId}`)}
            >
              <IonIcon icon={arrowBackOutline} />
            </button>
            <img
              src="https://ionicframework.com/docs/img/demos/avatar.svg"
              alt="Customer"
              className="chat-room-avatar"
            />
            <div className="chat-room-info">
              <h3>{booking?.customerName || 'Customer'}</h3>
              <div className="chat-room-status">
                <span className="status-dot" />
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
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
                <p>Start the conversation with the customer!</p>
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
                      <img
                        src="https://ionicframework.com/docs/img/demos/avatar.svg"
                        alt="Avatar"
                        className="message-avatar"
                      />
                    )}
                    <div className="message-bubble">
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

        {/* Input */}
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
          >
            <IonIcon icon={sendOutline} />
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MechanicChat;