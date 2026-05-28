import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LocationData {
  country: string | null;
  state: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
}

interface LocationContextType extends LocationData {
  refreshLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [locationData, setLocationData] = useState<LocationData>({
    country: null,
    state: null,
    city: null,
    latitude: null,
    longitude: null,
    loading: true,
    error: null,
  });

  const fetchLocationFromIP = async () => {
    try {
      // Use ipapi.co for IP-based geolocation (free tier)
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error('Failed to fetch location');

      const data = await response.json();

      const lat = data.latitude ?? null;
      const lon = data.longitude ?? null;

      let resolvedState: string | null =
        data.region_name || data.region || data.region_code || null;

      // If the provider doesn't return a state but we do have coordinates,
      // try a lightweight reverse-geocode to derive a region/state.
      if (!resolvedState && lat && lon) {
        try {
          const revRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
              String(lat)
            )}&lon=${encodeURIComponent(String(lon))}&zoom=10&addressdetails=1`,
            { headers: { 'Accept': 'application/json' } }
          );
          if (revRes.ok) {
            const rev = await revRes.json();
            const addr = rev?.address ?? {};
            resolvedState =
              addr.state || addr.region || addr.state_district || addr.county || null;
          }
        } catch (e) {
          console.warn('Reverse geocode failed:', e);
        }
      }

      if (!resolvedState) {
        console.warn('State missing from geolocation provider:', {
          country: data.country_name,
          city: data.city,
          region: data.region,
          region_name: data.region_name,
          region_code: data.region_code,
        });
      }

      setLocationData({
        country: data.country_name || null,
        state: resolvedState,
        city: data.city || null,
        latitude: lat,
        longitude: lon,
        loading: false,
        error: null,
      });

      // Store in localStorage for caching
      localStorage.setItem(
        'userLocation',
        JSON.stringify({
          country: data.country_name,
          state: resolvedState,
          city: data.city,
          latitude: lat,
          longitude: lon,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Error fetching location:', error);
      setLocationData(prev => ({
        ...prev,
        loading: false,
        error: 'Could not detect location',
      }));
    }
  };

  const refreshLocation = () => {
    setLocationData(prev => ({ ...prev, loading: true, error: null }));
    fetchLocationFromIP();
  };

  useEffect(() => {
    // Check cached location first (valid for 24 hours)
    const cached = localStorage.getItem('userLocation');
    if (cached) {
      const parsed = JSON.parse(cached);
      const isValid = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;

      // If cache is valid but missing state while having a city, refresh in background
      // (this avoids being stuck with a partial cached location).
      const shouldUseCache = isValid && (parsed.state || !parsed.city);

      if (shouldUseCache) {
        setLocationData({
          country: parsed.country,
          state: parsed.state || null,
          city: parsed.city,
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          loading: false,
          error: null,
        });
        return;
      }
    }

    fetchLocationFromIP();
  }, []);

  return (
    <LocationContext.Provider value={{ ...locationData, refreshLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useUserLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useUserLocation must be used within LocationProvider');
  }
  return context;
};
