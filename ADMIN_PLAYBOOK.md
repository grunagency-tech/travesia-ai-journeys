# 👨‍💼 Admin Playbook - Travesia AI Journeys

## 📋 Tabla de Contenidos

1. [Acceso al Panel de Administración](#acceso-al-panel-de-administración)
2. [Dashboard y Estadísticas](#dashboard-y-estadísticas)
3. [Gestión de Usuarios](#gestión-de-usuarios)
4. [Gestión de Viajes](#gestión-de-viajes)
5. [Monitoreo y Análisis](#monitoreo-y-análisis)
6. [Gestión de Roles](#gestión-de-roles)
7. [Mantenimiento de Base de Datos](#mantenimiento-de-base-de-datos)
8. [Troubleshooting Admin](#troubleshooting-admin)

---

## 🔐 Acceso al Panel de Administración

### Requisitos Previos
- Cuenta de usuario registrada en la plataforma
- Rol de `admin` asignado en la tabla `user_roles`

### URL de Acceso
```
https://tu-dominio.com/admin
```

### Primera Configuración

#### 1. Crear tu primer usuario administrador

Después de registrarte como usuario normal:

1. Ve al **Dashboard de Supabase**
2. Navega a **SQL Editor**
3. Ejecuta la siguiente consulta (reemplaza `TU_EMAIL` con tu email):

```sql
-- Obtener tu user_id
SELECT id, email FROM auth.users WHERE email = 'TU_EMAIL';

-- Asignar rol de admin (reemplaza USER_UUID)
INSERT INTO user_roles (user_id, role)
VALUES ('USER_UUID_AQUI', 'admin');
```

#### 2. Verificar acceso
1. Cierra sesión si estás logueado
2. Vuelve a iniciar sesión
3. Navega a `/admin`
4. Deberías ver el panel de administración completo

---

## 📊 Dashboard y Estadísticas

### Vista General

El dashboard muestra 4 métricas clave:

| Métrica | Descripción |
|---------|-------------|
| **Usuarios Totales** | Número total de usuarios registrados |
| **Viajes Creados** | Total de viajes generados en la plataforma |
| **Conversaciones** | Total de conversaciones de chat |
| **Viajes Este Mes** | Viajes creados en el mes actual |

### Gráficos Disponibles

#### 1. **Crecimiento Mensual** (LineChart)
- Muestra usuarios y viajes por mes
- Últimos 6 meses
- Permite identificar tendencias de crecimiento

#### 2. **Destinos Populares** (BarChart)
- Top 6 destinos más solicitados
- Ordenados por cantidad de viajes
- Útil para entender preferencias de usuarios

#### 3. **Usuarios por País** (PieChart)
- Distribución geográfica de usuarios
- Top 6 países
- Porcentaje por país

#### 4. **Viajes por Mes** (BarChart)
- Historial mensual de creación de viajes
- Útil para proyectar carga del sistema

### Interpretación de Datos

**Ejemplo de Análisis**:
```
Si ves:
- Crecimiento de usuarios: +15% mensual
- Destinos top: París, Tokyo, Nueva York
- Usuarios: 60% México, 25% España, 15% otros

Acción sugerida:
→ Optimizar contenido para destinos europeos y asiáticos
→ Añadir más información en español
→ Considerar soporte en horarios América/Europa
```

---

## 👥 Gestión de Usuarios

### Ver Lista de Usuarios

1. Ve al panel `/admin`
2. Click en la pestaña **"Usuarios"**
3. Verás una tabla con:
   - Nombre
   - Email
   - País
   - Fecha de registro

### Información Disponible

Desde la tabla puedes ver:
- **Usuarios activos recientes** (ordenados por fecha)
- **Distribución geográfica**
- **Patrones de registro**

### Acciones Administrativas

#### Asignar Rol de Admin a Otro Usuario

```sql
-- En Supabase SQL Editor
INSERT INTO user_roles (user_id, role)
VALUES ('USER_UUID_DEL_NUEVO_ADMIN', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

#### Revocar Rol de Admin

```sql
DELETE FROM user_roles
WHERE user_id = 'USER_UUID'
AND role = 'admin';
```

#### Eliminar Usuario y Sus Datos

```sql
-- Esto eliminará en cascada:
-- - Su perfil
-- - Todos sus viajes
-- - Todas sus conversaciones
-- - Sus roles

DELETE FROM profiles
WHERE id = 'USER_UUID';
```

> ⚠️ **ADVERTENCIA**: Esta acción es IRREVERSIBLE. Asegúrate de tener un backup.

### Casos de Uso Comunes

#### Caso 1: Usuario reporta cuenta hackeada
1. Desactiva la cuenta en Supabase Auth
2. Contacta al usuario para verificar identidad
3. Cambia contraseña desde el dashboard de Supabase
4. Reactiva la cuenta

#### Caso 2: Usuario duplicado
1. Identifica ambas cuentas
2. Exporta datos de la cuenta a eliminar
3. Borra la cuenta duplicada
4. Notifica al usuario

---

## ✈️ Gestión de Viajes

### Ver Todos los Viajes

1. Panel `/admin`
2. Pestaña **"Viajes"**
3. Tabla muestra:
   - Título del viaje
   - Usuario creador
   - Ruta (origen → destino)
   - Fechas del viaje
   - Número de viajeros
   - Presupuesto

### Filtros y Búsqueda

**Ordenamiento**:
- Por defecto: más recientes primero
- Puedes modificar el orden en el código:

```typescript
// En AdminPanel.tsx
.order('created_at', { ascending: false })
```

### Análisis de Viajes

#### Identificar Tendencias

**Query SQL útil**:
```sql
-- Destinos más populares
SELECT destination, COUNT(*) as total
FROM trips
GROUP BY destination
ORDER BY total DESC
LIMIT 10;

-- Presupuesto promedio por destino
SELECT destination, AVG(budget) as avg_budget
FROM trips
WHERE budget IS NOT NULL
GROUP BY destination
ORDER BY avg_budget DESC;

-- Duración promedio de viajes
SELECT 
  destination,
  AVG(end_date - start_date) as avg_duration_days
FROM trips
GROUP BY destination;
```

### Gestión de Contenido

#### Eliminar Viaje Específico

```sql
DELETE FROM trips
WHERE id = 'TRIP_UUID';
```

#### Exportar Todos los Viajes (Backup)

```sql
-- En SQL Editor
COPY (
  SELECT * FROM trips
  ORDER BY created_at DESC
) TO '/tmp/trips_backup.csv' WITH CSV HEADER;
```

---

## 📈 Monitoreo y Análisis

### KPIs Clave a Monitorear

| KPI | Descripción | Meta Sugerida |
|-----|-------------|---------------|
| **Tasa de Conversión** | Usuarios que completan un itinerario | > 60% |
| **Viajes por Usuario** | Promedio de viajes creados | > 2 |
| **Tiempo en Chat** | Duración promedio de conversación | 3-5 min |
| **Destinos Únicos** | Variedad de destinos solicitados | > 50 |

### Queries de Análisis

#### Tasa de Conversión

```sql
-- Usuarios que crearon al menos un viaje
SELECT 
  COUNT(DISTINCT user_id) * 100.0 / (SELECT COUNT(*) FROM profiles) as conversion_rate
FROM trips;
```

#### Usuarios más Activos

```sql
SELECT 
  p.email,
  p.name,
  COUNT(t.id) as total_trips
FROM profiles p
LEFT JOIN trips t ON p.id = t.user_id
GROUP BY p.id
ORDER BY total_trips DESC
LIMIT 10;
```

#### Crecimiento Semanal

```sql
SELECT 
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as new_users
FROM profiles
WHERE created_at > NOW() - INTERVAL '3 months'
GROUP BY week
ORDER BY week DESC;
```

### Alertas Recomendadas

Configura notificaciones para:
- ❌ Errores de API (OpenAI, TravelPayouts)
- 📉 Caída en conversiones > 20%
- 🚀 Pico de uso inusual
- 💰 Uso excesivo de OpenAI tokens

---

## 🔑 Gestión de Roles

### Roles Disponibles

| Rol | Permisos |
|-----|----------|
| `user` | Usuario estándar (por defecto) |
| `admin` | Acceso total al panel admin |

### Ver Todos los Admins

```sql
SELECT 
  ur.user_id,
  p.email,
  p.name,
  ur.created_at as admin_since
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
WHERE ur.role = 'admin'
ORDER BY ur.created_at DESC;
```

### Políticas de Seguridad

#### RLS (Row Level Security)

Verifica que las políticas estén activas:

```sql
-- Ver políticas de la tabla trips
SELECT * FROM pg_policies
WHERE tablename = 'trips';
```

#### Auditoría de Accesos

Crea una tabla de logs (opcional):

```sql
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🗄️ Mantenimiento de Base de Datos

### Backups Regulares

#### Backup Automático (Supabase)
- Supabase hace backups diarios automáticos
- Plan Pro: retención de 7 días
- Plan Team: retención de 14 días

#### Backup Manual

```bash
# Usando Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d).sql

# Restaurar backup
supabase db reset --db-url "postgresql://..."
```

### Limpieza de Datos

#### Eliminar Conversaciones Viejas (>6 meses)

```sql
DELETE FROM conversations
WHERE created_at < NOW() - INTERVAL '6 months'
AND trip_id IS NULL;  -- Solo conversaciones sin viaje asociado
```

#### Eliminar Viajes Sin Itinerario

```sql
DELETE FROM trips
WHERE itinerary_data IS NULL
AND created_at < NOW() - INTERVAL '1 month';
```

### Optimización

#### Vacuum y Analyze

```sql
-- En Supabase SQL Editor
VACUUM ANALYZE trips;
VACUUM ANALYZE conversations;
VACUUM ANALYZE profiles;
```

#### Índices Recomendados

```sql
-- Índice para búsqueda rápida de viajes por usuario
CREATE INDEX IF NOT EXISTS idx_trips_user_id 
ON trips(user_id);

-- Índice para búsqueda por destino
CREATE INDEX IF NOT EXISTS idx_trips_destination 
ON trips(destination);

-- Índice para queries de fecha
CREATE INDEX IF NOT EXISTS idx_trips_created 
ON trips(created_at DESC);
```

---

## 🛠️ Troubleshooting Admin

### Problema: No puedo acceder al panel admin

**Síntomas**: Página dice "Acceso Denegado"

**Soluciones**:
1. Verifica que tu usuario tenga el rol `admin`:
```sql
SELECT * FROM user_roles WHERE user_id = 'TU_UUID';
```

2. Si no aparece, añádelo:
```sql
INSERT INTO user_roles (user_id, role) VALUES ('TU_UUID', 'admin');
```

3. Cierra sesión y vuelve a entrar

---

### Problema: Los gráficos no cargan datos

**Síntomas**: Gráficos vacíos o con spinner infinito

**Soluciones**:
1. Verifica conexión a Supabase en consola del navegador (F12)
2. Revisa las políticas RLS:
```sql
-- Admins deben poder ver todos los datos
CREATE POLICY "Admins can view all trips" ON trips
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

3. Verifica que haya datos en las tablas:
```sql
SELECT COUNT(*) FROM trips;
SELECT COUNT(*) FROM profiles;
```

---

### Problema: Usuarios reportan errores en la generación de itinerarios

**Diagnóstico**:
1. Verifica logs de OpenAI en el dashboard de OpenAI
2. Revisa el uso de tokens y saldo
3. Checa errores en Supabase Logs

**Acciones**:
- Si es por límite de rate: espera o upgrade plan
- Si es por saldo: añade créditos
- Si es bug: revisa `services/openai.ts` logs

---

### Problema: Imágenes de destinos no cargan

**Soluciones**:
1. Verifica `VITE_GEMINI_API_KEY` en variables de entorno
2. Revisa que `destinationImages.ts` tenga el destino
3. Si es nuevo destino, añádelo manualmente:

```typescript
// En src/data/destinationImages.ts
export const destinationImages = {
  // ...
  "Nuevo Destino, País": "URL_DE_IMAGEN_UNSPLASH",
};
```

---

## 📞 Contactos de Soporte

### APIs
- **Supabase**: https://supabase.com/dashboard/support
- **OpenAI**: https://help.openai.com
- **TravelPayouts**: https://support.travelpayouts.com

### Recursos Internos
- Documentación técnica: `ARCHITECTURE.md`
- Guía de instalación: `INSTALLATION.md`
- Troubleshooting general: `TROUBLESHOOTING.md`

---

## 🔄 Actualizaciones y Mantenimiento

### Checklist Mensual

- [ ] Revisar estadísticas de crecimiento
- [ ] Verificar saldo de OpenAI API
- [ ] Backup manual de base de datos
- [ ] Revisar logs de errores en Supabase
- [ ] Actualizar destinationImages.ts con nuevos destinos populares
- [ ] Limpiar conversaciones antiguas (opcional)
- [ ] Verificar políticas RLS

### Checklist Trimestral

- [ ] Analizar tendencias de destinos
- [ ] Optimizar prompts de OpenAI si es necesario
- [ ] Revisar y actualizar precios/costos en itinerarios
- [ ] Actualizar dependencias del proyecto
- [ ] Evaluar necesidad de nuevas features
- [ ] Revisar feedback de usuarios

---

## 📚 Recursos Adicionales

- [Supabase Dashboard Guide](https://supabase.com/docs/guides/platform)
- [OpenAI Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
- [PostreSQL Admin Cookbook](https://www.postgresql.org/docs/current/admin.html)

---

**Última actualización**: Febrero 2026  
**Versión**: 1.0
