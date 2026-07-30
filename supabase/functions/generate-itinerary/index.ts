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
  flightData: z.any().optional(),
  language: z.string().min(2).max(5).optional().default("es")
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
    
    const { description, origin, destination, startDate, endDate, travelers, budget, flightData, language } = validationResult.data;
    
    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_AI_API_KEY) {
      console.error('GOOGLE_AI_API_KEY not configured');
      throw new Error('GOOGLE_AI_API_KEY not configured');
    }

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Dynamic scaling based on trip length
    const isLongTrip = days > 7;
    const activitiesPerDay = isLongTrip ? 2 : 3;
    const hotelOptions = isLongTrip ? 2 : 3;
    const activitySuggestions = isLongTrip ? 5 : 8;

    // Language configuration
    const languageConfig: Record<string, { name: string; instruction: string }> = {
      es: { name: "Spanish", instruction: "Responde completamente en español." },
      en: { name: "English", instruction: "Respond completely in English." },
      fr: { name: "French", instruction: "Réponds entièrement en français." },
      de: { name: "German", instruction: "Antworte vollständig auf Deutsch." },
      pt: { name: "Portuguese", instruction: "Responda completamente em português." },
      it: { name: "Italian", instruction: "Rispondi completamente in italiano." },
    };
    
    const langConfig = languageConfig[language] || languageConfig.es;

    const systemPrompt = `You are an expert travel planner. ${langConfig.instruction}
Generate a travel plan as valid JSON. Be EXTREMELY CONCISE - every string value should be SHORT (max 15 words).

JSON structure (property names in Spanish, values in ${langConfig.name}):
{
  "resumen": {
    "titulo": "short title",
    "descripcion": "1 sentence summary",
    "presupuestoEstimado": number,
    "duracion": ${days},
    "highlights": ["highlight1", "highlight2", "highlight3"]
  },
  "transporte": {
    "vuelos": [AT LEAST 3 flight options with different airlines: {"aerolinea":"airline","codigoAerolinea":"XX","origen":"XXX","destino":"XXX","fechaSalida":"ISO","fechaLlegada":"ISO","duracion":"Xh Xm","escalas":0,"precio":number,"calificacion":4.5,"link":"Google Flights URL"}],
    "transporteLocal": {
      "descripcion": "short desc",
      "opciones": [{"tipo":"type","descripcion":"short","costoAproximado":"$X","recomendado":true}],
      "consejos": ["tip1","tip2"],
      "tarjetasTransporte": "card name"
    },
    "alquilerCocheRecomendado": false,
    "opcionesCoche": [{"empresa":"name","tipoVehiculo":"type","precio":number,"puntoRecogida":"location","link":"kayak URL"}]
  },
  "alojamiento": {
    "recomendacion": "short recommendation",
    "zona": "area name",
    "costoPorNoche": number,
    "opciones": [{"nombre":"REAL hotel name","tipo":"Hotel","ubicacion":"area","precioPorNoche":number,"calificacion":4.5,"descripcion":"short","amenities":["WiFi","Pool"],"link":"Booking URL"}]
  },
  "actividades": [{"nombre":"name","descripcion":"short desc","duracion":"Xh","precio":number,"tipo":"Cultural","ubicacion":"area","horarios":"9-18h"}],
  "itinerario": [{"dia":1,"fecha":"${startDate}","resumenDia":"short","clima":"weather","actividades":[{"hora":"09:00","titulo":"name","descripcion":"short desc","ubicacion":"address","duracion":"Xh","costoAprox":number,"tipo":"type"}]}],
  "comentarios": {
    "consejos": ["tip1","tip2","tip3"],
    "advertencias": ["warning1"],
    "mejorEpoca": "short"
  },
  "infoLocal": {
    "clima": {"temperatura":"X-Y°C","descripcion":"short","mejorEpoca":"months"},
    "transporteLocal": {"descripcion":"short","opciones":["opt1","opt2"],"consejos":["tip1"]},
    "cultura": {"idioma":"lang","moneda":"XXX","propinas":"short","costumbres":["custom1","custom2"],"vestimenta":"short","saludos":"short","comidaTradicional":["dish1","dish2"],"festividades":"short"},
    "conversionMoneda": {"monedaLocal":"XXX","tipoCambio":number,"monedaOrigen":"USD"},
    "consejosAhorro": ["tip1","tip2"],
    "seguridad": {"nivelSeguridad":"High","zonasEvitar":["area"],"consejos":["tip1"]},
    "contactosUtiles": {"emergencias":"number","embajada":"info","policiaTuristica":"number"}
  }
}

RULES:
1. Exactly ${days} days. Day 1 fecha="${startDate}", each day +1.
2. ${activitiesPerDay} activities per day (include 1 restaurant with tipo="Gastronomía").
3. ${hotelOptions} hotel options, ${activitySuggestions} activity suggestions.
4. ALL strings MUST be SHORT. No long descriptions.
5. Do NOT include "link" in itinerario.actividades or actividades array items.
6. Use REAL place names. Prices in USD.
7. IATA codes for airlines (codigoAerolinea). Include calificacion (1-5) for each flight.
8. Trip for ${travelers} travelers.
9. MUST include at least 3 different flight options with different airlines, varying prices, and stops.
10. MUST include at least 3 car rental options with real company names (Hertz, Enterprise, Avis, Sixt, etc).`;

    const userPrompt = `Plan: ${description}. From ${origin} to ${destination}. ${startDate} to ${endDate} (${days} days). ${travelers} travelers. Budget: ${budget ? `$${budget} USD` : 'mid-range'}.${flightData ? ` Flights: ${JSON.stringify(flightData)}` : ''} Day 1 fecha="${startDate}". All text in ${langConfig.name}. Return ONLY valid JSON.`;

    console.log('Calling Google AI for itinerary generation...');
    
    // Format messages for Google AI
    const formattedContents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I will generate a detailed travel itinerary in the specified JSON format." }],
      },
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ];
    
    // Retry logic for AI calls
    let itinerary;
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`AI call attempt ${attempt + 1}/${maxRetries + 1}`);
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: formattedContents,
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 32000,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Google AI error:', response.status, errorText);
          if (response.status === 429) {
            return new Response(
              JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          throw new Error(`Google AI returned ${response.status}`);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!content) {
          console.error('Empty AI response, finish reason:', data.candidates?.[0]?.finishReason);
          throw new Error('Empty response from AI');
        }

        console.log('AI Response received, length:', content.length, 'parsing JSON...');

        // With responseMimeType=application/json, response should be clean JSON
        let jsonStr = content.trim();
        // Fallback cleanup in case model still wraps in markdown
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        }
        
        itinerary = JSON.parse(jsonStr);
        console.log('JSON parsed successfully on attempt', attempt + 1);
        break; // Success, exit retry loop
        
      } catch (e) {
        console.error(`Attempt ${attempt + 1} failed:`, e);
        if (attempt === maxRetries) {
          throw new Error('Failed to generate itinerary after multiple attempts');
        }
        // Wait before retry
        await new Promise(r => setTimeout(r, 1000));
      }
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
