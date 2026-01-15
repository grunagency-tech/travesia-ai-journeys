import { useState, useEffect, useRef } from "react";
import { MapPin, Calendar, Users, DollarSign, Clock } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { getDestinationImage } from "@/lib/destinationImages";

interface ItineraryHeaderProps {
  title: string;
  destination?: string;
  origin?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  budget?: number;
  duration?: number;
  customImage?: string;
}

// Normalize text for matching (remove accents, lowercase)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

// Clean a location string for matching/searching
const cleanLocationToken = (text: string): string => {
  return text
    .replace(/\(.*?\)/g, " ")
    .replace(/[|•]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    // remove common prepositions that often appear when we infer destination from titles
    .replace(/^((viaje|trip)\s+)?(a|en|to|in)\s+/i, "");
};

// Extract city name from destination string (e.g., "Lisboa, Portugal" -> "Lisboa")
const extractCityName = (destination: string): string => {
  const cleaned = cleanLocationToken(
    destination
      .replace(/[^\p{L}\p{N}\s,–\-:]/gu, " ")
      .replace(/\s+/g, " ")
  );

  const parts = cleaned.split(/[,:\-–]/);
  return cleanLocationToken(parts[0] || cleaned);
};

const postgrestQuote = (value: string) => `"${value.replace(/"/g, "\\\"")}"`;

// Search for destination image in database
const getDestinationImageFromDB = async (destination: string): Promise<string | null> => {
  try {
    // Extract just the city name for better matching
    const cityName = extractCityName(destination);
    if (!cityName) return null;

    const normalizedCity = normalizeText(cityName);
    const normalizedFull = normalizeText(destination);

    // Try to also infer a country token (helps for inputs like "Lisboa Portugal")
    const countryToken = cleanLocationToken(destination.split(',').slice(1).join(',')).slice(0, 60);

    console.log('Searching for destination image:', { destination, cityName, countryToken });

    // 1) Case-insensitive exact match (best result)
    const { data: exactMatch, error: exactError } = await supabase
      .from('destination_images')
      .select('image_url, city_name, city_name_en')
      .or(
        `city_name.ilike.${postgrestQuote(cityName)},city_name_en.ilike.${postgrestQuote(cityName)}`
      )
      .limit(1)
      .maybeSingle();

    if (exactError) console.warn('Exact match query error:', exactError);

    if (exactMatch?.image_url) {
      console.log('Found exact match:', exactMatch.city_name);
      return exactMatch.image_url;
    }

    // 2) Partial match (works when destination comes inside a longer string)
    const pattern = `%${cityName}%`;
    const { data: partialMatch, error: partialError } = await supabase
      .from('destination_images')
      .select('image_url, city_name, city_name_en')
      .or(
        `city_name.ilike.${postgrestQuote(pattern)},city_name_en.ilike.${postgrestQuote(pattern)}`
      )
      .limit(1)
      .maybeSingle();

    if (partialError) console.warn('Partial match query error:', partialError);

    if (partialMatch?.image_url) {
      console.log('Found partial match:', partialMatch.city_name);
      return partialMatch.image_url;
    }

    // 3) Country fallback (if provided)
    if (countryToken) {
      const countryPattern = `%${countryToken}%`;
      const { data: countryMatch } = await supabase
        .from('destination_images')
        .select('image_url, city_name, city_name_en')
        .or(`country.ilike.${postgrestQuote(countryPattern)}`)
        .limit(1)
        .maybeSingle();

      if (countryMatch?.image_url) {
        console.log('Found country match:', countryMatch.city_name);
        return countryMatch.image_url;
      }
    }

    // 4) Fallback: fetch some and do fuzzy match
    const { data: allImages } = await supabase
      .from('destination_images')
      .select('image_url, city_name, city_name_en')
      .limit(300);

    if (allImages) {
      const match = allImages.find((item) => {
        const itemCity = normalizeText(item.city_name || '');
        const itemCityEn = normalizeText(item.city_name_en || '');
        return (
          itemCity === normalizedCity ||
          itemCityEn === normalizedCity ||
          itemCity.includes(normalizedCity) ||
          itemCityEn.includes(normalizedCity) ||
          normalizedCity.includes(itemCity) ||
          normalizedCity.includes(itemCityEn) ||
          normalizedFull.includes(itemCity) ||
          normalizedFull.includes(itemCityEn)
        );
      });
      if (match?.image_url) {
        console.log('Found fuzzy match:', match.city_name);
        return match.image_url;
      }
    }

    console.log('No destination image found for:', destination);
    return null;
  } catch (error) {
    console.error('Error fetching destination image:', error);
    return null;
  }
};

const geocodeLocation = async (location: string): Promise<[number, number] | null> => {
  try {
    // Use the full location string for better geocoding accuracy
    console.log('Geocoding location:', location);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
      { headers: { 'User-Agent': 'TravesIA/1.0' } }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      console.log('Geocode result:', { lat: data[0].lat, lon: data[0].lon, display: data[0].display_name });
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    console.log('No geocode result for:', location);
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const ItineraryHeader = ({
  title,
  destination,
  origin,
  startDate,
  endDate,
  travelers = 1,
  budget,
  duration,
  customImage
}: ItineraryHeaderProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [heroImage, setHeroImage] = useState<string>('');

  const displayDestination = destination || 'Destino';

  // Fetch destination image from DB or fallback
  useEffect(() => {
    const fetchImage = async () => {
      if (customImage) {
        setHeroImage(customImage);
        return;
      }
      
      const dbImage = await getDestinationImageFromDB(displayDestination);
      if (dbImage) {
        setHeroImage(dbImage);
      } else {
        // Fallback to local images
        setHeroImage(getDestinationImage(displayDestination));
      }
    };
    
    fetchImage();
  }, [displayDestination, customImage]);

  // Geocode origin and destination
  useEffect(() => {
    if (origin) {
      geocodeLocation(origin).then(coords => {
        if (coords) setOriginCoords(coords);
      });
    }
    if (destination) {
      geocodeLocation(destination).then(coords => {
        if (coords) setDestCoords(coords);
      });
    }
  }, [origin, destination]);

  // Initialize map with route
  useEffect(() => {
    if (!mapRef.current || !destCoords) return;

    // Clean up previous map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Small delay to ensure container is properly sized
    const initMap = () => {
      if (!mapRef.current) return;
      
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
        touchZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      const destIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: hsl(var(--primary)); width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const originIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: #22c55e; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      // Add destination marker
      L.marker(destCoords, { icon: destIcon }).addTo(map);

      // If we have origin, add marker and draw route line
      if (originCoords) {
        L.marker(originCoords, { icon: originIcon }).addTo(map);
        
        // Draw curved line between origin and destination
        const latlngs: L.LatLngExpression[] = [originCoords, destCoords];
        L.polyline(latlngs, {
          color: 'hsl(240, 100%, 50%)',
          weight: 2,
          opacity: 0.7,
          dashArray: '10, 10'
        }).addTo(map);

        // Fit bounds to show both points
        const bounds = L.latLngBounds([originCoords, destCoords]);
        map.fitBounds(bounds, { padding: [30, 30] });
      } else {
        map.setView(destCoords, 10);
      }

      mapInstanceRef.current = map;

      // Multiple invalidateSize calls to ensure proper rendering
      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 300);
      setTimeout(() => map.invalidateSize(), 500);
    };

    // Delay initialization to ensure container is rendered
    const timeoutId = setTimeout(initMap, 50);

    return () => {
      clearTimeout(timeoutId);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [originCoords, destCoords]);

  return (
    <div className="bg-card md:rounded-xl overflow-hidden md:border md:shadow-card">
      {/* Main Header Row */}
      <div className="flex flex-col lg:flex-row">
        {/* Left: Image + Info - taller on mobile for immersive feel */}
        <div className="relative flex-1 min-h-[280px] md:min-h-[200px] lg:min-h-[240px]">
          <img
            src={heroImage}
            alt={displayDestination}
            className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Content overlay */}
          <div className="absolute inset-0 p-6 flex flex-col justify-end">
            {/* Location badge */}
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full">
                <MapPin className="w-4 h-4" />
                {displayDestination}
              </span>
            </div>
            
            {/* Title */}
            <h1 className="font-bold text-2xl lg:text-3xl text-white leading-tight mb-4">
              {title}
            </h1>

            {/* Info Grid */}
            <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-white/90">
              {(startDate || endDate) && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 opacity-75" />
                  <span className="text-sm">
                    {formatDate(startDate)}
                    {endDate && ` - ${formatDate(endDate)}`}
                  </span>
                </div>
              )}
              
              {duration && duration > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 opacity-75" />
                  <span className="text-sm">{duration} días</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 opacity-75" />
                <span className="text-sm">
                  {travelers} {travelers === 1 ? 'viajero' : 'viajeros'}
                </span>
              </div>
              
              {budget && budget > 0 && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">
                    ${budget.toLocaleString()} MXN
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Map */}
        <div className="w-full lg:w-80 h-[200px] lg:h-auto bg-muted relative overflow-hidden">
          {destCoords ? (
            <div ref={mapRef} className="w-full h-full absolute inset-0" style={{ minHeight: '200px' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <MapPin className="w-8 h-8 animate-pulse" />
            </div>
          )}
          
          {/* Route info overlay */}
          {origin && (
            <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-white">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="opacity-75">{origin}</span>
                <span className="opacity-50">→</span>
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>{displayDestination}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItineraryHeader;
