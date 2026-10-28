// src/api/geocoding.ts

/**
 * Convert latitude/longitude to a human-readable address
 * using OpenStreetMap Nominatim (free, no API key needed)
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
        },
      }
    );

    if (!response.ok) throw new Error('Geocoding failed');

    const data = await response.json();
    const addr = data.address || {};

    // Build readable address
    const parts = [
      addr.house_number,
      addr.road || addr.street,
      addr.suburb || addr.neighbourhood,
      addr.city || addr.town || addr.village || addr.municipality,
      addr.state || addr.province,
      addr.postcode,
    ].filter(Boolean);

    return parts.join(', ') || data.display_name || 'Unknown location';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }
};