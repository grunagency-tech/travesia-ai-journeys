# ✈️ Travesia AI Journeys

**Planifica viajes personalizados con inteligencia artificial**

Travesia es una plataforma web que utiliza IA conversacional para crear itinerarios de viaje personalizados, completos con recomendaciones de vuelos, alojamiento, actividades y gastronomía local.

---

## 🌟 Características Principales

- 🤖 **Chat con IA** - Conversación natural para planificar tu viaje
- 📅 **Itinerarios Detallados** - Día a día con actividades, horarios y costos
- ✈️ **Búsqueda de Vuelos** - Integración con TravelPayouts API para precios reales
- 🏨 **Recomendaciones de Alojamiento** - Opciones adaptadas a tu presupuesto
- 🗺️ **Mapa Interactivo** - Visualiza tus actividades en un mapa
- 🍽️ **Guía Gastronómica** - Restaurantes y platos típicos recomendados
- 💾 **Guarda tus Viajes** - Accede a todos tus itinerarios cuando quieras
- 👨‍💼 **Panel de Administración** - Estadísticas y gestión de usuarios (solo admins)

---

## 🚀 Demo

> 🔗 **[Ver Demo en Vivo](https://tu-dominio-aqui.vercel.app)** *(reemplaza con tu URL real)*

![Screenshot](./docs/screenshot.png)

---

## 📖 Documentación

| Documento | Descripción |
|-----------|-------------|
| [**INSTALLATION.md**](./INSTALLATION.md) | Guía completa de instalación y configuración |
| [**ARCHITECTURE.md**](./ARCHITECTURE.md) | Documentación técnica de la arquitectura del sistema |
| [**USER_GUIDE.md**](./USER_GUIDE.md) | Manual de usuario para usar la plataforma |
| [**ADMIN_PLAYBOOK.md**](./ADMIN_PLAYBOOK.md) | Guía de administración y gestión |
| [**DEPLOYMENT.md**](./DEPLOYMENT.md) | Instrucciones para deployment en producción |
| [**TROUBLESHOOTING.md**](./TROUBLESHOOTING.md) | Solución de problemas comunes |

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Componentes UI
- **React Router** - Routing
- **TanStack Query** - Data fetching & caching
- **Leaflet** - Mapas interactivos

### Backend & Servicios
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Row Level Security
- **OpenAI GPT-4o-mini** - Generación de itinerarios
- **Google Gemini AI** - Imágenes y descripciones
- **TravelPayouts API** - Búsqueda de vuelos

---

## ⚡ Quick Start

### Requisitos Previos

- Node.js 18+ ([Descargar](https://nodejs.org/))
- Cuentas y API keys de:
  - [Supabase](https://supabase.com)
  - [OpenAI](https://platform.openai.com)
  - [Google Gemini](https://ai.google.dev)
  - [TravelPayouts](https://www.travelpayouts.com)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/grunagency-tech/travesia-ai-journeys.git
cd travesia-ai-journeys

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus API keys

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

> 📚 **Para instrucciones detalladas**, lee [INSTALLATION.md](./INSTALLATION.md)

---

## 🔑 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Supabase
VITE_SUPABASE_PROJECT_ID="tu-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://xxxxx.supabase.co"

# OpenAI
VITE_OPENAI_API_KEY="sk-proj-xxxxx"

# Google Gemini
VITE_GEMINI_API_KEY="AIzaSyxxxxx"

# TravelPayouts
VITE_TRAVELPAYOUTS_TOKEN="xxxxx"
```

> ⚠️ **Nunca** subas el archivo `.env` a control de versiones

---

## 📁 Estructura del Proyecto

```
travesia-ai-journeys/
├── public/                 # Archivos estáticos
├── src/
│   ├── components/        # Componentes React
│   │   ├── ui/           # Componentes base (Shadcn)
│   │   ├── itinerary/    # Componentes del itinerario
│   │   └── ...
│   ├── contexts/         # React Contexts (Currency, Language, Location)
│   ├── data/             # Datos estáticos (imágenes de destinos)
│   ├── hooks/            # Custom hooks (useAuth, etc.)
│   ├── integrations/     # Integraciones (Supabase)
│   ├── lib/              # Utilidades
│   ├── pages/            # Páginas/Vistas
│   ├── services/         # Servicios API (OpenAI, Gemini, TravelPayouts)
│   ├── App.tsx           # Componente raíz
│   └── main.tsx          # Entry point
├── supabase/
│   └── migrations/       # Migraciones SQL
├── INSTALLATION.md       # Guía de instalación
├── ARCHITECTURE.md       # Documentación técnica
├── USER_GUIDE.md         # Manual de usuario
├── ADMIN_PLAYBOOK.md     # Guía de administración
├── DEPLOYMENT.md         # Guía de deployment
├── TROUBLESHOOTING.md    # Solución de problemas
└── README.md             # Este archivo
```

---

## 🎯 Cómo Usar

### 1. Registrarse
Crea una cuenta con tu email y contraseña.

### 2. Iniciar Chat
Click en "Crear Viaje" para empezar una conversación con TravesIA.

### 3. Responder Preguntas
La IA te preguntará sobre:
- Origen y destino
- Fechas de viaje
- Número de viajeros
- Presupuesto
- Estilo de viaje
- Intereses

### 4. Recibir Itinerario
TravesIA generará un itinerario completo y personalizado con:
- Actividades día a día
- Opciones de vuelos
- Recomendaciones de hoteles
- Restaurantes locales
- Consejos de cultura y clima

### 5. Guardar y Consultar
Todos tus viajes se guardan automáticamente en "Mis Viajes".

> 📖 **Guía detallada**: [USER_GUIDE.md](./USER_GUIDE.md)

---

## 👨‍💼 Panel de Administración

Los usuarios con rol `admin` tienen acceso a `/admin` con:

- 📊 Dashboard con estadísticas
- 👥 Gestión de usuarios
- ✈️ Gestión de viajes
- 📈 Gráficos de crecimiento
- 🗺️ Análisis de destinos populares

> 🔐 **Configurar admin**: [ADMIN_PLAYBOOK.md](./ADMIN_PLAYBOOK.md)

---

## 🧪 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo (puerto 5173)

# Build
npm run build           # Build de producción → dist/
npm run build:dev       # Build en modo desarrollo
npm run preview         # Preview del build de producción

# Linting
npm run lint            # Ejecutar ESLint
```

---

## 🚢 Deployment

### Deploy Rápido en Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/grunagency-tech/travesia-ai-journeys)

1. Click en el botón de arriba
2. Configura las variables de entorno
3. Deploy!

### Otras Plataformas

- **Netlify**: Ver [DEPLOYMENT.md](./DEPLOYMENT.md#deployment-en-netlify)
- **Cloudflare Pages**: Ver [DEPLOYMENT.md](./DEPLOYMENT.md#deployment-en-cloudflare-pages)

> 📘 **Guía completa**: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🔐 Seguridad

- 🔒 Autenticación con Supabase (JWT)
- 🛡️ Row Level Security (RLS) en base de datos
- 🧹 Sanitización HTML con DOMPurify
- 🔑 API keys en variables de entorno
- 🚫 CORS configurado correctamente

---

## 📈 Roadmap

### Próximas Features

- [ ] Exportar itinerario a PDF
- [ ] Compartir viajes con otros usuarios
- [ ] Notificaciones push
- [ ] Modo offline (PWA)
- [ ] Integración de pagos (Stripe)
- [ ] Reservas directas de hoteles
- [ ] App móvil nativa (React Native)
- [ ] Sistema de reseñas
- [ ] Recomendaciones basadas en ML

---

## 🐛 Reportar Problemas

Si encuentras un bug o tienes una sugerencia:

1. Revisa [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) primero
2. Abre un issue en [GitHub Issues](https://github.com/grunagency-tech/travesia-ai-journeys/issues)
3. Describe el problema con detalle
4. Incluye pasos para reproducirlo

---

## 🤝 Contribuir

Las contribuciones son bienvenidas!

1. Fork el proyecto
2. Crea una feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado y propiedad de [Grun Agency Tech](https://github.com/grunagency-tech).

Todos los derechos reservados.

---

## 👥 Equipo

Desarrollado por **Grun Agency Tech**

---

## 🙏 Agradecimientos

- [OpenAI](https://openai.com) - GPT-4o-mini API
- [Supabase](https://supabase.com) - Backend as a Service
- [Shadcn/ui](https://ui.shadcn.com) - Componentes UI
- [TravelPayouts](https://www.travelpayouts.com) - API de vuelos
- [Google](https://ai.google.dev) - Gemini AI
- [Unsplash](https://unsplash.com) - Imágenes de destinos

---

## 📞 Contacto

- **Website**: [tu-website.com](https://tu-website.com)
- **Email**: contacto@grunagency.com
- **GitHub**: [@grunagency-tech](https://github.com/grunagency-tech)

---

## 📚 Recursos Adicionales

- [React Documentation](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**¡Felices viajes con Travesia! ✈️🌍**

---

*Última actualización: Febrero 2026*
