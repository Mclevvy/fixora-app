// src/pages/mechanic/MechanicProfile.tsx
import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonSpinner,
  IonInput,
  IonButton,
  IonToast,
  IonTextarea,
} from '@ionic/react';
import { 
  saveOutline, logOutOutline, star, locationOutline, navigateOutline, addOutline, trashOutline,
  cameraOutline, searchOutline // ✅ IDINAGDAG ANG searchOutline
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getMechanicProfile,
  saveMechanicProfile,
  uploadProfilePicture,
} from '../../api/firebaseService';
import { reverseGeocode } from '../../api/geocoding';
import { Mechanic, MechanicSchedule, ServiceItem } from '../../types';
import InteractiveMap from '../../components/InteractiveMap';
import './MechanicProfile.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface LocalProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  profileImage?: string;
  specialization: string;
  specializations: string[];
  category: 'repair' | 'roadside' | 'both';
  status: 'available' | 'busy' | 'offline';
  rating: number;
  totalReviews: number;
  services: ServiceItem[]; 
  location: { latitude: number; longitude: number; address?: string };
  schedule: MechanicSchedule;
}

const defaultProfile = (id: string, fullName: string, email: string, profileImage?: string): LocalProfile => ({
  id, fullName, email, phone: '', profileImage: profileImage || '', specialization: 'General Repair', specializations: [],
  category: 'repair', status: 'offline', rating: 0, totalReviews: 0, 
  services: [], 
  location: { latitude: 14.5995, longitude: 120.9842, address: '' },
  schedule: { days: [], startTime: '08:00', endTime: '18:00' },
});

