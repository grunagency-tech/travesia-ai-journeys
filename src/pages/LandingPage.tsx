import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Navbar } from '@/components/Navbar';
import { Sparkles, MapPin, Calendar, DollarSign } from 'lucide-react';

const LandingPage = () => {
  const [tripDescription, setTripDescription] = useState('');
  const navigate = useNavigate();

  const handleGenerate = () => {
    if (tripDescription.trim()) {
      navigate('/crear-viaje', { state: { description: tripDescription } });
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Planifica tu viaje perfecto con IA
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Describe tu viaje ideal y deja que nuestra IA cree un itinerario personalizado con vuelos, actividades y presupuesto.
            </p>
            
            <div className="bg-card shadow-elegant rounded-xl p-6 mb-8">
              <Textarea
                placeholder="Ejemplo: Quiero un viaje romántico a París durante 5 días en junio, con presupuesto moderado. Me interesa la gastronomía y museos..."
                className="min-h-[120px] text-base mb-4"
                value={tripDescription}
                onChange={(e) => setTripDescription(e.target.value)}
              />
              <Button 
                size="lg" 
                className="w-full md:w-auto gradient-primary text-white"
                onClick={handleGenerate}
                disabled={!tripDescription.trim()}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generar mi itinerario
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            ¿Cómo funciona travesIA?
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">1. Describe tu viaje</h3>
              <p className="text-muted-foreground text-sm">
                Cuéntanos qué tipo de experiencia buscas
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">2. IA analiza opciones</h3>
              <p className="text-muted-foreground text-sm">
                Buscamos vuelos y creamos el mejor itinerario
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Revisa tu plan</h3>
              <p className="text-muted-foreground text-sm">
                Explora día a día tu itinerario personalizado
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">4. Guarda y comparte</h3>
              <p className="text-muted-foreground text-sm">
                Accede a tus viajes cuando quieras
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card p-6 rounded-lg shadow-card">
              <h3 className="text-xl font-semibold mb-3">✈️ Vuelos reales</h3>
              <p className="text-muted-foreground">
                Obtenemos precios y opciones de vuelos actualizados para tu destino
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-card">
              <h3 className="text-xl font-semibold mb-3">🗺️ Itinerarios detallados</h3>
              <p className="text-muted-foreground">
                Actividades por día organizadas por mañana, tarde y noche
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-card">
              <h3 className="text-xl font-semibold mb-3">💰 Control de presupuesto</h3>
              <p className="text-muted-foreground">
                Estimaciones de costos para cada actividad y alojamiento
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
