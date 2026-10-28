// src/components/InteractiveMap.tsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import { useIonViewWillLeave, useIonViewDidEnter } from '@ionic/react'; // ✅ DAGDAG
import L from 'leaflet';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

const customerIcon = L.divIcon({
  className: 'custom-customer-pin',
  html: `<div style="background-color: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.4);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface MapProps {
  latitude: number;
  longitude: number;
  onLocationChange?: (lat: number, lng: number) => void;
  draggable?: boolean;
  height?: string;
  zoom?: number;
  secondaryLatitude?: number;
  secondaryLongitude?: number;
}

class MapErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("Map crashed:", error); }
  render() {
    if (this.state.hasError) {
      return <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#9ca3af' }}>Loading map...</div>;
    }
    return this.props.children;
  }
}

const MapUpdater = ({ lat, lng, zoom, secondaryLat, secondaryLng }: { lat: number; lng: number; zoom: number; secondaryLat?: number; secondaryLng?: number; }) => {
  const map = useMap();

  // ✅ FIX 1: Itigil ang running animation BAGO lumabas ang page.
  // Ito ang pumipigil sa "Invalid LatLng (NaN, NaN)" crash.
  useIonViewWillLeave(() => {
    try {
      if (map && typeof map.stop === 'function') {
        map.stop();
      }
    } catch {}
  });

  // ✅ FIX 2: I-recompute ang size kapag bumabalik ang page.
  useIonViewDidEnter(() => {
    try {
      if (map && map.getContainer()) {
        map.invalidateSize();
      }
    } catch {}
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!map) return;

      // ✅ FIX 3: Skip kung 0x0 ang container (hidden o transitioning).
      const size = map.getSize();
      if (!size || size.x === 0 || size.y === 0) return;

      map.invalidateSize();

      if (typeof lat !== 'number' || isNaN(lat) || typeof lng !== 'number' || isNaN(lng)) return;

      try {
        if (typeof secondaryLat === 'number' && !isNaN(secondaryLat) && typeof secondaryLng === 'number' && !isNaN(secondaryLng)) {
          const bounds = L.latLngBounds([lat, lng], [secondaryLat, secondaryLng]);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        } else {
          map.flyTo([lat, lng], zoom, { animate: true, duration: 1.5 });
        }
      } catch (error) {
        console.warn("Map movement error:", error);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      // ✅ FIX 4: I-stop din ang animation kapag nag-unmount / nag-change ang props.
      try {
        if (map && typeof map.stop === 'function') map.stop();
      } catch {}
    };
  }, [lat, lng, zoom, secondaryLat, secondaryLng, map]);

  return null;
};

const LocationMarker: React.FC<{
  latitude: number;
  longitude: number;
  draggable: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
}> = ({ latitude, longitude, draggable, onLocationChange }) => {
  const map = useMapEvents({
    click(e) {
      if (onLocationChange) {
        onLocationChange(e.latlng.lat, e.latlng.lng);
        map.flyTo(e.latlng, map.getZoom());
      }
    },
  });

  if (typeof latitude !== 'number' || isNaN(latitude) || typeof longitude !== 'number' || isNaN(longitude)) {
    return null;
  }

  return (
    <Marker
      position={[latitude, longitude]}
      draggable={draggable}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          if (onLocationChange) {
            onLocationChange(position.lat, position.lng);
          }
        },
      }}
    />
  );
};

const InteractiveMap: React.FC<MapProps> = ({
  latitude,
  longitude,
  onLocationChange,
  draggable = true,
  height = '250px',
  zoom = 16,
  secondaryLatitude,
  secondaryLongitude,
}) => {
  const safeLat = (typeof latitude === 'number' && !isNaN(latitude)) ? latitude : 14.5995;
  const safeLng = (typeof longitude === 'number' && !isNaN(longitude)) ? longitude : 120.9842;
  const safeSecondaryLat = (typeof secondaryLatitude === 'number' && !isNaN(secondaryLatitude)) ? secondaryLatitude : undefined;
  const safeSecondaryLng = (typeof secondaryLongitude === 'number' && !isNaN(secondaryLongitude)) ? secondaryLongitude : undefined;

  return (
    <div style={{ height, width: '100%', borderRadius: '14px', overflow: 'hidden', border: '1.5px solid #e5e7eb', position: 'relative', zIndex: 1 }}>
      <MapErrorBoundary>
        <MapContainer center={[safeLat, safeLng]} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} zoomControl={false}>
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
          <ZoomControl position="topright" />
          <MapUpdater lat={safeLat} lng={safeLng} zoom={zoom} secondaryLat={safeSecondaryLat} secondaryLng={safeSecondaryLng} />
          <LocationMarker latitude={safeLat} longitude={safeLng} draggable={draggable} onLocationChange={onLocationChange} />
          {safeSecondaryLat !== undefined && safeSecondaryLng !== undefined && (
            <Marker position={[safeSecondaryLat, safeSecondaryLng]} icon={customerIcon} />
          )}
        </MapContainer>
      </MapErrorBoundary>
    </div>
  );
};

export default InteractiveMap;