import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Loader2, MapPin, Calendar, Users, DollarSign, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Mis viajes
                </h1>
                <p className="text-muted-foreground text-lg">
                  Tus aventuras guardadas y listas para explorar
                </p>
              </div>
              <Button 
                onClick={() => navigate('/crear-viaje')}
                size="lg"
                className="h-12 px-6 rounded-xl shadow-hover hover:shadow-elegant transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Crear nuevo viaje
              </Button>
            </div>
          </div>

          {trips.length === 0 ? (
            <Card className="shadow-premium border-0 rounded-3xl">
              <CardContent className="py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">
                  Comienza tu aventura
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Aún no tienes viajes guardados. Crea tu primer itinerario y comienza a planear experiencias inolvidables.
                </p>
                <Button 
                  onClick={() => navigate('/crear-viaje')}
                  size="lg"
                  className="h-12 px-8 rounded-xl shadow-hover hover:shadow-elegant transition-all"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Crear mi primer viaje
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <Card 
                  key={trip.id} 
                  className="shadow-card hover:shadow-premium border-0 rounded-3xl transition-all cursor-pointer overflow-hidden group hover-scale"
                  onClick={() => navigate(`/viaje/${trip.id}`)}
                >
                  {/* Card Header with gradient */}
                  <div className="h-32 bg-gradient-to-br from-primary/20 via-primary-glow/20 to-primary/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <CardTitle className="text-xl text-foreground line-clamp-2">{trip.title}</CardTitle>
                    </div>
                  </div>
                  
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-foreground font-medium truncate">
                        {trip.origin} → {trip.destination}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-muted-foreground">
                        {format(new Date(trip.start_date), 'd MMM', { locale: es })} - {format(new Date(trip.end_date), 'd MMM yyyy', { locale: es })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{trip.travelers} {trip.travelers === 1 ? 'viajero' : 'viajeros'}</span>
                      </div>

                      {trip.budget && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">${trip.budget}</span>
                        </div>
                      )}
                    </div>

                    <Button 
                      className="w-full mt-4 rounded-xl h-11 font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-all" 
                      variant="secondary"
                    >
                      Ver itinerario completo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTrips;
