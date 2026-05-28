# 🔧 Guía de Troubleshooting — Travesia AI Journeys

> **Última actualización**: Febrero 2026

---

## 📑 Tabla de Contenidos

1. [Errores de Configuración Inicial](#errores-de-configuración-inicial)
2. [Autenticación y Sesión](#autenticación-y-sesión)
3. [Chat y Generación de Itinerarios](#chat-y-generación-de-itinerarios)
4. [Búsqueda de Vuelos](#búsqueda-de-vuelos)
5. [Búsqueda de Hoteles](#búsqueda-de-hoteles)
6. [Voz a Texto](#voz-a-texto)
7. [Panel de Administración](#panel-de-administración)
8. [Errores de UI / Frontend](#errores-de-ui--frontend)
9. [Errores de Base de Datos](#errores-de-base-de-datos)
10. [Errores de Edge Functions](#errores-de-edge-functions)
11. [Rendimiento](#rendimiento)
12. [Despliegue y Build](#despliegue-y-build)

---

## Errores de Configuración Inicial

### ❌ `VITE_SUPABASE_URL is not defined`

**Causa**: El archivo `.env` no existe o le faltan variables.

**Solución**:
1. Verifica que el archivo `.env` existe en la raíz del proyecto
2. Debe contener al menos:
   ```env
   VITE_SUPABASE_PROJECT_ID="tu-project-id"
   VITE_SUPABASE_PUBLISHABLE_KEY="tu-anon-key"
   VITE_SUPABASE_URL="https://tu-project-id.supabase.co"
   ```
3. Reinicia el servidor de desarrollo (`npm run dev`)

### ❌ `Failed to construct 'URL': Invalid URL`

**Causa**: Las variables de entorno de Supabase tienen formato incorrecto.

**Solución**:
- Verifica que `VITE_SUPABASE_URL` comienza con `https://`
- Verifica que no hay espacios o comillas incorrectas en el valor

### ❌ La app muestra pantalla en blanco

**Causas posibles**:
1. Error de JavaScript en la consola (F12 → Console)
2. Variables de entorno no configuradas
3. Dependencias no instaladas

**Solución**:
1. Abre DevTools (F12) y revisa la pestaña Console
2. Ejecuta `npm install` para asegurar que las dependencias están instaladas
3. Verifica el archivo `.env`
4. Limpia caché: `rm -rf node_modules/.vite && npm run dev`

---

## Autenticación y Sesión

### ❌ No puedo registrarme / crear cuenta

**Causas posibles**:
1. Las migraciones de la tabla `profiles` no se ejecutaron
2. RLS policies no configuradas
3. El trigger de creación de perfil no existe

**Solución**:
1. Verifica que la tabla `profiles` existe en la base de datos
2. Revisa que el trigger `on_auth_user_created` está activo
3. Revisa los logs de auth en la consola del navegador

### ❌ Sesión se pierde al recargar la página

**Causa**: Problema con el almacenamiento de sesión.

**Solución**:
1. Verifica que `localStorage` no está bloqueado por el navegador
2. El cliente Supabase está configurado con `persistSession: true` (predeterminado)
3. Revisa que no hay errores de CORS en la consola

### ❌ "Invalid login credentials"

**Causas**:
1. Email o contraseña incorrectos
2. El usuario no ha verificado su email (si auto-confirm está deshabilitado)

**Solución**:
1. Usa la función de "Olvidé mi contraseña" para resetear
2. Verifica en la base de datos que el usuario existe en `auth.users`

### ❌ No puedo acceder como administrador

**Causa**: El rol de admin no está asignado.

**Solución**:
```sql
-- Ejecuta en el SQL Editor con el UUID de tu usuario
INSERT INTO public.user_roles (user_id, role)
VALUES ('TU-USER-UUID', 'admin');
```

---

## Chat y Generación de Itinerarios

### ❌ El chat no responde / timeout

**Causas posibles**:
1. API key de Google AI (`GOOGLE_AI_API_KEY`) no configurada en Edge Function secrets
2. Rate limit de la API de Google
3. Timeout de la Edge Function (límite de 60s)

**Solución**:
1. Verifica que el secret `GOOGLE_AI_API_KEY` está configurado
2. Revisa los logs de la Edge Function `travesia-chat`
3. Si es rate limit (429), espera unos minutos y reintenta

### ❌ "Failed to generate itinerary after multiple attempts"

**Causa**: La API de Google AI no pudo generar un JSON válido después de 3 intentos.

**Solución**:
1. Revisa los logs de `generate-itinerary` para ver el error específico
2. Intenta con una descripción de viaje más sencilla
3. Verifica que `GOOGLE_AI_API_KEY` tiene créditos/cuota disponible
4. Si el error persiste, puede ser un problema temporal de la API — reintenta en unos minutos

### ❌ El itinerario se genera pero no se muestra

**Causas posibles**:
1. Error al parsear el JSON generado por la IA
2. Secciones faltantes en la respuesta (e.g., `resumen`, `itinerario`)
3. Error en el componente de renderizado

**Solución**:
1. Abre DevTools (F12) → Console y busca errores de parsing
2. Revisa los logs de la Edge Function — el JSON devuelto debería tener estas secciones:
   - `resumen`, `transporte`, `alojamiento`, `itinerario`, `comentarios`, `infoLocal`
3. Si falta una sección, la función agrega placeholders vacíos automáticamente

### ❌ Las fechas del itinerario son incorrectas

**Causa**: Desfase de zona horaria al procesar fechas ISO.

**Solución**:
- Las fechas se procesan con `.slice(0, 10)` para extraer solo `YYYY-MM-DD`
- Si el día 1 aparece con fecha incorrecta, verifica que `startDate` se envía en formato `YYYY-MM-DD` sin hora

### ❌ El itinerario tarda mucho (>2 minutos)

**Causa**: Viajes largos (>7 días) generan más contenido.

**Solución**:
- Es normal que viajes largos tarden 1-2 minutos
- La app muestra un mensaje de "esperando" al usuario
- Para viajes >7 días, se reducen automáticamente las actividades por día (de 3 a 2)

---

## Búsqueda de Vuelos

### ❌ No se encuentran vuelos / "Flight search error"

**Causas posibles**:
1. Token de TravelPayouts no configurado (`TRAVELPAYOUTS_TOKEN`)
2. Códigos IATA de origen/destino incorrectos
3. Fechas inválidas
4. La API de TravelPayouts no tiene datos para esa ruta

**Solución**:
1. Verifica el secret `TRAVELPAYOUTS_TOKEN` en Edge Function secrets
2. La función usa la API de Aviasales — no todas las rutas están disponibles
3. Si no hay datos reales, la función devuelve `isEstimated: true` y puede generar datos estimados desde la IA
4. Revisa los logs de `search-flights`

### ❌ Los precios de vuelos parecen incorrectos

**Causa**: Los precios de TravelPayouts son referenciales y pueden variar.

**Nota**: Los precios son orientativos. Al hacer clic en "Ver vuelo", el usuario es redirigido a Google Flights con los parámetros de búsqueda correctos donde verá precios actualizados.

---

## Búsqueda de Hoteles

### ❌ No se encuentran hoteles

**Causas posibles**:
1. Token de TravelPayouts / Hotellook no configurado
2. El destino no tiene cobertura en la API
3. Error de red

**Solución**:
1. Verifica el secret `TRAVELPAYOUTS_TOKEN`
2. Revisa los logs de `search-hotels`
3. Si la API no encuentra hoteles, se muestran los generados por la IA como fallback

### ❌ El link de "Reservar" no muestra el hotel correcto

**Solución**:
- Los links redirigen a Google Hotels con el nombre del hotel como búsqueda
- Si el hotel tiene nombre genérico, Google puede mostrar resultados diferentes
- Los links NO incluyen fechas específicas para evitar discrepancias

---

## Voz a Texto

### ❌ La grabación de voz no funciona

**Causas posibles**:
1. El navegador no soporta `MediaRecorder` API
2. El usuario no otorgó permisos de micrófono
3. La API key de transcripción no está configurada

**Solución**:
1. Usa Chrome, Firefox o Edge (Safari tiene soporte limitado)
2. Verifica permisos del micrófono en la barra de dirección del navegador
3. Revisa que el secret para voice-to-text está configurado
4. Revisa los logs de `voice-to-text`

### ❌ La transcripción es incorrecta

**Causa**: Calidad de audio baja o idioma no detectado correctamente.

**Solución**:
- Habla claro y cerca del micrófono
- Reduce el ruido de fondo
- La función soporta múltiples idiomas automáticamente

---

## Panel de Administración

### ❌ No puedo acceder al panel de admin (`/admin`)

**Causas**:
1. Tu usuario no tiene el rol `admin` en la tabla `user_roles`
2. No has iniciado sesión

**Solución**:
1. Inicia sesión primero
2. Verifica tu rol con:
   ```sql
   SELECT * FROM public.user_roles WHERE user_id = 'TU-UUID';
   ```
3. Si no tienes rol, insértalo (ver sección de Autenticación)

### ❌ Las estadísticas del admin no cargan

**Causa**: Las queries de agregación pueden tardar si hay muchos datos.

**Solución**:
1. Revisa la consola del navegador por errores
2. Verifica que las tablas `trips`, `profiles`, `conversations` existen y tienen datos
3. Revisa las RLS policies — el admin necesita permisos de lectura amplios

---

## Errores de UI / Frontend

### ❌ Colores incorrectos (fondo amarillo en vez de blanco)

**Causa**: Conflicto entre valores HSL en `index.css` y funciones `hsl()` de Tailwind.

**Solución**:
1. Abre `src/index.css` y verifica que todos los colores usan formato HSL puro (sin `hsl()` wrapper)
2. Ejemplo correcto:
   ```css
   --background: 0 0% 100%;     /* ✅ Correcto */
   --background: hsl(0, 0%, 100%); /* ❌ Incorrecto */
   ```
3. Revisa `tailwind.config.ts` para asegurar que los colores referencian `hsl(var(--token))`

### ❌ La app no es responsive / se ve mal en móvil

**Solución**:
1. Usa DevTools (F12) → Toggle Device Toolbar para simular móvil
2. Los componentes usan el hook `useIsMobile()` para adaptar el layout
3. Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`

### ❌ Las imágenes de destinos no cargan

**Causas**:
1. La imagen local no existe en `src/assets/destinations/`
2. La URL de imagen de la base de datos (`destination_images`) es inválida
3. Error de red

**Solución**:
1. Se usan imágenes locales como fallback (en `src/lib/destinationImages.ts`)
2. Si la imagen del destino no está mapeada, se usa `default.jpg`
3. Verifica la consola del navegador por errores 404

---

## Errores de Base de Datos

### ❌ "new row violates row-level security policy"

**Causa**: La operación INSERT/UPDATE no cumple las políticas RLS.

**Solución**:
1. Verifica que el usuario está autenticado antes de hacer la operación
2. Asegúrate de que el `user_id` en la fila coincide con `auth.uid()`
3. Revisa las políticas RLS de la tabla afectada:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'nombre_tabla';
   ```

### ❌ "Could not find the public.X table"

**Causa**: La migración que crea esa tabla no se ejecutó.

**Solución**:
1. Revisa la carpeta `supabase/migrations/` para la migración correspondiente
2. Ejecuta las migraciones pendientes
3. Verifica que la tabla existe en el schema `public`

### ❌ Los datos no se guardan

**Causas posibles**:
1. Error de RLS (ver arriba)
2. El usuario no está autenticado
3. Error de validación en los datos

**Solución**:
1. Revisa la consola del navegador por errores de la API
2. Verifica que el usuario tiene sesión activa
3. Usa DevTools → Network para ver la respuesta exacta del servidor

---

## Errores de Edge Functions

### ❌ Error 500 en cualquier Edge Function

**Causas posibles**:
1. Secret/API key no configurada
2. Error de lógica en la función
3. Timeout (límite ~60s)

**Solución**:
1. Revisa los logs de la función específica
2. Verifica que todos los secrets necesarios están configurados:
   - `GOOGLE_AI_API_KEY` → `travesia-chat`, `generate-itinerary`
   - `TRAVELPAYOUTS_TOKEN` → `search-flights`, `search-hotels`
3. Para errores intermitentes, la función tiene reintentos automáticos (hasta 3 intentos)

### ❌ Error CORS ("blocked by CORS policy")

**Causa**: Las cabeceras CORS de la Edge Function no incluyen los headers necesarios.

**Solución**:
Verifica que la función incluya:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Y el handler OPTIONS:
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

### ❌ Error 429 (Rate Limit)

**Causa**: Demasiadas solicitudes a la API externa.

**Solución**:
1. Espera 1-2 minutos antes de reintentar
2. Para Google AI: verifica tu cuota en [Google AI Studio](https://ai.google.dev)
3. Para TravelPayouts: verifica límites en tu dashboard

---

## Rendimiento

### ⚠️ La app tarda mucho en cargar

**Optimizaciones implementadas**:
1. Lazy loading de imágenes con `loading="lazy"`
2. Code splitting por rutas con React lazy/Suspense
3. Caché de itinerarios en `conversationItineraryCache.ts`
4. TanStack Query con `staleTime` configurado

**Si aún es lento**:
1. Revisa DevTools → Network para assets grandes
2. Verifica que el build de producción está optimizado: `npm run build`
3. Revisa DevTools → Performance para identificar cuellos de botella

### ⚠️ Demasiados re-renders

**Solución**:
1. Usa React DevTools Profiler para identificar componentes problemáticos
2. Verifica que los contextos (`CurrencyContext`, `LanguageContext`, `LocationContext`) no causan re-renders innecesarios
3. Usa `React.memo` para componentes que reciben props estables

---

## Despliegue y Build

### ❌ `npm run build` falla

**Causas comunes**:
1. Errores de TypeScript
2. Imports faltantes
3. Variables de entorno no disponibles en build time

**Solución**:
1. Ejecuta `npx tsc --noEmit` para ver errores de TypeScript
2. Verifica todos los imports con `npm run lint`
3. Las variables `VITE_*` deben estar disponibles durante el build

### ❌ El build es muy grande

**Solución**:
1. Revisa el output de `npm run build` para ver tamaños de chunks
2. Usa `npx vite-bundle-visualizer` para analizar el bundle
3. Verifica que no se están importando librerías completas (tree-shaking)

### ❌ La app desplegada no carga

**Solución**:
1. Verifica que las variables de entorno están configuradas en el hosting
2. Para SPAs, configura el servidor para redirigir todas las rutas a `index.html`
3. Verifica la consola del navegador por errores

---

## 🆘 Contacto y Soporte

Si el problema persiste después de seguir esta guía:

1. **Revisa los logs** del navegador (F12 → Console) y del servidor
2. **Captura screenshots** del error y los logs
3. **Documenta los pasos** para reproducir el problema
4. **Revisa** la [Documentación de Arquitectura](./ARCHITECTURE.md) para entender el flujo afectado
5. **Consulta** la [Guía de Instalación](./INSTALLATION.md) si es un problema de setup

---

## 📋 Checklist Rápido de Diagnóstico

| Síntoma | Primer paso |
|---------|-------------|
| Pantalla en blanco | F12 → Console → buscar errores |
| No puedo iniciar sesión | Verificar tabla `profiles` y `auth.users` |
| Chat no responde | Verificar `GOOGLE_AI_API_KEY` secret |
| No hay vuelos | Verificar `TRAVELPAYOUTS_TOKEN` secret |
| Error 500 | Revisar logs de Edge Function |
| Error CORS | Verificar headers en Edge Function |
| Datos no se guardan | Verificar RLS policies y auth |
| Colores rotos | Revisar HSL en `index.css` |
