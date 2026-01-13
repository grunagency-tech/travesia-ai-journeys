import { useState, useEffect, useRef } from "react";
import { 
  MapPin, Calendar, Users, DollarSign, Plane, Hotel, 
  Compass, Info, ChevronDown, ChevronUp, Eye, Plus, Car
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getDestinationImage } from "@/lib/destinationImages";

interface ItineraryActivity {
  hora?: string;
  titulo?: string;
  descripcion?: string;
  ubicacion?: string;
  costoAprox?: number;
}

interface ItineraryDay {
  dia: number;
  fecha?: string;
  resumenDia?: string;
  actividades?: ItineraryActivity[];
}

interface ItineraryVuelo {
  aerolinea?: string;
  origen?: string;
  destino?: string;
  fechaSalida?: string;
  fechaLlegada?: string;
  precio?: number;
}

interface ItineraryData {
  destino?: string;
  resumen?: {
    titulo?: string;
    descripcion?: string;
    presupuestoEstimado?: number;
    duracion?: number;
    highlights?: string[];
  };
  transporte?: {
    vuelos?: ItineraryVuelo[];
    transporteLocal?: string;
  };
  alojamiento?: {
    recomendacion?: string;
    zona?: string;
    costoPorNoche?: number;
    opciones?: string[];
  };
  itinerario?: ItineraryDay[];
  comentarios?: {
    consejos?: string[];
    advertencias?: string[];
    mejorEpoca?: string;
  };
}

interface ItineraryPanelProps {
  data: ItineraryData;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  customImage?: string;
}

