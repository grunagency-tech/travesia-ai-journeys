import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Loader2, MapPin, Calendar, Users, DollarSign, Plane, Clock, ArrowLeft, Trash2, Sparkles, Hotel, MessageSquare, FileText, CheckCircle2, Lightbulb, AlertTriangle, Sun, Car } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import logoIcon from '@/assets/logo-icon.svg';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDestinationImage } from '@/lib/destinationImages';
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

// New JSON structure interfaces
interface ItineraryResumen {
  titulo: string;
  descripcion: string;
  presupuestoEstimado: number;
  duracion: number;
  highlights: string[];
}

interface ItineraryVuelo {
  aerolinea: string;
  origen: string;
  destino: string;
  fechaSalida: string;
  fechaLlegada: string;
  precio: number;
}

interface ItineraryTransporte {
  vuelos: ItineraryVuelo[];
  transporteLocal: string;
}

interface ItineraryAlojamiento {
  recomendacion: string;
  zona: string;
  costoPorNoche: number;
  opciones: string[];
}

interface ItineraryActividad {
  hora: 'morning' | 'afternoon' | 'evening';
  titulo: string;
  descripcion: string;
  ubicacion: string;
  costoAprox: number;
}

interface ItineraryDia {
  dia: number;
  fecha: string;
  resumenDia: string;
  actividades: ItineraryActividad[];
}