const MechanicProfile: React.FC = () => {
  const { user, logout, updateUser } = useAuth(); 
  const navigate = useNavigate();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false); // ✅ BAGONG STATE
  const [toast, setToast] = useState({ show: false, msg: '', color: 'success' });

  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const p: any = await getMechanicProfile(user.id);
      if (p) {
        setProfile({
          id: user.id, fullName: p.fullName || user.fullName || '', email: p.email || user.email || '',
          profileImage: p.profileImage || user.profileImage || '', 
          phone: p.phone || '', specialization: p.specialization || 'General Repair',
          specializations: p.specializations || [], category: p.category || 'repair',
          status: p.status || 'offline', rating: p.rating || 0, totalReviews: p.totalReviews || 0,
          services: p.services || [], 
          location: p.location || { latitude: 14.5995, longitude: 120.9842, address: '' },
          schedule: p.schedule || { days: [], startTime: '08:00', endTime: '18:00' },
        });
      } else {
        setProfile(defaultProfile(user.id, user.fullName || '', user.email || '', user.profileImage));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !profile) return;

    if (!file.type.startsWith('image/')) {
      setToast({ show: true, msg: 'Please select an image file', color: 'danger' });
      return;
    }

    setIsUploadingImage(true);
    try {
      const newImageUrl = await uploadProfilePicture(user.id, file);
      setProfile({ ...profile, profileImage: newImageUrl });
      updateUser({ ...user, profileImage: newImageUrl }); 
      setToast({ show: true, msg: 'Profile picture updated!', color: 'success' });
    } catch (error) {
      setToast({ show: true, msg: 'Failed to upload image', color: 'danger' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddService = () => {
    if (!newServiceName.trim() || !newServicePrice.trim() || !profile) return;
    const newService: ServiceItem = {
      id: Date.now().toString(), 
      name: newServiceName.trim(),
      price: Number(newServicePrice),
    };
    setProfile({
      ...profile,
      services: [...profile.services, newService],
    });
    setNewServiceName('');
    setNewServicePrice('');
  };

  const handleRemoveService = (id: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      services: profile.services.filter((s) => s.id !== id),
    });
  };

  // ✅ BAGONG FUNCTION: Mag-search ng address papuntang coordinates
  const handleSearchAddress = async () => {
    if (!profile || !profile.location.address?.trim()) return;
    
    setIsSearchingAddress(true);
    try {
      const query = encodeURIComponent(profile.location.address);
      // Gumagamit ng OpenStreetMap Nominatim API para maghanap ng Lat/Lng base sa text
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
        setProfile({
          ...profile,
          location: { ...profile.location, latitude: lat, longitude: lon }
        });
        setToast({ show: true, msg: 'Location found on map!', color: 'success' });
      } else {
        setToast({ show: true, msg: 'Address not found. Try a more specific location.', color: 'warning' });
      }
    } catch (error) {
      console.error(error);
      setToast({ show: true, msg: 'Failed to search address.', color: 'danger' });
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      setToast({ show: true, msg: 'Geolocation not supported by browser', color: 'danger' });
      return;
    }
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setProfile((prev) => prev ? { ...prev, location: { ...prev.location, latitude: lat, longitude: lng } } : null);
        try {
          const fetchedAddress = await reverseGeocode(lat, lng);
          if (fetchedAddress) {
            setProfile((prev) => prev ? { ...prev, location: { ...prev.location, address: fetchedAddress } } : null);
          }
        } catch (error) { console.error(error); }
        setIsLocating(false);
        setToast({ show: true, msg: 'GPS captured! Please click Save.', color: 'success' });
      },
      (error) => {
        console.error(error);
        setIsLocating(false);
        setToast({ show: true, msg: 'GPS failed. Pwede mong i-drag ang pin sa mapa sa baba.', color: 'danger' });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleMapLocationChange = async (lat: number, lng: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      location: { ...profile.location, latitude: lat, longitude: lng }
    });
    try {
      const fetchedAddress = await reverseGeocode(lat, lng);
      if (fetchedAddress) {
        setProfile((prev) => prev ? { ...prev, location: { ...prev.location, address: fetchedAddress } } : null);
      }
    } catch (error) { console.error(error); }
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      const data: Partial<Mechanic> = {
        fullName: profile.fullName, email: profile.email, phone: profile.phone,
        profileImage: profile.profileImage, 
        specialization: profile.specialization, specializations: profile.specializations,
        category: profile.category, status: profile.status, 
        services: profile.services, 
        location: profile.location, schedule: profile.schedule,
      };
      await saveMechanicProfile(profile.id, data);
      setToast({ show: true, msg: 'Profile updated successfully', color: 'success' });
    } catch (e) {
      console.error(e);
      setToast({ show: true, msg: 'Update failed', color: 'danger' });
    }
  };

  const toggleDay = (day: string) => {
    if (!profile) return;
    const has = profile.schedule.days.includes(day);
    setProfile({
      ...profile,
      schedule: { ...profile.schedule, days: has ? profile.schedule.days.filter((d: string) => d !== day) : [...profile.schedule.days, day] },
    });
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  if (isLoading || !profile) {
    return <IonPage><IonContent><div className="mech-center"><IonSpinner name="crescent" /></div></IonContent></IonPage>;
  }

  return (
    <IonPage>
      <IonContent className="mech-profile" fullscreen>
        <div className="mp-header">
          
          <label htmlFor="mech-profile-upload" style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}>
            <div className="mp-avatar" style={{ overflow: 'hidden', padding: 0 }}>
              {isUploadingImage ? (
                <IonSpinner name="crescent" style={{ color: 'white' }} />
              ) : profile.profileImage ? (
                <img src={profile.profileImage} alt={profile.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile.fullName.charAt(0).toUpperCase() || 'M'
              )}
            </div>
            
            <div style={{
              position: 'absolute', bottom: '0px', right: '0px', background: '#ffffff', 
              borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', border: '2px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10
            }}>
              <IonIcon icon={cameraOutline} style={{ color: '#0ea5e9', fontSize: '18px' }} />
            </div>
          </label>
          <input id="mech-profile-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={isUploadingImage} />

          <h1>{profile.fullName}</h1>
          <p>{profile.email}</p>

          <div className="mp-status-selector">
            <button className={`mp-status-btn available ${profile.status === 'available' ? 'active' : ''}`} onClick={() => setProfile({ ...profile, status: 'available' })}>Available</button>
            <button className={`mp-status-btn busy ${profile.status === 'busy' ? 'active' : ''}`} onClick={() => setProfile({ ...profile, status: 'busy' })}>Busy</button>
            <button className={`mp-status-btn offline ${profile.status === 'offline' ? 'active' : ''}`} onClick={() => setProfile({ ...profile, status: 'offline' })}>Offline</button>
          </div>
        </div>

        <div className="mp-section">
          <h2>Customer Preview</h2>
          <div className="mp-card-preview">
            <div className="mp-preview-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profile.profileImage ? (
                <img src={profile.profileImage} alt={profile.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="mp-preview-info">
              <h3>{profile.fullName}</h3>
              <p>{profile.specialization}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                  {profile.services.length > 0 ? `From ₱${profile.services[0].price}` : 'No services set'}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IonIcon icon={star} style={{ color: '#f59e0b' }} /> {profile.rating.toFixed(1)} ({profile.totalReviews})
                </span>
              </div>
            </div>
            <span className={`mp-preview-status ${profile.status}`}>{profile.status}</span>
          </div>
        </div>

        <div className="mp-section">
          <h2>Basic Info</h2>
          <div className="mp-card">
            <IonInput label="Full Name" labelPlacement="floating" value={profile.fullName} onIonInput={(e) => setProfile({ ...profile, fullName: e.detail.value || '' })} className="mp-input" />
            <IonInput label="Phone" labelPlacement="floating" value={profile.phone} onIonInput={(e) => setProfile({ ...profile, phone: e.detail.value || '' })} className="mp-input" />
          </div>
        </div>

        <div className="mp-section">
          <h2>My Services & Prices</h2>
          <div className="mp-card">
            {profile.services.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px 0' }}>No services added yet. Add one below.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {profile.services.map((service) => (
                  <div key={service.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{service.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#0ea5e9' }}>₱{service.price}</span>
                      <button onClick={() => handleRemoveService(service.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>
                        <IonIcon icon={trashOutline} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <IonInput placeholder="Service Name (e.g. Vulcanize)" value={newServiceName} onIonInput={(e) => setNewServiceName(e.detail.value || '')} className="mp-input" style={{ flex: 2, marginBottom: 0 }} />
              <IonInput type="number" placeholder="Price" value={newServicePrice} onIonInput={(e) => setNewServicePrice(e.detail.value || '')} className="mp-input" style={{ flex: 1, marginBottom: 0 }} />
              <IonButton onClick={handleAddService} style={{ '--background': '#0ea5e9', height: '44px', margin: 0 }}>
                <IonIcon icon={addOutline} />
              </IonButton>
            </div>
          </div>
        </div>

        <div className="mp-section">
          <h2>Work Schedule</h2>
          <div className="mp-card">
            <p className="mp-label">Working Days</p>
            <div className="mp-chips">
              {DAYS.map((d) => (
                <button key={d} className={`mp-chip small ${profile.schedule.days.includes(d) ? 'active' : ''}`} onClick={() => toggleDay(d)}>{d}</button>
              ))}
            </div>
            <div className="mp-time-row">
              <IonInput type="time" label="Start" labelPlacement="floating" value={profile.schedule.startTime} onIonInput={(e) => setProfile({ ...profile, schedule: { ...profile.schedule, startTime: e.detail.value || '' } })} className="mp-input half" />
              <IonInput type="time" label="End" labelPlacement="floating" value={profile.schedule.endTime} onIonInput={(e) => setProfile({ ...profile, schedule: { ...profile.schedule, endTime: e.detail.value || '' } })} className="mp-input half" />
            </div>
          </div>
        </div>

        <div className="mp-section">
          <h2>Shop / Base Location</h2>
          <div className="mp-card">
            <IonTextarea 
              label="Address" 
              labelPlacement="floating" 
              value={profile.location.address} 
              onIonInput={(e) => setProfile({ ...profile, location: { ...profile.location, address: e.detail.value || '' } })} 
              autoGrow 
              className="mp-input" 
            />
            
            {/* ✅ BAGONG DAGDAG: SEARCH ADDRESS BUTTON */}
            <button 
              onClick={handleSearchAddress} 
              disabled={isSearchingAddress || !profile.location.address}
              style={{ 
                width: '100%', padding: '12px', marginTop: '8px', 
                background: isSearchingAddress || !profile.location.address ? '#e2e8f0' : '#0ea5e9', 
                color: isSearchingAddress || !profile.location.address ? '#94a3b8' : 'white', 
                border: 'none', borderRadius: '8px', fontWeight: 'bold', 
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', 
                cursor: isSearchingAddress || !profile.location.address ? 'not-allowed' : 'pointer' 
              }}
            >
              {isSearchingAddress ? <IonSpinner name="crescent" style={{ width: '16px', height: '16px' }} /> : <IonIcon icon={searchOutline} />}
              {isSearchingAddress ? 'Searching...' : 'Find Address on Map'}
            </button>

            <button onClick={handleGetGPS} disabled={isLocating} style={{ width: '100%', padding: '12px', marginTop: '8px', background: '#e0f2fe', color: '#0ea5e9', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              {isLocating ? <IonSpinner name="crescent" style={{ width: '16px', height: '16px' }} /> : <IonIcon icon={navigateOutline} />}
              {isLocating ? 'Getting GPS...' : 'Use Current GPS Location'}
            </button>

            <div style={{ marginTop: '16px' }}>
              <InteractiveMap latitude={profile.location.latitude} longitude={profile.location.longitude} onLocationChange={handleMapLocationChange} draggable={true} height="200px" zoom={15} />
            </div>
          </div>
        </div>

        <div className="mp-actions">
          <IonButton expand="block" onClick={handleSave} className="mp-save">
            <IonIcon icon={saveOutline} slot="start" /> Save Changes
          </IonButton>
          <IonButton expand="block" fill="outline" color="danger" onClick={handleLogout}>
            <IonIcon icon={logOutOutline} slot="start" /> Logout
          </IonButton>
        </div>

        <IonToast isOpen={toast.show} onDidDismiss={() => setToast({ ...toast, show: false })} message={toast.msg} duration={3000} color={toast.color} />
      </IonContent>
    </IonPage>
  );
};

export default MechanicProfile;