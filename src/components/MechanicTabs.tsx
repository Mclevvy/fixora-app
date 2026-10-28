// src/components/MechanicTabs.tsx
import React from 'react';
import {
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/react';
import {
  gridOutline,
  briefcaseOutline,
  cubeOutline,
  personOutline,
} from 'ionicons/icons';

const MechanicTabs: React.FC = () => {
  return (
    <IonTabBar className="mechanic-tab-bar" slot="bottom">
      <IonTabButton tab="dashboard" href="/mechanic/dashboard">
        <IonIcon icon={gridOutline} />
        <IonLabel>Dashboard</IonLabel>
      </IonTabButton>

      <IonTabButton tab="jobs" href="/mechanic/jobs">
        <IonIcon icon={briefcaseOutline} />
        <IonLabel>Jobs</IonLabel>
      </IonTabButton>

      <IonTabButton tab="inventory" href="/mechanic/inventory">
        <IonIcon icon={cubeOutline} />
        <IonLabel>Inventory</IonLabel>
      </IonTabButton>

      <IonTabButton tab="profile" href="/mechanic/profile">
        <IonIcon icon={personOutline} />
        <IonLabel>Profile</IonLabel>
      </IonTabButton>
    </IonTabBar>
  );
};

export default MechanicTabs;