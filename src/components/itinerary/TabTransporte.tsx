import { useState, useMemo } from "react";
import { Plane, Car, ChevronDown, Bus, Train, CreditCard, AlertCircle, ExternalLink, DollarSign, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FlightOption, CarRentalOption, TransportOption } from "./types";
import FlightCard from "./FlightCard";

interface LocalTransportData {
  descripcion?: string;
  opciones?: TransportOption[];
  consejos?: string[];
  tarjetasTransporte?: string;
}

interface TabTransporteProps {
  flights?: FlightOption[];
  carRentalRecommended?: boolean;
  carOptions?: CarRentalOption[];
  localTransport?: string | LocalTransportData;
  destination?: string; // For generating fallback car rental links
  startDate?: string;
  endDate?: string;
  onAddFlight?: (flight: FlightOption) => void;
  onAddCar?: (car: CarRentalOption) => void;
}

// Car rental company logos
const getCarRentalLogo = (empresa: string): string => {
  const carRentalLogos: Record<string, string> = {
    'hertz': 'https://logo.clearbit.com/hertz.com',
    'enterprise': 'https://logo.clearbit.com/enterprise.com',
    'avis': 'https://logo.clearbit.com/avis.com',
    'budget': 'https://logo.clearbit.com/budget.com',
    'sixt': 'https://logo.clearbit.com/sixt.com',
    'europcar': 'https://logo.clearbit.com/europcar.com',
    'national': 'https://logo.clearbit.com/nationalcar.com',
    'alamo': 'https://logo.clearbit.com/alamo.com',
    'dollar': 'https://logo.clearbit.com/dollar.com',
    'thrifty': 'https://logo.clearbit.com/thrifty.com',
    'ace': 'https://logo.clearbit.com/acerentacar.com',
    'payless': 'https://logo.clearbit.com/paylesscar.com',
    'fox': 'https://logo.clearbit.com/foxrentacar.com',
    'localiza': 'https://logo.clearbit.com/localiza.com',
    'movida': 'https://logo.clearbit.com/movida.com.br',
    'unidas': 'https://logo.clearbit.com/unidas.com.br',
  };

  const normalizedEmpresa = empresa.toLowerCase();
  
  for (const [key, url] of Object.entries(carRentalLogos)) {
    if (normalizedEmpresa.includes(key)) {
      return url;
    }
  }

  return '';
};

// Generate fallback car rental options with real links
const generateDefaultCarOptions = (destination?: string, startDate?: string, endDate?: string): CarRentalOption[] => {
  const destEncoded = encodeURIComponent(destination || 'aeropuerto');
  const pickupDate = startDate || '';
  const dropoffDate = endDate || '';
  
  // Build Kayak link
  const kayakLink = `https://www.kayak.com/cars/${destEncoded}/${pickupDate}/${dropoffDate}`;
  
  return [
    {
      id: 'default-economy',
      empresa: 'Hertz',
      tipoVehiculo: 'Económico (Ej: Toyota Yaris)',
      precio: 25,
      puntoRecogida: 'Aeropuerto principal',
      link: kayakLink,
    },
    {
      id: 'default-compact',
      empresa: 'Enterprise',
      tipoVehiculo: 'Compacto (Ej: VW Golf)',
      precio: 35,
      puntoRecogida: 'Aeropuerto principal',
      link: kayakLink,
    },
    {
      id: 'default-suv',
      empresa: 'Avis',
      tipoVehiculo: 'SUV (Ej: Toyota RAV4)',
      precio: 55,
      puntoRecogida: 'Aeropuerto principal',
      link: kayakLink,
    },
  ];
};