interface ItineraryComentarios {
  consejos: string[];
  advertencias: string[];
  mejorEpoca: string;
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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user && id) {
      loadTripDetails();
    }
  }, [user, authLoading, id, navigate]);

  // Fetch real destination image when trip is loaded
  useEffect(() => {
    if (trip?.destination) {
      setImageLoading(true);
      getDestinationImage(trip.destination)
        .then((url) => {
          setDestinationImage(url);
          setImageLoading(false);
        })
        .catch(() => {
          setImageLoading(false);
        });
    }
  }, [trip?.destination]);

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

  const getTimeOfDayLabel = (timeOfDay: string) => {
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

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Hero Card */}
            <div className="lg:col-span-2">
              {/* Hero Image Card */}
              <div className="relative rounded-2xl overflow-hidden mb-6">
                {/* Grayscale Image */}
                <div className="relative h-[280px] md:h-[320px]">
                  {imageLoading ? (
                    <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <img 
                      src={destinationImage} 
                      alt={trip.destination}
                      className="w-full h-full object-cover grayscale"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  {/* Verified Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verificado con IA
                    </span>
                  </div>

                  {/* Title and Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h1 className="font-urbanist font-bold text-2xl md:text-3xl text-white mb-4">
                      Tu viaje a {trip.destination}
                    </h1>
                    
                    {/* Info Badges */}
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
                          ${trip.budget.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Section */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 mb-6">
                  <TabsTrigger 
                    value="resumen" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-3 text-sm font-medium"
                  >
                    Resumen
                  </TabsTrigger>
                  <TabsTrigger 
                    value="transporte" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-3 text-sm font-medium"
                  >
                    Transporte
                  </TabsTrigger>
                  <TabsTrigger 
                    value="alojamiento" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-3 text-sm font-medium"
                  >
                    Alojamiento
                  </TabsTrigger>
                  <TabsTrigger 
                    value="comentarios" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-3 text-sm font-medium"
                  >
                    Comentarios
                  </TabsTrigger>
                </TabsList>

                {/* Resumen Tab */}
                <TabsContent value="resumen" className="mt-0">
                  <div className="space-y-6">
                    {/* Trip Summary Card */}
                    <div className="bg-card rounded-2xl border p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-urbanist font-bold text-lg">Resumen del viaje</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-3 bg-muted/50 rounded-xl">
                          <p className="text-2xl font-bold text-primary">{resumen?.duracion || tripDays}</p>
                          <p className="text-xs text-muted-foreground">Días</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-xl">
                          <p className="text-2xl font-bold text-primary">{trip.travelers}</p>
                          <p className="text-xs text-muted-foreground">Viajeros</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-xl">
                          <p className="text-2xl font-bold text-primary">{itinerarioDias.length || days.length}</p>
                          <p className="text-xs text-muted-foreground">Días planificados</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-xl">
                          <p className="text-2xl font-bold text-primary">
                            ${resumen?.presupuestoEstimado?.toLocaleString() || trip.budget?.toLocaleString() || '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">Presupuesto</p>
                        </div>
                      </div>

                      {/* Description from new structure */}
                      {resumen?.descripcion && (
                        <p className="text-muted-foreground leading-relaxed mb-4">{resumen.descripcion}</p>
                      )}
                      
                      {/* Legacy summary fallback */}
                      {!resumen?.descripcion && legacySummary && (
                        <p className="text-muted-foreground leading-relaxed mb-4">{legacySummary}</p>
                      )}

                      {/* Highlights */}
                      {resumen?.highlights && resumen.highlights.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            Puntos destacados
                          </h4>
                          <ul className="space-y-2">
                            {resumen.highlights.map((highlight, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* HTML Itinerary (legacy) */}
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
                          dangerouslySetInnerHTML={{ __html: itineraryHtml }} 
                        />
                      </div>
                    )}

                    {/* Day by Day Itinerary - New Structure */}
                    {itinerarioDias.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-urbanist font-bold text-lg px-1">Itinerario día a día</h3>
                        {itinerarioDias.map((dia) => (
                          <div key={dia.dia} className="bg-card rounded-2xl border overflow-hidden">
                            <div className="bg-primary/5 px-6 py-4 border-b">
                              <h4 className="font-urbanist font-bold text-base">
                                Día {dia.dia} — {format(new Date(dia.fecha), 'd MMMM yyyy', { locale: es })}
                              </h4>
                              {dia.resumenDia && (
                                <p className="text-sm text-muted-foreground mt-1">{dia.resumenDia}</p>
                              )}
                            </div>
                            <div className="p-6 space-y-4">
                              {dia.actividades.map((actividad, index) => (
                                <div 
                                  key={index} 
                                  className="p-4 bg-muted/30 rounded-xl border-l-4 border-primary"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full mb-2">
                                        {getTimeOfDayLabel(actividad.hora)}
                                      </span>
                                      <h5 className="font-urbanist font-semibold text-base">
                                        {actividad.titulo}
                                      </h5>
                                    </div>
                                    {actividad.costoAprox > 0 && (
                                      <span className="text-sm font-semibold text-primary">
                                        ${actividad.costoAprox}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {actividad.descripcion}
                                  </p>
                                  {actividad.ubicacion && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-primary" />
                                      {actividad.ubicacion}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Legacy Day by Day from DB */}
                    {itinerarioDias.length === 0 && days.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-urbanist font-bold text-lg px-1">Itinerario día a día</h3>
                        {days.map((day) => (
                          <div key={day.id} className="bg-card rounded-2xl border overflow-hidden">
                            <div className="bg-primary/5 px-6 py-4 border-b">
                              <h4 className="font-urbanist font-bold text-base">
                                Día {day.day_number} — {format(new Date(day.date), 'd MMMM yyyy', { locale: es })}
                              </h4>
                              {day.summary && (
                                <p className="text-sm text-muted-foreground mt-1">{day.summary}</p>
                              )}
                            </div>
                            <div className="p-6 space-y-4">
                              {day.activities.map((activity: any, index: number) => (
                                <div 
                                  key={index} 
                                  className="p-4 bg-muted/30 rounded-xl border-l-4 border-primary"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full mb-2">
                                        {getTimeOfDayLabel(activity.timeOfDay)}
                                      </span>
                                      <h5 className="font-urbanist font-semibold text-base">
                                        {activity.title}
                                      </h5>
                                    </div>
                                    {activity.approxCost && (
                                      <span className="text-sm font-semibold text-primary">
                                        ${activity.approxCost}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {activity.description}
                                  </p>
                                  {activity.location && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-primary" />
                                      {activity.location}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Empty state */}
                    {!itineraryHtml && itinerarioDias.length === 0 && days.length === 0 && (
                      <div className="bg-card rounded-2xl border p-10 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-urbanist font-bold text-lg mb-2">Sin resumen disponible</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Este viaje aún no tiene un itinerario generado. Puedes crear uno nuevo desde el chat.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Transporte Tab */}
                <TabsContent value="transporte" className="mt-0">
                  <div className="space-y-4">
                    {/* Route Info */}
                    <div className="bg-card rounded-2xl border p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                          <Plane className="w-5 h-5 text-sky-600" />
                        </div>
                        <h3 className="font-urbanist font-bold text-lg">Ruta del viaje</h3>
                      </div>
                      <div className="flex items-center gap-4 text-lg">
                        <span className="font-semibold">{trip.origin || 'Tu ciudad'}</span>
                        <Plane className="w-5 h-5 text-primary rotate-90" />
                        <span className="font-semibold">{trip.destination}</span>
                      </div>
                    </div>

                    {/* Vuelos from new structure */}
                    {transporte?.vuelos && transporte.vuelos.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-urbanist font-bold text-lg px-1">Vuelos sugeridos</h3>
                        {transporte.vuelos.map((vuelo, idx) => (
                          <div 
                            key={idx} 
                            className="bg-card rounded-2xl border p-5 hover:shadow-md transition-shadow"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-urbanist font-bold text-base">{vuelo.aerolinea}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {vuelo.origen} → {vuelo.destino}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <span>{format(new Date(vuelo.fechaSalida), 'PPp', { locale: es })}</span>
                                  </div>
                                  <span className="text-primary">→</span>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <span>{format(new Date(vuelo.fechaLlegada), 'PPp', { locale: es })}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-urbanist font-bold text-primary">${vuelo.precio}</p>
                                <p className="text-xs text-muted-foreground">estimado</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Legacy Flights from DB */}
                    {(!transporte?.vuelos || transporte.vuelos.length === 0) && flights.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-urbanist font-bold text-lg px-1">Opciones de vuelos</h3>
                        {flights.map((flight) => (
                          <div 
                            key={flight.id} 
                            className="bg-card rounded-2xl border p-5 hover:shadow-md transition-shadow"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-urbanist font-bold text-base">{flight.airline}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {flight.origin} → {flight.destination}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <span>{format(new Date(flight.departure_time), 'PPp', { locale: es })}</span>
                                  </div>
                                  <span className="text-primary">→</span>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <span>{format(new Date(flight.arrival_time), 'PPp', { locale: es })}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-2xl font-urbanist font-bold text-primary">${flight.price}</p>
                                  <p className="text-xs text-muted-foreground">por persona</p>
                                </div>
                                {flight.link && (
                                  <Button className="rounded-full" size="sm" asChild>
                                    <a href={flight.link} target="_blank" rel="noopener noreferrer">
                                      Ver detalles
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Transporte Local */}
                    {transporte?.transporteLocal && (
                      <div className="bg-card rounded-2xl border p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <Car className="w-5 h-5 text-green-600" />
                          </div>
                          <h3 className="font-urbanist font-bold text-lg">Transporte local</h3>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {transporte.transporteLocal}
                        </p>
                      </div>
                    )}

                    {/* Empty state */}
                    {(!transporte?.vuelos || transporte.vuelos.length === 0) && flights.length === 0 && !transporte?.transporteLocal && (
                      <div className="bg-card rounded-2xl border p-10 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-sky-100 rounded-2xl flex items-center justify-center">
                          <Plane className="w-8 h-8 text-sky-500" />
                        </div>
                        <h3 className="font-urbanist font-bold text-lg mb-2">Sin información de transporte</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          No hay información de transporte disponible para este viaje.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Alojamiento Tab */}
                <TabsContent value="alojamiento" className="mt-0">
                  <div className="space-y-4">
                    {(alojamiento || legacyAccommodation) ? (
                      <div className="bg-card rounded-2xl border p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Hotel className="w-5 h-5 text-amber-600" />
                          </div>
                          <h3 className="font-urbanist font-bold text-lg">Recomendación de alojamiento</h3>
                        </div>
                        
                        <p className="text-muted-foreground leading-relaxed mb-4">
                          {alojamiento?.recomendacion || legacyAccommodation?.recommendation}
                        </p>

                        {/* Zona */}
                        {alojamiento?.zona && (
                          <div className="flex items-center gap-2 mb-4 text-sm">
                            <MapPin className="w-4 h-4 text-amber-600" />
                            <span className="font-medium">Zona recomendada:</span>
                            <span className="text-muted-foreground">{alojamiento.zona}</span>
                          </div>
                        )}

                        {/* Costo */}
                        {(alojamiento?.costoPorNoche || legacyAccommodation?.estimatedCostPerNight) && (
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl mb-4">
                            <DollarSign className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-700">
                              Costo estimado: ${alojamiento?.costoPorNoche || legacyAccommodation?.estimatedCostPerNight} por noche
                            </span>
                          </div>
                        )}

                        {/* Opciones */}
                        {alojamiento?.opciones && alojamiento.opciones.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="font-semibold text-sm mb-3">Opciones sugeridas</h4>
                            <ul className="space-y-2">
                              {alojamiento.opciones.map((opcion, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <Hotel className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                  {opcion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-card rounded-2xl border p-10 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-2xl flex items-center justify-center">
                          <Hotel className="w-8 h-8 text-amber-500" />
                        </div>
                        <h3 className="font-urbanist font-bold text-lg mb-2">Sin información de alojamiento</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          No hay recomendaciones de alojamiento disponibles para este viaje.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Comentarios Tab */}
                <TabsContent value="comentarios" className="mt-0">
                  <div className="space-y-4">
                    {comentarios && (comentarios.consejos?.length > 0 || comentarios.advertencias?.length > 0 || comentarios.mejorEpoca) ? (
                      <>
                        {/* Consejos */}
                        {comentarios.consejos && comentarios.consejos.length > 0 && (
                          <div className="bg-card rounded-2xl border p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Lightbulb className="w-5 h-5 text-blue-600" />
                              </div>
                              <h3 className="font-urbanist font-bold text-lg">Consejos útiles</h3>
                            </div>
                            <ul className="space-y-3">
                              {comentarios.consejos.map((consejo, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                                  <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                  {consejo}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Advertencias */}
                        {comentarios.advertencias && comentarios.advertencias.length > 0 && (
                          <div className="bg-card rounded-2xl border p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                              </div>
                              <h3 className="font-urbanist font-bold text-lg">Advertencias</h3>
                            </div>
                            <ul className="space-y-3">
                              {comentarios.advertencias.map((advertencia, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                                  <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                  {advertencia}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Mejor Época */}
                        {comentarios.mejorEpoca && (
                          <div className="bg-card rounded-2xl border p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                <Sun className="w-5 h-5 text-green-600" />
                              </div>
                              <h3 className="font-urbanist font-bold text-lg">Mejor época para visitar</h3>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                              {comentarios.mejorEpoca}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-card rounded-2xl border p-10 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-violet-100 rounded-2xl flex items-center justify-center">
                          <MessageSquare className="w-8 h-8 text-violet-500" />
                        </div>
                        <h3 className="font-urbanist font-bold text-lg mb-2">Sin comentarios aún</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          No hay consejos o comentarios disponibles para este viaje.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column - Map & Quick Info */}
            <div className="lg:col-span-1 space-y-4">
              {/* Map Placeholder */}
              <div className="bg-card rounded-2xl border overflow-hidden">
                <div className="h-[300px] bg-muted flex items-center justify-center">
                  <div className="text-center p-4">
                    <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Mapa del viaje
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {trip.origin || 'Tu ciudad'} → {trip.destination}
                    </p>
                  </div>
                </div>
              </div>

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
                      <span className="font-medium">${trip.budget.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Inicio</span>
                    <span className="font-medium">{format(startDate, 'd MMM yyyy', { locale: es })}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fin</span>
                    <span className="font-medium">{format(endDate, 'd MMM yyyy', { locale: es })}</span>
                  </div>
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
        </div>
      </div>
    </div>
  );
};

export default TripDetail;
