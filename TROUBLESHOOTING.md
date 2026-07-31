# 🚨 Troubleshooting - Travesia AI Journeys

Guía de solución de problemas comunes para desarrolladores, administradores y usuarios.

---

## 📋 Índice

1. [Problemas de Instalación](#problemas-de-instalación)
2. [Problemas de Autenticación](#problemas-de-autenticación)
3. [Problemas con la IA](#problemas-con-la-ia)
4. [Problemas con APIs Externas](#problemas-con-apis-externas)
5. [Problemas de Base de Datos](#problemas-de-base-de-datos)
6. [Problemas de Performance](#problemas-de-performance)
7. [Problemas de Deployment](#problemas-de-deployment)

---

## 🔧 Problemas de Instalación

### Error: "Cannot find module" o "Module not found"

**Síntoma**:
```
Error: Cannot find module '@/components/...'
```

**Solución**:
```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# O con bun
rm -rf node_modules bun.lockb
bun install
```

---

### Error: "VITE_SUPABASE_URL is not defined"

**Síntoma**:
- La app no carga
- Errores en consola sobre variables de entorno

**Solución**:
1. Verifica que existe el archivo `.env` en la raíz del proyecto
2. Verifica que todas las variables empiecen con `VITE_`
3. Reinicia el servidor de desarrollo:
```bash
# Detén el servidor (Ctrl+C)
npm run dev
```

**Checklist de variables**:
```env
VITE_SUPABASE_PROJECT_ID="..."
VITE_SUPABASE_PUBLISHABLE_KEY="..."
VITE_SUPABASE_URL="https://...supabase.co"
VITE_OPENAI_API_KEY="sk-proj-..."
VITE_GEMINI_API_KEY="AIzaSy..."
VITE_TRAVELPAYOUTS_TOKEN="..."
```

---

### Puerto 5173 ya está en uso

**Síntoma**:
```
Port 5173 is in use, trying another one...
```

**Solución A**: Mata el proceso en ese puerto
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5173 | xargs kill -9
```

**Solución B**: Usa otro puerto
```bash
npm run dev -- --port 3000
```

---

## 🔐 Problemas de Autenticación

### No puedo registrarme / "Email already registered"

**Síntoma**:
- Error al intentar crear cuenta
- Mensaje: "User already registered"

**Solución**:
1. ¿Ya tienes cuenta? Intenta iniciar sesión
2. ¿Olvidaste tu contraseña? Usa "Recuperar contraseña"
3. Si es un error, verifica en Supabase Dashboard → Authentication → Users

---

### No recibo el email de confirmación

**Síntoma**:
- Registro exitoso pero sin email

**Solución**:
1. Revisa la carpeta de spam
2. En Supabase Dashboard → Authentication → Users, verifica el estado del usuario
3. Si es necesario, confirma el email manualmente:
```sql
-- En Supabase SQL Editor
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'usuario@example.com';
```

---

### Sesión expirada constantemente

**Síntoma**:
- Te saca de la sesión cada pocos minutos

**Solución**:
1. Limpia cookies y localStorage:
```javascript
// En consola del navegador (F12)
localStorage.clear();
```

2. Verifica en Supabase Dashboard → Settings → Auth que el JWT expiry esté configurado correctamente (default: 3600 segundos)

---

### Error: "Invalid JWT"

**Síntoma**:
```
Error: Invalid JWT / JWT expired
```

**Solución**:
```javascript
// Fuerza refresh del token
import { supabase } from '@/integrations/supabase/client';
await supabase.auth.refreshSession();
```

Si persiste, cierra sesión y vuelve a entrar.

---

## 🤖 Problemas con la IA

### ChatGPT no responde / Error 429

**Síntoma**:
```
OpenAI API Error: 429 - Rate limit exceeded
```

**Causa**: Has excedido el límite de requests de OpenAI

**Solución**:
1. Espera unos minutos
2. Verifica tu plan en OpenAI Dashboard
3. Considera upgrade a plan con mayor límite

---

### ChatGPT responde con JSON inválido

**Síntoma**:
- Error en consola: `Unexpected token`
- La conversación se "atoró"

**Solución Temporal**: 
Refresca la página y empieza una nueva conversación

**Solución Permanente**:
Verifica el system prompt en `services/openai.ts`:
```typescript
response_format: { type: "json_object" }
```

---

### La IA no genera el itinerario completo

**Síntoma**:
- Solo recibe preguntas pero nunca genera itinerario
- Status siempre "collecting"

**Diagnóstico**:
```javascript
// En ChatPage, añade console.log
console.log('AI Response:', response);
console.log('Status:', response.status);
console.log('Missing info:', response.missing_info);
```

**Solución**:
1. Verifica que respondiste TODAS las preguntas
2. Incluye confirmación explícita: "Sí, todo correcto"
3. Si el prompt es muy largo, puede truncarse. Verifica `max_tokens` en `openai.ts`

---

### Error: "OpenAI API key is invalid"

**Síntoma**:
```
Error 401: Incorrect API key provided
```

**Solución**:
1. Verifica que la API key en `.env` es correcta
2. Genera una nueva key en https://platform.openai.com/api-keys
3. Actualiza `.env` y reinicia el servidor

---

## 🌐 Problemas con APIs Externas

### TravelPayouts no devuelve vuelos

**Síntoma**:
- Sección de vuelos vacía
- Array vacío en consola

**Soluciones**:

**1. Verifica el token**:
```javascript
// En consola del navegador
console.log(import.meta.env.VITE_TRAVELPAYOUTS_TOKEN);
```

**2. Verifica códigos IATA**:
- Deben ser códigos de aeropuerto válidos
- MEX ✅ | Ciudad de México ❌
- CDG ✅ | París ❌

**3. Verifica fechas**:
- Formato: YYYY-MM-DD
- No más de 365 días en el futuro

**4. Revisa la respuesta de la API**:
```javascript
// En services/travelpayouts.ts, añade:
console.log('API Response:', json);
```

---

### Imágenes de destinos no cargan

**Síntoma**:
- Placeholders en lugar de imágenes
- Errores 403/404 en Network tab

**Solución A**: Verifica Gemini API key
```bash
# En .env
VITE_GEMINI_API_KEY="AIzaSy..."
```

**Solución B**: Usa la base de datos estática
Ya hay un fallback en `src/data/destinationImages.ts`

**Añadir nuevo destino**:
```typescript
// En destinationImages.ts
export const destinationImages = {
  "Nueva Ciudad, País": "https://images.unsplash.com/photo-XXXXX",
};
```

---

### Error CORS con APIs

**Síntoma**:
```
Access to fetch at '...' has been blocked by CORS policy
```

**Solución**:
Las APIs deben soportar CORS. Si no:
1. Contacta al proveedor de la API
2. Usa un proxy (Cloudflare Workers, etc.)
3. Llama desde backend (Supabase Edge Functions)

---

## 🗄️ Problemas de Base de Datos

### Error: "relation does not exist"

**Síntoma**:
```
relation "public.trips" does not exist
```

**Causa**: Las migraciones no se ejecutaron

**Solución**:
```bash
# Con Supabase CLI
supabase db push

# O ejecuta manualmente las migraciones en SQL Editor
```

---

### Error: "new row violates row-level security policy"

**Síntoma**:
- No puedes insertar/actualizar datos
- Error RLS en consola

**Solución**:
Verifica las políticas RLS en Supabase Dashboard → Database → Policies

**Políticas requeridas**:
```sql
-- Ejemplo: usuarios pueden insertar sus propios viajes
CREATE POLICY "Users can insert own trips"
ON trips FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

### Los datos no se actualizan en tiempo real

**Síntoma**:
- Cambios en DB no se reflejan en UI

**Solución**:
1. Verifica que estás usando TanStack Query
2. Invalida el cache:
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ['trips'] });
```

---

### Backup corrupto / No puedo restaurar

**Solución**:
```bash
# Verifica el archivo SQL
head -20 backup.sql

# Restaura en modo --clean
psql -h db.xxx.supabase.co -U postgres -d postgres --clean < backup.sql
```

---

## ⚡ Problemas de Performance

### La app carga muy lento

**Diagnóstico**:
1. Abre DevTools (F12) → Network tab
2. Identifica recursos lentos

**Soluciones**:

**1. Optimiza imágenes**:
```bash
# Usa formatos modernos como WebP
# Comprime imágenes: https://tinypng.com
```

**2. Code splitting**:
```typescript
// Usa lazy loading
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
```

**3. Reduce bundle size**:
```bash
npm run build
npx vite-bundle-visualizer
```

---

### TanStack Query hace demasiadas requests

**Síntoma**:
- Network tab lleno de requests duplicadas

**Solución**:
```typescript
// Ajusta staleTime y cacheTime
const { data } = useQuery({
  queryKey: ['trips'],
  queryFn: fetchTrips,
  staleTime: 5 * 60 * 1000, // 5 minutos
  cacheTime: 10 * 60 * 1000, // 10 minutos
});
```

---

### OpenAI responde muy lento

**Síntoma**:
- Tarda >30 segundos en generar itinerario

**Solución**:
1. Reduce `max_tokens` en `services/openai.ts`
2. Usa modelo más rápido: `gpt-3.5-turbo` en lugar de `gpt-4o-mini`
3. Optimiza el system prompt (menos instrucciones)

---

## 🚀 Problemas de Deployment

### Build falla con "out of memory"

**Síntoma**:
```
FATAL ERROR: Reached heap limit Allocation failed
```

**Solución**:
```bash
# Aumenta memoria de Node
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

### Variables de entorno no funcionan en producción

**Síntoma**:
- La app funciona local pero no en producción

**Causa**: Las variables de entorno no están configuradas

**Solución**:

**Vercel**:
1. Dashboard → Settings → Environment Variables
2. Añade todas las `VITE_*` variables
3. Redeploy

**Netlify**:
1. Site settings → Environment variables
2. Añade las variables
3. Trigger redeploy

---

### "404 Not Found" en rutas de la app

**Síntoma**:
- `/viaje/123` da 404 al recargar página

**Causa**: SPA routing no configurado

**Solución**:

**Vercel**: Crea `vercel.json`
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Netlify**: Crea `public/_redirects`
```
/*    /index.html   200
```

---

### Supabase timeout en producción

**Síntoma**:
```
Error: connect ETIMEDOUT
```

**Solución**:
1. Verifica que la URL de Supabase sea correcta
2. Revisa que el proyecto de Supabase esté activo
3. Verifica que no estés en plan pausado (Free tier duerme después de 1 semana inactivo)

---

## 🆘 Comandos de Diagnóstico

### Verificar configuración

```bash
# Ver variables de entorno (sin valores sensibles)
npm run dev 2>&1 | grep VITE

# Verificar versión de Node
node --version  # Debe ser >=18

# Verificar versión de npm
npm --version

# Limpiar cache
npm cache clean --force
```

### Logs útiles

```javascript
// En ChatPage.tsx o donde sea necesario
console.log('Environment:', import.meta.env);
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('User:', user);
console.log('Auth state:', await supabase.auth.getSession());
```

---

## 📞 Cuando Todo Falla

### Checklist Final

- [ ] Reinicia el servidor de desarrollo
- [ ] Limpia cache del navegador (Ctrl+Shift+R)
- [ ] Borra `node_modules` y reinstala
- [ ] Verifica que `.env` existe y está completo
- [ ] Revisa consola del navegador (F12)
- [ ] Revisa consola del servidor
- [ ] Verifica que Supabase esté online
- [ ] Verifica que OpenAI tenga créditos
- [ ] Lee los logs de Supabase Dashboard → Logs

### Obtener Ayuda

1. **Busca el error en internet**:
   ```
   site:github.com "tu error exacto"
   ```

2. **Revisa documentación oficial**:
   - [Supabase Docs](https://supabase.com/docs)
   - [React Query](https://tanstack.com/query)
   - [Vite](https://vitejs.dev)

3. **Contacta soporte** (si aplicable)

---

**Este documento se actualizará con nuevos problemas comunes.**

**Última actualización**: Febrero 2026