// Categorize flights: cheapest, best-rated, fastest
const categorizeFlights = (flights: FlightOption[]): FlightOption[] => {
  if (!flights || flights.length === 0) return [];
  
  const categorized: FlightOption[] = [];
  const usedIds = new Set<string>();
  
  // Helper to generate unique id for flight
  const getFlightId = (f: FlightOption) => 
    f.id || `${f.aerolinea}-${f.precio}-${f.escalas}`;
  
  // 1. Find the cheapest flight
  const sortedByPrice = [...flights].sort((a, b) => (a.precio || 999999) - (b.precio || 999999));
  if (sortedByPrice.length > 0) {
    const cheapest = { ...sortedByPrice[0], categoria: 'cheapest' as const };
    categorized.push(cheapest);
    usedIds.add(getFlightId(cheapest));
  }
  
  // 2. Find the fastest flight (least stops, or direct flight)
  const sortedBySpeed = [...flights].sort((a, b) => {
    // First by number of stops
    const stopsA = a.escalas ?? 999;
    const stopsB = b.escalas ?? 999;
    if (stopsA !== stopsB) return stopsA - stopsB;
    
    // Then by duration if available
    const durationToMinutes = (dur?: string): number => {
      if (!dur) return 9999;
      const match = dur.match(/(\d+)h\s*(\d+)?m?/);
      if (match) {
        return parseInt(match[1]) * 60 + (parseInt(match[2]) || 0);
      }
      return 9999;
    };
    return durationToMinutes(a.duracion) - durationToMinutes(b.duracion);
  });
  
  // Find a fastest that's not already used
  for (const flight of sortedBySpeed) {
    if (!usedIds.has(getFlightId(flight))) {
      const fastest = { ...flight, categoria: 'fastest' as const };
      categorized.push(fastest);
      usedIds.add(getFlightId(fastest));
      break;
    }
  }
  
  // 3. Find the best-rated flight
  const sortedByRating = [...flights].sort((a, b) => {
    // Higher rating is better
    const ratingA = a.calificacion ?? 0;
    const ratingB = b.calificacion ?? 0;
    if (ratingB !== ratingA) return ratingB - ratingA;
    
    // If no ratings, use airline reputation (basic heuristic)
    const premiumAirlines = ['iberia', 'emirates', 'qatar', 'lufthansa', 'air france', 'british airways', 'delta', 'united', 'american', 'klm', 'swiss'];
    const isAPremium = premiumAirlines.some(pa => a.aerolinea.toLowerCase().includes(pa)) ? 1 : 0;
    const isBPremium = premiumAirlines.some(pa => b.aerolinea.toLowerCase().includes(pa)) ? 1 : 0;
    return isBPremium - isAPremium;
  });
  
  // Find a best-rated that's not already used
  for (const flight of sortedByRating) {
    if (!usedIds.has(getFlightId(flight))) {
      const bestRated = { ...flight, categoria: 'best-rated' as const };
      categorized.push(bestRated);
      usedIds.add(getFlightId(bestRated));
      break;
    }
  }
  
  // If we still need more flights to have 3, add more by price
  if (categorized.length < 3) {
    for (const flight of sortedByPrice) {
      if (!usedIds.has(getFlightId(flight))) {
        // Assign a category based on what's missing
        const hasCategory = (cat: string) => categorized.some(f => f.categoria === cat);
        let category: 'cheapest' | 'best-rated' | 'fastest' = 'cheapest';
        
        if (!hasCategory('fastest')) category = 'fastest';
        else if (!hasCategory('best-rated')) category = 'best-rated';
        
        const newFlight = { ...flight, categoria: category };
        categorized.push(newFlight);
        usedIds.add(getFlightId(newFlight));
        
        if (categorized.length >= 3) break;
      }
    }
  }
  
  // Sort by category order: cheapest, best-rated, fastest
  const categoryOrder = { 'cheapest': 1, 'best-rated': 2, 'fastest': 3 };
  return categorized.sort((a, b) => 
    (categoryOrder[a.categoria || 'cheapest'] || 4) - (categoryOrder[b.categoria || 'cheapest'] || 4)
  );
};

