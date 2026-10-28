// src/components/TrackMap.tsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom icons
const mechanicIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div class="marker-pin mechanic">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const customerIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div class="marker-pin customer">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const FitBounds: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  const key = points.map((p) => p.join(',')).join('|');

  useEffect(() => {
    if (points.length >= 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);

  return null;
};

interface TrackMapProps {
  customerLat: number;
  customerLng: number;
  mechanicLat?: number;
  mechanicLng?: number;
  height?: string;
}

const TrackMap: React.FC<TrackMapProps> = ({
  customerLat,
  customerLng,
  mechanicLat,
  mechanicLng,
  height = '340px',
}) => {
  const hasMechanic = !!mechanicLat && !!mechanicLng;

  const points: [number, number][] = hasMechanic
    ? [
        [customerLat, customerLng],
        [mechanicLat!, mechanicLng!],
      ]
    : [[customerLat, customerLng]];

  const center: [number, number] = hasMechanic
    ? [(customerLat + mechanicLat!) / 2, (customerLng + mechanicLng!) / 2]
    : [customerLat, customerLng];

  return (
    <div
      style={{
        height,
        width: '100%',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      }}
    >
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[customerLat, customerLng]} icon={customerIcon}>
          <Popup>Your Location</Popup>
        </Marker>

        {hasMechanic && (
          <>
            <Marker position={[mechanicLat!, mechanicLng!]} icon={mechanicIcon}>
              <Popup>Mechanic</Popup>
            </Marker>
            <Polyline
              positions={[
                [mechanicLat!, mechanicLng!],
                [customerLat, customerLng],
              ]}
              pathOptions={{
                color: '#1a4d3e',
                weight: 4,
                opacity: 0.75,
                dashArray: '10, 8',
                lineCap: 'round',
              }}
            />
          </>
        )}

        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
};

export default TrackMap;