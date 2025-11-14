import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Navbar } from '@/components/Navbar';
import { Sparkles, Paperclip, MapPin, Calendar, Plane } from 'lucide-react';
import heroBackground from '@/assets/hero-background.jpg';

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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBackground})` }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-32">
          <div className="max-w-5xl mx-auto text-center">
            {/* Hero Title */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
              Planea tu viaje
              <br />
              completo en segundos
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Dinos a dónde quieres ir y nosotros nos encargamos del resto.
              <br />
              Itinerarios personalizados, vuelos y presupuesto en tiempo real.
            </p>
            
            {/* Input Box */}
            <div className="bg-white rounded-3xl shadow-2xl p-6 mb-6 max-w-4xl mx-auto">
              <Textarea
                placeholder="Ejemplo: Quiero ir a Japón en abril por 10 días, me encanta la comida y los templos. Presupuesto moderado. Saldré desde Madrid..."
                className="min-h-[140px] text-base border-0 focus-visible:ring-0 resize-none bg-transparent text-gray-900 placeholder:text-gray-400"
                value={tripDescription}
                onChange={(e) => setTripDescription(e.target.value)}
              />
              
              <div className="flex items-center justify-between gap-4 mt-4">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 border-gray-300"
                >
                  <Paperclip className="w-4 h-4" />
                  Adjuntar archivos
                </Button>
                
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-white px-8"
                  onClick={handleGenerate}
                  disabled={!tripDescription.trim()}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generar mi itinerario
                </Button>
              </div>
            </div>
            
            {/* Beta Text */}
            <p className="text-gray-400 text-sm">
              Gratis durante la beta. Sin tarjeta. Sin problemas.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            ¿Cómo funciona travesIA?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">1. Describe tu viaje</h3>
              <p className="text-muted-foreground text-lg">
                Cuéntanos a dónde quieres ir, tus fechas, presupuesto y preferencias. Cuanto más detalle, mejor será tu itinerario.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Plane className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">2. IA busca y planifica</h3>
              <p className="text-muted-foreground text-lg">
                Nuestra IA busca vuelos reales, crea tu itinerario día a día y calcula el presupuesto total de tu viaje.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">3. Ajusta y viaja</h3>
              <p className="text-muted-foreground text-lg">
                Revisa tu plan completo, ajusta lo que necesites y guárdalo para tenerlo siempre disponible en tu próxima aventura.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-card p-8 rounded-2xl shadow-card">
              <div className="text-4xl mb-4">✈️</div>
              <h3 className="text-xl font-semibold mb-3">Vuelos reales</h3>
              <p className="text-muted-foreground">
                Obtenemos precios y opciones de vuelos actualizados para tu destino en tiempo real.
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl shadow-card">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold mb-3">Itinerarios detallados</h3>
              <p className="text-muted-foreground">
                Actividades por día organizadas por mañana, tarde y noche, adaptadas a tus intereses.
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl shadow-card">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-3">Control de presupuesto</h3>
              <p className="text-muted-foreground">
                Estimaciones de costos para cada actividad, alojamiento y transporte durante tu viaje.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
