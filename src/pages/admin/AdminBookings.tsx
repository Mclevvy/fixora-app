// src/pages/admin/AdminBookings.tsx
import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonSpinner } from '@ionic/react';
import { cashOutline, searchOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { getAllBookingsAdmin } from '../../api/firebaseService';
import { Booking } from '../../types';
import './Admin.css';

const AdminBookings: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    getAllBookingsAdmin().then((data) => {
      setBookings(data);
      setFilteredBookings(data);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = bookings;
    if (statusFilter !== 'all') result = result.filter(b => b.status === statusFilter);
    if (search) {
      result = result.filter(b => 
        b.customerName.toLowerCase().includes(search.toLowerCase()) || 
        b.id.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredBookings(result);
  }, [bookings, statusFilter, search]);

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-green';
    if (status === 'cancelled') return 'bg-red';
    if (status === 'in-progress') return 'bg-blue';
    return 'bg-yellow';
  };

  // ✅ BINAGO: 10% Commission lang ang kukunin ni Admin
  const adminCommission = bookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + ((b.price || 0) * 0.10), 0);

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
            <h1>All Bookings</h1>
            <p>Monitor transactions platform-wide</p>
          </div>

          <div className="admin-content">
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <h3>{bookings.length}</h3>
                <p>Total Bookings</p>
              </div>
              <div className="admin-stat-card">
                {/* ✅ IPINAKITA ANG 10% COMMISSION */}
                <h3>₱{adminCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                <p>Admin Commission (10%)</p>
              </div>
            </div>

            <div className="admin-search-bar">
              <IonIcon icon={searchOutline} style={{ color: '#9ca3af', fontSize: 20 }} />
              <input 
                type="text" 
                placeholder="Search by customer or ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="admin-filters">
              {['all', 'pending', 'accepted', 'in-progress', 'completed', 'cancelled'].map((status) => (
                <div 
                  key={status}
                  className={`admin-filter-btn ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {status.replace('-', ' ')}
                </div>
              ))}
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><IonSpinner /></div>
            ) : filteredBookings.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>No bookings found.</p>
            ) : (
              <div className="admin-list-grid">
                {filteredBookings.map((b) => (
                  <div 
                    key={b.id} 
                    className="admin-card" 
                    onClick={() => navigate(`/admin/bookings/${b.id}`)} 
                    style={{ cursor: 'pointer' }} 
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
                      <IonIcon icon={cashOutline} style={{ fontSize: 22 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1f2937' }}>
                        {b.serviceType === 'repair' ? 'Repair Service' : 'Roadside'}
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.customerName} • #{b.id.slice(0, 6).toUpperCase()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#0ea5e9', fontSize: 15 }}>
                        ₱{b.price > 0 ? b.price.toLocaleString() : 'TBD'}
                      </div>
                      <span className={`admin-badge ${getStatusColor(b.status)}`} style={{ marginTop: 4, display: 'inline-block' }}>
                        {b.status.toUpperCase()}
                      </span>
                    </div>
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

export default AdminBookings;