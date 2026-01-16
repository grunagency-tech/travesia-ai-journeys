import { Navbar } from "@/components/Navbar";
import { FileText } from "lucide-react";

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Términos y Condiciones</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            TravesIA | Trip Planner
          </h1>
          <p className="text-sm text-muted-foreground">
            Última actualización: Enero / 2026
          </p>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-8">
            <p className="text-muted-foreground leading-relaxed font-medium">
              Al acceder y utilizar TravesIA | Trip Planner, el usuario acepta los presentes términos.
            </p>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">1. Naturaleza del servicio</h2>
              <p className="text-muted-foreground leading-relaxed">
                TravesIA | Trip Planner es una plataforma digital de planificación de viajes. Su función es organizar, estructurar y presentar información de viaje para facilitar la toma de decisiones. TravesIA no es una agencia de viajes, no vende pasajes, no gestiona reservas ni procesa pagos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">2. Uso de la plataforma</h2>
              <p className="text-muted-foreground leading-relaxed">
                El usuario ingresa información sobre su viaje y TravesIA genera un plan estructurado. La precisión del resultado depende de la información proporcionada. El servicio es gratuito en la fase de prueba y requiere registro de usuario.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">3. Enlaces a terceros</h2>
              <p className="text-muted-foreground leading-relaxed">
                La plataforma puede mostrar enlaces a servicios externos para continuar con reservas. TravesIA no controla ni es responsable por precios, disponibilidad, políticas o ejecución de dichos servicios.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">4. Contenido del usuario</h2>
              <p className="text-muted-foreground leading-relaxed">
                El usuario autoriza a TravesIA a utilizar la información ingresada exclusivamente para la generación y mejora del servicio de planificación.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">5. Limitación de responsabilidad</h2>
              <p className="text-muted-foreground leading-relaxed">
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
