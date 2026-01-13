import { useState } from "react";
import { Plane, Clock, Star, ArrowRight, Car, ChevronDown, Plus, ExternalLink, Bus, Train, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FlightOption, CarRentalOption, TransportOption } from "./types";

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
  onAddFlight?: (flight: FlightOption) => void;
  onAddCar?: (car: CarRentalOption) => void;
}

const TabTransporte = ({
  flights = [],
  carRentalRecommended,
  carOptions = [],
  localTransport,
  onAddFlight,
  onAddCar
}: TabTransporteProps) => {
  const [showAllFlights, setShowAllFlights] = useState(false);
  const [showCarSection, setShowCarSection] = useState(carRentalRecommended ?? false);
  const [showAllCars, setShowAllCars] = useState(false);

  const topFlights = flights.slice(0, 3);
  const remainingFlights = flights.slice(3);

  const formatDuration = (duration?: string) => {
    return duration || '—';
  };

  const formatTime = (time?: string) => {
    return time || '—';
  };

  return (
    <div className="space-y-6">
      {/* Flights Section */}
      <div>
        <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
          <Plane className="w-5 h-5 text-primary" />
          Vuelos disponibles
        </h3>

        {topFlights.length > 0 ? (
          <div className="space-y-3">
            {topFlights.map((flight, idx) => (
              <Card key={idx} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    {/* Airline & Route */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Plane className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{flight.aerolinea}</p>
                          <p className="text-sm text-muted-foreground">
                            {flight.origen} <ArrowRight className="w-3 h-3 inline mx-1" /> {flight.destino}
                          </p>
                        </div>
                      </div>
                      
                      {/* Times */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{formatTime(flight.horaSalida)} - {formatTime(flight.horaLlegada)}</span>
                        </div>
                        {flight.duracion && (
                          <span className="text-muted-foreground">{flight.duracion}</span>
                        )}
                        <Badge variant={flight.escalas === 0 ? "default" : "secondary"} className="text-xs">
                          {flight.escalas === 0 ? 'Directo' : `${flight.escalas} escala${flight.escalas > 1 ? 's' : ''}`}
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
                    <div className="text-right">
                      {flight.precio && (
                        <p className="text-xl font-bold text-primary">
                          ${flight.precio.toLocaleString()}
                          <span className="text-xs font-normal text-muted-foreground ml-1">MXN</span>
                        </p>
                      )}
                      <Button 
                        size="sm" 
                        className="mt-2"
                        onClick={() => onAddFlight?.(flight)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">
            <Plane className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay vuelos disponibles</p>
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
                <Card key={idx} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                            <Plane className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{flight.aerolinea}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatTime(flight.horaSalida)} - {formatTime(flight.horaLlegada)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {flight.precio && (
                        <p className="font-semibold text-primary">${flight.precio.toLocaleString()}</p>
                      )}
                      <Button size="sm" variant="outline" onClick={() => onAddFlight?.(flight)}>
                        Agregar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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

        {showCarSection && carOptions.length > 0 && (
          <div className="space-y-3 mt-4">
            {(showAllCars ? carOptions : carOptions.slice(0, 2)).map((car, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{car.tipoVehiculo}</p>
                      <p className="text-sm text-muted-foreground">{car.empresa}</p>
                      {car.puntoRecogida && (
                        <p className="text-xs text-muted-foreground mt-1">📍 {car.puntoRecogida}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {car.precio && (
                        <p className="font-bold text-green-600">${car.precio.toLocaleString()}/día</p>
                      )}
                      <Button size="sm" className="mt-2" variant="outline" onClick={() => onAddCar?.(car)}>
                        Agregar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {carOptions.length > 2 && !showAllCars && (
              <Button variant="ghost" className="w-full" onClick={() => setShowAllCars(true)}>
                Ver más opciones
              </Button>
            )}
          </div>
        )}

        {showCarSection && carOptions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay opciones de alquiler disponibles
          </p>
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
