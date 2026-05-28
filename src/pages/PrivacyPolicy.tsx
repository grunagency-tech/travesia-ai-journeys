import { Navbar } from "@/components/Navbar";
import { Shield, Mail } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Política de Privacidad</span>
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
            <p className="text-muted-foreground leading-relaxed text-base md:text-lg pb-8 border-b border-border">
              En TravesIA | Trip Planner entendemos que planificar un viaje implica confianza. Por ello, protegemos la información personal de nuestros usuarios con altos estándares de seguridad y transparencia, conforme a la Ley N.º 29733 – Ley de Protección de Datos Personales del Perú y su reglamento.
            </p>

            <section className="py-8 border-b border-border">
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">1. Información que recopilamos</h2>
              <p className="text-muted-foreground leading-relaxed text-base mb-4">
                TravesIA recopila únicamente la información necesaria para cumplir su finalidad de planificación de viajes, incluyendo:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-muted-foreground text-base">
                <li>Datos de identificación básica (nombre y correo electrónico).</li>
                <li>Información del viaje (destinos, fechas, intereses, presupuesto, estilo de viaje).</li>
                <li>Datos técnicos y de navegación (cookies, ubicación aproximada, interacción con la plataforma).</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed text-base mt-4">
                La información es proporcionada voluntariamente por el usuario a través del registro y el uso del servicio.
              </p>
            </section>

            <section className="py-8 border-b border-border">
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">2. Finalidad del tratamiento</h2>
              <p className="text-muted-foreground leading-relaxed text-base mb-4">
                Los datos personales son utilizados para:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-muted-foreground text-base">
                <li>Crear y organizar itinerarios de viaje personalizados.</li>
                <li>Centralizar información relevante del viaje en un solo entorno digital.</li>
                <li>Mejorar la experiencia del usuario y el desempeño de la plataforma.</li>
                <li>Análisis interno de uso y campañas de marketing propias.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed text-base mt-4 font-medium">
                TravesIA no comercializa ni comparte datos personales con terceros.
              </p>
            </section>

            <section className="py-8 border-b border-border">
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">3. Cookies y herramientas de análisis</h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                Utilizamos cookies y herramientas analíticas para optimizar la navegación y el rendimiento del servicio. El usuario puede configurar su navegador para restringir su uso, considerando posibles limitaciones funcionales.
              </p>
            </section>

            <section className="py-8 border-b border-border">
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">4. Plataformas externas</h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                TravesIA puede redirigir al usuario a plataformas de terceros para completar reservas. Dichos terceros operan bajo sus propios términos, políticas y responsabilidades. TravesIA no procesa pagos ni almacena información financiera.
              </p>
            </section>

            <section className="py-8 border-b border-border">
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">5. Seguridad de la información</h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                Aplicamos medidas técnicas y organizativas razonables para proteger los datos personales contra accesos no autorizados, pérdida o uso indebido.
              </p>
            </section>

            <section className="pt-8">
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">6. Derechos del titular de los datos</h2>
              <p className="text-muted-foreground leading-relaxed text-base mb-6">
                El usuario puede ejercer sus derechos ARCO (acceso, rectificación, cancelación u oposición) escribiendo a:
              </p>
              <a
                href="mailto:contacto@travesia.pe"
                className="inline-flex items-center gap-2 px-5 py-3 bg-primary/10 text-primary rounded-full font-medium hover:bg-primary/20 transition-colors"
              >
                <Mail className="w-4 h-4" />
                contacto@travesia.pe
              </a>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
