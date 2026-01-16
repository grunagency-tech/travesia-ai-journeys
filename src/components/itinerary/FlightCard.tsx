import { Plane, Clock, ArrowRight, ExternalLink, Plus, Star, DollarSign, Zap, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlightOption } from "./types";

interface FlightCardProps {
  flight: FlightOption;
  onAddFlight?: (flight: FlightOption) => void;
  showCategory?: boolean;
}

// Airline logo URL using a public API
const getAirlineLogo = (airline: string, iataCode?: string): string => {
  // Try to use logo.clearbit.com for airlines
  const airlineLogos: Record<string, string> = {
    'latam': 'https://logo.clearbit.com/latam.com',
    'avianca': 'https://logo.clearbit.com/avianca.com',
    'american': 'https://logo.clearbit.com/aa.com',
    'delta': 'https://logo.clearbit.com/delta.com',
    'united': 'https://logo.clearbit.com/united.com',
    'iberia': 'https://logo.clearbit.com/iberia.com',
    'air france': 'https://logo.clearbit.com/airfrance.com',
    'lufthansa': 'https://logo.clearbit.com/lufthansa.com',
    'british airways': 'https://logo.clearbit.com/britishairways.com',
    'emirates': 'https://logo.clearbit.com/emirates.com',
    'qatar': 'https://logo.clearbit.com/qatarairways.com',
    'copa': 'https://logo.clearbit.com/copaair.com',
    'aeromexico': 'https://logo.clearbit.com/aeromexico.com',
    'jetsmart': 'https://logo.clearbit.com/jetsmart.com',
    'sky airline': 'https://logo.clearbit.com/skyairline.com',
    'viva air': 'https://logo.clearbit.com/vivaair.com',
    'ryanair': 'https://logo.clearbit.com/ryanair.com',
    'easyjet': 'https://logo.clearbit.com/easyjet.com',
    'southwest': 'https://logo.clearbit.com/southwest.com',
    'spirit': 'https://logo.clearbit.com/spirit.com',
    'frontier': 'https://logo.clearbit.com/flyfrontier.com',
    'klm': 'https://logo.clearbit.com/klm.com',
    'swiss': 'https://logo.clearbit.com/swiss.com',
    'turkish': 'https://logo.clearbit.com/turkishairlines.com',
    'air canada': 'https://logo.clearbit.com/aircanada.com',
    'aer lingus': 'https://logo.clearbit.com/aerlingus.com',
    'tap': 'https://logo.clearbit.com/flytap.com',
    'vueling': 'https://logo.clearbit.com/vueling.com',
  };

  const normalizedAirline = airline.toLowerCase();
  
  for (const [key, url] of Object.entries(airlineLogos)) {
    if (normalizedAirline.includes(key)) {
      return url;
    }
  }

  // If IATA code is available, try using it
  if (iataCode) {
    return `https://images.kiwi.com/airlines/64/${iataCode}.png`;
  }

  return '';
};

const getCategoryInfo = (category?: string): { icon: React.ReactNode; label: string; color: string } => {
  switch (category) {
    case 'cheapest':
      return {
        icon: <DollarSign className="w-3.5 h-3.5" />,
        label: 'Más barato',
        color: 'bg-green-100 text-green-700 border-green-200'
      };
    case 'best-rated':
      return {
        icon: <Award className="w-3.5 h-3.5" />,
        label: 'Mejor calificado',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200'
      };
    case 'fastest':
      return {
        icon: <Zap className="w-3.5 h-3.5" />,
        label: 'Más rápido',
        color: 'bg-blue-100 text-blue-700 border-blue-200'
      };
    default:
      return {
        icon: null,
        label: '',
        color: ''
      };
  }
};

const FlightCard = ({ flight, onAddFlight, showCategory = true }: FlightCardProps) => {
  const logoUrl = flight.logoUrl || getAirlineLogo(flight.aerolinea, flight.codigoAerolinea);
  const categoryInfo = getCategoryInfo(flight.categoria);

  const formatTime = (time?: string) => time || '—';

  // Generate a fallback link if none is provided
  const getFlightLink = (flight: FlightOption): string => {
    if (flight.link) return flight.link;
    
    // Generate Google Flights link as fallback
    const origin = flight.origen || '';
    const destination = flight.destino || '';
    const date = flight.fechaSalida ? flight.fechaSalida.split('T')[0] : '';
    
    return `https://www.google.com/travel/flights?q=vuelos%20${origin}%20a%20${destination}%20${date}`;
  };

  const flightLink = getFlightLink(flight);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-l-4" 
          style={{ borderLeftColor: flight.categoria === 'cheapest' ? '#22c55e' : 
                                     flight.categoria === 'best-rated' ? '#eab308' : 
                                     flight.categoria === 'fastest' ? '#3b82f6' : 'transparent' }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Airline Logo & Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center overflow-hidden shadow-sm">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={flight.aerolinea}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      // Fallback to icon if image fails
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div class="w-5 h-5 text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg></div>';
                    }}
                  />
                ) : (
                  <Plane className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{flight.aerolinea}</p>
                  {showCategory && categoryInfo.label && (
                    <Badge variant="outline" className={`text-xs ${categoryInfo.color}`}>
                      {categoryInfo.icon}
                      <span className="ml-1">{categoryInfo.label}</span>
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {flight.origen} <ArrowRight className="w-3 h-3 inline mx-1" /> {flight.destino}
                </p>
              </div>
            </div>
            
            {/* Times */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{formatTime(flight.horaSalida)} - {formatTime(flight.horaLlegada)}</span>
              </div>
              {flight.duracion && (
                <span className="text-muted-foreground">{flight.duracion}</span>
              )}
              <Badge variant={flight.escalas === 0 ? "default" : "secondary"} className="text-xs">
                {flight.escalas === 0 ? 'Directo' : `${flight.escalas} escala${flight.escalas !== undefined && flight.escalas > 1 ? 's' : ''}`}
              </Badge>
            </div>
          </div>

          {/* Rating */}
          {flight.calificacion && (
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">{flight.calificacion}</span>
            </div>
          )}

          {/* Price & Action */}
          <div className="text-right min-w-[140px]">
            {flight.precio && (
              <p className="text-xl font-bold text-primary">
                ${flight.precio.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground ml-1">USD</span>
              </p>
            )}
            <div className="flex flex-col gap-1.5 mt-2">
              <Button 
                size="sm"
                variant="default"
                onClick={() => window.open(flightLink, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Reservar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onAddFlight?.(flight)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlightCard;
