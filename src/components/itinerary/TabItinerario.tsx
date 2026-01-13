import { useState } from "react";
import { 
  Calendar, ChevronDown, ChevronUp, Eye, Plus, Plane, Hotel, 
  Car, MapPin, Clock, Sun, Cloud, CloudRain, Thermometer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ItineraryDay, FlightOption, AccommodationOption, CarRentalOption, ActivityOption } from "./types";

interface TabItinerarioProps {
  days: ItineraryDay[];
  onAddFlight?: () => void;
  onAddAccommodation?: () => void;
  onAddCar?: () => void;
  onAddActivity?: () => void;
}

const formatFullDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return dateStr;
  }
};

const getTimeLabel = (hora?: string): string => {
  if (!hora) return '';
  const labels: Record<string, string> = {
    morning: 'Mañana',
    afternoon: 'Tarde',
    evening: 'Noche',
  };
  return labels[hora] || hora;
};

const getWeatherIcon = (clima?: string) => {
  if (!clima) return <Sun className="w-4 h-4 text-yellow-500" />;
  const lower = clima.toLowerCase();
  if (lower.includes('lluvia') || lower.includes('rain')) return <CloudRain className="w-4 h-4 text-blue-500" />;
  if (lower.includes('nublado') || lower.includes('cloud')) return <Cloud className="w-4 h-4 text-gray-500" />;
  return <Sun className="w-4 h-4 text-yellow-500" />;
};

const TabItinerario = ({ 
  days,
  onAddFlight,
  onAddAccommodation,
  onAddCar,
  onAddActivity
}: TabItinerarioProps) => {
  const [openDays, setOpenDays] = useState<number[]>([1]);
  const [showQuickView, setShowQuickView] = useState(false);

  const toggleDay = (dayNum: number) => {
    setOpenDays(prev => 
      prev.includes(dayNum) 
        ? prev.filter(d => d !== dayNum)
        : [...prev, dayNum]
    );
  };

  // Quick View Table Data
  const categories = ['Vuelos', 'Alojamiento', 'Actividades', 'Coche'];
  
  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full border-primary text-primary hover:bg-primary/5"
            onClick={() => setShowQuickView(true)}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Vista rápida
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full"
            onClick={onAddFlight}
          >
            <Plane className="w-4 h-4 mr-1.5" />
            Agregar vuelo
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full"
            onClick={onAddAccommodation}
          >
            <Hotel className="w-4 h-4 mr-1.5" />
            Agregar alojamiento
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full"
            onClick={onAddCar}
          >
            <Car className="w-4 h-4 mr-1.5" />
            Agregar coche
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full"
            onClick={onAddActivity}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Agregar actividad
          </Button>
        </div>
      </div>

      {/* Days Accordion */}
      {days && days.length > 0 ? (
        <div className="space-y-3">
          {days.map((day) => (
            <Collapsible
              key={day.dia}
              open={openDays.includes(day.dia)}
              onOpenChange={() => toggleDay(day.dia)}
            >
              <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Day Number */}
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                        <span className="text-xs text-primary font-medium uppercase">Día</span>
                        <span className="text-xl font-bold text-primary">{day.dia}</span>
                      </div>
                      
                      {/* Day Info */}
                      <div className="text-left">
                        <p className="font-semibold text-foreground">
                          {formatFullDate(day.fecha) || `Día ${day.dia}`}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          {day.ciudad && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {day.ciudad}
                            </span>
                          )}
                          {day.clima && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              {getWeatherIcon(day.clima)}
                              {day.clima}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Expand indicator */}
                    <div className="flex items-center gap-2">
                      {day.actividades && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          {day.actividades.length} actividades
                        </span>
                      )}
                      {openDays.includes(day.dia) ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3">
                    {/* Flight cards if any */}
                    {day.vuelos?.map((vuelo, idx) => (
                      <div key={`flight-${idx}`} className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                          <Plane className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{vuelo.aerolinea}</p>
                          <p className="text-sm text-muted-foreground">
                            {vuelo.horaSalida} - {vuelo.horaLlegada}
                          </p>
                        </div>
                        {vuelo.precio && (
                          <span className="text-sm font-semibold text-blue-600">
                            ${vuelo.precio.toLocaleString()}
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Accommodation card if any */}
                    {day.alojamiento && (
                      <div className="flex gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                          <Hotel className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{day.alojamiento.nombre}</p>
                          <p className="text-sm text-muted-foreground">{day.alojamiento.ubicacion}</p>
                        </div>
                      </div>
                    )}

                    {/* Car rental if any */}
                    {day.coche && (
                      <div className="flex gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                          <Car className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{day.coche.tipoVehiculo}</p>
                          <p className="text-sm text-muted-foreground">{day.coche.empresa}</p>
                        </div>
                      </div>
                    )}

                    {/* Activities */}
                    {day.actividades?.map((activity, idx) => (
                      <div key={idx} className="flex gap-3 p-3 border-l-3 border-primary/40 bg-muted/30 rounded-r-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-foreground">{activity.titulo}</h4>
                            {activity.hora && (
                              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {getTimeLabel(activity.hora)}
                              </span>
                            )}
                          </div>
                          {activity.descripcion && (
                            <p className="text-sm text-muted-foreground mb-2">{activity.descripcion}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {activity.ubicacion && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {activity.ubicacion}
                              </span>
                            )}
                            <span className={`font-medium ${activity.costoAprox && activity.costoAprox > 0 ? 'text-foreground' : 'text-green-600'}`}>
                              {activity.costoAprox && activity.costoAprox > 0 
                                ? `$${activity.costoAprox.toLocaleString()} MXN` 
                                : 'Gratis'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No hay itinerario disponible</p>
          <p className="text-sm mt-1">Agrega vuelos, alojamiento y actividades para comenzar</p>
        </div>
      )}

      {/* Quick View Dialog */}
      <Dialog open={showQuickView} onOpenChange={setShowQuickView}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Vista rápida del viaje</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border bg-muted p-2 text-left text-sm font-medium">Categoría</th>
                    {days.map(day => (
                      <th key={day.dia} className="border bg-muted p-2 text-center text-sm font-medium min-w-[100px]">
                        Día {day.dia}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat}>
                      <td className="border p-2 text-sm font-medium bg-muted/50">{cat}</td>
                      {days.map(day => (
                        <td key={day.dia} className="border p-2 text-xs text-center">
                          {cat === 'Vuelos' && day.vuelos?.length ? (
                            <span className="text-blue-600">✈️ {day.vuelos[0].aerolinea}</span>
                          ) : cat === 'Alojamiento' && day.alojamiento ? (
                            <span className="text-purple-600">🏨 {day.alojamiento.nombre}</span>
                          ) : cat === 'Actividades' && day.actividades?.length ? (
                            <span className="text-orange-600">{day.actividades.length} act.</span>
                          ) : cat === 'Coche' && day.coche ? (
                            <span className="text-green-600">🚗 {day.coche.tipoVehiculo}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TabItinerario;
