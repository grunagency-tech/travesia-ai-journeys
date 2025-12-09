import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Loader2, MapPin, Calendar, Users, DollarSign, Plane, Clock, ArrowLeft, Trash2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import logoIcon from '@/assets/logo-icon.svg';
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

interface Trip {
  id: string;
  title: string;
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number | null;
  travelers: number;
  preferences: { itinerary_html?: string } | null;
}

// Pool of travel images for trip headers
const tripHeaderImages = [
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1500259571355-332da5cb07aa?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&h=400&fit=crop',
];

const getImageForTrip = (tripId: string) => {
  let hash = 0;
  for (let i = 0; i < tripId.length; i++) {
    const char = tripId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % tripHeaderImages.length;
  return tripHeaderImages[index];
};

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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user && id) {
      loadTripDetails();
    }
  }, [user, authLoading, id, navigate]);

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
  const tripImage = getImageForTrip(trip.id);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      {/* Hero Header with Image */}
      <div className="relative pt-20">
        {/* Background Image */}
        <div className="absolute inset-x-0 top-20 h-72 md:h-80 overflow-hidden">
          <img 
            src={tripImage} 
            alt={trip.destination}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background" />
        </div>

        {/* Navigation & Actions */}
        <div className="relative container mx-auto px-4 md:px-8 pt-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/mis-viajes')}
              className="bg-white/90 backdrop-blur-sm hover:bg-white text-foreground rounded-full px-5 shadow-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  disabled={isDeleting}
                  className="rounded-full px-5 shadow-lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
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
        </div>

        {/* Trip Title Card */}
        <div className="relative container mx-auto px-4 md:px-8 mt-24 md:mt-32">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 max-w-5xl mx-auto">
            {/* Title Section */}
            <div className="flex items-start gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <img src={logoIcon} alt="travesIA" className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-urbanist font-extrabold text-2xl md:text-4xl text-foreground leading-tight mb-2">
                  {trip.title}
                </h1>
                <p className="text-muted-foreground text-sm flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Generado con IA por travesIA
                </p>
              </div>
            </div>

            {/* Trip Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-4 md:p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ruta</span>
                </div>
                <p className="font-semibold text-foreground text-sm md:text-base leading-snug">
                  {trip.origin || 'Por definir'} → {trip.destination}
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 md:p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-200 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Fechas</span>
                </div>
                <p className="font-semibold text-foreground text-sm md:text-base">
                  {format(new Date(trip.start_date), 'd MMM', { locale: es })} - {format(new Date(trip.end_date), 'd MMM', { locale: es })}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 md:p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-200 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Viajeros</span>
                </div>
                <p className="font-semibold text-foreground text-sm md:text-base">
                  {trip.travelers} {trip.travelers === 1 ? 'persona' : 'personas'}
                </p>
              </div>

              {trip.budget ? (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 md:p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-200 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Presupuesto</span>
                  </div>
                  <p className="font-semibold text-foreground text-sm md:text-base">
                    ${trip.budget.toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 md:p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-gray-500" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Presupuesto</span>
                  </div>
                  <p className="font-semibold text-muted-foreground text-sm md:text-base">
                    Flexible
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 md:px-8 py-10 md:py-16">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* HTML Itinerary from webhook */}
          {itineraryHtml && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-blue-600 px-6 md:px-10 py-6">
                <h2 className="font-urbanist font-bold text-xl md:text-2xl text-white flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  Tu itinerario completo
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  Planificado especialmente para ti con IA
                </p>
              </div>
              <div className="p-6 md:p-10">
                <div 
                  className="prose prose-sm md:prose-base max-w-none prose-headings:font-urbanist prose-headings:font-bold prose-a:text-primary"
                  dangerouslySetInnerHTML={{ __html: itineraryHtml }} 
                />
              </div>
            </div>
          )}

          {/* Flights */}
          {flights.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-sky-500 to-cyan-500 px-6 md:px-10 py-6">
                <h2 className="font-urbanist font-bold text-xl md:text-2xl text-white flex items-center gap-3">
                  <Plane className="w-6 h-6" />
                  Opciones de vuelos
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  Las mejores opciones para tu viaje
                </p>
              </div>
              <div className="p-6 md:p-10 space-y-4">
                {flights.map((flight) => (
                  <div 
                    key={flight.id} 
                    className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-urbanist font-bold text-lg text-foreground">{flight.airline}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {flight.origin} → {flight.destination}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{format(new Date(flight.departure_time), 'PPp', { locale: es })}</span>
                          </div>
                          <span className="text-primary">→</span>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{format(new Date(flight.arrival_time), 'PPp', { locale: es })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-3xl font-urbanist font-extrabold text-primary">${flight.price}</p>
                          <p className="text-xs text-muted-foreground">por persona</p>
                        </div>
                        {flight.link && (
                          <Button className="rounded-full" asChild>
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
            </div>
          )}

          {/* Itinerary Days */}
          {days.length > 0 && (
            <div className="space-y-6">
              <h2 className="font-urbanist font-bold text-2xl text-foreground px-2">
                Itinerario día a día
              </h2>
              {days.map((day) => (
                <div key={day.id} className="bg-white rounded-3xl shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/90 to-primary px-6 md:px-10 py-5">
                    <h3 className="font-urbanist font-bold text-lg md:text-xl text-white">
                      Día {day.day_number} — {format(new Date(day.date), 'd MMMM yyyy', { locale: es })}
                    </h3>
                    {day.summary && (
                      <p className="text-white/80 text-sm mt-1">{day.summary}</p>
                    )}
                  </div>
                  <div className="p-6 md:p-10 space-y-4">
                    {day.activities.map((activity: any, index: number) => (
                      <div 
                        key={index} 
                        className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-l-4 border-primary"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-2">
                              {getTimeOfDayLabel(activity.timeOfDay)}
                            </span>
                            <h4 className="font-urbanist font-bold text-lg text-foreground">
                              {activity.title}
                            </h4>
                          </div>
                          {activity.approxCost && (
                            <span className="text-lg font-bold text-primary">
                              ${activity.approxCost}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground leading-relaxed mb-3">
                          {activity.description}
                        </p>
                        {activity.location && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-primary" />
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

          {/* Empty state if no content */}
          {!itineraryHtml && days.length === 0 && flights.length === 0 && (
            <div className="bg-white rounded-3xl shadow-xl p-10 md:p-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-urbanist font-bold text-xl mb-3">Sin itinerario detallado</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Este viaje aún no tiene un itinerario generado. Puedes crear uno nuevo desde el chat.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripDetail;
