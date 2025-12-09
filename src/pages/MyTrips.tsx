import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Loader2, MapPin, Calendar, Users, Plus, ArrowRight, Plane } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getTravelImage } from '@/lib/travelImages';

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
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando tus aventuras...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Navbar />
      
      <div className="container mx-auto px-6 lg:px-8 pt-32 lg:pt-40 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-16 lg:mb-20">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Plane className="w-7 h-7 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full">
                    {trips.length} {trips.length === 1 ? 'viaje' : 'viajes'}
                  </span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
                  Mis viajes
                </h1>
                <p className="text-xl text-muted-foreground max-w-xl">
                  Explora y gestiona todas tus aventuras planificadas
                </p>
              </div>
              <Button 
                onClick={() => navigate('/crear-viaje')}
                size="lg"
                className="h-16 px-10 rounded-2xl shadow-lg hover:shadow-xl transition-all text-lg font-semibold gap-3"
              >
                <Plus className="w-6 h-6" />
                Nuevo viaje
              </Button>
            </div>
          </div>

          {trips.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="relative h-72 bg-gradient-to-br from-primary/20 via-primary/10 to-blue-50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <MapPin className="w-14 h-14 text-primary" />
                  </div>
                </div>
              </div>
              <div className="p-10 lg:p-16 text-center">
                <h3 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                  ¡Tu próxima aventura te espera!
                </h3>
                <p className="text-muted-foreground text-xl mb-10 max-w-xl mx-auto leading-relaxed">
                  Aún no tienes viajes guardados. Crea tu primer itinerario personalizado con inteligencia artificial.
                </p>
                <Button 
                  onClick={() => navigate('/crear-viaje')}
                  size="lg"
                  className="h-16 px-12 rounded-2xl shadow-lg hover:shadow-xl transition-all text-lg font-semibold gap-3"
                >
                  <Plus className="w-6 h-6" />
                  Crear mi primer viaje
                </Button>
              </div>
            </div>
          ) : (
            /* Trip Cards Grid */
            <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
              {trips.map((trip) => (
                <div 
                  key={trip.id} 
                  className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-2"
                  onClick={() => navigate(`/viaje/${trip.id}`)}
                >
                  <div className="flex flex-col sm:flex-row h-full">
                    {/* Image Section */}
                    <div className="relative w-full sm:w-2/5 h-56 sm:h-auto min-h-[240px]">
                      <img 
                        src={getTravelImage(trip.id)}
                        alt={trip.destination}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/40 to-transparent" />
                      
                      {/* Duration Badge */}
                      <div className="absolute top-5 left-5 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
                        <span className="text-sm font-semibold text-foreground">
                          {getDuration(trip.start_date, trip.end_date)} días
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-8 flex flex-col justify-between">
                      <div className="space-y-5">
                        {/* Destination as Main Title */}
                        <h2 className="text-2xl lg:text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {trip.destination}
                        </h2>
                        
                        {/* Route */}
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span className="text-base">{trip.origin}</span>
                          <ArrowRight className="w-5 h-5" />
                          <span className="text-base font-medium text-foreground">{trip.destination}</span>
                        </div>

                        {/* Trip Details */}
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Fechas</p>
                              <p className="text-base font-medium text-foreground">
                                {format(new Date(trip.start_date), 'd MMM', { locale: es })} - {format(new Date(trip.end_date), 'd MMM yyyy', { locale: es })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Viajeros</p>
                              <p className="text-base font-medium text-foreground">
                                {trip.travelers} {trip.travelers === 1 ? 'persona' : 'personas'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <Button 
                        className="mt-8 w-full rounded-xl h-14 text-base font-semibold group-hover:bg-primary group-hover:text-white transition-all" 
                        variant="secondary"
                      >
                        Ver itinerario
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
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
