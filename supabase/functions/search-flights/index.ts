import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const searchFlightsSchema = z.object({
  origin: z.string().trim().min(2, "Origin must be at least 2 characters").max(100, "Origin must be less than 100 characters"),
  destination: z.string().trim().min(2, "Destination must be at least 2 characters").max(100, "Destination must be less than 100 characters"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format").optional(),
  passengers: z.number().int().min(1, "At least 1 passenger required").max(20, "Maximum 20 passengers allowed")
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Validate input
    const validationResult = searchFlightsSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validationResult.error.issues.map(issue => issue.message)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { origin, destination, startDate, endDate, passengers } = validationResult.data;
    
    const TRAVELPAYOUTS_API_TOKEN = Deno.env.get('TRAVELPAYOUTS_API_TOKEN');
    if (!TRAVELPAYOUTS_API_TOKEN) {
      throw new Error('TRAVELPAYOUTS_API_TOKEN not configured');
    }

    console.log('Searching flights:', { origin, destination, startDate, endDate, passengers });

    // Use Travelpayouts Data API to search for flights
    // Using the latest data access API endpoint
    const url = `https://api.travelpayouts.com/aviasales/v3/prices_for_dates`;
    const params = new URLSearchParams({
      origin: origin,
      destination: destination,
      departure_at: startDate,
      return_at: endDate || '',
      currency: 'USD',
      token: TRAVELPAYOUTS_API_TOKEN,
    });

    console.log('Calling Travelpayouts API:', `${url}?${params}`);
    
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Travelpayouts API error:', response.status, errorText);
      
      // Return empty results but don't fail completely
      return new Response(
        JSON.stringify({ 
          flights: [], 
          error: 'Could not fetch flight data',
          isEstimated: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Travelpayouts response:', JSON.stringify(data));

    // Parse and format the flight data
    const flights = data.data?.map((flight: any) => ({
      airline: flight.airline || 'Unknown',
      origin: flight.origin || origin,
      destination: flight.destination || destination,
      departureTime: flight.departure_at,
      arrivalTime: flight.return_at,
      price: flight.value || 0,
      link: flight.link || `https://www.aviasales.com/search/${origin}${startDate}${destination}${endDate || ''}1`,
      rawData: flight,
    })) || [];

    return new Response(
      JSON.stringify({ flights, isEstimated: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-flights:', error);
    return new Response(
      JSON.stringify({ 
        flights: [], 
        error: error instanceof Error ? error.message : 'Unknown error',
        isEstimated: true 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
