import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function validateInput(body: Record<string, unknown>): { valid: true; data: { description: string; origin: string; destination: string; startDate: string; endDate: string; travelers: number; budget: number | null; flightData: unknown; language: string } } | { valid: false; errors: string[] } {
  const errors: string[] = [];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (!description || description.length > 1000) errors.push('description: must be 1-1000 chars');

  const origin = typeof body.origin === 'string' && body.origin.trim().length > 0 ? body.origin.trim() : 'No especificado';
  if (origin.length > 100) errors.push('origin: must be <= 100 chars');

  const destination = typeof body.destination === 'string' ? body.destination.trim() : '';
  if (destination.length < 2 || destination.length > 100) errors.push('destination: must be 2-100 chars');

  const startDate = typeof body.startDate === 'string' ? body.startDate : '';
  if (!dateRegex.test(startDate)) errors.push('startDate: must be YYYY-MM-DD');

  const endDate = typeof body.endDate === 'string' ? body.endDate : '';
  if (!dateRegex.test(endDate)) errors.push('endDate: must be YYYY-MM-DD');

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) errors.push('endDate: must be after or equal to start date');

  const travelers = typeof body.travelers === 'number' ? body.travelers : 0;
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > 20) errors.push('travelers: must be 1-20');

  const budget = body.budget != null ? (typeof body.budget === 'number' && body.budget > 0 && body.budget <= 10000000 ? body.budget : -1) : null;
  if (budget === -1) errors.push('budget: must be positive and <= 10000000');

  const language = typeof body.language === 'string' && body.language.length >= 2 && body.language.length <= 5 ? body.language : 'es';

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data: { description, origin, destination, startDate, endDate, travelers, budget: budget as number | null, flightData: body.flightData, language } };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing auth header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const requestBody = await req.json();
    console.log('Received request body:', JSON.stringify(requestBody));
    
    const validation = validateInput(requestBody);
    if (!validation.valid) {
      console.error('Validation failed:', validation.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { description, origin, destination, startDate, endDate, travelers, budget, flightData, language } = validation.data;
    
    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY') || Deno.env.get('GOOGLE_API_KEY');
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
3. ${hotelOptions} hotel options. The "actividades" array MUST have AT LEAST ${activitySuggestions} unique activity suggestions (landmarks, tours, restaurants, experiences). NEVER leave it empty.
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
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GOOGLE_AI_API_KEY}`,
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

    // Ensure actividades array exists - extract from daily itinerary as fallback
    if (!itinerary.actividades || !Array.isArray(itinerary.actividades) || itinerary.actividades.length === 0) {
      console.warn('Missing actividades section, extracting from daily itinerary...');
      const extractedActivities: Record<string, any> = {};
      if (itinerary.itinerario && Array.isArray(itinerary.itinerario)) {
        for (const day of itinerary.itinerario) {
          if (day.actividades && Array.isArray(day.actividades)) {
            for (const act of day.actividades) {
              const name = act.titulo || act.nombre || '';
              if (name && !extractedActivities[name.toLowerCase()]) {
                extractedActivities[name.toLowerCase()] = {
                  nombre: name,
                  descripcion: act.descripcion || '',
                  duracion: act.duracion || '2h',
                  precio: act.costoAprox || act.precio || 0,
                  tipo: act.tipo || 'Cultural',
                  ubicacion: act.ubicacion || destination,
                  horarios: act.hora || '',
                };
              }
            }
          }
        }
      }
      itinerary.actividades = Object.values(extractedActivities);
      console.log(`Extracted ${itinerary.actividades.length} activities from daily itinerary`);
    }

    // ===== POST-PROCESSING: Validate and regenerate all booking links =====
    console.log('Validating and regenerating booking links...');

    const enc = (s: string) => encodeURIComponent(s.trim());

    // Fix flight links → Google Flights search (most reliable across all routes)
    if (itinerary.transporte?.vuelos && Array.isArray(itinerary.transporte.vuelos)) {
      for (const vuelo of itinerary.transporte.vuelos) {
        const orig = vuelo.origen || '';
        const dest = vuelo.destino || '';
        // Google Flights text search works for both IATA codes and city names
        vuelo.link = `https://www.google.com/travel/flights?q=flights+from+${enc(orig)}+to+${enc(dest)}+on+${startDate}${endDate ? '+return+' + endDate : ''}&curr=USD&hl=es`;
      }
    }

    // Fix car rental links → Kayak with proper city format
    if (itinerary.transporte?.opcionesCoche && Array.isArray(itinerary.transporte.opcionesCoche)) {
      const destParts = destination.split(',').map((p: string) => p.trim().replace(/\s+/g, '-'));
      const kayakLocation = destParts.join(',');
      for (const coche of itinerary.transporte.opcionesCoche) {
        coche.link = `https://www.kayak.com/cars/${enc(kayakLocation)}/${startDate}/${endDate};map?ucs=10f8kfk`;
      }
    }

    // Fix hotel links → Google Maps search (precise location matching, avoids wrong city)
    if (itinerary.alojamiento?.opciones && Array.isArray(itinerary.alojamiento.opciones)) {
      for (const hotel of itinerary.alojamiento.opciones) {
        if (typeof hotel === 'object' && hotel.nombre) {
          hotel.link = `https://www.google.com/maps/search/${enc((hotel.nombre as string) + ' ' + destination)}`;
        }
      }
    }

    // Remove any links from itinerario.actividades (should not have links per rules)
    if (itinerary.itinerario && Array.isArray(itinerary.itinerario)) {
      for (const day of itinerary.itinerario) {
        if (day.actividades && Array.isArray(day.actividades)) {
          for (const act of day.actividades) {
            delete act.link;
          }
        }
      }
    }

    // Fix activity suggestion links → Google Maps search (always shows the place)
    if (itinerary.actividades && Array.isArray(itinerary.actividades)) {
      for (const act of itinerary.actividades) {
        if (act.nombre) {
          // Google Maps search guarantees showing the actual place on a map
          act.link = `https://www.google.com/maps/search/${enc(act.nombre + ', ' + destination)}`;
        }
      }
    }

    console.log('Links validated and regenerated. Returning itinerary with sections:', Object.keys(itinerary));

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
