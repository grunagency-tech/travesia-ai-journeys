import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Loader2, MapPin, Calendar, Users, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS, de, pt, it } from 'date-fns/locale';
import { getImageByDestination } from '@/lib/travelImages';
import travelGlobeIcon from '@/assets/travel-globe-icon.png';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';
import { useToast } from '@/hooks/use-toast';
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

const locales = { ES: es, EN: enUS, DE: de, PT: pt, IT: it };

interface Trip {
  id: string;
  title: string;
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number | null;
  travelers: number;
  created_at: string;
}

const MyTrips = () => {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const t = (key: string) => getTranslation(`myTrips.${key}`, language);
  const dateLocale = locales[language] || es;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      loadTrips();
    }
  }, [user, authLoading, navigate]);

  const loadTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTrips(data || []);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    setDeletingId(tripId);
    try {
      // Delete related data first
      await supabase.from('itinerary_days').delete().eq('trip_id', tripId);
      await supabase.from('flight_options').delete().eq('trip_id', tripId);
      await supabase.from('conversations').update({ trip_id: null }).eq('trip_id', tripId);

      // Delete the trip
      const { error } = await supabase.from('trips').delete().eq('id', tripId);
      if (error) throw error;

      setTrips(prev => prev.filter(t => t.id !== tripId));
      toast({
        title: "Viaje eliminado",
        description: "El itinerario ha sido eliminado correctamente",
      });
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el viaje",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <img src={travelGlobeIcon} alt="travesIA" className="w-10 h-10 animate-pulse" />
            </div>
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header with gradient overlay like itinerary */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-[200px] bg-gradient-to-b from-primary/8 via-primary/4 to-transparent" />
        
        {/* Spacer for navbar */}
        <div className="h-20" />

        <div className="relative container mx-auto px-4 md:px-8 pt-8 pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <img src={travelGlobeIcon} alt="travesIA" className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-urbanist font-bold text-2xl md:text-3xl text-foreground">
                    {t('title')}
                  </h1>
                  {trips.length > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
                      {trips.length}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">
                  {t('subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          {trips.length === 0 ? (
            /* Empty State - styled like itinerary card */
            <div className="bg-card rounded-xl overflow-hidden border shadow-sm animate-fade-in">
              {/* Header gradient banner like itinerary */}
              <div className="relative h-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-600 to-primary/80" />
                <div className="absolute inset-0 opacity-20" style={{ 
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }} />
                <div className="absolute inset-0 flex items-center px-6">
                  <div>
                    <h2 className="font-urbanist font-bold text-xl text-white">
                      ¡Comienza tu aventura!
                    </h2>
                    <p className="text-white/80 text-sm mt-1">
                      Crea tu primer itinerario personalizado
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Empty state content */}
              <div className="p-8 md:p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-5 bg-primary/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-urbanist font-bold text-xl text-foreground mb-2">
                  Aún no tienes viajes guardados
                </h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                  Planifica tu próximo destino con ayuda de nuestra inteligencia artificial
                </p>
                <Button 
                  onClick={() => navigate('/crear-viaje')}
                  className="rounded-full px-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear mi primer viaje
                </Button>
              </div>
            </div>
          ) : (
            /* Trip Cards - styled like itinerary panel */
            <div className="space-y-4">
              {trips.map((trip) => (
                <div 
                  key={trip.id} 
                  className="bg-card rounded-xl overflow-hidden border shadow-sm cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-300 animate-fade-in group"
                  onClick={() => navigate(`/viaje/${trip.id}`)}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image Section - like itinerary header */}
                    <div className="relative w-full md:w-72 h-44 md:h-auto md:min-h-[180px] flex-shrink-0">
                      <img 
                        src={getImageByDestination(trip.destination)}
                        alt={trip.destination}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                      
                      {/* Duration Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                          <Calendar className="w-3.5 h-3.5" />
                          {getDuration(trip.start_date, trip.end_date)} días
                        </span>
                      </div>
                      
                      {/* Destination overlay on mobile */}
                      <div className="absolute bottom-3 left-3 md:hidden">
                        <h2 className="font-urbanist font-bold text-xl text-white drop-shadow-lg">
                          {trip.destination}
                        </h2>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        {/* Destination (desktop) */}
                        <h2 className="hidden md:block font-urbanist font-bold text-xl text-foreground mb-3">
                          {trip.destination}
                        </h2>

                        {/* Trip Info - compact like itinerary */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{trip.origin} → {trip.destination}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <span>
                              {format(new Date(trip.start_date), 'd MMM', { locale: es })} - {format(new Date(trip.end_date), 'd MMM', { locale: es })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-green-500" />
                            <span>{trip.travelers} {trip.travelers === 1 ? 'viajero' : 'viajeros'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button 
                          className="flex-1 rounded-full"
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/viaje/${trip.id}`);
                          }}
                        >
                          Ver itinerario
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => e.stopPropagation()}
                              disabled={deletingId === trip.id}
                            >
                              {deletingId === trip.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-xl" onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-urbanist font-bold text-lg">
                                ¿Eliminar este viaje?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. El itinerario a {trip.destination} será eliminado permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTrip(trip.id);
                                }} 
                                className="rounded-full bg-destructive hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTrips;
