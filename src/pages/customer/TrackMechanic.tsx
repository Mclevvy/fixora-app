// src/pages/customer/TrackMechanic.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent, IonPage, IonIcon, IonSpinner, IonButton,
} from '@ionic/react';
import {
  arrowBackOutline, chatbubbleOutline, timeOutline, checkmarkCircleOutline,
  closeCircleOutline, constructOutline, locationOutline,
} from 'ionicons/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subscribeToBooking } from '../../api/firebaseService';
import { Booking, BookingStatus } from '../../types';
import InteractiveMap from '../../components/InteractiveMap';
import './TrackMechanic.css';

// ✅ WEATHERAPI.COM API KEY
const WEATHER_API_KEY = 'da3cfa93f9474e29871125721260611'; 

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

const getWeatherInfo = (conditionText: string | undefined) => {
  if (!conditionText) return { icon: '⏳', text: 'Loading' };
  
  const text = conditionText.toLowerCase();
  
  if (text.includes('sunny') || text.includes('clear')) return { icon: '☀️', text: conditionText };
  if (text.includes('cloud') || text.includes('overcast')) return { icon: '☁️', text: conditionText };
  if (text.includes('rain') || text.includes('drizzle')) return { icon: '🌧️', text: conditionText };
  if (text.includes('thunder') || text.includes('storm')) return { icon: '⛈️', text: conditionText };
  if (text.includes('snow') || text.includes('ice')) return { icon: '❄️', text: conditionText };
  if (text.includes('fog') || text.includes('mist')) return { icon: '🌫️', text: conditionText };
  
  return { icon: '🌤️', text: conditionText };
};

// ✅ GAGAMITIN NATIN ANG ORAS NG DEVICE PARA HINDI MAGMUKHANG LATE
const formatCurrentTime = () => {
  try {
    return new Date().toLocaleString('en-PH', { 
      timeZone: 'Asia/Manila',
      weekday: 'long', hour: 'numeric', minute: '2-digit', hour12: true
    });
  } catch {
    return 'Just now';
  }
};