const geocodeDestination = async (destination: string): Promise<[number, number] | null> => {
  try {
    const cleanDestination = destination.split(',')[0].trim();
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanDestination)}&limit=1`,
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

const formatFullDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return dateStr;
  }
};

const getTimeLabel = (hora?: string): string => {
  if (!hora) return '';
  const labels: Record<string, string> = {
    morning: 'Mañana',
    afternoon: 'Tarde', 
    evening: 'Noche',
  };
  return labels[hora] || hora;
};

const ItineraryPanel = ({ 
  data, 
  startDate, 
  endDate, 
  travelers = 1,
  customImage 
}: ItineraryPanelProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [openDays, setOpenDays] = useState<number[]>([1]);

  const destination = data.destino || data.resumen?.titulo?.split(' ').slice(-2).join(' ') || 'Destino';
  const heroImage = customImage || getDestinationImage(destination);
  const budget = data.resumen?.presupuestoEstimado;
  const title = data.resumen?.titulo || `Descubre lo mejor de ${destination}`;

  // Geocode destination
  useEffect(() => {
    if (destination) {
      geocodeDestination(destination).then(coords => {
        if (coords) setCoordinates(coords);
      });
    }
  }, [destination]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !coordinates) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
    }).setView(coordinates, 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background: #3B82F6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker(coordinates, { icon: customIcon }).addTo(map);
    mapInstanceRef.current = map;

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates]);

  const toggleDay = (dayNum: number) => {
    setOpenDays(prev => 
      prev.includes(dayNum) 
        ? prev.filter(d => d !== dayNum)
        : [...prev, dayNum]
    );
  };

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row">
        {/* Hero Image */}
        <div className="relative flex-1 h-48 lg:h-56">
          <img
            src={heroImage}
            alt={destination}
            className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          {/* Location badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
              <MapPin className="w-3 h-3" />
              {destination}
            </span>
          </div>
          
          {/* Title */}
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="font-urbanist font-bold text-xl lg:text-2xl text-white leading-tight">
              {title}
            </h1>
          </div>
        </div>

        {/* Map */}
        <div className="w-full lg:w-64 h-32 lg:h-56 bg-gray-200">
          {coordinates ? (
            <div ref={mapRef} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <MapPin className="w-6 h-6 animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-white border-b px-4 py-3 flex flex-wrap items-center gap-4 lg:gap-6">
        {(startDate || endDate) && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Fechas</span>
              <p className="text-sm font-medium">{formatDate(startDate)}</p>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Viajeros</span>
            <p className="text-sm font-medium">{travelers} {travelers === 1 ? 'persona' : 'personas'}</p>
          </div>
        </div>
        
        {budget && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Presupuesto</span>
              <p className="text-sm font-semibold text-green-600">${budget.toLocaleString()} MXN</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="itinerario" className="w-full">
        <div className="bg-white border-b">
          <TabsList className="w-full justify-start h-auto p-0 bg-transparent rounded-none">
            <TabsTrigger 
              value="itinerario" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-3 text-sm font-medium"
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              Itinerario
            </TabsTrigger>
            <TabsTrigger 
              value="transporte"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-3 text-sm font-medium"
            >
              <Plane className="w-4 h-4 mr-1.5" />
              Transporte
            </TabsTrigger>
            <TabsTrigger 
              value="alojamiento"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-3 text-sm font-medium"
            >
              <Hotel className="w-4 h-4 mr-1.5" />
              Alojamiento
            </TabsTrigger>
            <TabsTrigger 
              value="actividades"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-3 text-sm font-medium"
            >
              <Compass className="w-4 h-4 mr-1.5" />
              Actividades
            </TabsTrigger>
            <TabsTrigger 
              value="info"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-3 text-sm font-medium"
            >
              <Info className="w-4 h-4 mr-1.5" />
              Info Local
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Action Buttons */}
        <div className="bg-white px-4 py-3 flex flex-wrap gap-2 border-b">
          <Button variant="outline" size="sm" className="rounded-full text-primary border-primary hover:bg-primary/5">
            <Eye className="w-4 h-4 mr-1.5" />
            Vista rápida
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            <Plus className="w-4 h-4 mr-1.5" />
            Agregar vuelo
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            <Plus className="w-4 h-4 mr-1.5" />
            Agregar alojamiento
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            <Plus className="w-4 h-4 mr-1.5" />
            Agregar coche
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            <Plus className="w-4 h-4 mr-1.5" />
            Agregar actividad
          </Button>
        </div>

        {/* Tab Contents */}
        <div className="p-4">
          {/* Itinerario Tab */}
          <TabsContent value="itinerario" className="mt-0 space-y-4">
            {data.itinerario && data.itinerario.length > 0 ? (
              data.itinerario.map((day) => (
                <Collapsible
                  key={day.dia}
                  open={openDays.includes(day.dia)}
                  onOpenChange={() => toggleDay(day.dia)}
                >
                  <div className="bg-white rounded-xl border overflow-hidden">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                            <span className="text-xs text-primary font-medium">DÍA</span>
                            <span className="text-xl font-bold text-primary">{day.dia}</span>
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-foreground">
                              {formatFullDate(day.fecha) || `Día ${day.dia}`}
                            </p>
                            {day.resumenDia && (
                              <p className="text-sm text-muted-foreground">{day.resumenDia}</p>
                            )}
                          </div>
                        </div>
                        {openDays.includes(day.dia) ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-4">
                        {day.actividades?.map((activity, idx) => (
                          <div key={idx} className="flex gap-4 pl-4 border-l-2 border-primary/30">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-foreground">{activity.titulo}</h4>
                                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                                  {getTimeLabel(activity.hora)}
                                </span>
                              </div>
                              {activity.descripcion && (
                                <p className="text-sm text-muted-foreground mb-2">{activity.descripcion}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {activity.ubicacion && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {activity.ubicacion}
                                  </span>
                                )}
                                <span className={`font-medium ${activity.costoAprox && activity.costoAprox > 0 ? 'text-foreground' : 'text-green-600'}`}>
                                  {activity.costoAprox && activity.costoAprox > 0 ? `$${activity.costoAprox} MXN` : 'Gratis'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay itinerario disponible</p>
              </div>
            )}
          </TabsContent>

          {/* Transporte Tab */}
          <TabsContent value="transporte" className="mt-0 space-y-4">
            {data.transporte?.vuelos && data.transporte.vuelos.length > 0 ? (
              <>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Plane className="w-5 h-5" />
                  Vuelos
                </h3>
                {data.transporte.vuelos.map((vuelo, idx) => (
                  <div key={idx} className="bg-white rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{vuelo.aerolinea}</p>
                        <p className="text-sm text-muted-foreground">
                          {vuelo.origen} → {vuelo.destino}
                        </p>
                        {vuelo.fechaSalida && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(vuelo.fechaSalida)}
                          </p>
                        )}
                      </div>
                      {vuelo.precio && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">${vuelo.precio.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">MXN</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {data.transporte.transporteLocal && (
                  <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                    <Car className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Transporte local</p>
                      <p className="text-sm text-blue-700">{data.transporte.transporteLocal}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Plane className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay información de transporte</p>
              </div>
            )}
          </TabsContent>

          {/* Alojamiento Tab */}
          <TabsContent value="alojamiento" className="mt-0 space-y-4">
            {data.alojamiento ? (
              <div className="bg-white rounded-xl border p-4 space-y-4">
                {data.alojamiento.recomendacion && (
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                      <Hotel className="w-5 h-5" />
                      Recomendación
                    </h3>
                    <p className="text-muted-foreground">{data.alojamiento.recomendacion}</p>
                  </div>
                )}
                
                {data.alojamiento.zona && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>Zona recomendada: <strong>{data.alojamiento.zona}</strong></span>
                  </div>
                )}
                
                {data.alojamiento.costoPorNoche && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span>Costo por noche: <strong className="text-green-600">${data.alojamiento.costoPorNoche.toLocaleString()} MXN</strong></span>
                  </div>
                )}
                
                {data.alojamiento.opciones && data.alojamiento.opciones.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Otras opciones:</p>
                    <div className="flex flex-wrap gap-2">
                      {data.alojamiento.opciones.map((opcion, idx) => (
                        <span key={idx} className="text-xs px-3 py-1.5 bg-gray-100 rounded-full">
                          {opcion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Hotel className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay información de alojamiento</p>
              </div>
            )}
          </TabsContent>

          {/* Actividades Tab */}
          <TabsContent value="actividades" className="mt-0 space-y-4">
            {data.resumen?.highlights && data.resumen.highlights.length > 0 ? (
              <>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Compass className="w-5 h-5" />
                  Highlights del viaje
                </h3>
                <div className="grid gap-3">
                  {data.resumen.highlights.map((highlight, idx) => (
                    <div key={idx} className="bg-white rounded-xl border p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {idx + 1}
                      </div>
                      <p>{highlight}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Compass className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay actividades destacadas</p>
              </div>
            )}
          </TabsContent>

          {/* Info Local Tab */}
          <TabsContent value="info" className="mt-0 space-y-4">
            {data.comentarios ? (
              <>
                {data.comentarios.consejos && data.comentarios.consejos.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <h3 className="font-semibold text-green-800 mb-3">💡 Consejos</h3>
                    <ul className="space-y-2">
                      {data.comentarios.consejos.map((consejo, idx) => (
                        <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                          <span className="text-green-500">•</span>
                          {consejo}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {data.comentarios.advertencias && data.comentarios.advertencias.length > 0 && (
                  <div className="bg-amber-50 rounded-xl p-4">
                    <h3 className="font-semibold text-amber-800 mb-3">⚠️ Advertencias</h3>
                    <ul className="space-y-2">
                      {data.comentarios.advertencias.map((adv, idx) => (
                        <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                          <span className="text-amber-500">•</span>
                          {adv}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {data.comentarios.mejorEpoca && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">🗓️ Mejor época para visitar</h3>
                    <p className="text-sm text-blue-700">{data.comentarios.mejorEpoca}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay información local disponible</p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ItineraryPanel;
