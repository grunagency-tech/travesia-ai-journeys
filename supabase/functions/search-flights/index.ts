import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { origin, destination, startDate, endDate, passengers } = await req.json();
    
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