const TrackMechanic: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [mechanicWeather, setMechanicWeather] = useState<any>(null);
  const [customerWeather, setCustomerWeather] = useState<any>(null);
  
  const lastFetchTimeRef = useRef<number>(0);
  const lastMechanicLocRef = useRef<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    const unsubscribe = subscribeToBooking(bookingId, (data) => {
      setBooking(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [bookingId]);

  useEffect(() => {
    if (!booking) return;

    const now = Date.now();
    const mLoc = booking.mechanicLocation || booking.location;
    
    let distanceMoved = 0;
    if (lastMechanicLocRef.current) {
      distanceMoved = Number(calculateDistance(
        lastMechanicLocRef.current.lat, lastMechanicLocRef.current.lng, 
        mLoc.latitude, mLoc.longitude
      ) || 0);
    }

    const shouldFetchMechanic = (now - lastFetchTimeRef.current > 600000) || (distanceMoved > 2) || !mechanicWeather;

    const fetchWeather = async (lat: number, lng: number) => {
      try {
        console.log(`🌤️ Fetching WeatherAPI for lat: ${lat}, lng: ${lng}`);
        
        // ✅ WEATHERAPI.COM ENDPOINT
        const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${lat},${lng}&aqi=no`);
        
        if (!res.ok) {
          console.error("❌ WeatherAPI Error Status:", res.status);
          return null;
        }

        const data = await res.json();
        console.log("🌤️ WeatherAPI Response:", data); 

        if (data.current && data.location) {
          return {
            temperature: Math.round(data.current.temp_c),
            conditionText: data.current.condition.text, 
            humidity: data.current.humidity ?? 0,
            windSpeed: Math.round(data.current.wind_kph ?? 0),
            precipitation: data.current.precip_mm ?? 0,
            locationName: data.location.name, // ✅ Makikita natin kung saan galing ang data
          };
        }
        return null;
      } catch (error) {
        console.error('❌ WeatherAPI Fetch failed:', error);
        return null;
      }
    };

    if (shouldFetchMechanic) {
      fetchWeather(mLoc.latitude, mLoc.longitude).then(setMechanicWeather);
      lastFetchTimeRef.current = now;
      lastMechanicLocRef.current = { lat: mLoc.latitude, lng: mLoc.longitude };
    }

    if (booking.location && !customerWeather) {
      fetchWeather(booking.location.latitude, booking.location.longitude).then(setCustomerWeather);
    }

  }, [booking?.mechanicLocation?.latitude, booking?.location?.latitude]);

  const getStatusInfo = (status?: BookingStatus) => {
    switch (status) {
      case 'accepted': return { text: 'On the way', eta: 'Est. 10-15 mins', cssClass: 'accepted', icon: timeOutline };
      case 'in-progress': return { text: 'Service in progress', eta: 'Mechanic is working', cssClass: 'in-progress', icon: constructOutline };
      case 'completed': return { text: 'Service Completed', eta: 'Done', cssClass: 'completed', icon: checkmarkCircleOutline };
      case 'cancelled': return { text: 'Cancelled', eta: 'Booking cancelled', cssClass: 'cancelled', icon: closeCircleOutline };
      default: return { text: 'Pending', eta: 'Waiting for mechanic', cssClass: 'pending', icon: timeOutline };
    }
  };

  if (isLoading) {
    return (
      <IonPage><IonContent className="track-page">
        <div className="track-loading"><IonSpinner name="crescent" /><p style={{ marginTop: 12 }}>Loading tracking data...</p></div>
      </IonContent></IonPage>
    );
  }

  if (!booking) {
    return (
      <IonPage><IonContent className="track-page">
        <div className="track-loading"><h3>Booking not found</h3><IonButton className="track-action-btn primary" onClick={() => navigate('/customer/bookings')} style={{ marginTop: 16 }}>Go Back</IonButton></div>
      </IonContent></IonPage>
    );
  }

  const mechanicLoc = booking.mechanicLocation || { latitude: booking.location.latitude, longitude: booking.location.longitude };

  const distance = booking.mechanicLocation 
    ? calculateDistance(booking.mechanicLocation.latitude, booking.mechanicLocation.longitude, booking.location.latitude, booking.location.longitude)
    : null;

  const statusInfo = getStatusInfo(booking.status);

  const WeatherCard = ({ data, label }: { data: any, label: string }) => {
    if (!data) return null;
    const info = getWeatherInfo(data.conditionText); 
    
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.8)', borderRadius: '16px', padding: '10px 14px', 
        boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.1)', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', color: '#0f172a', width: '100%', maxWidth: '300px', marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '36px', lineHeight: 1 }}>{info.icon}</span>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '38px', fontWeight: 500, letterSpacing: '-1px', lineHeight: 1 }}>{data.temperature}</span>
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '10px', color: '#64748b', marginTop: '4px', marginLeft: '2px', fontWeight: 500 }}><span>°C</span></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', fontSize: '9px', color: '#64748b', fontWeight: 500, marginLeft: '6px' }}>
            <span>Precip: {data.precipitation}mm</span>
            <span>Humidity: {data.humidity}%</span>
            <span>Wind: {data.windSpeed} km/h</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>{label}</div>
          {/* ✅ IPINAKITA ANG LOCATION NAME PARA MALAMAN KUNG SAAN GALING */}
          <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>{data.locationName}</div>
          {/* ✅ GINAMIT ANG ORAS NG DEVICE */}
          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{formatCurrentTime()}</div>
          <div style={{ fontSize: '12px', color: '#0ea5e9', fontWeight: 600, marginTop: '2px' }}>{info.text}</div>
        </div>
      </div>
    );
  };

  return (
    <IonPage>
      <IonContent className="track-page" fullscreen>
        <div className="track-map-container" style={{ position: 'relative' }}>
          
          <button className="track-back-btn" onClick={() => navigate('/customer/bookings')} style={{ zIndex: 1000 }}>
            <IonIcon icon={arrowBackOutline} />
          </button>

          <div style={{ position: 'absolute', top: '70px', right: '10px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
            <WeatherCard data={mechanicWeather} label="Mechanic Area" />
            <WeatherCard data={customerWeather} label="Your Area" />
          </div>

          <InteractiveMap
            latitude={mechanicLoc.latitude} longitude={mechanicLoc.longitude} draggable={false}
            height="100%" zoom={16} secondaryLatitude={booking.location.latitude}
            secondaryLongitude={booking.location.longitude} zoomOnMarkerClick={true}
          />
        </div>

        <div className="track-info-card">
          <div className="track-header-row">
            <div className={`track-status-badge ${statusInfo.cssClass}`}><span className="pulse-dot"></span>{statusInfo.text}</div>
            <div className="track-eta"><IonIcon icon={timeOutline} /><span>{statusInfo.eta}</span></div>
          </div>

          <h2 className="track-mechanic-name">{booking.mechanicName || 'Mechanic'}</h2>
          <p className="track-vehicle-info">{booking.vehicle.make} {booking.vehicle.model} • {booking.serviceType === 'repair' ? 'Repair' : 'Roadside'}</p>

          {distance && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', background: '#f0f9ff', padding: '8px 12px', borderRadius: '8px' }}>
              <IonIcon icon={locationOutline} style={{ color: '#0ea5e9', fontSize: '18px' }} />
              <span style={{ fontSize: '13px', color: '#0369a1', fontWeight: '600' }}>{distance} km away from you</span>
            </div>
          )}

          <div className="track-divider"></div>

          <div className="track-actions">
            <button className="track-action-btn primary" onClick={() => navigate(`/customer/chat/${booking.id}`)} style={{ background: '#00b4d8', boxShadow: '0 8px 20px -5px rgba(0, 180, 216, 0.4)' }}>
              <IonIcon icon={chatbubbleOutline} /> Chat with Mechanic
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TrackMechanic;