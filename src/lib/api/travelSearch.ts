import { supabase } from '@/integrations/supabase/client';
import type { FlightOption, AccommodationOption } from '@/components/itinerary/types';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  startDate: string;
  endDate?: string;
  passengers: number;
}

export interface HotelSearchParams {
  destination: string;
  iataCode?: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  currency?: string;
  limit?: number;
}

export interface FlightSearchResult {
  flights: FlightOption[];
  isEstimated: boolean;
  error?: string;
}

export interface HotelSearchResult {
  hotels: AccommodationOption[];
  cityId?: string;
  isEstimated: boolean;
  error?: string;
}

export const travelSearchApi = {
  async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
    try {
      const { data, error } = await supabase.functions.invoke('search-flights', {
        body: params,
      });

      if (error) {
        console.error('Flight search error:', error);
        return { flights: [], isEstimated: true, error: error.message };
      }

      // Map API response to FlightOption format
      const flights: FlightOption[] = (data.flights || []).map((f: any) => ({
        id: f.id || `flight-${Date.now()}-${Math.random()}`,
        aerolinea: f.airline || 'Aerolínea',
        origen: f.origin || params.origin,
        destino: f.destination || params.destination,
        fechaSalida: f.departureTime,
        fechaLlegada: f.arrivalTime,
        precio: f.price,
        link: f.link,
        escalas: f.stops,
        duracion: f.duration,
      }));

      return { flights, isEstimated: data.isEstimated || false };
    } catch (error) {
      console.error('Flight search failed:', error);
      return { 
        flights: [], 
        isEstimated: true, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  async searchHotels(params: HotelSearchParams): Promise<HotelSearchResult> {
    try {
      const { data, error } = await supabase.functions.invoke('search-hotels', {
        body: {
          destination: params.destination,
          iataCode: params.iataCode,
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          adults: params.adults || 2,
          currency: params.currency || 'USD',
          limit: params.limit || 10,
        },
      });

      if (error) {
        console.error('Hotel search error:', error);
        return { hotels: [], isEstimated: true, error: error.message };
      }

      return { 
        hotels: data.hotels || [], 
        cityId: data.cityId,
        isEstimated: data.isEstimated || false 
      };
    } catch (error) {
      console.error('Hotel search failed:', error);
      return { 
        hotels: [], 
        isEstimated: true, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },
};

export default travelSearchApi;
