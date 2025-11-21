import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Navbar } from '@/components/Navbar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Paperclip, Send, Linkedin, Instagram, Facebook } from 'lucide-react';
import heroBackground from '@/assets/hero-background.jpg';
import logoFull from '@/assets/logo-full.svg';
import bookingLogo from '@/assets/partners/booking.svg';
import tripLogo from '@/assets/partners/trip.svg';
import viatorLogo from '@/assets/partners/viator.svg';
import tripadvisorLogo from '@/assets/partners/tripadvisor.svg';
import expediaLogo from '@/assets/partners/expedia.svg';
import luggageIcon from '@/assets/icons/luggage.svg';
import hotelIcon from '@/assets/icons/hotel.svg';
import customizeIcon from '@/assets/icons/customize.svg';
import activitiesIcon from '@/assets/icons/activities.svg';
import whyObjectsIcon from '@/assets/why-objects.svg';
import whyCalendarIcon from '@/assets/why-calendar.svg';
import whySearchIcon from '@/assets/why-search.svg';
import whyTravelersIcon from '@/assets/why-travelers.svg';
import logoText from '@/assets/logo-text.svg';
import colosseumImage from '@/assets/colosseum.png';
import dubaiImage from '@/assets/dubai.png';

const LandingPage = () => {
  const [tripDescription, setTripDescription] = useState('');
  const navigate = useNavigate();

  const handleGenerate = () => {
    if (tripDescription.trim()) {
      navigate('/crear-viaje', { state: { description: tripDescription } });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-end overflow-hidden pt-20 pb-12">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBackground})` }}
        />
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 pb-8">
          <div className="max-w-5xl mx-auto text-center">
            {/* Hero Title */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-urbanist font-extrabold text-white mb-4 leading-tight">
              Planea tu viaje completo
              <br />
              en segundos
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white/90 mb-6 max-w-3xl mx-auto font-light">
              Hoteles, vuelos, actividades, itinerarios personalizados, en un solo lugar
            </p>
            
            {/* Input Box */}
            <div className="bg-white rounded-3xl shadow-2xl p-4 mb-3 max-w-4xl mx-auto">
              <Textarea
                placeholder='Se preciso. Ej. "Quiero viajar a Buenos Aires con mi pareja por 7 días con un presupuesto de $900, hospedarnos cerca al Obelisco y realizar actividades extremas fuera de la ciudad"'
                className="min-h-[80px] text-sm border-0 focus-visible:ring-0 resize-none bg-transparent text-gray-900 placeholder:text-gray-400/80"
                value={tripDescription}
                onChange={(e) => setTripDescription(e.target.value)}
              />
              
              <div className="flex items-center justify-between gap-4 mt-3">
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Paperclip className="w-4 h-4" />
                  <span className="text-sm">Adjuntar archivos</span>
                </Button>
                
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-2.5"
                  onClick={handleGenerate}
                  disabled={!tripDescription.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Generar mi itinerario
                </Button>
              </div>
            </div>
            
            {/* Beta Text */}
            <p className="text-white/80 text-sm flex items-center justify-center gap-2">
              Gratis durante la beta. Sin tarjeta. Sin problemas. ↓
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 bg-gradient-to-b from-white to-purple-50/30">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 flex items-center gap-2 flex-wrap">
                  ¿Cómo funciona <img src={logoText} alt="travesIA" className="h-10 inline-block" /> ?
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Tu planificador de viajes con inteligencia artificial crea itinerarios personalizados con vuelos, hoteles, actividades y mucho más, en segundos.
                </p>
                
                <div className="space-y-6">
                  <div className="flex gap-4 bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center p-2">
                        <img src={luggageIcon} alt="Equipaje" className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Describe tu idea</h3>
                      <p className="text-muted-foreground text-sm">
                        Cuéntanos cómo imaginas tu viaje y deja que TravesIA haga el resto.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center p-2">
                        <img src={activitiesIcon} alt="Actividades" className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Recibe tu itinerario personalizado al instante</h3>
                      <p className="text-muted-foreground text-sm">
                        Obtén un plan de viaje hecho a tu medida en segundos.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center p-2">
                        <img src={customizeIcon} alt="Personalizar" className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Ajusta, guarda y comparte</h3>
                      <p className="text-muted-foreground text-sm">
                        Personaliza tu itinerario y compártelo fácilmente.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center p-2">
                        <img src={hotelIcon} alt="Hotel" className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Reserva seguro con nuestros partners</h3>
                      <p className="text-muted-foreground text-sm">
                        Reserva todo tu viaje de forma rápida y confiable.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl overflow-hidden" style={{ width: '305.0526px', height: '390.5837px' }}>
                    <img 
                      src={colosseumImage} 
                      alt="Colosseum" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden mt-8" style={{ width: '305.0526px', height: '390.5837px' }}>
                    <img 
                      src={dubaiImage} 
                      alt="Dubai" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 py-3 text-base font-semibold"
                onClick={scrollToTop}
              >
                ¡Pruébalo YA!
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why use travesIA */}
      <section className="py-12 bg-purple-50/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 flex items-center justify-center gap-2 flex-wrap">
            ¿Por qué usar <img src={logoText} alt="travesIA" className="h-10 inline-block" />?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Tu asistente de viajes con inteligencia artificial crea itinerarios con vuelos, hoteles, actividades y lo que necesites, en segundos
          </p>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="mb-4">
                <img 
                  src={whyObjectsIcon}
                  alt="Planning" 
                  className="w-full h-32 object-contain"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2">Todo tu viaje, desde una sola conversación</h3>
              <p className="text-sm text-muted-foreground">
                Organiza vuelos, hoteles y experiencias fácilmente, sin complicaciones.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="mb-4">
                <img 
                  src={whyCalendarIcon}
                  alt="Search" 
                  className="w-full h-32 object-contain"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ahorra horas de búsqueda y comparación</h3>
              <p className="text-sm text-muted-foreground">
                Nosotros encontramos las mejores opciones por ti, rápido y claro.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="mb-4">
                <img 
                  src={whySearchIcon}
                  alt="Prices" 
                  className="w-full h-32 object-contain"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2">Precios y disponibilidad en tiempo real</h3>
              <p className="text-sm text-muted-foreground">
                Tarifas actualizadas al instante, sin sorpresas ni letras pequeñas.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="mb-4">
                <img 
                  src={whyTravelersIcon}
                  alt="Travelers" 
                  className="w-full h-32 object-contain"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2">Planes hechos por viajeros para viajeros</h3>
              <p className="text-sm text-muted-foreground">
                Itinerarios que se ajustan a tu estilo, cultura y presupuesto
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-b from-purple-50/30 to-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 flex items-center justify-center gap-2 flex-wrap">
            Viajeros como tú que ya probaron <img src={logoText} alt="travesIA" className="h-10 inline-block" />
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm relative">
              <div className="text-6xl text-orange-500 mb-4">"</div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80" 
                  alt="Maria" 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">María, Lima</p>
                  <div className="flex text-primary">★★★★★</div>
                </div>
                <span className="ml-auto text-2xl">🇵🇪</span>
              </div>
              <p className="text-sm text-muted-foreground italic">
                "Planifiqué mi viaje a Cusco en segundos y descubrí lugares únicos"
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm relative">
              <div className="text-6xl text-orange-500 mb-4">"</div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" 
                  alt="Jorge" 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">Jorge, CDMX</p>
                  <div className="flex text-primary">★★★★★</div>
                </div>
                <span className="ml-auto text-2xl">🇲🇽</span>
              </div>
              <p className="text-sm text-muted-foreground italic">
                "TravesIA me armó mi Eurotrip en segundos. Me ahorro tiempo y dinero."
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm relative">
              <div className="text-6xl text-orange-500 mb-4">"</div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" 
                  alt="Valentina" 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">Valentina, Bogotá</p>
                  <div className="flex text-primary">★★★★★</div>
                </div>
                <span className="ml-auto text-2xl">🇨🇴</span>
              </div>
              <p className="text-sm text-muted-foreground italic">
                "Me encantó tener todo en un solo lugar, sin estrés."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-20 bg-gradient-to-b from-white to-orange-50/20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
            Conectados con las plataformas
            <br />
            más confiables del mundo
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Más de 10,000 itinerarios creados con datos reales de precios, rutas y experiencias. Accede a las mejores opciones del mercado.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-12 mb-12">
            <img src={bookingLogo} alt="Booking.com" className="h-8 object-contain" />
            <img src={tripLogo} alt="Trip.com" className="h-8 object-contain" />
            <img src={viatorLogo} alt="Viator" className="h-8 object-contain" />
            <img src={tripadvisorLogo} alt="Tripadvisor" className="h-8 object-contain" />
            <img src={expediaLogo} alt="Expedia" className="h-8 object-contain" />
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 py-3 text-base font-semibold"
              onClick={scrollToTop}
            >
              ¡Pruébalo YA!
            </Button>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-orange-50/20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-white rounded-lg border-0 shadow-sm px-6">
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  ¿Cómo puede TravesIA planificar tu viaje completo en solo segundos?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  TravesIA utiliza inteligencia artificial para analizar tus preferencias, presupuesto y destino, y generar en segundos un itinerario personalizado con vuelos, hospedajes, actividades, transporte y clima. Solo escribe tu idea —por ejemplo: "Quiero viajar a México con $800 durante 5 días"— y la IA hará el resto, entregándote una guía completa y organizada para tu viaje.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-white rounded-lg border-0 shadow-sm px-6">
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  ¿Qué tipo de información incluye el itinerario que crea TravesIA?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  Cada itinerario generado por TravesIA incluye información práctica y actualizada sobre vuelos, opciones de alojamiento, actividades recomendadas, presupuesto estimado, clima, transporte local y consejos culturales. Todo se adapta a tus fechas, estilo de viaje y tipo de experiencia que buscas (romántica, aventura, descanso o cultural).
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-white rounded-lg border-0 shadow-sm px-6">
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  ¿TravesIA realiza reservas o solo muestra las mejores opciones de viaje?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  TravesIA no realiza reservas directas. Nuestra inteligencia artificial analiza y selecciona las mejores opciones disponibles en plataformas asociadas como Booking.com, Viator, TripAdvisor y Expedia. Te mostramos los resultados más relevantes y confiables para que puedas reservar fácilmente desde las páginas oficiales de nuestros partners.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-white rounded-lg border-0 shadow-sm px-6">
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  ¿Qué tan confiables son los precios y recomendaciones que muestra TravesIA?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  Los precios y recomendaciones de TravesIA se actualizan constantemente a través de integraciones con fuentes oficiales y plataformas globales de viajes. Aunque las tarifas son estimadas y pueden variar según la disponibilidad o la fecha, los valores mostrados reflejan información real y actualizada del mercado.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-white rounded-lg border-0 shadow-sm px-6">
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  ¿Cómo protege TravesIA mi información y mis datos personales?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  TravesIA cumple con los estándares internacionales de protección de datos (GDPR e INDECOPI). Tu información solo se usa para mejorar tus recomendaciones personalizadas y nunca se comparte con terceros sin tu consentimiento. Toda la comunicación y almacenamiento de datos se realiza mediante conexiones seguras y cifradas.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-border/40">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div className="flex flex-col gap-3 max-w-sm items-start">
                <img src={logoFull} alt="travesIA" className="h-8" />
                <div className="flex items-center gap-4">
                  <a href="#" className="text-orange-500 hover:text-orange-600 transition-colors">
                    <Linkedin className="w-6 h-6" />
                  </a>
                  <a href="#" className="text-orange-500 hover:text-orange-600 transition-colors">
                    <Instagram className="w-6 h-6" />
                  </a>
                  <a href="#" className="text-orange-500 hover:text-orange-600 transition-colors">
                    <Facebook className="w-6 h-6" />
                  </a>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed text-left">
                  © 2025 TravesIA — Itinerarios únicos, presupuestos de viajes personalizados, recomendaciones a tu medida y mucho más. Planifica todo tu viaje en un solo lugar.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-6 md:gap-12 md:items-start">
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacidad
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Términos
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Ayuda
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contacto
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
