import { Navbar } from "@/components/Navbar";
import { Mail, MessageCircle, HelpCircle, Calendar, Edit3, ExternalLink, Sparkles, Search, Plane } from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import logoIcon from "@/assets/logo-icon.svg";

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      question: "¿Qué es TravesIA?",
      answer: "TravesIA es un planificador de viajes inteligente que utiliza inteligencia artificial para convertir tus ideas, fechas y preferencias en un itinerario completo, ordenado y fácil de gestionar. Diseñado para viajeros que quieren maximizar su tiempo y experiencias.",
      icon: HelpCircle,
      category: "General",
    },
    {
      question: "¿Qué problema resuelve?",
      answer: "TravesIA elimina la planificación fragmentada y el estrés de organizar un viaje. Centralizamos vuelos, hospedaje, actividades y rutas en un solo lugar, ahorrándote horas de investigación en múltiples sitios web.",
      icon: MessageCircle,
      category: "General",
    },
    {
      question: "¿Cómo funciona TravesIA?",
      answer: "Es muy simple: cuéntanos tu destino, fechas, presupuesto y estilo de viaje. Nuestra IA analiza miles de opciones y genera un itinerario personalizado en minutos. Puedes chatear para ajustar cualquier detalle hasta que quede perfecto.",
      icon: Calendar,
      category: "Uso",
    },
    {
      question: "¿Puedo modificar mi itinerario?",
      answer: "¡Por supuesto! Tu itinerario es completamente editable. Simplemente escribe en el chat qué te gustaría cambiar (más aventura, menos museos, agregar un día extra) y la IA regenerará el plan según tus nuevas preferencias.",
      icon: Edit3,
      category: "Uso",
    },
    {
      question: "¿TravesIA realiza reservas?",
      answer: "Por el momento, TravesIA se enfoca en la planificación perfecta de tu viaje. Te proporcionamos enlaces directos a las mejores plataformas de reserva para que completes tu booking con confianza y al mejor precio.",
      icon: ExternalLink,
      category: "Reservas",
    },
    {
      question: "¿Mis itinerarios se guardan?",
      answer: "Sí. Si tienes una cuenta, tus itinerarios se guardan automáticamente en 'Mis Viajes'. Puedes acceder a ellos desde cualquier dispositivo y continuar editándolos cuando quieras.",
      icon: Plane,
      category: "Cuenta",
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section with gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-600 to-indigo-700" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-[10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-[5%] w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-400/5 rounded-full blur-3xl" />
          
          {/* Floating dots */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${10 + Math.random() * 80}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 pt-32 pb-20 text-center">
          {/* Logo badge */}
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-5 py-2.5 mb-8 border border-white/20">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
              <img src={logoIcon} alt="" className="w-5 h-5 brightness-0 invert" />
            </div>
            <span className="text-white/90 font-medium">Centro de Ayuda</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-urbanist font-bold text-white mb-6">
            ¿Cómo podemos ayudarte?
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Encuentra respuestas rápidas a las preguntas más frecuentes sobre travesIA
          </p>

          {/* Search box */}
          <div className="max-w-xl mx-auto relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Buscar en el centro de ayuda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-base bg-white border-0 rounded-full shadow-xl placeholder:text-muted-foreground/70"
            />
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16 -mt-8 relative z-20">
          {[
            { label: "Preguntas", value: `${faqs.length}+`, icon: HelpCircle },
            { label: "Respuesta", value: "Inmediata", icon: Sparkles },
            { label: "Soporte", value: "24/7", icon: MessageCircle },
            { label: "Idiomas", value: "5", icon: Mail },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-urbanist font-bold text-foreground mb-3">
              Preguntas Frecuentes
            </h2>
            <p className="text-muted-foreground">
              Todo lo que necesitas saber para comenzar a planificar
            </p>
          </div>

          {filteredFaqs.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-2xl px-6 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 data-[state=open]:shadow-lg data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="text-left py-6 hover:no-underline group">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                        <faq.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <span className="block font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                          {faq.question}
                        </span>
                        <span className="text-xs text-muted-foreground/70 mt-0.5">{faq.category}</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 pl-16 pr-4 text-muted-foreground text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No encontramos resultados para "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 text-primary hover:underline text-sm"
              >
                Limpiar búsqueda
              </button>
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="max-w-2xl mx-auto">
          <div className="relative bg-gradient-to-br from-primary via-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-center shadow-2xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-400/10 rounded-full blur-xl" />
            
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border border-white/20">
                <Mail className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-urbanist font-bold text-white mb-3">
                ¿No encontraste lo que buscabas?
              </h2>
              <p className="text-white/80 mb-8 max-w-md mx-auto">
                Nuestro equipo está listo para ayudarte con cualquier consulta adicional
              </p>
              <a
                href="mailto:contacto@travesia.pe"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary rounded-full font-semibold hover:bg-white/90 transition-colors shadow-lg hover:shadow-xl"
              >
                <Mail className="w-5 h-5" />
                contacto@travesia.pe
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpCenter;
