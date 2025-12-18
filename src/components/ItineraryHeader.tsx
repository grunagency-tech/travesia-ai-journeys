import { useEffect, useRef, useState } from "react";
import { MapPin, Calendar, Users } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ItineraryHeaderProps {
  title: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  price?: string;
  customImage?: string;
}

// Pool of travel images for destinations
const destinationImages = [
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80", // Paris
  "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80", // Venice
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80", // Italy coast
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80", // Dubai
  "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80", // Beach
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80", // Mountains
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80", // Paris Eiffel
  "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80", // Rome
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80", // Japan
  "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80", // NYC
];

// Get image based on destination name
const getDestinationImage = (destination: string): string => {
  const hash = destination.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return destinationImages[hash % destinationImages.length];
};

// Get coordinates for a destination using Nominatim (free geocoding)
const geocodeDestination = async (destination: string): Promise<[number, number] | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`,
      {
        headers: {
          'User-Agent': 'TravesIA/1.0'
        }
      }
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

const ItineraryHeader = ({ 
  title, 
  destination,
  startDate, 
  endDate, 
  travelers = 1,
  price,
  customImage
}: ItineraryHeaderProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const displayDestination = destination || title;
  // Use custom image if provided, otherwise generate based on destination
  const heroImage = customImage || getDestinationImage(displayDestination);

  // Geocode destination
  useEffect(() => {
    if (displayDestination) {
      geocodeDestination(displayDestination).then(coords => {
        if (coords) {
          setCoordinates(coords);
        }
      });
    }
  }, [displayDestination]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !coordinates) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Create new map
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
    }).setView(coordinates, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Custom marker icon
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background: #0000FF; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker(coordinates, { icon: customIcon }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates]);

  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  return (
    <div className="mb-6 rounded-xl overflow-hidden shadow-lg bg-white">
      {/* Hero Image */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img
          src={heroImage}
          alt={displayDestination}
          className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        
        {/* Title overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-2xl md:text-3xl font-urbanist font-bold text-white drop-shadow-lg">
            {title}
          </h2>
          <div className="flex items-center gap-2 text-white/90 mt-1">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{displayDestination}</span>
          </div>
        </div>
      </div>
      
      {/* Info bar + Map */}
      <div className="flex flex-col md:flex-row">
        {/* Trip details */}
        <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 gap-4 border-b md:border-b-0 md:border-r border-gray-100">
          {(formattedStartDate || formattedEndDate) && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fechas</p>
                <p className="text-sm font-medium">
                  {formattedStartDate}
                  {formattedEndDate && formattedStartDate !== formattedEndDate && (
                    <> - {formattedEndDate}</>
                  )}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Viajeros</p>
              <p className="text-sm font-medium">{travelers} {travelers === 1 ? 'persona' : 'personas'}</p>
            </div>
          </div>
          
          {price && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold text-lg">$</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Precio estimado</p>
                <p className="text-sm font-bold text-green-600">{price}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Map */}
        <div className="w-full md:w-48 h-32 md:h-auto">
          {coordinates ? (
            <div ref={mapRef} className="w-full h-full min-h-[128px]" />
          ) : (
            <div className="w-full h-full min-h-[128px] bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MapPin className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs">Cargando mapa...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItineraryHeader;
