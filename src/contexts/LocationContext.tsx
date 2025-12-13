import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LocationData {
  country: string | null;
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
      
      setLocationData({
        country: data.country_name || null,
        city: data.city || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        loading: false,
        error: null,
      });
      
      // Store in localStorage for caching
      localStorage.setItem('userLocation', JSON.stringify({
        country: data.country_name,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: Date.now(),
      }));
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
      
      if (isValid) {
        setLocationData({
          country: parsed.country,
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