const TabTransporte = ({
  flights = [],
  carRentalRecommended,
  carOptions = [],
  localTransport,
  destination,
  startDate,
  endDate,
  onAddFlight,
  onAddCar
}: TabTransporteProps) => {
  const [showAllFlights, setShowAllFlights] = useState(false);
  const [showCarSection, setShowCarSection] = useState(carRentalRecommended ?? false);
  const [showAllCars, setShowAllCars] = useState(false);

  // Use provided car options or generate defaults
  const effectiveCarOptions = useMemo(() => {
    if (carOptions && carOptions.length > 0) {
      return carOptions;
    }
    return generateDefaultCarOptions(destination, startDate, endDate);
  }, [carOptions, destination, startDate, endDate]);

  // Get categorized top 3 flights
  const categorizedFlights = useMemo(() => categorizeFlights(flights), [flights]);
  
  // Get remaining flights (those not in top 3)
  const remainingFlights = useMemo(() => {
    const topIds = new Set(categorizedFlights.map(f => f.id || `${f.aerolinea}-${f.precio}-${f.escalas}`));
    return flights.filter(f => !topIds.has(f.id || `${f.aerolinea}-${f.precio}-${f.escalas}`));
  }, [flights, categorizedFlights]);

  return (
    <div className="space-y-6">
      {/* Flights Section */}
      <div>
        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
          <Plane className="w-5 h-5 text-primary" />
          Los mejores vuelos disponibles
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Seleccionamos las mejores opciones para tu viaje
        </p>

        {/* Category Legend */}
        {categorizedFlights.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
              <DollarSign className="w-3 h-3 mr-1" />
              Más barato
            </Badge>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">
              <Award className="w-3 h-3 mr-1" />
              Mejor calificado
            </Badge>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
              <Zap className="w-3 h-3 mr-1" />
              Más rápido
            </Badge>
          </div>
        )}

        {categorizedFlights.length > 0 ? (
          <div className="space-y-3">
            {categorizedFlights.map((flight, idx) => (
              <FlightCard 
                key={flight.id || idx} 
                flight={flight} 
                onAddFlight={onAddFlight}
                showCategory={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">
            <Plane className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay vuelos disponibles</p>
            <p className="text-sm mt-1">Intenta con otras fechas o destinos</p>
          </div>
        )}

        {/* Show More Flights */}
        {remainingFlights.length > 0 && (
          <Collapsible open={showAllFlights} onOpenChange={setShowAllFlights}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full mt-3">
                <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showAllFlights ? 'rotate-180' : ''}`} />
                Ver {remainingFlights.length} opciones más
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              {remainingFlights.map((flight, idx) => (
                <FlightCard 
                  key={flight.id || idx} 
                  flight={flight} 
                  onAddFlight={onAddFlight}
                  showCategory={false}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* Car Rental Section */}
      <div className="bg-muted/30 rounded-xl p-5 border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Car className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">¿Alquilar coche en este destino?</h4>
            <p className="text-sm text-muted-foreground">
              {carRentalRecommended 
                ? 'Recomendado para este destino'
                : 'Puede ser útil para explorar los alrededores'}
            </p>
          </div>
          
          {!showCarSection && (
            <Button variant="outline" onClick={() => setShowCarSection(true)}>
              Ver opciones
            </Button>
          )}
        </div>

        {showCarSection && (
          <div className="space-y-3 mt-4">
            {/* Info badge for default options */}
            {carOptions.length === 0 && (
              <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg p-2 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                <span>Precios estimados. Haz clic en "Reservar" para ver disponibilidad real.</span>
              </div>
            )}
            
            {(showAllCars ? effectiveCarOptions : effectiveCarOptions.slice(0, 3)).map((car, idx) => {
              const carLogo = getCarRentalLogo(car.empresa);
              return (
              <Card key={car.id || idx} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center overflow-hidden shadow-sm">
                        {carLogo ? (
                          <img 
                            src={carLogo} 
                            alt={car.empresa}
                            className="w-10 h-10 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>';
                            }}
                          />
                        ) : (
                          <Car className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{car.tipoVehiculo}</p>
                        <p className="text-sm text-muted-foreground">{car.empresa}</p>
                        {car.puntoRecogida && (
                          <p className="text-xs text-muted-foreground mt-1">📍 {car.puntoRecogida}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right min-w-[130px]">
                      {car.precio && (
                        <p className="font-bold text-green-600">
                          ${car.precio.toLocaleString()}
                          <span className="text-xs font-normal text-muted-foreground">/día</span>
                        </p>
                      )}
                      <div className="flex flex-col gap-1.5 mt-2">
                        <Button 
                          size="sm" 
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => window.open(car.link || `https://www.kayak.com/cars/${encodeURIComponent(destination || '')}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Reservar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onAddCar?.(car)}>
                          Agregar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
            
            {effectiveCarOptions.length > 3 && !showAllCars && (
              <Button variant="ghost" className="w-full" onClick={() => setShowAllCars(true)}>
                Ver más opciones
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Local Transport Info */}
      {localTransport && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Bus className="w-5 h-5 text-blue-600" />
            Transporte local
          </h3>

          {typeof localTransport === 'string' ? (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-sm text-blue-700">{localTransport}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Description */}
              {localTransport.descripcion && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm text-blue-700">{localTransport.descripcion}</p>
                </div>
              )}

              {/* Transport Options */}
              {localTransport.opciones && localTransport.opciones.length > 0 && (
                <div className="grid gap-3 md:grid-cols-2">
                  {localTransport.opciones.map((option, idx) => (
                    <Card key={idx} className={option.recomendado ? 'border-green-200 bg-green-50/50' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            option.tipo.toLowerCase().includes('metro') ? 'bg-blue-100' :
                            option.tipo.toLowerCase().includes('bus') ? 'bg-green-100' :
                            option.tipo.toLowerCase().includes('taxi') || option.tipo.toLowerCase().includes('uber') ? 'bg-yellow-100' :
                            option.tipo.toLowerCase().includes('tren') ? 'bg-purple-100' : 'bg-muted'
                          }`}>
                            {option.tipo.toLowerCase().includes('metro') ? <Train className="w-5 h-5 text-blue-600" /> :
                             option.tipo.toLowerCase().includes('tren') ? <Train className="w-5 h-5 text-purple-600" /> :
                             <Bus className="w-5 h-5 text-green-600" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{option.tipo}</h4>
                              {option.recomendado && (
                                <Badge className="bg-green-100 text-green-700 text-xs">Recomendado</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{option.descripcion}</p>
                            {option.costoAproximado && (
                              <p className="text-sm font-medium text-primary mt-2">
                                💰 {option.costoAproximado}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Transport Cards */}
              {localTransport.tarjetasTransporte && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                  <h4 className="font-medium text-purple-900 flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4" />
                    Tarjetas de transporte
                  </h4>
                  <p className="text-sm text-purple-700">{localTransport.tarjetasTransporte}</p>
                </div>
              )}

              {/* Tips */}
              {localTransport.consejos && localTransport.consejos.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <h4 className="font-medium text-amber-900 flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Consejos de transporte
                  </h4>
                  <ul className="space-y-1.5">
                    {localTransport.consejos.map((consejo, idx) => (
                      <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                        <span className="text-amber-500">•</span>
                        {consejo}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TabTransporte;
