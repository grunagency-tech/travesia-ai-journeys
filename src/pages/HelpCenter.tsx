import { Navbar } from "@/components/Navbar";
import { Mail, MessageCircle, HelpCircle, Calendar, Edit3, ExternalLink } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const HelpCenter = () => {

  const faqs = [
    {
      question: "¿Qué es TravesIA?",
      answer: "TravesIA es un planificador de viajes que convierte ideas, fechas y preferencias en un plan de viaje claro, ordenado y fácil de gestionar.",
      icon: HelpCircle,
    },
    {
      question: "¿Qué problema resuelve?",
      answer: "TravesIA elimina la planificación fragmentada, centralizando toda la información del viaje en un solo lugar.",
      icon: MessageCircle,
    },
    {
      question: "¿Cómo funciona TravesIA?",
      answer: "A partir de los datos ingresados, TravesIA organiza rutas, tiempos y prioridades, ayudándote a visualizar y ajustar tu viaje antes de reservar.",
      icon: Calendar,
    },
    {
      question: "¿Puedo modificar mi itinerario?",
      answer: "Sí. El itinerario es editable y evoluciona según tus decisiones.",
      icon: Edit3,
    },
    {
      question: "¿TravesIA realiza reservas?",
      answer: "No. TravesIA te acompaña en la planificación de tu viaje; las reservas se completan directamente en plataformas externas.",
      icon: ExternalLink,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Centro de Ayuda</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            TravesIA | Trip Planner
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encuentra respuestas a las preguntas más frecuentes sobre nuestra plataforma
          </p>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left py-5 hover:no-underline">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <faq.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground text-lg">
                      {faq.question}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5 pl-14 text-muted-foreground text-base leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact Section */}
        <div className="max-w-xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-lg">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Contacto</h2>
            <p className="text-muted-foreground mb-1">TravesIA | Trip Planner</p>
            <p className="text-muted-foreground mb-6">
              Para consultas, soporte o información general:
            </p>
            <a
              href="mailto:contacto@travesia.pe"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
            >
              <Mail className="w-4 h-4" />
              contacto@travesia.pe
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpCenter;
