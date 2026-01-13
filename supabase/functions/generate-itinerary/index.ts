import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generateItinerarySchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(1000, "Description must be less than 1000 characters"),
  origin: z.string().trim().min(2, "Origin must be at least 2 characters").max(100, "Origin must be less than 100 characters"),
  destination: z.string().trim().min(2, "Destination must be at least 2 characters").max(100, "Destination must be less than 100 characters"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
  travelers: z.number().int().min(1, "At least 1 traveler required").max(20, "Maximum 20 travelers allowed"),
  budget: z.number().positive("Budget must be positive").max(10000000, "Budget exceeds maximum allowed").optional().nullable(),
  flightData: z.any().optional()
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  { message: "End date must be after or equal to start date", path: ["endDate"] }
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth temporarily disabled for testing
    console.log('Processing itinerary request (auth disabled for testing)');

    const requestBody = await req.json();
    console.log('Received request body:', JSON.stringify(requestBody));
    
    // Validate input
    const validationResult = generateItinerarySchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validationResult.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { description, origin, destination, startDate, endDate, travelers, budget, flightData } = validationResult.data;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const systemPrompt = `Eres un experto planificador de viajes que crea itinerarios detallados y personalizados en español.
Tu tarea es generar un plan de viaje completo estructurado en formato JSON.

El JSON DEBE tener esta estructura EXACTA (respeta los nombres de las propiedades):
{
  "resumen": {
    "titulo": "string - Título atractivo del viaje",
    "descripcion": "string - Resumen descriptivo del viaje (2-3 oraciones)",
    "presupuestoEstimado": number - Presupuesto total estimado en USD,
    "duracion": number - Número de días,
    "highlights": ["string - punto destacado 1", "string - punto destacado 2", "string - punto destacado 3", "string - punto destacado 4", "string - punto destacado 5"]
  },
  "transporte": {
    "vuelos": [
      {
        "aerolinea": "string - nombre de aerolínea real que opera esa ruta (ej: American Airlines, Delta, United)",
        "origen": "string - código IATA del aeropuerto (ej: MEX, LAX, JFK)",
        "destino": "string - código IATA del aeropuerto destino (ej: LAS, CDG, LHR)",
        "fechaSalida": "string - fecha ISO (YYYY-MM-DDTHH:mm:ss)",
        "fechaLlegada": "string - fecha ISO (YYYY-MM-DDTHH:mm:ss)",
        "duracion": "string - duración del vuelo (ej: 2h 30m)",
        "escalas": number - número de escalas (0 para directo),
        "precio": number - precio estimado en USD,
        "link": "string - OBLIGATORIO: URL funcional de Google Flights con formato: https://www.google.com/travel/flights?q=flights%20from%20ORIGEN%20to%20DESTINO%20on%20FECHA. Ejemplo: https://www.google.com/travel/flights?q=flights%20from%20MEX%20to%20LAS%20on%202026-07-24"
      }
    ],
    "transporteLocal": {
      "descripcion": "string - descripción general del sistema de transporte",
      "opciones": [
        {
          "tipo": "string - Metro/Bus/Taxi/Uber/Tren/etc",
          "descripcion": "string - cómo funciona y dónde usarlo",
          "costoAproximado": "string - rango de precios típico",
          "recomendado": boolean - si es recomendado para turistas
        }
      ],
      "consejos": ["string - consejo práctico 1", "string - consejo práctico 2", "string - consejo práctico 3"],
      "tarjetasTransporte": "string - tarjetas o pases de transporte recomendados (ej: Oyster Card, MetroCard, etc)"
    },
    "alquilerCocheRecomendado": boolean - si se recomienda alquilar coche,
    "opcionesCoche": [
      {
        "empresa": "string - nombre de empresa de alquiler",
        "tipoVehiculo": "string - tipo de vehículo",
        "precio": number - precio por día en USD,
        "puntoRecogida": "string - ubicación de recogida",
        "link": "string - URL de reserva: https://www.kayak.com/cars/{DESTINO}/{FECHA_INICIO}/{FECHA_FIN} o sitio oficial de la empresa"
      }
    ]
  },
  "alojamiento": {
    "recomendacion": "string - descripción detallada de la recomendación principal",
    "zona": "string - mejor zona para hospedarse con explicación de por qué",
    "costoPorNoche": number - costo promedio por noche en USD,
    "opciones": [
      {
        "nombre": "string - nombre del hotel/hostal REAL que existe (ej: The Venetian Resort, Caesars Palace, Hotel RIU Plaza)",
        "tipo": "string - Hotel/Hostal/Apartamento/B&B",
        "ubicacion": "string - dirección o zona",
        "precioPorNoche": number - precio por noche en USD,
        "calificacion": number - calificación de 1 a 5,
        "descripcion": "string - breve descripción del hotel",
        "amenities": ["string - WiFi", "string - Desayuno", "string - Piscina"],
        "link": "string - OBLIGATORIO: URL funcional de Booking.com con formato: https://www.booking.com/searchresults.html?ss=NOMBRE+DEL+HOTEL+CIUDAD (reemplazar espacios con +). Ejemplo: https://www.booking.com/searchresults.html?ss=The+Venetian+Resort+Las+Vegas"
      }
    ]
  },
  "actividades": [
    {
      "nombre": "string - nombre de la actividad/atracción",
      "descripcion": "string - descripción detallada",
      "duracion": "string - tiempo estimado (ej: 2-3 horas)",
      "precio": number - precio en USD (0 si es gratis),
      "tipo": "string - Cultural/Gastronomía/Aventura/Naturaleza/Compras/Entretenimiento",
      "ubicacion": "string - dirección o zona",
      "horarios": "string - horarios de apertura típicos",
      "link": "string - URL oficial o de reservas (TripAdvisor, GetYourGuide, Viator, sitio oficial)"
    }
  ],
  "itinerario": [
    {
      "dia": number,
      "fecha": "string - fecha YYYY-MM-DD",
      "resumenDia": "string - resumen breve del día",
      "clima": "string - clima esperado para esa fecha",
      "actividades": [
        {
          "hora": "string - hora específica (ej: 09:00)",
          "titulo": "string - nombre de la actividad",
          "descripcion": "string - descripción detallada de qué hacer",
          "ubicacion": "string - dirección específica",
          "duracion": "string - duración estimada",
          "costoAprox": number - costo aproximado en USD,
          "tipo": "string - tipo de actividad",
          "link": "string - URL para reservar o más info"
        }
      ]
    }
  ],
  "comentarios": {
    "consejos": ["string - consejo útil 1", "string - consejo útil 2", "string - consejo útil 3", "string - consejo útil 4"],
    "advertencias": ["string - advertencia o precaución 1", "string - advertencia 2"],
    "mejorEpoca": "string - mejor época para visitar este destino con explicación"
  },
  "infoLocal": {
    "clima": {
      "temperatura": "string - rango de temperaturas típicas para las fechas del viaje",
      "descripcion": "string - descripción del clima esperado",
      "mejorEpoca": "string - mejor época del año para visitar"
    },
    "transporteLocal": {
      "descripcion": "string - resumen del sistema de transporte público",
      "opciones": ["string - opción 1 con descripción", "string - opción 2 con descripción"],
      "consejos": ["string - consejo 1", "string - consejo 2", "string - consejo 3"]
    },
    "cultura": {
      "idioma": "string - idioma oficial y otros idiomas hablados",
      "moneda": "string - moneda oficial con símbolo",
      "propinas": "string - costumbres de propinas detalladas",
      "costumbres": ["string - costumbre local 1", "string - costumbre local 2", "string - costumbre local 3", "string - costumbre local 4"],
      "vestimenta": "string - código de vestimenta recomendado",
      "saludos": "string - cómo saludar apropiadamente",
      "comidaTradicional": ["string - plato típico 1 con descripción", "string - plato típico 2 con descripción", "string - plato típico 3 con descripción"],
      "festividades": "string - festividades o eventos durante las fechas del viaje si aplica"
    },
    "conversionMoneda": {
      "monedaLocal": "string - código de moneda (ej: EUR, GBP, JPY)",
      "tipoCambio": number - tipo de cambio aproximado respecto a USD,
      "monedaOrigen": "USD"
    },
    "consejosAhorro": ["string - consejo para ahorrar 1", "string - consejo para ahorrar 2", "string - consejo para ahorrar 3"],
    "seguridad": {
      "nivelSeguridad": "string - Alto/Medio/Bajo",
      "zonasEvitar": ["string - zona a evitar 1"],
      "consejos": ["string - consejo de seguridad 1", "string - consejo de seguridad 2"]
    },
    "contactosUtiles": {
      "emergencias": "string - número de emergencias",
      "embajada": "string - info de embajada si aplica",
      "policiaTuristica": "string - número de policía turística si existe"
    }
  }
}

REGLAS IMPORTANTES:
1. Crea exactamente ${days} días de itinerario
2. Cada día debe tener al menos 4-5 actividades con horarios específicos (09:00, 12:30, etc)
3. Sé MUY específico con nombres de lugares REALES, restaurantes, atracciones
4. Los precios deben ser realistas y actualizados para ${destination}
5. Si hay datos de vuelos disponibles, úsalos; si no, sugiere aerolíneas REALES que operan esa ruta
6. El presupuesto estimado debe considerar: vuelos, alojamiento, comidas, actividades y transporte local
7. Incluye URLs REALES de sitios como TripAdvisor, GetYourGuide, Viator, Booking, o sitios oficiales de las atracciones
8. La info cultural debe ser PRECISA y respetuosa - costumbres reales del destino
9. Incluye información de transporte público REAL con precios aproximados actuales
10. Responde SOLO con el JSON, sin texto adicional ni markdown`;

    const userPrompt = `Crea un plan de viaje completo con estos detalles:
- Descripción del viajero: ${description}
- Origen: ${origin}
- Destino: ${destination}
- Fechas: ${startDate} a ${endDate} (${days} días)
- Número de viajeros: ${travelers}
- Presupuesto del usuario: ${budget ? `$${budget} USD` : 'No especificado (sugiere opciones de rango medio)'}
${flightData ? `\n- Datos de vuelos disponibles:\n${JSON.stringify(flightData, null, 2)}` : ''}

Genera el itinerario completo siguiendo EXACTAMENTE la estructura JSON especificada.`;

    console.log('Calling Lovable AI for itinerary generation...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('AI Response received, parsing JSON...');

    // Parse the JSON response
    let itinerary;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      itinerary = JSON.parse(jsonStr.trim());
      console.log('JSON parsed successfully');
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      console.error('Raw content:', content);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate that required sections exist
    const requiredSections = ['resumen', 'transporte', 'alojamiento', 'itinerario', 'comentarios'];
    for (const section of requiredSections) {
      if (!itinerary[section]) {
        console.warn(`Missing section: ${section}, adding empty placeholder`);
        itinerary[section] = section === 'itinerario' ? [] : {};
      }
    }

    console.log('Returning itinerary with sections:', Object.keys(itinerary));

    return new Response(
      JSON.stringify({ itinerary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-itinerary:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
