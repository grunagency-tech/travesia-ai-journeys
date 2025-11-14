import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Loader2, Calendar, MapPin, Users, DollarSign, Plane } from 'lucide-react';
import { format } from 'date-fns';

const CreateTrip = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [description, setDescription] = useState(location.state?.description || '');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<any>(null);
  const [savingTrip, setSavingTrip] = useState(false);

  const handleGenerate = async () => {
    if (!origin || !destination || !startDate || !endDate) {
      toast({
        title: 'Datos incompletos',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setItinerary(null);

    try {
      // First, search for flights
      console.log('Searching flights...');
      const { data: flightData, error: flightError } = await supabase.functions.invoke('search-flights', {
        body: {
          origin,
          destination,
          startDate,
          endDate,
          passengers: travelers,
        },
      });

      if (flightError) {
        console.error('Flight search error:', flightError);
      }

      // Generate itinerary with AI
      console.log('Generating itinerary...');
      const { data, error } = await supabase.functions.invoke('generate-itinerary', {
        body: {
          description,
          origin,
          destination,
          startDate,
          endDate,
          travelers,
          budget: budget ? parseFloat(budget) : null,
          flightData: flightData?.flights || [],
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.itinerary) {
        throw new Error('No se recibió el itinerario');
      }

      setItinerary(data.itinerary);
      
      toast({
        title: '¡Itinerario generado!',
        description: 'Tu plan de viaje está listo',
      });
    } catch (error: any) {
      console.error('Error generating itinerary:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo generar el itinerario',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTrip = async () => {
    if (!user) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para guardar el viaje',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!itinerary) return;

    setSavingTrip(true);

    try {
      // Save trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          title: itinerary.trip.title,
          origin,
          destination,
          start_date: startDate,
          end_date: endDate,
          budget: budget ? parseFloat(budget) : null,
          travelers,
          preferences: { description },
        })
        .select()
        .single();

      if (tripError) throw tripError;

      // Save itinerary days
      const daysData = itinerary.days.map((day: any) => ({
        trip_id: trip.id,
        day_number: day.dayNumber,
        date: day.date,
        summary: day.summary,
        activities: day.activities,
      }));

      const { error: daysError } = await supabase
        .from('itinerary_days')
        .insert(daysData);

      if (daysError) throw daysError;

      // Save flight options
      if (itinerary.flights && itinerary.flights.length > 0) {
        const flightsData = itinerary.flights.map((flight: any) => ({
          trip_id: trip.id,
          airline: flight.airline,
          origin: flight.origin,
          destination: flight.destination,
          departure_time: flight.departureTime,
          arrival_time: flight.arrivalTime,
          price: flight.price,
          link: flight.link || null,
          raw_data: flight,
        }));

        const { error: flightsError } = await supabase
          .from('flight_options')
          .insert(flightsData);

        if (flightsError) throw flightsError;
      }

      toast({
        title: '¡Viaje guardado!',
        description: 'Puedes verlo en "Mis viajes"',
      });

      navigate('/mis-viajes');
    } catch (error: any) {
      console.error('Error saving trip:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el viaje',
        variant: 'destructive',
      });
    } finally {
      setSavingTrip(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Crear nuevo viaje</h1>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Detalles del viaje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe tu viaje ideal..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="origin">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Origen
                    </Label>
                    <Input
                      id="origin"
                      placeholder="ej: MAD"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div>
                    <Label htmlFor="destination">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Destino
                    </Label>
                    <Input
                      id="destination"
                      placeholder="ej: CDG"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Fecha inicio
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Fecha fin
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="travelers">
                      <Users className="w-4 h-4 inline mr-1" />
                      Viajeros
                    </Label>
                    <Input
                      id="travelers"
                      type="number"
                      min="1"
                      value={travelers}
                      onChange={(e) => setTravelers(parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="budget">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Presupuesto (USD)
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="Opcional"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Plane className="w-4 h-4 mr-2" />
                      Generar itinerario
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-6">
              {loading && (
                <Card className="shadow-elegant">
                  <CardContent className="py-12 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Creando tu itinerario personalizado...</p>
                  </CardContent>
                </Card>
              )}

              {itinerary && (
                <Card className="shadow-elegant">
                  <CardHeader>
                    <CardTitle>{itinerary.trip.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{itinerary.trip.summary}</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Budget */}
                    {itinerary.trip.estimatedBudget && (
                      <div className="p-4 bg-accent rounded-lg">
                        <p className="text-sm font-medium">Presupuesto estimado</p>
                        <p className="text-2xl font-bold text-primary">
                          ${itinerary.trip.estimatedBudget}
                        </p>
                      </div>
                    )}

                    {/* Days */}
                    <div>
                      <h3 className="font-semibold mb-3">Itinerario por días</h3>
                      <div className="space-y-3">
                        {itinerary.days.slice(0, 2).map((day: any) => (
                          <div key={day.dayNumber} className="p-3 border rounded-lg">
                            <p className="font-medium">Día {day.dayNumber}</p>
                            <p className="text-sm text-muted-foreground">{day.summary}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {day.activities.length} actividades
                            </p>
                          </div>
                        ))}
                        {itinerary.days.length > 2 && (
                          <p className="text-sm text-muted-foreground text-center">
                            +{itinerary.days.length - 2} días más
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <Button 
                      className="w-full" 
                      onClick={handleSaveTrip}
                      disabled={savingTrip}
                    >
                      {savingTrip ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar plan'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTrip;
