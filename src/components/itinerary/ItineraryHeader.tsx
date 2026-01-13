import { useState, useEffect, useRef } from "react";
import { MapPin, Calendar, Users, DollarSign, Clock } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getDestinationImage } from "@/lib/destinationImages";

interface ItineraryHeaderProps {
  title: string;
  destination: string;
  origin?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  budget?: number;
  duration?: number;
  customImage?: string;
}

const geocodeLocation = async (location: string): Promise<[number, number] | null> => {
  try {
    const cleanLocation = location.split(',')[0].trim();
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanLocation)}&limit=1`,
      { headers: { 'User-Agent': 'TravesIA/1.0' } }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
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

  const heroImage = customImage || getDestinationImage(destination);

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

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
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
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [originCoords, destCoords]);

  return (
    <div className="bg-card rounded-xl overflow-hidden border shadow-card">
      {/* Main Header Row */}
      <div className="flex flex-col lg:flex-row">
        {/* Left: Image + Info */}
        <div className="relative flex-1 min-h-[200px] lg:min-h-[240px]">
          <img
            src={heroImage}
            alt={destination}
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
                {destination}
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
        <div className="w-full lg:w-80 h-48 lg:h-auto bg-muted relative">
          {destCoords ? (
            <div ref={mapRef} className="w-full h-full min-h-[200px] lg:min-h-[240px]" />
          ) : (
            <div className="w-full h-full min-h-[200px] flex items-center justify-center text-muted-foreground">
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
                <span>{destination}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItineraryHeader;
