import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Loader2, MapPin, Calendar, Users, DollarSign, Plane, Clock, ArrowLeft, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Viaje no encontrado</p>
              <Button onClick={() => navigate('/mis-viajes')}>
                Volver a mis viajes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const itineraryHtml = trip.preferences?.itinerary_html;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/mis-viajes')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar este viaje?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El itinerario será eliminado permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteTrip}>
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Trip Header */}
          <Card className="shadow-elegant mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">{trip.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ruta</p>
                    <p className="font-medium">{trip.origin} → {trip.destination}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fechas</p>
                    <p className="font-medium">
                      {format(new Date(trip.start_date), 'd MMM', { locale: es })} - {format(new Date(trip.end_date), 'd MMM', { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Viajeros</p>
                    <p className="font-medium">{trip.travelers}</p>
                  </div>
                </div>

                {trip.budget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Presupuesto</p>
                      <p className="font-medium">${trip.budget}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* HTML Itinerary from webhook */}
          {itineraryHtml && (
            <Card className="shadow-elegant mb-6">
              <CardHeader>
                <CardTitle>Tu itinerario completo</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: itineraryHtml }} 
                />
              </CardContent>
            </Card>
          )}

          {/* Flights */}
          {flights.length > 0 && (
            <Card className="shadow-elegant mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="w-5 h-5" />
                  Opciones de vuelos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {flights.map((flight) => (
                  <div key={flight.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{flight.airline}</p>
                        <p className="text-sm text-muted-foreground">
                          {flight.origin} → {flight.destination}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">${flight.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{format(new Date(flight.departure_time), 'PPp', { locale: es })}</span>
                      </div>
                      <span>→</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{format(new Date(flight.arrival_time), 'PPp', { locale: es })}</span>
                      </div>
                    </div>
                    {flight.link && (
                      <Button variant="secondary" size="sm" asChild>
                        <a href={flight.link} target="_blank" rel="noopener noreferrer">
                          Ver detalles
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Itinerary Days */}
          {days.length > 0 && (
            <div className="space-y-6">
              {days.map((day) => (
                <Card key={day.id} className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Día {day.day_number} - {format(new Date(day.date), 'd MMMM', { locale: es })}
                    </CardTitle>
                    {day.summary && (
                      <p className="text-muted-foreground">{day.summary}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {day.activities.map((activity: any, index: number) => (
                      <div key={index} className="p-4 bg-accent rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-medium text-primary mb-1">
                              {getTimeOfDayLabel(activity.timeOfDay)}
                            </p>
                            <p className="font-semibold">{activity.title}</p>
                          </div>
                          {activity.approxCost && (
                            <p className="text-sm font-semibold text-primary">
                              ${activity.approxCost}
                            </p>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {activity.description}
                        </p>
                        {activity.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {activity.location}
                          </p>
                        )}
                      </div>
                    ))}
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

export default TripDetail;