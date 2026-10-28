// src/pages/admin/AdminNotifications.tsx
import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonSpinner } from '@ionic/react';
import { alertCircleOutline, warningOutline } from 'ionicons/icons';
import { getAllBookingsAdmin, getAllInventoryItems } from '../../api/firebaseService';
import { Booking, InventoryItem } from '../../types';
import './Admin.css';

const AdminNotifications: React.FC = () => {
  const [failedPayments, setFailedPayments] = useState<Booking[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [bookings, inventory] = await Promise.all([
        getAllBookingsAdmin(),
        getAllInventoryItems()
      ]);
      
      setFailedPayments(bookings.filter(b => b.paymentStatus === 'failed'));
      setLowStockItems(inventory.filter(i => i.quantity <= i.lowStockThreshold));
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <IonPage>
      <IonContent className="admin-page" fullscreen>
        <div className="admin-container">
          <div className="admin-header">
            <h1>System Alerts</h1>
            <p>Automated notifications for critical events</p>
          </div>

          <div className="admin-content">
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><IonSpinner name="crescent" /></div>
            ) : (
              <>
                <h2 className="admin-section-title">Payment Failures</h2>
                {failedPayments.length === 0 ? (
                  <div className="admin-card" style={{ justifyContent: 'center', padding: 30, color: '#9ca3af' }}>
                    <p style={{ margin: 0 }}>No payment failures detected.</p>
                  </div>
                ) : (
                  <div className="admin-list-grid">
                    {failedPayments.map((b) => (
                      <div key={b.id} className="admin-card" style={{ borderLeft: '4px solid #ef4444' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991b1b' }}>
                          <IonIcon icon={alertCircleOutline} style={{ fontSize: 22 }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#991b1b' }}>Payment Failed</h3>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                            {b.customerName} • Booking #{b.id.slice(0, 8).toUpperCase()} • ₱{b.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <h2 className="admin-section-title" style={{ marginTop: 24 }}>Inventory Alerts</h2>
                {lowStockItems.length === 0 ? (
                  <div className="admin-card" style={{ justifyContent: 'center', padding: 30, color: '#9ca3af' }}>
                    <p style={{ margin: 0 }}>All inventory levels are sufficient.</p>
                  </div>
                ) : (
                  <div className="admin-list-grid">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="admin-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#92400e' }}>
                          <IonIcon icon={warningOutline} style={{ fontSize: 22 }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#92400e' }}>Low Stock: {item.name}</h3>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                            Only {item.quantity} left (Threshold: {item.lowStockThreshold})
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminNotifications;