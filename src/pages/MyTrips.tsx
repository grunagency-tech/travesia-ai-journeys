import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Loader2, MapPin, Calendar, Users, Plus, ArrowRight, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS, de, pt, it } from 'date-fns/locale';
import { getTravelImage } from '@/lib/travelImages';
import logoIcon from '@/assets/logo-icon.svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';

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
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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
            <p className="text-muted-foreground text-sm">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      {/* Hero Header */}
      <div className="relative">
        {/* Background decorative elements */}
        <div className="absolute inset-x-0 top-0 h-[280px] md:h-[320px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-blue-500/10" />
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>

        {/* Spacer for navbar */}
        <div className="h-20" />

        {/* Header Content */}
        <div className="relative container mx-auto px-4 md:px-8 pt-14">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <img src={logoIcon} alt="travesIA" className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="font-urbanist font-extrabold text-3xl md:text-4xl text-foreground">
                      {t('title')}
                    </h1>
                    <span className="bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full">
                      {trips.length}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {t('subtitle')}
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate('/crear-viaje')}
                className="rounded-full px-6 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('newTrip')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-8 pb-16">
        <div className="max-w-5xl mx-auto">
          {trips.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in">
              <div className="bg-gradient-to-r from-primary to-blue-600 px-6 md:px-10 py-6">
                <h2 className="font-urbanist font-bold text-xl md:text-2xl text-white flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  ¡Comienza tu aventura!
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  Crea tu primer itinerario personalizado
                </p>
              </div>
              <div className="p-10 md:p-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-urbanist font-bold text-2xl text-foreground mb-3">
                  Aún no tienes viajes guardados
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Planifica tu próximo destino con ayuda de nuestra inteligencia artificial
                </p>
                <Button 
                  onClick={() => navigate('/crear-viaje')}
                  className="rounded-full px-8"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear mi primer viaje
                </Button>
              </div>
            </div>
          ) : (
            /* Trip Cards */
            <div className="space-y-6">
              {trips.map((trip) => (
                <div 
                  key={trip.id} 
                  className="bg-white rounded-3xl shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                  onClick={() => navigate(`/viaje/${trip.id}`)}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image Section */}
                    <div className="relative w-full md:w-2/5 h-48 md:h-auto md:min-h-[240px]">
                      <img 
                        src={getTravelImage(trip.id)}
                        alt={trip.destination}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
                      
                      {/* Duration Badge */}
                      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
                        <span className="text-sm font-bold text-foreground">
                          {getDuration(trip.start_date, trip.end_date)} días
                        </span>
                      </div>
                      
                      {/* Destination on image (mobile) */}
                      <div className="absolute bottom-4 left-4 md:hidden">
                        <h2 className="font-urbanist font-extrabold text-2xl text-white drop-shadow-lg">
                          {trip.destination}
                        </h2>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                      <div>
                        {/* Destination (desktop) */}
                        <h2 className="hidden md:block font-urbanist font-extrabold text-2xl md:text-3xl text-foreground mb-4">
                          {trip.destination}
                        </h2>

                        {/* Trip Info Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-xs text-muted-foreground font-medium uppercase">Ruta</span>
                            </div>
                            <p className="font-semibold text-foreground text-sm">
                              {trip.origin} → {trip.destination}
                            </p>
                          </div>

                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-8 h-8 bg-orange-200 rounded-xl flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-orange-600" />
                              </div>
                              <span className="text-xs text-muted-foreground font-medium uppercase">Fechas</span>
                            </div>
                            <p className="font-semibold text-foreground text-sm">
                              {format(new Date(trip.start_date), 'd MMM', { locale: es })} - {format(new Date(trip.end_date), 'd MMM', { locale: es })}
                            </p>
                          </div>

                          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-8 h-8 bg-green-200 rounded-xl flex items-center justify-center">
                                <Users className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="text-xs text-muted-foreground font-medium uppercase">Viajeros</span>
                            </div>
                            <p className="font-semibold text-foreground text-sm">
                              {trip.travelers} {trip.travelers === 1 ? 'persona' : 'personas'}
                            </p>
                          </div>

                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-8 h-8 bg-purple-200 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                              </div>
                              <span className="text-xs text-muted-foreground font-medium uppercase">IA</span>
                            </div>
                            <p className="font-semibold text-foreground text-sm">
                              Generado
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <Button 
                        className="w-full rounded-full"
                        variant="default"
                      >
                        Ver itinerario
                        <ArrowRight className="w-4 h-4 ml-2" />
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
