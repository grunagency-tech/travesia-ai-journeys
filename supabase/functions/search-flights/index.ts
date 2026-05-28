import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

function validateFlightInput(body: any): { valid: true; data: { origin: string; destination: string; startDate: string; endDate?: string; passengers: number } } | { valid: false; errors: string[] } {
  const errors: string[] = [];
  const origin = typeof body.origin === 'string' ? body.origin.trim() : '';
  if (origin.length < 2 || origin.length > 100) errors.push("Origin must be 2-100 characters");
  const destination = typeof body.destination === 'string' ? body.destination.trim() : '';
  if (destination.length < 2 || destination.length > 100) errors.push("Destination must be 2-100 characters");
  if (!body.startDate || !dateRegex.test(body.startDate)) errors.push("Start date must be YYYY-MM-DD");
  if (body.endDate && !dateRegex.test(body.endDate)) errors.push("End date must be YYYY-MM-DD");
  const passengers = parseInt(body.passengers) || 0;
  if (passengers < 1 || passengers > 20) errors.push("Passengers must be 1-20");
  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data: { origin, destination, startDate: body.startDate, endDate: body.endDate, passengers } };
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
    console.log('Processing flight search request');

    const requestBody = await req.json();
    
    const validationResult = validateFlightInput(requestBody);
    if (!validationResult.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { origin, destination, startDate, endDate, passengers } = validationResult.data;
    
    const TRAVELPAYOUTS_API_TOKEN = Deno.env.get('TRAVELPAYOUTS_API_TOKEN');
    if (!TRAVELPAYOUTS_API_TOKEN) {
      throw new Error('TRAVELPAYOUTS_API_TOKEN not configured');
    }

    console.log('Searching flights:', { origin, destination, startDate, endDate, passengers });

    const url = `https://api.travelpayouts.com/aviasales/v3/prices_for_dates`;
    const params = new URLSearchParams({
      origin,
      destination,
      departure_at: startDate,
      return_at: endDate || '',
      currency: 'USD',
      token: TRAVELPAYOUTS_API_TOKEN,
    });

    const logParams = new URLSearchParams(params);
    logParams.set('token', '[REDACTED]');
    console.log('Calling Travelpayouts API:', `${url}?${logParams}`);
    
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Travelpayouts API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ flights: [], error: 'Could not fetch flight data', isEstimated: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Travelpayouts response:', JSON.stringify(data));

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
      JSON.stringify({ flights: [], error: error instanceof Error ? error.message : 'Unknown error', isEstimated: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
