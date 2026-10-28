// src/pages/PlaceholderPage.tsx
import React from 'react';
import { 
  IonContent, IonPage, IonHeader, IonToolbar, IonTitle, 
  IonButton, IonIcon, IonText, IonCard, IonCardContent 
} from '@ionic/react';
import { logOutOutline, constructOutline } from 'ionicons/icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface PlaceholderProps {
  title: string;
  description?: string;
}

const PlaceholderPage: React.FC<PlaceholderProps> = ({ title, description }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>{title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent className="ion-text-center">
            <IonIcon 
              icon={constructOutline} 
              size="large" 
              color="primary" 
              style={{ fontSize: '80px' }}
            />
            <h2>{title}</h2>
            <IonText color="medium">
              <p>{description || 'Coming Soon'}</p>
            </IonText>
            <IonText color="dark">
              <p><strong>Logged in as:</strong> {user?.fullName} ({user?.role})</p>
            </IonText>
            <IonButton expand="block" color="danger" className="ion-margin-top" onClick={handleLogout}>
              <IonIcon icon={logOutOutline} slot="start" />
              Logout
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default PlaceholderPage;