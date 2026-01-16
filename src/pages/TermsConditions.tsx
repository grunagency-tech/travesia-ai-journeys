import { Navbar } from "@/components/Navbar";
import { FileText } from "lucide-react";

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Términos y Condiciones</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            TravesIA | Trip Planner
          </h1>
          <p className="text-sm text-muted-foreground">
            Última actualización: Enero / 2026
          </p>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-6 md:p-10 lg:p-12 shadow-sm">
            <p className="text-muted-foreground leading-relaxed font-medium text-base md:text-lg pb-8 border-b border-border">
              Al acceder y utilizar TravesIA | Trip Planner, el usuario acepta los presentes términos.
            </p>

            <section className="py-8 border-b border-border">
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">1. Naturaleza del servicio</h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                TravesIA | Trip Planner es una plataforma digital de planificación de viajes. Su función es organizar, estructurar y presentar información de viaje para facilitar la toma de decisiones. TravesIA no es una agencia de viajes, no vende pasajes, no gestiona reservas ni procesa pagos.
              </p>
            </section>

            <section className="py-8 border-b border-border">
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">2. Uso de la plataforma</h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                El usuario ingresa información sobre su viaje y TravesIA genera un plan estructurado. La precisión del resultado depende de la información proporcionada. El servicio es gratuito en la fase de prueba y requiere registro de usuario.
              </p>
            </section>

            <section className="py-8 border-b border-border">
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">3. Enlaces a terceros</h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                La plataforma puede mostrar enlaces a servicios externos para continuar con reservas. TravesIA no controla ni es responsable por precios, disponibilidad, políticas o ejecución de dichos servicios.
              </p>
            </section>

            <section className="py-8 border-b border-border">
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">4. Contenido del usuario</h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                El usuario autoriza a TravesIA a utilizar la información ingresada exclusivamente para la generación y mejora del servicio de planificación.
              </p>
            </section>

            <section className="pt-8">
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">5. Limitación de responsabilidad</h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                TravesIA ofrece información con fines de planificación. El usuario es responsable de verificar condiciones finales antes de viajar o reservar.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsConditions;
