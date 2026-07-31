import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const searchHotelsSchema = z.object({
  destination: z.string().trim().min(2, "Destination is required"),
  iataCode: z.string().trim().length(3, "IATA code must be 3 characters").optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-in date must be in YYYY-MM-DD format"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-out date must be in YYYY-MM-DD format"),
  adults: z.number().int().min(1).max(10).default(2),
  currency: z.string().default('USD'),
  limit: z.number().int().min(1).max(20).default(10),
});

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

    // Fallback to destination name search
    const url = `https://engine.hotellook.com/api/v2/lookup.json?query=${encodeURIComponent(destination)}&lang=es&lookFor=city&limit=1`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.results?.locations?.[0]?.id) {
        return data.results.locations[0].id;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting city ID:', error);
    return null;
  }
}

// Get hotel details with pricing from Hotellook
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

  console.log('Searching hotels with URL:', `${url}?${params}`);

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
    
    // Generate booking link
    const bookingLink = `https://search.hotellook.com/hotels?destination=${cityId}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&currency=${currency}&hotelId=${hotelId}&marker=${TRAVELPAYOUTS_MARKER}`;

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing hotel search request');

    const requestBody = await req.json();
    
    // Validate input
    const validationResult = searchHotelsSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validationResult.error.issues.map(issue => issue.message)
        }),
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
