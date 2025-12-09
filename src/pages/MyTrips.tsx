import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Loader2, MapPin, Calendar, Users, Plus, ArrowRight, Plane, Sparkles } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/10 animate-pulse" />
              <Loader2 className="w-8 h-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-muted-foreground font-medium">Cargando tus aventuras...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 lg:px-8 pt-32 lg:pt-40 pb-12 relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-primary/20 px-5 py-2.5 rounded-full shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                    <Plane className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {trips.length} {trips.length === 1 ? 'aventura guardada' : 'aventuras guardadas'}
                  </span>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-bold text-foreground tracking-tight font-urbanist">
                  Mis viajes
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                  Tus itinerarios personalizados, listos para explorar
                </p>
              </div>
              
              <Button 
                onClick={() => navigate('/crear-viaje')}
                size="lg"
                className="h-14 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all text-base font-semibold gap-2 bg-gradient-to-r from-primary to-blue-600"
              >
                <Plus className="w-5 h-5" />
                Nuevo viaje
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          {trips.length === 0 ? (
            /* Empty State */
            <div className="relative bg-white rounded-[2rem] shadow-2xl border border-gray-100/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
              
              <div className="relative p-12 lg:p-20 text-center">
                <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-primary/20 to-blue-400/20 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <MapPin className="w-10 h-10 text-primary" />
                  </div>
                </div>
                
                <h3 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 font-urbanist">
                  ¡Tu próxima aventura te espera!
                </h3>
                <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto leading-relaxed">
                  Crea tu primer itinerario personalizado con inteligencia artificial
                </p>
                
                <Button 
                  onClick={() => navigate('/crear-viaje')}
                  size="lg"
                  className="h-14 px-10 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all text-base font-semibold gap-2 bg-gradient-to-r from-primary to-blue-600"
                >
                  <Sparkles className="w-5 h-5" />
                  Crear mi primer viaje
                </Button>
              </div>
            </div>
          ) : (
            /* Trip Cards Grid */
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {trips.map((trip, index) => (
                <div 
                  key={trip.id} 
                  className="group relative bg-white rounded-[1.5rem] shadow-lg hover:shadow-2xl border border-gray-100/80 overflow-hidden transition-all duration-500 cursor-pointer hover:-translate-y-1"
                  onClick={() => navigate(`/viaje/${trip.id}`)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Image Section */}
                  <div className="relative h-52 overflow-hidden">
                    <img 
                      src={getTravelImage(trip.id)}
                      alt={trip.destination}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Duration Badge */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                      <span className="text-xs font-bold text-foreground">
                        {getDuration(trip.start_date, trip.end_date)} días
                      </span>
                    </div>
                    
                    {/* Destination overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-2xl font-bold text-white font-urbanist drop-shadow-lg">
                        {trip.destination}
                      </h2>
                      <div className="flex items-center gap-2 text-white/90 text-sm mt-1">
                        <span>{trip.origin}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{trip.destination}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-5">
                    {/* Trip Details */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">
                          {format(new Date(trip.start_date), 'd MMM', { locale: es })} - {format(new Date(trip.end_date), 'd MMM', { locale: es })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{trip.travelers}</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button 
                      className="w-full rounded-xl h-11 text-sm font-semibold bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary hover:from-primary hover:to-blue-600 hover:text-white transition-all duration-300 border-0" 
                      variant="outline"
                    >
                      Ver itinerario
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-[1.5rem] ring-2 ring-primary/0 group-hover:ring-primary/20 transition-all duration-300 pointer-events-none" />
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
