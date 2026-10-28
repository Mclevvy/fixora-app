// src/pages/customer/ContactSupport.tsx
import React, { useState } from 'react';
import { IonContent, IonPage, IonIcon, IonToast } from '@ionic/react';
import {
  arrowBackOutline,
  mailOutline,
  callOutline,
  sendOutline,
  helpCircleOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import './ContactSupport.css';

const ContactSupport: React.FC = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) return;
    setShowToast(true);
    setTimeout(() => {
      setSubject('');
      setMessage('');
      navigate('/customer/home', { replace: true });
    }, 1800);
  };

  return (
    <IonPage>
      <IonContent className="support-page" fullscreen>
        <div className="support-container">
          <div className="support-header">
            <div className="support-header-top">
              <button className="support-back" onClick={() => navigate(-1)}>
                <IonIcon icon={arrowBackOutline} />
              </button>
              <div className="support-header-title">
                <h1>Contact Support</h1>
                <p>We're here to help</p>
              </div>
            </div>
          </div>

          <div className="support-section">
            <h2 className="support-section-title">Quick Contact</h2>
            <div className="support-quick-grid">
              <a href="tel:+639170000000" className="support-quick-card">
                <div className="support-quick-icon call">
                  <IonIcon icon={callOutline} />
                </div>
                <div className="support-quick-label">Call Us</div>
                <div className="support-quick-value">+63 917 000 0000</div>
              </a>

              <a href="mailto:support@fixora.ph" className="support-quick-card">
                <div className="support-quick-icon mail">
                  <IonIcon icon={mailOutline} />
                </div>
                <div className="support-quick-label">Email</div>
                <div className="support-quick-value">support@fixora.ph</div>
              </a>
            </div>
          </div>

          <div className="support-section">
            <h2 className="support-section-title">Send us a message</h2>
            <div className="support-form">
              <label>Subject</label>
              <input
                type="text"
                placeholder="e.g. Issue with my booking"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />

              <label>Message</label>
              <textarea
                placeholder="Describe your concern..."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <button
                className="support-submit"
                onClick={handleSubmit}
                disabled={!subject.trim() || !message.trim()}
              >
                <IonIcon icon={sendOutline} />
                Send Message
              </button>
            </div>
          </div>

          <div className="support-section">
            <div className="support-faq">
              <IonIcon icon={helpCircleOutline} />
              <div>
                <h3>Frequently Asked Questions</h3>
                <p>Find quick answers to common issues.</p>
              </div>
            </div>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Message sent! We'll get back to you soon."
          duration={2200}
          color="success"
        />
      </IonContent>
    </IonPage>
  );
};

export default ContactSupport;