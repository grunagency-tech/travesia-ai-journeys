import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Navbar } from '@/components/Navbar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Paperclip, Send, Linkedin, Instagram, Facebook, Mic, ChevronDown, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();
  const { language } = useLanguage();

  const { isRecording, isProcessing, toggleRecording } = useVoiceRecorder({
    onTranscription: (text) => {
      setTripDescription(prev => prev ? `${prev} ${text}` : text);
    }
  });

  // Preload hero image
  useState(() => {
    const img = new Image();
    img.src = heroBackground;
    img.onload = () => setImageLoaded(true);
  });

  const handleGenerate = () => {
    if (tripDescription.trim()) {
      navigate('/chat', { state: { initialMessage: tripDescription } });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col justify-end sm:flex-row sm:items-end overflow-hidden pt-24 sm:pt-20 pb-6 sm:pb-12">
        {/* Background placeholder gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-blue-900" />
        
        {/* Background Image with lazy loading */}
        <div 
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `url(${heroBackground})` }}
        />
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 flex flex-col justify-center flex-1 sm:flex-initial sm:h-auto sm:pb-8">
          {/* Title Section - centered vertically on mobile */}
          <div className="max-w-5xl mx-auto text-left sm:text-center flex-shrink-0 mb-auto sm:mb-0 mt-auto sm:mt-0">
            {/* Hero Title */}
            <h1 className="text-[3.25rem] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-urbanist font-extrabold text-white mb-2 sm:mb-4 leading-[1.05] sm:leading-tight">
              {getTranslation('hero.title', language)}
            </h1>
            
            {/* Subtitle */}
            <p className="text-sm sm:text-lg md:text-xl text-white/90 mb-0 sm:mb-6 max-w-3xl sm:mx-auto font-light">
              {getTranslation('hero.subtitle', language)}
            </p>
          </div>
          
          {/* Spacer for mobile - pushes input to bottom */}
          <div className="flex-1 sm:hidden min-h-8" />
          
          {/* Input Section - at bottom on mobile */}
          <div className="max-w-5xl mx-auto text-left sm:text-center w-full">
            
            {/* Input Box - Mobile Version */}
            <div className="sm:hidden bg-white rounded-3xl shadow-2xl p-4 mb-3 max-w-4xl mx-auto">
              <Textarea
                placeholder={getTranslation('hero.placeholder', language)}
                className="min-h-[80px] text-sm border-0 focus-visible:ring-0 resize-none bg-transparent text-gray-900 placeholder:text-gray-500"
                value={tripDescription}
                onChange={(e) => setTripDescription(e.target.value)}
              />
              
              <div className="flex items-center justify-between mt-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className={`rounded-full ${isRecording ? 'text-red-500 bg-red-100 animate-pulse' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    onClick={toggleRecording}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </Button>
                  
                  <Button 
                    size="icon"
                    className="bg-primary hover:bg-primary/90 text-white rounded-full w-10 h-10"
                    onClick={handleGenerate}
                    disabled={!tripDescription.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Input Box - Desktop Version */}
            <div className="hidden sm:block bg-white rounded-3xl shadow-2xl p-4 mb-3 max-w-4xl mx-auto">
              <Textarea
                placeholder={getTranslation('hero.placeholder', language)}
                className="min-h-[80px] text-sm border-0 focus-visible:ring-0 resize-none bg-transparent text-gray-900 placeholder:text-gray-400/80"
                value={tripDescription}
                onChange={(e) => setTripDescription(e.target.value)}
              />
              
              <div className="flex items-center justify-between gap-4 mt-3">
                <Button 
                  variant="ghost" 
                  className="flex items-center justify-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Paperclip className="w-4 h-4" />
                  <span className="text-sm">{getTranslation('hero.attachFiles', language)}</span>
                </Button>
                
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-2.5"
                  onClick={handleGenerate}
                  disabled={!tripDescription.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  <span className="text-sm">{getTranslation('hero.generateButton', language)}</span>
                </Button>
              </div>
            </div>
                
            {/* Beta Text with gray background on mobile */}
            <div className="sm:hidden bg-gray-800/60 backdrop-blur-sm rounded-full px-6 py-3 mx-auto inline-flex items-center gap-2">
              <p className="text-white text-sm">
                {getTranslation('hero.betaText', language)}
              </p>
              <ChevronDown className="w-4 h-4 text-white" />
            </div>
            
            {/* Beta Text - Desktop */}
            <p className="hidden sm:flex text-white/80 text-sm items-center justify-center gap-2">
              {getTranslation('hero.betaText', language)}
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-12 md:py-16 bg-gradient-to-b from-white to-purple-50/30">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              <div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 flex items-center gap-2 flex-wrap">
                  {getTranslation('howItWorks.title', language)} <img src={logoText} alt="travesIA" className="h-8 sm:h-10 inline-block" /> ?
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                  {getTranslation('howItWorks.description', language)}
                </p>
                
                <div className="space-y-6">
                  <div className="flex gap-4 bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center p-2">
                        <img src={luggageIcon} alt="Equipaje" className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{getTranslation('howItWorks.step1Title', language)}</h3>
                      <p className="text-muted-foreground text-sm">
                        {getTranslation('howItWorks.step1Description', language)}
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
                      <h3 className="text-lg font-semibold mb-1">{getTranslation('howItWorks.step2Title', language)}</h3>
                      <p className="text-muted-foreground text-sm">
                        {getTranslation('howItWorks.step2Description', language)}
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
                      <h3 className="text-lg font-semibold mb-1">{getTranslation('howItWorks.step3Title', language)}</h3>
                      <p className="text-muted-foreground text-sm">
                        {getTranslation('howItWorks.step3Description', language)}
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
                      <h3 className="text-lg font-semibold mb-1">{getTranslation('howItWorks.step4Title', language)}</h3>
                      <p className="text-muted-foreground text-sm">
                        {getTranslation('howItWorks.step4Description', language)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative hidden md:block">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl overflow-hidden w-full max-w-[305px]" style={{ aspectRatio: '305/390.5837' }}>
                    <img 
                      src={colosseumImage} 
                      alt="Colosseum" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden mt-8 w-full max-w-[305px]" style={{ aspectRatio: '305/390.5837' }}>
                    <img 
                      src={dubaiImage} 
                      alt="Dubai" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Button - centered between How it works and Why use */}
      <section className="py-10 md:py-12 bg-gradient-to-b from-purple-50/30 to-purple-50/30">
        <div className="container mx-auto px-6 text-center">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 py-3 text-base font-semibold"
            onClick={scrollToTop}
          >
            {getTranslation('howItWorks.tryButton', language)}
          </Button>
        </div>
      </section>

      {/* Why use travesIA */}
      <section className="py-12 md:py-16 bg-purple-50/30">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4 flex items-center justify-center gap-2 flex-wrap px-4">
            {getTranslation('whyUse.title', language)} <img src={logoText} alt="travesIA" className="h-8 sm:h-10 inline-block" />?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            {getTranslation('whyUse.description', language)}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="mb-4 hidden sm:block">
                <img 
                  src={whyObjectsIcon}
                  alt="Planning" 
                  className="w-full h-32 object-contain"
                />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">{getTranslation('whyUse.feature1Title', language)}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {getTranslation('whyUse.feature1Description', language)}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="mb-4 hidden sm:block">
                <img 
                  src={whyCalendarIcon}
                  alt="Search" 
                  className="w-full h-32 object-contain"
                />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">{getTranslation('whyUse.feature2Title', language)}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {getTranslation('whyUse.feature2Description', language)}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="mb-4 hidden sm:block">
                <img 
                  src={whySearchIcon}
                  alt="Prices" 
                  className="w-full h-32 object-contain"
                />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">{getTranslation('whyUse.feature3Title', language)}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {getTranslation('whyUse.feature3Description', language)}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="mb-4 hidden sm:block">
                <img 
                  src={whyTravelersIcon}
                  alt="Travelers" 
                  className="w-full h-32 object-contain"
                />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">{getTranslation('whyUse.feature4Title', language)}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {getTranslation('whyUse.feature4Description', language)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-purple-50/30 to-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 flex items-center justify-center gap-2 flex-wrap px-4">
            {getTranslation('testimonials.title', language)} <img src={logoText} alt="travesIA" className="h-8 sm:h-10 inline-block" />
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80" 
                  alt="Maria" 
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover"
                />
                <img src="https://flagcdn.com/w40/pe.png" alt="Perú" className="w-8 h-6 object-cover rounded-sm" />
              </div>
              <div className="mb-3">
                <p className="font-semibold text-base sm:text-lg mb-1">María, Lima</p>
                <div className="flex text-primary text-lg sm:text-xl">★★★★★</div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                "Planifiqué mi viaje a Cusco en segundos y descubrí lugares únicos."
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" 
                  alt="Jorge" 
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover"
                />
                <img src="https://flagcdn.com/w40/mx.png" alt="México" className="w-8 h-6 object-cover rounded-sm" />
              </div>
              <div className="mb-3">
                <p className="font-semibold text-base sm:text-lg mb-1">Jorge, CDMX</p>
                <div className="flex text-primary text-lg sm:text-xl">★★★★★</div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                "TravesIA me armó mi Eurotrip en segundos. Me ahorro tiempo y dinero."
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" 
                  alt="Valentina" 
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover"
                />
                <img src="https://flagcdn.com/w40/co.png" alt="Colombia" className="w-8 h-6 object-cover rounded-sm" />
              </div>
              <div className="mb-3">
                <p className="font-semibold text-base sm:text-lg mb-1">Valentina, Bogotá</p>
                <div className="flex text-primary text-lg sm:text-xl">★★★★★</div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                "Me encantó tener todo en un solo lugar, sin estrés."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-white to-orange-50/20">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-3 px-4">
            {getTranslation('partners.title', language)}
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            {getTranslation('partners.description', language)}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            <img src={bookingLogo} alt="Booking.com" className="h-6 sm:h-8 object-contain" />
            <img src={tripLogo} alt="Trip.com" className="h-6 sm:h-8 object-contain" />
            <img src={viatorLogo} alt="Viator" className="h-6 sm:h-8 object-contain" />
            <img src={tripadvisorLogo} alt="Tripadvisor" className="h-6 sm:h-8 object-contain" />
            <img src={expediaLogo} alt="Expedia" className="h-6 sm:h-8 object-contain" />
          </div>
        </div>
      </section>

      {/* CTA Button - centered between sections */}
      <section className="py-10 md:py-12 bg-gradient-to-b from-white to-orange-50/20">
        <div className="container mx-auto px-6 text-center">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 py-3 text-base font-semibold"
            onClick={scrollToTop}
          >
            {getTranslation('howItWorks.tryButton', language)}
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12 md:py-16 bg-orange-50/20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-white rounded-lg border-0 shadow-sm px-4 sm:px-6">
                <AccordionTrigger className="text-left text-sm sm:text-base font-semibold hover:no-underline py-4 sm:py-5">
                  {getTranslation('faq.q1', language)}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground pb-4 sm:pb-5">
                  {getTranslation('faq.a1', language)}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-white rounded-lg border-0 shadow-sm px-4 sm:px-6">
                <AccordionTrigger className="text-left text-sm sm:text-base font-semibold hover:no-underline py-4 sm:py-5">
                  {getTranslation('faq.q2', language)}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground pb-4 sm:pb-5">
                  {getTranslation('faq.a2', language)}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-white rounded-lg border-0 shadow-sm px-4 sm:px-6">
                <AccordionTrigger className="text-left text-sm sm:text-base font-semibold hover:no-underline py-4 sm:py-5">
                  ¿TravesIA realiza reservas o solo muestra las mejores opciones de viaje?
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground pb-4 sm:pb-5">
                  TravesIA no realiza reservas directas. Nuestra inteligencia artificial analiza y selecciona las mejores opciones disponibles en plataformas asociadas como Booking.com, Viator, TripAdvisor y Expedia. Te mostramos los resultados más relevantes y confiables para que puedas reservar fácilmente desde las páginas oficiales de nuestros partners.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-white rounded-lg border-0 shadow-sm px-4 sm:px-6">
                <AccordionTrigger className="text-left text-sm sm:text-base font-semibold hover:no-underline py-4 sm:py-5">
                  ¿Qué tan confiables son los precios y recomendaciones que muestra TravesIA?
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground pb-4 sm:pb-5">
                  Los precios y recomendaciones de TravesIA se actualizan constantemente a través de integraciones con fuentes oficiales y plataformas globales de viajes. Aunque las tarifas son estimadas y pueden variar según la disponibilidad o la fecha, los valores mostrados reflejan información real y actualizada del mercado.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-white rounded-lg border-0 shadow-sm px-4 sm:px-6">
                <AccordionTrigger className="text-left text-sm sm:text-base font-semibold hover:no-underline py-4 sm:py-5">
                  ¿Cómo protege TravesIA mi información y mis datos personales?
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground pb-4 sm:pb-5">
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
