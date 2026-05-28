import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

function validateInput(body: any): { valid: true; data: { destination: string; iataCode?: string; checkIn: string; checkOut: string; adults: number; currency: string; limit: number } } | { valid: false; errors: string[] } {
  const errors: string[] = [];
  if (!body.destination || typeof body.destination !== 'string' || body.destination.trim().length < 2) errors.push("Destination is required");
  if (body.iataCode !== undefined && (typeof body.iataCode !== 'string' || body.iataCode.trim().length !== 3)) errors.push("IATA code must be 3 characters");
  if (!body.checkIn || !dateRegex.test(body.checkIn)) errors.push("Check-in date must be YYYY-MM-DD");
  if (!body.checkOut || !dateRegex.test(body.checkOut)) errors.push("Check-out date must be YYYY-MM-DD");
  if (errors.length > 0) return { valid: false, errors };
  return {
    valid: true,
    data: {
      destination: body.destination.trim(),
      iataCode: body.iataCode?.trim(),
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      adults: Math.min(10, Math.max(1, parseInt(body.adults) || 2)),
      currency: body.currency || 'USD',
      limit: Math.min(20, Math.max(1, parseInt(body.limit) || 10)),
    }
  };
}

// Hotellook API helper to get city ID
async function getCityId(destination: string, iataCode?: string): Promise<string | null> {
  try {
    // Try with IATA code first if available
    if (iataCode) {
      const url = `https://engine.hotellook.com/api/v2/lookup.json?query=${encodeURIComponent(iataCode)}&lang=es&lookFor=city&limit=1`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.results?.locations?.[0]?.id) {
          return data.results.locations[0].id;
        }
      }
    }

    // Try full destination first
    const fullResult = await lookupCity(destination);
    if (fullResult) return fullResult;

    // If destination contains comma or slash (region), try parts individually
    const separators = /[,\/]/;
    if (separators.test(destination)) {
      const parts = destination.split(separators).map(p => p.trim()).filter(Boolean);
      for (const part of parts) {
        const result = await lookupCity(part);
        if (result) {
          console.log(`Found city ID using part: "${part}" from "${destination}"`);
          return result;
        }
      }
    }

    // Try first word only (e.g., "Patagonia" from "Patagonia, Argentina/Chile")
    const firstWord = destination.split(/[\s,\/]/)[0]?.trim();
    if (firstWord && firstWord !== destination) {
      const result = await lookupCity(firstWord);
      if (result) {
        console.log(`Found city ID using first word: "${firstWord}"`);
        return result;
      }
    }

    // Try known city mappings for popular regions
    const regionToCities: Record<string, string[]> = {
      'patagonia': ['El Calafate', 'Bariloche', 'Ushuaia', 'Puerto Natales'],
      'riviera maya': ['Cancún', 'Playa del Carmen', 'Tulum'],
      'costa azul': ['Niza', 'Cannes', 'Mónaco'],
      'toscana': ['Florencia', 'Siena', 'Pisa'],
      'algarve': ['Faro', 'Lagos', 'Albufeira'],
    };
    const destLower = destination.toLowerCase();
    for (const [region, cities] of Object.entries(regionToCities)) {
      if (destLower.includes(region)) {
        for (const city of cities) {
          const result = await lookupCity(city);
          if (result) {
            console.log(`Found city ID using region mapping: "${city}" for "${destination}"`);
            return result;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting city ID:', error);
    return null;
  }
}

async function lookupCity(query: string): Promise<string | null> {
  // Try both English and Spanish lookups via Hotellook
  for (const lang of ['en', 'es']) {
    try {
      const url = `https://engine.hotellook.com/api/v2/lookup.json?query=${encodeURIComponent(query)}&lang=${lang}&lookFor=city&limit=1`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const locationId = data.results?.locations?.[0]?.id;
        if (locationId) {
          console.log(`lookupCity found "${query}" (${lang}) → ID: ${locationId}`);
          return locationId;
        }
      } else {
        console.log(`lookupCity "${query}" (${lang}) → HTTP ${response.status}`);
        await response.text(); // consume body
      }
    } catch (e) {
      console.log(`lookupCity "${query}" (${lang}) → error: ${e}`);
    }
  }
  return null;
}
async function searchHotels(
  cityId: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  currency: string,
  limit: number
) {
  const TRAVELPAYOUTS_API_TOKEN = Deno.env.get('TRAVELPAYOUTS_API_TOKEN');
  const TRAVELPAYOUTS_MARKER = Deno.env.get('TRAVELPAYOUTS_MARKER') || '504941';

  // Use the cache API for hotel pricing (doesn't require auth signature)
  const url = `https://yasen.hotellook.com/tp/public/widget_location_dump.json`;
  const params = new URLSearchParams({
    currency,
    language: 'es',
    limit: limit.toString(),
    id: cityId,
    type: 'popularity',
    check_in: checkIn,
    check_out: checkOut,
    token: TRAVELPAYOUTS_API_TOKEN || '',
  });

  const logParams = new URLSearchParams(params);
  logParams.set('token', '[REDACTED]');
  console.log('Searching hotels with URL:', `${url}?${logParams}`);

  const response = await fetch(`${url}?${params}`);
  
  if (!response.ok) {
    console.error('Hotellook API error:', response.status, await response.text());
    return [];
  }

  const data = await response.json();
  console.log('Hotellook response keys:', Object.keys(data));

  // Parse hotel data
  const hotels = (Array.isArray(data) ? data : data.hotels || []).slice(0, limit).map((hotel: any) => {
    const hotelId = hotel.id || hotel.hotelId;
    
    // Generate Google Travel search link
    const hotelName = (hotel.name || hotel.hotelName || 'Hotel').replace(/\s+/g, '+');
    const bookingLink = `https://www.google.com/travel/search?q=${hotelName}+${checkIn}+to+${checkOut}&qs=OAA&guests=${adults}&checkin=${checkIn}&checkout=${checkOut}`;

    return {
      id: hotelId?.toString(),
      nombre: hotel.name || hotel.hotelName || 'Hotel',
      imagen: hotel.photoUrls?.[0] || hotel.photos?.main || (hotelId ? `https://photo.hotellook.com/image_v2/limit/h${hotelId}_1/800/520.auto` : null),
      ubicacion: hotel.address || hotel.location?.name || '',
      calificacion: hotel.rating || hotel.stars || 0,
      tipo: hotel.propertyType || (hotel.stars ? `${hotel.stars} estrellas` : 'Hotel'),
      precioPorNoche: hotel.priceFrom || hotel.price || hotel.minPrice || 0,
      precioTotal: hotel.priceAvg || hotel.priceFrom || 0,
      etiquetas: [
        hotel.stars ? `${hotel.stars}★` : null,
        hotel.rating >= 8 ? 'Excelente' : hotel.rating >= 7 ? 'Muy bueno' : null,
        hotel.amenities?.includes('wifi') || hotel.wifi ? 'WiFi gratis' : null,
        hotel.amenities?.includes('breakfast') || hotel.breakfast ? 'Desayuno' : null,
      ].filter(Boolean),
      link: bookingLink,
      distanciaCentro: hotel.distance || hotel.distanceToCenter,
    };
  });

  return hotels;
}

// Alternative: Get popular hotels for a destination
async function getPopularHotels(destination: string, currency: string, limit: number) {
  const TRAVELPAYOUTS_API_TOKEN = Deno.env.get('TRAVELPAYOUTS_API_TOKEN');
  
  const url = `https://engine.hotellook.com/api/v2/static/hotels.json`;
  const params = new URLSearchParams({
    locationId: destination,
    token: TRAVELPAYOUTS_API_TOKEN || '',
  });

  try {
    const response = await fetch(`${url}?${params}`);
    if (response.ok) {
      const data = await response.json();
      return data.hotels?.slice(0, limit) || [];
    }
  } catch (error) {
    console.error('Error fetching popular hotels:', error);
  }
  return [];
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
    console.log('Processing hotel search request');

    const requestBody = await req.json();
    
    const validationResult = validateInput(requestBody);
    if (!validationResult.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { destination, iataCode, checkIn, checkOut, adults, currency, limit } = validationResult.data;
    
    console.log('Searching hotels:', { destination, iataCode, checkIn, checkOut, adults });

    // Get city ID
    const cityId = await getCityId(destination, iataCode);
    
    if (!cityId) {
      console.log('Could not find city ID for:', destination);
      return new Response(
        JSON.stringify({ 
          hotels: [],
          message: 'Could not find city in hotel database',
          isEstimated: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found city ID:', cityId);

    // Search for hotels
    const hotels = await searchHotels(cityId, checkIn, checkOut, adults, currency, limit);

    console.log(`Found ${hotels.length} hotels`);

    return new Response(
      JSON.stringify({ 
        hotels, 
        cityId,
        isEstimated: hotels.length === 0 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-hotels:', error);
    return new Response(
      JSON.stringify({ 
        hotels: [], 
        error: error instanceof Error ? error.message : 'Unknown error',
        isEstimated: true 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
