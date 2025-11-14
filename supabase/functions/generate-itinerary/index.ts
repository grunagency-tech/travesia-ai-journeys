import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, origin, destination, startDate, endDate, travelers, budget, flightData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const systemPrompt = `Eres un experto planificador de viajes que crea itinerarios detallados y personalizados. 
Tu tarea es generar un plan de viaje estructurado en formato JSON.

El JSON debe tener esta estructura exacta:
{
  "trip": {
    "title": "string - Título atractivo del viaje",
    "summary": "string - Resumen breve del viaje",
    "estimatedBudget": number - Presupuesto estimado total
  },
  "days": [
    {
      "dayNumber": number,
      "date": "YYYY-MM-DD",
      "summary": "string - Resumen del día",
      "activities": [
        {
          "timeOfDay": "morning" | "afternoon" | "evening",
          "title": "string",
          "description": "string",
          "location": "string",
          "approxCost": number
        }
      ]
    }
  ],
  "flights": [
    {
      "airline": "string",
      "origin": "string",
      "destination": "string",
      "departureTime": "ISO datetime",
      "arrivalTime": "ISO datetime",
      "price": number,
      "isEstimated": boolean
    }
  ],
  "accommodation": {
    "recommendation": "string",
    "estimatedCostPerNight": number
  }
}

IMPORTANTE: 
- Crea exactamente ${days} días de itinerario
- Sé específico con lugares reales y actividades concretas
- Los costos deben ser realistas
- Usa las opciones de vuelos reales si están disponibles
- Responde SOLO con el JSON, sin texto adicional`;

    const userPrompt = `Crea un plan de viaje con estos detalles:
- Descripción del usuario: ${description}
- Origen: ${origin}
- Destino: ${destination}
- Fechas: ${startDate} a ${endDate} (${days} días)
- Número de viajeros: ${travelers}
- Presupuesto: ${budget ? `$${budget}` : 'No especificado'}
${flightData ? `\n- Datos de vuelos disponibles:\n${JSON.stringify(flightData, null, 2)}` : ''}

Genera el itinerario completo en JSON.`;

    console.log('Calling Lovable AI...');
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
    
    console.log('AI Response:', content);

    // Parse the JSON response
    let itinerary;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      itinerary = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      throw new Error('Invalid JSON response from AI');
    }

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
