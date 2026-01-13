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
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

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

    const systemPrompt = `You are an expert travel planner who creates detailed and personalized itineraries.
${langConfig.instruction}

Your task is to generate a complete travel plan structured in JSON format.

The JSON MUST have this EXACT structure (respect property names, but all TEXT VALUES must be in ${langConfig.name}):
{
  "resumen": {
    "titulo": "string - Attractive trip title",
    "descripcion": "string - Descriptive summary of the trip (2-3 sentences)",
    "presupuestoEstimado": number - Estimated total budget in USD,
    "duracion": number - Number of days,
    "highlights": ["string - highlight 1", "string - highlight 2", "string - highlight 3", "string - highlight 4", "string - highlight 5"]
  },
  "transporte": {
    "vuelos": [
      {
        "aerolinea": "string - name of real airline operating that route (e.g: American Airlines, Delta, United)",
        "origen": "string - IATA airport code (e.g: MEX, LAX, JFK)",
        "destino": "string - destination IATA airport code (e.g: LAS, CDG, LHR)",
        "fechaSalida": "string - ISO date (YYYY-MM-DDTHH:mm:ss)",
        "fechaLlegada": "string - ISO date (YYYY-MM-DDTHH:mm:ss)",
        "duracion": "string - flight duration (e.g: 2h 30m)",
        "escalas": number - number of layovers (0 for direct),
        "precio": number - estimated price in USD,
        "link": "string - MANDATORY: functional Google Flights URL with format: https://www.google.com/travel/flights?q=flights%20from%20ORIGIN%20to%20DESTINATION%20on%20DATE. Example: https://www.google.com/travel/flights?q=flights%20from%20MEX%20to%20LAS%20on%202026-07-24"
      }
    ],
    "transporteLocal": {
      "descripcion": "string - general description of transport system",
      "opciones": [
        {
          "tipo": "string - Metro/Bus/Taxi/Uber/Train/etc",
          "descripcion": "string - how it works and where to use it",
          "costoAproximado": "string - typical price range",
          "recomendado": boolean - if recommended for tourists
        }
      ],
      "consejos": ["string - practical tip 1", "string - practical tip 2", "string - practical tip 3"],
      "tarjetasTransporte": "string - recommended transport cards or passes (e.g: Oyster Card, MetroCard, etc)"
    },
    "alquilerCocheRecomendado": boolean - if renting a car is recommended,
    "opcionesCoche": [
      {
        "empresa": "string - rental company name",
        "tipoVehiculo": "string - vehicle type",
        "precio": number - price per day in USD,
        "puntoRecogida": "string - pickup location",
        "link": "string - booking URL: https://www.kayak.com/cars/{DESTINATION}/{START_DATE}/{END_DATE} or official company site"
      }
    ]
  },
  "alojamiento": {
    "recomendacion": "string - detailed description of main recommendation",
    "zona": "string - best area to stay with explanation of why",
    "costoPorNoche": number - average cost per night in USD,
    "opciones": [
      {
        "nombre": "string - name of REAL hotel/hostel that exists (e.g: The Venetian Resort, Caesars Palace, Hotel RIU Plaza)",
        "tipo": "string - Hotel/Hostel/Apartment/B&B",
        "ubicacion": "string - address or area",
        "precioPorNoche": number - price per night in USD,
        "calificacion": number - rating from 1 to 5,
        "descripcion": "string - brief description of the hotel",
        "amenities": ["string - WiFi", "string - Breakfast", "string - Pool"],
        "link": "string - MANDATORY: functional Booking.com URL with format: https://www.booking.com/searchresults.html?ss=HOTEL+NAME+CITY (replace spaces with +). Example: https://www.booking.com/searchresults.html?ss=The+Venetian+Resort+Las+Vegas"
      }
    ]
  },
  "actividades": [
    {
      "nombre": "string - activity/attraction name",
      "descripcion": "string - detailed description",
      "duracion": "string - estimated time (e.g: 2-3 hours)",
      "precio": number - price in USD (0 if free),
      "tipo": "string - Cultural/Gastronomy/Adventure/Nature/Shopping/Entertainment",
      "ubicacion": "string - address or area",
      "horarios": "string - typical opening hours",
      "link": "string - official or booking URL (TripAdvisor, GetYourGuide, Viator, official site)"
    }
  ],
  "itinerario": [
    {
      "dia": number,
      "fecha": "string - date YYYY-MM-DD",
      "resumenDia": "string - brief summary of the day",
      "clima": "string - expected weather for that date",
      "actividades": [
        {
          "hora": "string - specific time (e.g: 09:00)",
          "titulo": "string - activity name",
          "descripcion": "string - detailed description of what to do",
          "ubicacion": "string - specific address",
          "duracion": "string - estimated duration",
          "costoAprox": number - approximate cost in USD,
          "tipo": "string - activity type",
          "link": "string - URL to book or more info"
        }
      ]
    }
  ],
  "comentarios": {
    "consejos": ["string - useful tip 1", "string - useful tip 2", "string - useful tip 3", "string - useful tip 4"],
    "advertencias": ["string - warning or caution 1", "string - warning 2"],
    "mejorEpoca": "string - best time to visit this destination with explanation"
  },
  "infoLocal": {
    "clima": {
      "temperatura": "string - typical temperature range for travel dates",
      "descripcion": "string - description of expected weather",
      "mejorEpoca": "string - best time of year to visit"
    },
    "transporteLocal": {
      "descripcion": "string - summary of public transport system",
      "opciones": ["string - option 1 with description", "string - option 2 with description"],
      "consejos": ["string - tip 1", "string - tip 2", "string - tip 3"]
    },
    "cultura": {
      "idioma": "string - official language and other spoken languages",
      "moneda": "string - official currency with symbol",
      "propinas": "string - detailed tipping customs",
      "costumbres": ["string - local custom 1", "string - local custom 2", "string - local custom 3", "string - local custom 4"],
      "vestimenta": "string - recommended dress code",
      "saludos": "string - how to greet appropriately",
      "comidaTradicional": ["string - typical dish 1 with description", "string - typical dish 2 with description", "string - typical dish 3 with description"],
      "festividades": "string - festivals or events during travel dates if applicable"
    },
    "conversionMoneda": {
      "monedaLocal": "string - currency code (e.g: EUR, GBP, JPY)",
      "tipoCambio": number - approximate exchange rate to USD,
      "monedaOrigen": "USD"
    },
    "consejosAhorro": ["string - money-saving tip 1", "string - money-saving tip 2", "string - money-saving tip 3"],
    "seguridad": {
      "nivelSeguridad": "string - High/Medium/Low",
      "zonasEvitar": ["string - area to avoid 1"],
      "consejos": ["string - safety tip 1", "string - safety tip 2"]
    },
    "contactosUtiles": {
      "emergencias": "string - emergency number",
      "embajada": "string - embassy info if applicable",
      "policiaTuristica": "string - tourist police number if exists"
    }
  }
}

IMPORTANT RULES:
1. Create exactly ${days} days of itinerary
2. Each day must have at least 4-5 activities with specific times (09:00, 12:30, etc)
3. Be VERY specific with REAL place names, restaurants, attractions
4. Prices must be realistic and up-to-date for ${destination}
5. If flight data is available, use it; otherwise, suggest REAL airlines that operate that route
6. Estimated budget should consider: flights, accommodation, meals, activities, and local transport
7. Include REAL URLs from sites like TripAdvisor, GetYourGuide, Viator, Booking, or official attraction sites
8. Cultural info must be ACCURATE and respectful - real destination customs
9. Include REAL public transport info with approximate current prices
10. Respond ONLY with the JSON, no additional text or markdown
11. ALL text content must be in ${langConfig.name}`;

    const userPrompt = `Create a complete travel plan with these details:
- Traveler description: ${description}
- Origin: ${origin}
- Destination: ${destination}
- Dates: ${startDate} to ${endDate} (${days} days)
- Number of travelers: ${travelers}
- User budget: ${budget ? `$${budget} USD` : 'Not specified (suggest mid-range options)'}
${flightData ? `\n- Available flight data:\n${JSON.stringify(flightData, null, 2)}` : ''}

Generate the complete itinerary following EXACTLY the specified JSON structure. Remember: ALL text content must be in ${langConfig.name}.`;

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
