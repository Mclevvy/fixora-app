// src/pages/admin/AdminReports.tsx
import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonSpinner } from '@ionic/react';
import { peopleOutline, carSportOutline, cashOutline, downloadOutline } from 'ionicons/icons';
import { getAllUsers, getAllBookingsAdmin } from '../../api/firebaseService';
import './Admin.css';

const AdminReports: React.FC = () => {
  const [stats, setStats] = useState({ users: 0, mechanics: 0, bookings: 0, revenue: 0 });
  const [bookingsData, setBookingsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [users, bookings] = await Promise.all([getAllUsers(), getAllBookingsAdmin()]);
      
      const mechanics = users.filter(u => u.role === 'mechanic').length;
      const revenue = bookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + (b.price || 0), 0);
      
      setStats({
        users: users.filter(u => u.role === 'customer').length,
        mechanics,
        bookings: bookings.length,
        revenue
      });
      setBookingsData(bookings);
      setIsLoading(false);
    };
    fetchStats();
  }, []);

  const downloadCSV = () => {
    if (bookingsData.length === 0) return;

    const headers = ['Booking ID', 'Date', 'Customer', 'Service', 'Status', 'Payment Status', 'Price'];
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const b of bookingsData) {
      const row = [
        b.id,
        new Date(b.createdAt).toLocaleDateString(),
        `"${b.customerName}"`,
        b.serviceType,
        b.status,
        b.paymentStatus,
        b.price
      ];
      csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'fixora_report.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <IonPage>
      <IonContent className="admin-page" fullscreen>
        <div className="admin-container">
          
          {/* ✅ CYAN/BLUE HEADER */}
          <div 
            className="admin-header"
            style={{ 
              background: 'linear-gradient(135deg, #00b4d8 0%, #06b6d4 100%)',
              boxShadow: '0 10px 30px -10px rgba(0, 180, 216, 0.5)'
            }}
          >
            <h1>System Reports</h1>
            <p>Platform performance summary</p>
          </div>

          <div className="admin-content">
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><IonSpinner /></div>
            ) : (
              <>
                <div className="admin-stats-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="admin-card">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e40af' }}>
                      <IonIcon icon={peopleOutline} style={{ fontSize: 22 }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{stats.users}</h3>
                      <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Total Customers</p>
                    </div>
                  </div>

                  <div className="admin-card">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#92400e' }}>
                      <IonIcon icon={carSportOutline} style={{ fontSize: 22 }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{stats.mechanics}</h3>
                      <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Verified Mechanics</p>
                    </div>
                  </div>

                  <div className="admin-card">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#065f46' }}>
                      <IonIcon icon={cashOutline} style={{ fontSize: 22 }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>₱{stats.revenue.toLocaleString()}</h3>
                      <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Total Platform Revenue</p>
                    </div>
                  </div>
                </div>

                <h2 className="admin-section-title" style={{ marginTop: 24 }}>Export Data</h2>
                <div className="admin-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Download Transactions</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Generate a CSV file containing all booking history.</p>
                  </div>
                  <button className="admin-btn btn-export" onClick={downloadCSV} style={{ width: '100%', padding: '14px', background: '#0ea5e9', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <IonIcon icon={downloadOutline} style={{ fontSize: 18 }} />
                    Download CSV Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminReports;