# 📦 Guía de Instalación - Travesia AI Journeys

## Requisitos Previos

### Software Necesario
- **Node.js** versión 18.x o superior ([Descargar aquí](https://nodejs.org/))
- **npm** (incluido con Node.js) o **Bun** (alternativa más rápida)
- **Git** para clonar el repositorio
- Navegador web moderno (Chrome, Firefox, Edge, Safari)

### Cuentas de Servicios Externos
Necesitarás crear cuentas y obtener claves API para los siguientes servicios:

1. **Supabase** (Base de datos y autenticación)
   - Sitio: https://supabase.com
   - Plan gratuito disponible

2. **OpenAI** (IA conversacional para itinerarios)
   - Sitio: https://platform.openai.com
   - Requiere tarjeta de crédito para uso

3. **Google Gemini AI** (Generación de imágenes)
   - Sitio: https://ai.google.dev
   - API key gratuita disponible

4. **TravelPayouts** (API de vuelos)
   - Sitio: https://www.travelpayouts.com
   - Registro gratuito

---

## 🚀 Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone https://github.com/grunagency-tech/travesia-ai-journeys.git
cd travesia-ai-journeys
```

### 2. Instalar Dependencias

Usando npm:
```bash
npm install
```

O usando Bun (más rápido):
```bash
bun install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="tu-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="tu-publishable-key-aqui"
VITE_SUPABASE_URL="https://tu-project-id.supabase.co"

# OpenAI Configuration
VITE_OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxx"

# Google Gemini Configuration
VITE_GEMINI_API_KEY="AIzaSyxxxxxxxxxxxxxxxxx"

# TravelPayouts Configuration
VITE_TRAVELPAYOUTS_TOKEN="tu-token-aqui"
```

> **⚠️ IMPORTANTE**: Nunca subas el archivo `.env` a control de versiones. Está incluido en `.gitignore` por seguridad.

---

## 🗄️ Configuración de Supabase

### 1. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota el **Project ID**, **URL** y **API Key (anon public)**

### 2. Ejecutar Migraciones de Base de Datos

Las migraciones están en la carpeta `supabase/migrations/`. 

**Opción A: Usando Supabase CLI** (Recomendado)

1. Instala Supabase CLI:
```bash
npm install -g supabase
```

2. Vincula tu proyecto:
```bash
supabase link --project-ref tu-project-id
```

3. Aplica las migraciones:
```bash
supabase db push
```

**Opción B: Manual desde el Dashboard**

1. Ve al Dashboard de Supabase → SQL Editor
2. Copia y ejecuta el contenido de cada archivo de migración en orden cronológico

### 3. Configurar Row Level Security (RLS)

Las políticas de seguridad deben estar configuradas en las tablas:
- `profiles` - Solo usuarios autenticados pueden ver/editar su perfil
- `trips` - Los usuarios solo ven sus propios viajes
- `conversations` - Privacidad de conversaciones por usuario
- `user_roles` - Solo lectura para verificar roles de admin

### 4. Crear Primer Usuario Admin

Ejecuta este SQL en el SQL Editor de Supabase después de registrar tu primer usuario:

```sql
-- Reemplaza 'USER_UUID' con el UUID de tu usuario
INSERT INTO user_roles (user_id, role)
VALUES ('USER_UUID', 'admin');
```

---

## 🔑 Configuración de APIs

### OpenAI API

1. Ve a [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Crea una nueva API key
3. Añade créditos a tu cuenta (mínimo $5 recomendado)
4. Copia la key y agrégala a `.env` como `VITE_OPENAI_API_KEY`

**Modelo usado**: `gpt-4o-mini` (económico y eficiente)

### Google Gemini API

1. Ve a [https://ai.google.dev](https://ai.google.dev)
2. Obtén una API key gratuita
3. Agrégala a `.env` como `VITE_GEMINI_API_KEY`

**Modelo usado**: `gemini-pro` (para descripciones de imágenes)

### TravelPayouts API

1. Regístrate en [https://www.travelpayouts.com](https://www.travelpayouts.com)
2. Ve a "Tools" → "API"
3. Copia tu token
4. Agrégalo a `.env` como `VITE_TRAVELPAYOUTS_TOKEN`

---

## ▶️ Ejecutar la Aplicación

### Modo Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:5173**

### Build para Producción

```bash
npm run build
```

Los archivos optimizados se generarán en la carpeta `dist/`.

### Preview del Build

```bash
npm run preview
```

Vista previa del build de producción en: **http://localhost:4173**

---

## ✅ Verificación de Instalación

### Checklist Post-Instalación

- [ ] La aplicación abre en el navegador sin errores
- [ ] Puedes registrarte y crear una cuenta nueva
- [ ] Puedes iniciar sesión con tu cuenta
- [ ] El chat conversacional responde (verifica OpenAI key)
- [ ] Las imágenes de destinos cargan correctamente
- [ ] Puedes crear un nuevo viaje
- [ ] El panel de admin es accesible (si configuraste el rol admin)

### Errores Comunes

#### "VITE_SUPABASE_URL is not defined"
**Solución**: Verifica que tu archivo `.env` existe y tiene las variables correctas.

#### "OpenAI API key is invalid"
**Solución**: Verifica que la API key es válida y tiene créditos disponibles.

#### "Failed to fetch conversations"
**Solución**: Verifica que las migraciones de Supabase se ejecutaron correctamente.

#### Imágenes no cargan
**Solución**: Verifica la configuración de `VITE_GEMINI_API_KEY` o usa las imágenes estáticas del proyecto.

---

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo

# Build
npm run build           # Build de producción
npm run build:dev       # Build en modo desarrollo
npm run preview         # Preview del build

# Linting
npm run lint            # Ejecuta ESLint
```

---

## 📱 Acceso desde Otros Dispositivos

Para probar en móviles o tablets en tu red local:

1. Inicia el servidor de desarrollo
2. Obtén tu IP local:
   - Windows: `ipconfig` (busca IPv4)
   - Mac/Linux: `ifconfig` o `ip addr`
3. Accede desde otro dispositivo: `http://TU_IP:5173`

---

## 🆘 Soporte

Si encuentras problemas durante la instalación:

1. Verifica que todos los requisitos previos estén instalados
2. Revisa que todas las variables de entorno estén configuradas
3. Consulta la sección de [Troubleshooting](./TROUBLESHOOTING.md)
4. Revisa los logs de la consola del navegador (F12)
5. Revisa los logs del servidor en la terminal

---

## 📚 Próximos Pasos

Después de la instalación exitosa:

1. Lee la [Documentación de Arquitectura](./ARCHITECTURE.md)
2. Revisa la [Guía de Usuario](./USER_GUIDE.md)
3. Si eres admin, consulta el [Admin Playbook](./ADMIN_PLAYBOOK.md)
4. Para deployment, lee [DEPLOYMENT.md](./DEPLOYMENT.md)
