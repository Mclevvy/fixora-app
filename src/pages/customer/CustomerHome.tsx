// src/pages/customer/CustomerHome.tsx
import React, { useState, useEffect } from 'react';
import {
  IonContent, IonPage, IonIcon, IonSpinner, IonRefresher, IonRefresherContent,
} from '@ionic/react';
import {
  notificationsOutline, searchOutline, star, locationOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllMechanics } from '../../api/firebaseService';
import { Mechanic, ServiceCategory } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import './CustomerHome.css';

const categories: { key: ServiceCategory; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'repair', label: 'Repair' },
  { key: 'roadside', label: 'Roadside' }, { key: 'maintenance', label: 'Maintenance' },
  { key: 'electrical', label: 'Electrical' }, { key: 'engine', label: 'Engine' },
];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

const CustomerHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [filteredMechanics, setFilteredMechanics] = useState<Mechanic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('all');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadMechanics();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => console.error('Location permission denied', error)
      );
    }
  }, []);

  useEffect(() => { filterMechanics(); }, [selectedCategory, searchText, mechanics]);

  const loadMechanics = async () => {
    setIsLoading(true);
    try {
      const data = await getAllMechanics();
      const sorted = data.sort((a, b) => {
        if (a.status === 'available' && b.status !== 'available') return -1;
        if (a.status !== 'available' && b.status === 'available') return 1;
        return b.rating - a.rating;
      });
      setMechanics(sorted); setFilteredMechanics(sorted);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const filterMechanics = () => {
    let filtered = [...mechanics];
    if (selectedCategory !== 'all') filtered = filtered.filter((m) => m.category === selectedCategory);
    if (searchText.trim()) {
      filtered = filtered.filter((m) => m.fullName.toLowerCase().includes(searchText.toLowerCase()) || m.specialization.toLowerCase().includes(searchText.toLowerCase()));
    }
    setFilteredMechanics(filtered);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadMechanics(); (event.target as HTMLIonRefresherElement).complete();
  };

  return (
    <IonPage>
      <IonContent className="customer-home" fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}><IonRefresherContent /></IonRefresher>
        <div className="home-container">
          <div className="home-header">
            <div className="header-top">
              <div className="header-greeting">
                <p className="greeting-subtext">Welcome,</p>
                <h2 className="greeting-name">{user?.fullName || 'Customer'}</h2>
              </div>
              <div className="header-icons">
                <div className="icon-btn" onClick={() => navigate('/customer/notifications')} style={{ cursor: 'pointer' }}>
                  <IonIcon icon={notificationsOutline} />
                  {unreadCount > 0 && (<span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>)}
                </div>
              </div>
            </div>

            <h1 className="home-title">What Service Do You<br />Need Today?</h1>

            <div className="emergency-card">
              <div className="emergency-content">
                <span className="emergency-badge">EMERGENCY REPAIR</span>
                <h2 className="emergency-title">Need a mechanic<br />right away?</h2>
                <p className="emergency-subtitle">Get roadside assistance in minutes.</p>
                <button className="book-now-btn" onClick={() => navigate('/customer/book')}>BOOK NOW</button>
              </div>
              <img src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=300" alt="Engine" className="emergency-image" />
            </div>
          </div>

          <div className="search-bar">
            <IonIcon icon={searchOutline} />
            <input type="text" placeholder="Search for mechanic..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          </div>

          <div className="section-padding">
            <div className="section-header">
              <h2 className="section-title">Categories</h2>
              <button className="see-all-btn">See all</button>
            </div>
            <div className="categories-scroll">
              {categories.map((cat) => (
                <div key={cat.key} className={`category-pill ${selectedCategory === cat.key ? 'active' : ''}`} onClick={() => setSelectedCategory(cat.key)}>{cat.label}</div>
              ))}
            </div>
          </div>

          <div className="section-padding" style={{ paddingBottom: '30px' }}>
            <div className="section-header">
              <h2 className="section-title">Top Rated & Available Mechanics</h2>
            </div>

            {isLoading ? (
              <div className="loading-container"><IonSpinner name="crescent" /><p>Loading mechanics...</p></div>
            ) : filteredMechanics.length === 0 ? (
              <div className="empty-container"><IonIcon icon={searchOutline} style={{ fontSize: '60px', color: '#d1d5db' }} /><h3>No mechanics found</h3><p>Try a different category or search term</p></div>
            ) : (
              <div className="mechanics-grid">
                {filteredMechanics.map((mechanic) => {
                  const dist = userLocation && mechanic.location ? calculateDistance(userLocation.lat, userLocation.lng, mechanic.location.latitude, mechanic.location.longitude) : null;
                  return (
                    <div 
                      key={mechanic.id} 
                      className="mechanic-card" 
                      onClick={() => navigate(`/customer/mechanic/${mechanic.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="mechanic-avatar-wrapper">
                        <img src={mechanic.profileImage || 'https://ionicframework.com/docs/img/demos/avatar.svg'} alt={mechanic.fullName} className="mechanic-avatar" />
                        <div className={`availability-dot ${mechanic.status}`} />
                      </div>
                      <div className="mechanic-info">
                        <h3 className="mechanic-name">{mechanic.fullName}</h3>
                        <p className="mechanic-specialty">{mechanic.specialization}</p>
                        <div className="mechanic-meta" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', background: 'transparent', padding: 0 }}>
                          {mechanic.services && mechanic.services.length > 0 ? (
                            mechanic.services.slice(0, 2).map((s, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '12px', color: '#334155' }}>
                                <span>{s.name}</span>
                                <span style={{ fontWeight: '800' }}>₱{s.price}</span>
                              </div>
                            ))
                          ) : (
                            <span style={{ fontSize: '12px', color: '#64748b' }}>No services listed</span>
                          )}
                          <div className="mechanic-rating" style={{ marginTop: '4px', width: '100%', justifyContent: 'space-between' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <IonIcon icon={star} style={{ color: '#f59e0b', fontSize: '12px' }} />
                              {mechanic.rating.toFixed(1)} ({mechanic.totalReviews})
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{dist ? `${dist} km away` : 'Distance unknown'}</span>
                          </div>
                        </div>
                      </div>
                      <button className="book-btn" style={{ background: '#e0f2fe', color: '#0ea5e9', border: 'none' }}>
                        View Services
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CustomerHome;