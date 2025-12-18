import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Loader2, Calendar, MapPin, Users, DollarSign, Plane } from 'lucide-react';
import { format } from 'date-fns';

const CreateTrip = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currency, currencySymbol } = useCurrency();
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
      
      // Auto-save the trip after generation
      if (user) {
        await autoSaveTrip(data.itinerary);
      }
      
      toast({
        title: '¡Itinerario generado y guardado!',
        description: 'Puedes verlo en "Mis viajes"',
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

  const autoSaveTrip = async (itineraryData: any) => {
    if (!user) return;

    try {
      // Save trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          title: itineraryData.trip.title,
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
      const daysData = itineraryData.days.map((day: any) => ({
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
      if (itineraryData.flights && itineraryData.flights.length > 0) {
        const flightsData = itineraryData.flights.map((flight: any) => ({
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
    } catch (error: any) {
      console.error('Error auto-saving trip:', error);
      // Don't throw - we already have the itinerary displayed
    }
  };

  // handleSaveTrip removed - trips are now auto-saved after generation

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
          {/* Header Section */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Crear nuevo viaje
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Diseña tu experiencia perfecta. Completa los detalles y deja que la IA cree tu itinerario ideal.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form */}
            <Card className="shadow-premium border-0 rounded-3xl transition-smooth">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl">Detalles del viaje</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Completa la información para personalizar tu experiencia
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Ej: Quiero un viaje relajante con playas y buena gastronomía..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="resize-none border-border/50 focus:border-primary transition-smooth rounded-xl"
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
                      Presupuesto ({currency})
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {currencySymbol}
                      </span>
                      <Input
                        id="budget"
                        type="number"
                        placeholder="Opcional"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full mt-8 h-14 text-base font-semibold rounded-xl shadow-hover hover:shadow-elegant transition-all" 
                  size="lg"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generando tu itinerario...
                    </>
                  ) : (
                    <>
                      <Plane className="w-5 h-5 mr-2" />
                      Generar itinerario con IA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-6">
              {loading && (
                <Card className="shadow-premium border-0 rounded-3xl">
                  <CardContent className="py-16 text-center">
                    <div className="relative inline-block mb-6">
                      <Loader2 className="w-16 h-16 animate-spin text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Creando tu itinerario</h3>
                    <p className="text-muted-foreground">La IA está diseñando tu experiencia perfecta...</p>
                  </CardContent>
                </Card>
              )}

              {itinerary && (
                <Card className="shadow-premium border-0 rounded-3xl overflow-hidden">
                  <div className="bg-gradient-to-br from-primary/5 to-primary-glow/5 p-6 border-b">
                    <CardTitle className="text-2xl mb-2">{itinerary.trip.title}</CardTitle>
                    <p className="text-muted-foreground">{itinerary.trip.summary}</p>
                  </div>
                  <CardContent className="space-y-6 p-6">
                    {/* Budget */}
                    {itinerary.trip.estimatedBudget && (
                      <div className="p-6 bg-gradient-to-br from-primary/10 to-primary-glow/10 rounded-2xl border border-primary/20">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Presupuesto estimado</p>
                        <p className="text-3xl font-bold text-primary">
                          ${itinerary.trip.estimatedBudget}
                        </p>
                      </div>
                    )}

                    {/* Days */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Itinerario por días</h3>
                      <div className="space-y-3">
                        {itinerary.days.slice(0, 2).map((day: any) => (
                          <div key={day.dayNumber} className="p-5 bg-card border border-border/50 rounded-xl hover:border-primary/30 transition-smooth">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">{day.dayNumber}</span>
                              </div>
                              <p className="font-semibold">Día {day.dayNumber}</p>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{day.summary}</p>
                            <p className="text-xs text-muted-foreground">
                              {day.activities.length} actividades planificadas
                            </p>
                          </div>
                        ))}
                        {itinerary.days.length > 2 && (
                          <div className="text-center py-2">
                            <p className="text-sm text-muted-foreground">
                              + {itinerary.days.length - 2} días más incluidos
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Auto-saved message */}
                    <div className="w-full text-center py-4 text-green-600 font-medium flex items-center justify-center gap-2">
                      <span className="text-lg">✓</span>
                      Itinerario guardado automáticamente
                    </div>
                    <Button 
                      className="w-full h-14 text-base font-semibold rounded-xl shadow-hover hover:shadow-elegant transition-all" 
                      onClick={() => navigate('/mis-viajes')}
                    >
                      Ver mis viajes
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
