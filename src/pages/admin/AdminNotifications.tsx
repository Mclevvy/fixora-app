// src/pages/admin/AdminNotifications.tsx
import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonSpinner } from '@ionic/react';
import { alertCircleOutline, warningOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { getAllBookingsAdmin } from '../../api/firebaseService';
import { Booking, InventoryItem } from '../../types';
import './Admin.css';

const AdminNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [failedPayments, setFailedPayments] = useState<Booking[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAllBookingsAdmin().then((bookings) => {
      setFailedPayments(bookings.filter(b => b.paymentStatus === 'failed'));
      setIsLoading(false);
    });

    const unsubInventory = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const inventoryData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
      
      const lowStock = inventoryData.filter(i => {
        const qty = Number(i.quantity) || 0;
        const threshold = Number(i.lowStockThreshold) || 0;
        return qty <= threshold;
      });
      
      setLowStockItems(lowStock);
    }, (error) => {
      console.error("Error listening to inventory:", error);
    });

    return () => unsubInventory();
  }, []);

  return (
    <IonPage>
      <IonContent className="admin-page" fullscreen>
        <div className="admin-container">
          
          {/* ✅ BINAGO: Cyan/Blue Gradient Header */}
          <div 
            className="admin-header"
            style={{ 
              background: 'linear-gradient(135deg, #00b4d8 0%, #06b6d4 100%)',
              boxShadow: '0 10px 30px -10px rgba(0, 180, 216, 0.5)'
            }}
          >
            <h1>System Alerts</h1>
            <p>Automated notifications for critical events</p>
          </div>

          <div className="admin-content">
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><IonSpinner name="crescent" /></div>
            ) : (
              <>
                {/* ================= PAYMENT FAILURES ================= */}
                <h2 className="admin-section-title">Payment Failures</h2>
                {failedPayments.length === 0 ? (
                  <div className="admin-card" style={{ justifyContent: 'center', padding: 30, color: '#9ca3af' }}>
                    <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 24, color: '#10b981', marginRight: 8 }} />
                    <p style={{ margin: 0 }}>No payment failures detected.</p>
                  </div>
                ) : (
                  <div className="admin-list-grid">
                    {failedPayments.map((b) => (
                      <div 
                        key={b.id} 
                        className="admin-card" 
                        style={{ borderLeft: '4px solid #ef4444', cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/bookings/${b.id}`)}
                      >
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

                {/* ================= INVENTORY ALERTS ================= */}
                <h2 className="admin-section-title" style={{ marginTop: 24 }}>Inventory Alerts</h2>
                {lowStockItems.length === 0 ? (
                  <div className="admin-card" style={{ justifyContent: 'center', padding: 30, color: '#9ca3af' }}>
                    <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 24, color: '#10b981', marginRight: 8 }} />
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