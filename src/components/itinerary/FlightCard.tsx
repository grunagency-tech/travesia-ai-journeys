import { Plane, Clock, ArrowRight, ExternalLink, Plus, Star, DollarSign, Zap, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlightOption } from "./types";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/itineraryTranslations";

interface FlightCardProps {
  flight: FlightOption;
  onAddFlight?: (flight: FlightOption) => void;
  showCategory?: boolean;
  tripStartDate?: string;
  tripEndDate?: string;
}

// Airline logo URL using IATA code (priority) or fallback to clearbit
const getAirlineLogo = (airline: string, iataCode?: string): string => {
  // If IATA code is available, use Kiwi's reliable airline logo API
  if (iataCode) {
    return `https://images.kiwi.com/airlines/64/${iataCode}.png`;
  }

  // Fallback: IATA codes for common airlines
  const airlineIataCodes: Record<string, string> = {
    'american': 'AA',
    'delta': 'DL',
    'united': 'UA',
    'iberia': 'IB',
    'air france': 'AF',
    'lufthansa': 'LH',
    'british airways': 'BA',
    'emirates': 'EK',
    'qatar': 'QR',
    'aeromexico': 'AM',
    'latam': 'LA',
    'avianca': 'AV',
    'copa': 'CM',
    'jetsmart': 'JA',
    'volaris': 'Y4',
    'viva aerobus': 'VB',
    'spirit': 'NK',
    'frontier': 'F9',
    'southwest': 'WN',
    'ryanair': 'FR',
    'easyjet': 'U2',
    'klm': 'KL',
    'swiss': 'LX',
    'turkish': 'TK',
    'air canada': 'AC',
    'tap': 'TP',
    'vueling': 'VY',
    'aer lingus': 'EI',
    'jetblue': 'B6',
    'alaska': 'AS',
    'interjet': '4O',
    'gol': 'G3',
    'azul': 'AD',
  };

  const normalizedAirline = airline.toLowerCase();
  
  for (const [key, code] of Object.entries(airlineIataCodes)) {
    if (normalizedAirline.includes(key)) {
      return `https://images.kiwi.com/airlines/64/${code}.png`;
    }
  }

  // Last resort: try clearbit
  const airlineLogos: Record<string, string> = {
    'latam': 'https://logo.clearbit.com/latam.com',
    'avianca': 'https://logo.clearbit.com/avianca.com',
    'american': 'https://logo.clearbit.com/aa.com',
    'delta': 'https://logo.clearbit.com/delta.com',
    'united': 'https://logo.clearbit.com/united.com',
    'aeromexico': 'https://logo.clearbit.com/aeromexico.com',
  };

  for (const [key, url] of Object.entries(airlineLogos)) {
    if (normalizedAirline.includes(key)) {
      return url;
    }
  }

  return '';
};

const getCategoryInfo = (category?: string, lang: string = 'ES'): { icon: React.ReactNode; label: string; color: string } => {
  switch (category) {
    case 'cheapest':
      return { icon: <DollarSign className="w-3.5 h-3.5" />, label: t('masBarato', lang as any), color: 'bg-green-100 text-green-700 border-green-200' };
    case 'best-rated':
      return { icon: <Award className="w-3.5 h-3.5" />, label: t('mejorCalificado', lang as any), color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    case 'fastest':
      return { icon: <Zap className="w-3.5 h-3.5" />, label: t('masRapido', lang as any), color: 'bg-blue-100 text-blue-700 border-blue-200' };
    default:
      return { icon: null, label: '', color: '' };
  }
};

const FlightCard = ({ flight, onAddFlight, showCategory = true, tripStartDate, tripEndDate }: FlightCardProps) => {
  const { language } = useLanguage();
  const logoUrl = flight.logoUrl || getAirlineLogo(flight.aerolinea, flight.codigoAerolinea);
  const categoryInfo = getCategoryInfo(flight.categoria, language);

  const formatTime = (time?: string) => time || '—';

  // Use the link from the API if available, otherwise generate Google Flights search
  const getFlightLink = (flight: FlightOption): string => {
    if (flight.link) return flight.link;
    const origin = flight.origen || '';
    const dest = flight.destino || '';
    const departDate = tripStartDate || (flight.fechaSalida ? flight.fechaSalida.split('T')[0] : '');
    const returnDate = tripEndDate || (flight.fechaLlegada ? flight.fechaLlegada.split('T')[0] : '');
    return `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(origin)}+to+${encodeURIComponent(dest)}+on+${departDate}${returnDate ? '+return+' + returnDate : ''}&curr=USD&hl=es`;
  };

  const flightLink = getFlightLink(flight);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-l-4" 
          style={{ borderLeftColor: flight.categoria === 'cheapest' ? '#22c55e' : 
                                     flight.categoria === 'best-rated' ? '#eab308' : 
                                     flight.categoria === 'fastest' ? '#3b82f6' : 'transparent' }}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Airline Logo & Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white border flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={flight.aerolinea}
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div class="w-5 h-5 text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg></div>';
                    }}
                  />
                ) : (
                  <Plane className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm sm:text-base">{flight.aerolinea}</p>
                  {showCategory && categoryInfo.label && (
                    <Badge variant="outline" className={`text-xs ${categoryInfo.color}`}>
                      {categoryInfo.icon}
                      <span className="ml-1">{categoryInfo.label}</span>
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {flight.origen} <ArrowRight className="w-3 h-3 inline mx-1" /> {flight.destino}
                </p>
              </div>
              {/* Rating - show inline on mobile */}
              {flight.calificacion && (
                <div className="flex items-center gap-1 text-yellow-500 sm:hidden flex-shrink-0">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">{flight.calificacion}</span>
                </div>
              )}
            </div>
            
            {/* Times */}
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm flex-wrap">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                <span>{formatTime(flight.horaSalida)} - {formatTime(flight.horaLlegada)}</span>
              </div>
              {flight.duracion && (
                <span className="text-muted-foreground">{flight.duracion}</span>
              )}
              <Badge variant={flight.escalas === 0 ? "default" : "secondary"} className="text-xs">
                {flight.escalas === 0 ? t('directo', language) : `${flight.escalas} ${flight.escalas > 1 ? t('escalas', language) : t('escala', language)}`}
              </Badge>
            </div>
          </div>

          {/* Rating - desktop only */}
          {flight.calificacion && (
            <div className="hidden sm:flex items-center gap-1 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">{flight.calificacion}</span>
            </div>
          )}

          {/* Price & Action */}
          <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right sm:min-w-[140px] border-t sm:border-t-0 pt-2 sm:pt-0">
            {flight.precio && (
              <p className="text-lg sm:text-xl font-bold text-primary">
                ${flight.precio.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground ml-1">USD</span>
              </p>
            )}
            <div className="flex gap-1.5 sm:flex-col sm:mt-2">
              <Button 
                size="sm"
                variant="default"
                className="text-xs sm:text-sm"
                onClick={() => window.open(flightLink, '_blank')}
              >
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                {t('reservar', language)}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs sm:text-sm"
                onClick={() => onAddFlight?.(flight)}
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                {t('agregar', language)}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlightCard;
