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
    "highlights": ["string - punto destacado 1", "string - punto destacado 2", "string - punto destacado 3"]
  },
  "transporte": {
    "vuelos": [
      {
        "aerolinea": "string - nombre de aerolínea sugerida",
        "origen": "string - ciudad de origen",
        "destino": "string - ciudad de destino",
        "fechaSalida": "string - fecha ISO (YYYY-MM-DDTHH:mm:ss)",
        "fechaLlegada": "string - fecha ISO (YYYY-MM-DDTHH:mm:ss)",
        "precio": number - precio estimado en USD
      }
    ],
    "transporteLocal": "string - recomendaciones de transporte dentro del destino"
  },
  "alojamiento": {
    "recomendacion": "string - descripción de la recomendación principal",
    "zona": "string - mejor zona para hospedarse",
    "costoPorNoche": number - costo promedio por noche en USD,
    "opciones": ["string - opción 1", "string - opción 2", "string - opción 3"]
  },
  "itinerario": [
    {
      "dia": number,
      "fecha": "string - fecha YYYY-MM-DD",
      "resumenDia": "string - resumen breve del día",
      "actividades": [
        {
          "hora": "morning" | "afternoon" | "evening",
          "titulo": "string - nombre de la actividad",
          "descripcion": "string - descripción detallada",
          "ubicacion": "string - lugar específico",
          "costoAprox": number - costo aproximado en USD
        }
      ]
    }
  ],
  "comentarios": {
    "consejos": ["string - consejo útil 1", "string - consejo útil 2"],
    "advertencias": ["string - advertencia o precaución"],
    "mejorEpoca": "string - mejor época para visitar este destino"
  }
}

REGLAS IMPORTANTES:
1. Crea exactamente ${days} días de itinerario
2. Cada día debe tener al menos 3 actividades (mañana, tarde, noche)
3. Sé específico con nombres de lugares reales, restaurantes, atracciones
4. Los precios deben ser realistas para ${destination}
5. Si hay datos de vuelos disponibles, úsalos; si no, sugiere opciones realistas
6. El presupuesto estimado debe considerar: vuelos, alojamiento, comidas, actividades y transporte local
7. Responde SOLO con el JSON, sin texto adicional ni markdown`;

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
