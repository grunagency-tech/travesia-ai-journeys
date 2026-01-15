import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Loader2, MapPin, Calendar, Users, DollarSign, Plane, Clock, ArrowLeft, Trash2, Sparkles, Hotel, MessageSquare, FileText, CheckCircle2, Lightbulb, AlertTriangle, Sun, Car } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import logoIcon from '@/assets/logo-icon.svg';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getDestinationImage } from '@/lib/destinationImages';
import { sanitizeHtml } from '@/lib/sanitizeHtml';
import ItineraryPanel from '@/components/ItineraryPanel';
import { ItineraryData as ItineraryDataType } from '@/components/itinerary/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ItineraryDay {
  id: string;
  day_number: number;
  date: string;
  summary: string;
  activities: any[];
}

interface FlightOption {
  id: string;
  airline: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  link: string | null;
}

// New JSON structure interfaces (fields are optional because older/newer webhook versions may omit them)
interface ItineraryResumen {
  titulo?: string;
  descripcion?: string;
  presupuestoEstimado?: number;
  duracion?: number;
  highlights?: string[];
}

interface ItineraryVuelo {
  aerolinea?: string;
  origen?: string;
  destino?: string;
  fechaSalida?: string;
  fechaLlegada?: string;
  precio?: number;
}

interface ItineraryTransporte {
  vuelos?: ItineraryVuelo[];
  transporteLocal?: string;
}

interface ItineraryAlojamiento {
  recomendacion?: string;
  zona?: string;
  costoPorNoche?: number;
  opciones?: string[];
}

interface ItineraryActividad {
  hora?: string;
  titulo?: string;
  descripcion?: string;
  ubicacion?: string;
  costoAprox?: number;
}

interface ItineraryDia {
  dia: number;
  fecha?: string;
  resumenDia?: string;
  actividades?: ItineraryActividad[];
}

interface ItineraryComentarios {
  consejos?: string[];
  advertencias?: string[];
  mejorEpoca?: string;
}

interface ItineraryData {
  resumen?: ItineraryResumen;
  transporte?: ItineraryTransporte;
  alojamiento?: ItineraryAlojamiento;
  itinerario?: ItineraryDia[];
  comentarios?: ItineraryComentarios;
}

interface TripPreferences {
  itinerary_html?: string;
  itinerary_data?: ItineraryData;
  // Legacy fields
  accommodation?: { recommendation: string; estimatedCostPerNight: number };
  summary?: string;
}

interface Trip {
  id: string;
  title: string;
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number | null;
  travelers: number;
  preferences: TripPreferences | null;
}

const TripDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [flights, setFlights] = useState<FlightOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("resumen");
  const [destinationImage, setDestinationImage] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);
  const [mapCoordinates, setMapCoordinates] = useState<[number, number] | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user && id) {
      loadTripDetails();
    }
  }, [user, authLoading, id, navigate]);

  // Fetch destination image when trip is loaded
  useEffect(() => {
    if (trip?.destination) {
      setImageLoading(true);
      const url = getDestinationImage(trip.destination);
      setDestinationImage(url);
      setImageLoading(false);
    }
  }, [trip?.destination]);

  // Geocode destination and initialize map
  const geocodeDestination = async (destination: string): Promise<[number, number] | null> => {
    try {
      // Clean destination name for better geocoding
      const cleanDestination = destination.split(':')[0].split('-')[0].trim();
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanDestination)}&limit=1`
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

  useEffect(() => {
    if (trip?.destination) {
      geocodeDestination(trip.destination).then(coords => {
        if (coords) {
          setMapCoordinates(coords);
        }
      });
    }
  }, [trip?.destination]);

  useEffect(() => {
    // Only proceed if we have coordinates and a container
    if (!mapCoordinates || !mapContainerRef.current) return;

    // Clean up previous map instance if exists
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Create custom icon
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background: linear-gradient(135deg, hsl(17, 93%, 53%) 0%, hsl(17, 93%, 43%) 100%); width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
        <svg style="transform: rotate(45deg); width: 16px; height: 16px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: mapCoordinates,
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    L.marker(mapCoordinates, { icon: customIcon }).addTo(map);

    mapRef.current = map;

    // Force a resize after mount to ensure proper rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapCoordinates]);

  const loadTripDetails = async () => {
    try {
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      const { data: daysData, error: daysError } = await supabase
        .from('itinerary_days')
        .select('*')
        .eq('trip_id', id)
        .order('day_number');

      if (daysError) throw daysError;
      setDays(daysData || []);

      const { data: flightsData, error: flightsError } = await supabase
        .from('flight_options')
        .select('*')
        .eq('trip_id', id);

      if (flightsError) throw flightsError;
      setFlights(flightsData || []);

    } catch (error) {
      console.error('Error loading trip details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      // Delete related data first (itinerary_days and flight_options)
      await supabase
        .from('itinerary_days')
        .delete()
        .eq('trip_id', id);
      
      await supabase
        .from('flight_options')
        .delete()
        .eq('trip_id', id);

      // Unlink any conversations from this trip
      await supabase
        .from('conversations')
        .update({ trip_id: null })
        .eq('trip_id', id);

      // Now delete the trip itself
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Viaje eliminado",
        description: "El itinerario ha sido eliminado correctamente",
      });
      navigate('/mis-viajes');
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el viaje",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatMaybeDate = (dateStr?: string, formatStr: string = 'd MMMM yyyy') => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (!isValid(d)) return null;
    return format(d, formatStr, { locale: es });
  };

  const getTimeOfDayLabel = (timeOfDay?: string) => {
    if (!timeOfDay) return '';

    // If we receive a time like "14:00" from the webhook
    if (/^\d{1,2}:\d{2}$/.test(timeOfDay)) return `🕐 ${timeOfDay}`;

    const labels: Record<string, string> = {
      morning: '🌅 Mañana',
      afternoon: '☀️ Tarde',
      evening: '🌙 Noche',
    };
    return labels[timeOfDay] || timeOfDay;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <img src={logoIcon} alt="travesIA" className="w-10 h-10 animate-pulse" />
            </div>
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Cargando tu itinerario...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-2xl flex items-center justify-center">
              <MapPin className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-urbanist font-bold text-2xl mb-3">Viaje no encontrado</h2>
            <p className="text-muted-foreground mb-8">
              No pudimos encontrar el itinerario que buscas
            </p>
            <Button 
              onClick={() => navigate('/mis-viajes')}
              className="rounded-full px-8"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a mis viajes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const itineraryHtml = trip.preferences?.itinerary_html;
  const itineraryData = trip.preferences?.itinerary_data;
  
  // Extract sections from new JSON structure
  const resumen = itineraryData?.resumen;
  const transporte = itineraryData?.transporte;
  const alojamiento = itineraryData?.alojamiento;
  const itinerarioDias = itineraryData?.itinerario || [];
  const comentarios = itineraryData?.comentarios;
  
  // Legacy fallbacks
  const legacyAccommodation = trip.preferences?.accommodation;
  const legacySummary = trip.preferences?.summary;

  // Calculate trip duration
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Spacer for navbar */}
      <div className="h-16" />

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/mis-viajes')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a mis viajes
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar viaje
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-urbanist font-bold text-xl">
                    ¿Eliminar este viaje?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El itinerario será eliminado permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteTrip} className="rounded-full">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Show ItineraryPanel if we have itinerary_data */}
          {itineraryData ? (
            <ItineraryPanel 
              data={itineraryData as ItineraryDataType}
              destination={trip.destination}
              origin={trip.origin}
              startDate={trip.start_date}
              endDate={trip.end_date}
              travelers={trip.travelers}
              budget={trip.budget || undefined}
            />
          ) : (
            /* Fallback: Two Column Layout for legacy trips */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column - Hero Card */}
              <div className="lg:col-span-2">
                {/* Hero Image Card */}
                <div className="relative rounded-2xl overflow-hidden mb-6">
                  <div className="relative h-[280px] md:h-[320px]">
                    {imageLoading ? (
                      <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <img 
                        src={destinationImage} 
                        alt={trip.destination}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verificado con IA
                      </span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h1 className="font-urbanist font-bold text-2xl md:text-3xl text-white mb-4">
                        Tu viaje a {trip.destination}
                      </h1>
                      
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full border border-white/30">
                          <Calendar className="w-4 h-4" />
                          {format(startDate, 'd', { locale: es })} - {format(endDate, 'd MMMM yyyy', { locale: es })}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full border border-white/30">
                          <MapPin className="w-4 h-4" />
                          {trip.destination}
                        </span>
                        {trip.budget && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full border border-white/30">
                            <DollarSign className="w-4 h-4" />
                            ${trip.budget.toLocaleString()} MXN
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legacy HTML Itinerary */}
                {itineraryHtml && (
                  <div className="bg-card rounded-2xl border p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-urbanist font-bold text-lg">Itinerario detallado</h3>
                        <p className="text-xs text-muted-foreground">Generado con IA por travesIA</p>
                      </div>
                    </div>
                    <div 
                      className="prose prose-sm max-w-none prose-headings:font-urbanist prose-headings:font-bold prose-a:text-primary"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(itineraryHtml) }} 
                    />
                  </div>
                )}

                {/* Legacy Day by Day from DB */}
                {days.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <h3 className="font-urbanist font-bold text-lg px-1">Itinerario día a día</h3>
                    {days.map((day) => (
                      <div key={day.id} className="bg-card rounded-2xl border overflow-hidden">
                        <div className="bg-primary/5 px-6 py-4 border-b">
                          <h4 className="font-urbanist font-bold text-base">
                            Día {day.day_number}
                            {formatMaybeDate(day.date) && (
                              <> — {formatMaybeDate(day.date)}</>
                            )}
                          </h4>
                          {day.summary && (
                            <p className="text-sm text-muted-foreground mt-1">{day.summary}</p>
                          )}
                        </div>
                        <div className="p-6 space-y-4">
                          {(day.activities?.length ?? 0) > 0 ? (
                            (day.activities ?? []).map((activity: any, index: number) => (
                              <div 
                                key={index} 
                                className="p-4 bg-muted/30 rounded-xl border-l-4 border-primary"
                              >
                                <h5 className="font-urbanist font-semibold text-base">
                                  {activity.titulo || activity.title || 'Actividad'}
                                </h5>
                                {(activity.descripcion || activity.description) && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {activity.descripcion || activity.description}
                                  </p>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">Sin actividades detalladas.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="bg-card rounded-2xl border p-5">
                  <h3 className="font-urbanist font-bold text-base mb-4">Detalles del viaje</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Destino</span>
                      <span className="font-medium">{trip.destination}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duración</span>
                      <span className="font-medium">{tripDays} días</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Viajeros</span>
                      <span className="font-medium">{trip.travelers} {trip.travelers === 1 ? 'persona' : 'personas'}</span>
                    </div>
                    {trip.budget && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Presupuesto</span>
                        <span className="font-medium">${trip.budget.toLocaleString()} MXN</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* travesIA Badge */}
                <div className="bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-2xl border border-primary/20 p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center">
                      <img src={logoIcon} alt="travesIA" className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-urbanist font-bold text-sm">Generado con travesIA</p>
                      <p className="text-xs text-muted-foreground">Planificación inteligente</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripDetail;
