// src/components/LoadingScreen.tsx
import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import './LoadingScreen.css';

const LoadingScreen: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen className="loading-bg">
        <div className="loading-container">
          
          <div className="scene-wrapper">
            {/* Kalsada at Progress Bar */}
            <div className="road-track">
              <div className="road-progress"></div>
            </div>

            {/* Sasakyan (Custom SVG Side View) */}
            <div className="car-container">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="car-icon"
              >
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <path d="M9 17h6" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            </div>
          </div>

          <h1 className="loading-title">
            FIX<span>ORA</span>
          </h1>
          <p className="loading-subtitle">On the way...</p>
          
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoadingScreen;