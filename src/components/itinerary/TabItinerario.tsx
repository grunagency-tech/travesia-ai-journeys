import { useState, useMemo } from "react";
import { 
  Calendar, ChevronDown, ChevronUp, Eye, Plus, Plane, Hotel, 
  Car, MapPin, Clock, Sun, Cloud, CloudRain, DollarSign
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/itineraryTranslations";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ItineraryDay, FlightOption, AccommodationOption, CarRentalOption, ActivityOption } from "./types";

interface AddedItem {
  type: 'flight' | 'hotel' | 'car' | 'activity';
  item: FlightOption | AccommodationOption | CarRentalOption | ActivityOption;
  day: number;
  time?: string;
}

interface TabItinerarioProps {
  days: ItineraryDay[];
  onAddFlight?: () => void;
  onAddAccommodation?: () => void;
  onAddCar?: () => void;
  onAddActivity?: () => void;
  addedItems?: AddedItem[];
  travelers?: number;
  startDate?: string;
  endDate?: string;
}

const langToLocale: Record<string, string> = {
  ES: 'es-ES', EN: 'en-US', DE: 'de-DE', PT: 'pt-BR', IT: 'it-IT'
};

const formatFullDate = (dateStr?: string, lang: string = 'ES'): string => {
  if (!dateStr) return '';
  const locale = langToLocale[lang] || 'es-ES';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) {
      const date = new Date(dateStr);
      return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    }
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return dateStr;
  }
};

const getTimeLabel = (hora?: string, lang?: string): string => {
  if (!hora) return '';
  if (lang) {
    const key = hora === 'morning' ? 'manana' : hora === 'afternoon' ? 'tarde' : hora === 'evening' ? 'noche' : '';
    if (key) return t(key, lang as any);
  }
  return hora;
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
  onAddActivity,
  addedItems = [],
  travelers = 1,
  startDate,
  endDate
}: TabItinerarioProps) => {
  const { currencySymbol, currency } = useCurrency();
  const { language } = useLanguage();
  const [openDays, setOpenDays] = useState<number[]>([1]);
  const [showQuickView, setShowQuickView] = useState(false);

  const toggleDay = (dayNum: number) => {
    setOpenDays(prev => 
      prev.includes(dayNum) 
        ? prev.filter(d => d !== dayNum)
        : [...prev, dayNum]
    );
  };

  // Calculate total nights
  const totalNights = useMemo(() => {
    if (!startDate || !endDate) return days.length || 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 1);
  }, [startDate, endDate, days.length]);

  // Calculate total costs (flights × travelers, hotels × nights)
  const totalCosts = useMemo(() => {
    let flights = 0;
    let hotels = 0;
    let cars = 0;
    let activities = 0;

    // From days data
    days.forEach(day => {
      day.vuelos?.forEach(v => { if (v.precio) flights += v.precio; });
      if (day.alojamiento?.precioPorNoche) hotels += day.alojamiento.precioPorNoche;
      if (day.coche?.precio) cars += day.coche.precio;
      day.actividades?.forEach(a => { if (a.costoAprox) activities += a.costoAprox; });
    });

    // From added items
    addedItems.forEach(added => {
      if (added.type === 'flight' && 'precio' in added.item && added.item.precio) {
        flights += added.item.precio;
      } else if (added.type === 'hotel' && 'precioTotal' in added.item && added.item.precioTotal) {
        // Use precioTotal directly (already calculated as nights × price)
        hotels += added.item.precioTotal;
      } else if (added.type === 'hotel' && 'precioPorNoche' in added.item && added.item.precioPorNoche) {
        hotels += added.item.precioPorNoche * totalNights;
      } else if (added.type === 'car' && 'precio' in added.item && added.item.precio) {
        cars += added.item.precio;
      } else if (added.type === 'activity' && 'precio' in added.item && added.item.precio) {
        activities += added.item.precio;
      }
    });

    // Multiply flights by number of travelers
    flights = flights * travelers;
    // Hotels from days: price per night × total nights (not per day since it's already summed per day)
    // Only multiply if hotels came from daily data (not added items which already have total)
    const dailyHotels = days.reduce((sum, day) => sum + (day.alojamiento?.precioPorNoche || 0), 0);
    const addedHotels = hotels - dailyHotels;
    hotels = (dailyHotels > 0 ? dailyHotels * totalNights : 0) + addedHotels;

    return { flights, hotels, cars, activities, total: flights + hotels + cars + activities };
  }, [days, addedItems, travelers, totalNights]);

  // Quick View Table Data
  const categories = [t('vuelos', language), t('alojamiento', language), t('actividades', language), t('coche', language)];
  
  // Get added items for a specific day
  const getAddedItemsForDay = (dayNum: number, type: string) => {
    return addedItems.filter(item => item.day === dayNum && item.type === type);
  };
  
  return (
    <div className="space-y-3 md:space-y-4">
      {/* Action Bar - horizontal scroll on mobile */}
      <div className="bg-card md:rounded-xl md:border p-3 md:p-4 -mx-3 md:mx-0 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full border-primary text-primary hover:bg-primary/5 text-xs md:text-sm px-3 md:px-4"
            onClick={() => setShowQuickView(true)}
          >
            <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-1.5" />
            {t('vistaRapida', language)}
          </Button>
        </div>
      </div>

      {/* Days Accordion */}
      {days && days.length > 0 ? (
        <div className="space-y-2 md:space-y-3">
          {days.map((day) => {
            const addedFlights = getAddedItemsForDay(day.dia, 'flight');
            const addedHotels = getAddedItemsForDay(day.dia, 'hotel');
            const addedCars = getAddedItemsForDay(day.dia, 'car');
            const addedActivities = getAddedItemsForDay(day.dia, 'activity');
            
            return (
              <Collapsible
                key={day.dia}
                open={openDays.includes(day.dia)}
                onOpenChange={() => toggleDay(day.dia)}
              >
                <div className="bg-card rounded-xl md:border overflow-hidden shadow-sm">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 md:gap-4">
                        {/* Day Number - smaller on mobile */}
                        <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-[10px] md:text-xs text-primary font-medium uppercase">{t('dia', language)}</span>
                          <span className="text-lg md:text-xl font-bold text-primary">{day.dia}</span>
                        </div>
                        
                        {/* Day Info */}
                        <div className="text-left min-w-0">
                          <p className="font-semibold text-foreground text-sm md:text-base truncate">
                            {formatFullDate(day.fecha, language) || `${t('dia', language)} ${day.dia}`}
                          </p>
                          <div className="flex items-center gap-2 md:gap-3 mt-0.5 md:mt-1 flex-wrap">
                            {day.ciudad && (
                              <span className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {day.ciudad}
                              </span>
                            )}
                            {day.clima && (
                              <span className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
                                {getWeatherIcon(day.clima)}
                                <span className="hidden md:inline">{day.clima}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Expand indicator */}
                      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                        {day.actividades && (
                          <span className="text-[10px] md:text-xs text-muted-foreground bg-muted px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
                            {day.actividades.length + addedActivities.length} {t('actividades', language)}
                          </span>
                        )}
                        {openDays.includes(day.dia) ? (
                          <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-3 pb-3 md:px-4 md:pb-4 space-y-2 md:space-y-3">
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

                      {/* Added flights */}
                      {addedFlights.map((added, idx) => {
                        const flight = added.item as FlightOption;
                        return (
                          <div key={`added-flight-${idx}`} className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 border-dashed">
                            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                              <Plane className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{flight.aerolinea}</p>
                              <p className="text-xs text-blue-600">{t('agregadoPorTi', language)}</p>
                            </div>
                            {flight.precio && (
                              <span className="text-sm font-semibold text-blue-600">
                                ${flight.precio.toLocaleString()}
                              </span>
                            )}
                          </div>
                        );
                      })}

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

                      {/* Added hotels */}
                      {addedHotels.map((added, idx) => {
                        const hotel = added.item as AccommodationOption;
                        return (
                          <div key={`added-hotel-${idx}`} className="flex gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200 border-dashed">
                            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                              <Hotel className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{hotel.nombre}</p>
                              <p className="text-xs text-purple-600">{t('agregadoPorTi', language)}</p>
                            </div>
                            {hotel.precioPorNoche && (
                              <span className="text-sm font-semibold text-purple-600">
                                ${hotel.precioPorNoche.toLocaleString()}/noche
                              </span>
                            )}
                          </div>
                        );
                      })}

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

                      {/* Added cars */}
                      {addedCars.map((added, idx) => {
                        const car = added.item as CarRentalOption;
                        return (
                          <div key={`added-car-${idx}`} className="flex gap-3 p-3 bg-green-50 rounded-lg border border-green-200 border-dashed">
                            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                              <Car className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{car.tipoVehiculo}</p>
                              <p className="text-xs text-green-600">{t('agregadoPorTi', language)}</p>
                            </div>
                            {car.precio && (
                              <span className="text-sm font-semibold text-green-600">
                                ${car.precio.toLocaleString()}
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {/* Activities */}
                      {day.actividades?.map((activity, idx) => (
                        <div key={idx} className="flex gap-3 p-3 border-l-3 border-primary/40 bg-muted/30 rounded-r-lg">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-foreground">{activity.titulo}</h4>
                              <div className="flex items-center gap-2">
                                {activity.hora && (
                                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {getTimeLabel(activity.hora, language)}
                                  </span>
                                )}
                              </div>
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
                              {activity.duracion && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {activity.duracion}
                                </span>
                              )}
                              <span className={`font-medium ${activity.costoAprox && activity.costoAprox > 0 ? 'text-foreground' : 'text-green-600'}`}>
                                {activity.costoAprox && activity.costoAprox > 0 
                                  ? `${currencySymbol}${activity.costoAprox.toLocaleString()} ${currency}` 
                                   : t('gratis', language)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Added activities */}
                      {addedActivities.map((added, idx) => {
                        const activity = added.item as ActivityOption;
                        return (
                          <div key={`added-activity-${idx}`} className="flex gap-3 p-3 border-l-3 border-orange-400 bg-orange-50/50 rounded-r-lg">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-foreground">{activity.nombre}</h4>
                                <div className="flex items-center gap-2">
                                  {added.time && (
                                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {getTimeLabel(added.time, language)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-orange-600 mb-1">{t('agregadoPorTi', language)}</p>
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
                              <span className={`font-medium ${activity.precio && activity.precio > 0 ? 'text-foreground' : 'text-green-600'}`}>
                                  {activity.precio && activity.precio > 0 
                                    ? `${currencySymbol}${activity.precio.toLocaleString()} ${currency}` 
                                    : t('gratis', language)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">{t('noItinerario', language)}</p>
          <p className="text-sm mt-1">{t('agregaParaComenzar', language)}</p>
        </div>
      )}

      {/* Total Cost Summary */}
      {totalCosts.total > 0 && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            {t('costoAproximado', language)}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {totalCosts.flights > 0 && (
              <div className="bg-card rounded-lg p-3 text-center">
                <Plane className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{t('vuelos', language)}</p>
                <p className="font-semibold text-sm">{currencySymbol}{totalCosts.flights.toLocaleString()}</p>
              </div>
            )}
            {totalCosts.hotels > 0 && (
              <div className="bg-card rounded-lg p-3 text-center">
                <Hotel className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{t('alojamiento', language)}</p>
                <p className="font-semibold text-sm">{currencySymbol}{totalCosts.hotels.toLocaleString()}</p>
              </div>
            )}
            {totalCosts.cars > 0 && (
              <div className="bg-card rounded-lg p-3 text-center">
                <Car className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{t('transporteLabel', language)}</p>
                <p className="font-semibold text-sm">{currencySymbol}{totalCosts.cars.toLocaleString()}</p>
              </div>
            )}
            {totalCosts.activities > 0 && (
              <div className="bg-card rounded-lg p-3 text-center">
                <MapPin className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{t('tabActividades', language)}</p>
                <p className="font-semibold text-sm">{currencySymbol}{totalCosts.activities.toLocaleString()}</p>
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-primary/20 flex justify-between items-center">
            <span className="font-medium">{t('totalEstimado', language)}</span>
            <span className="text-xl font-bold text-primary">{currencySymbol}{totalCosts.total.toLocaleString()} {currency}</span>
          </div>
        </div>
      )}

      {/* Quick View Dialog */}
      <Dialog open={showQuickView} onOpenChange={setShowQuickView}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{t('vistaRapidaViaje', language)}</span>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            {/* Cost Summary */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                {t('resumenGastos', language)}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/80 rounded-lg p-3 text-center">
                  <Plane className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">{t('vuelos', language)}</p>
                  <p className="font-semibold text-sm">{currencySymbol}{totalCosts.flights.toLocaleString()}</p>
                </div>
                <div className="bg-white/80 rounded-lg p-3 text-center">
                  <Hotel className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">{t('alojamiento', language)}</p>
                  <p className="font-semibold text-sm">{currencySymbol}{totalCosts.hotels.toLocaleString()}</p>
                </div>
                <div className="bg-white/80 rounded-lg p-3 text-center">
                  <Car className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">{t('transporteLabel', language)}</p>
                  <p className="font-semibold text-sm">{currencySymbol}{totalCosts.cars.toLocaleString()}</p>
                </div>
                <div className="bg-white/80 rounded-lg p-3 text-center">
                  <MapPin className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">{t('tabActividades', language)}</p>
                  <p className="font-semibold text-sm">{currencySymbol}{totalCosts.activities.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-primary/20 flex justify-between items-center">
                <span className="font-medium">{t('totalEstimado', language)}</span>
                <span className="text-xl font-bold text-primary">{currencySymbol}{totalCosts.total.toLocaleString()} {currency}</span>
              </div>
            </div>

            {/* Day by day table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border bg-muted p-2 text-left text-sm font-medium">{t('categoria', language)}</th>
                    {days.map(day => (
                      <th key={day.dia} className="border bg-muted p-2 text-center text-sm font-medium min-w-[100px]">
                        {t('dia', language)} {day.dia}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat}>
                      <td className="border p-2 text-sm font-medium bg-muted/50">{cat}</td>
                      {days.map(day => {
                        const addedForDay = addedItems.filter(i => i.day === day.dia);
                        const hasAdded = cat === t('vuelos', language) ? addedForDay.some(i => i.type === 'flight') :
                                        cat === t('alojamiento', language) ? addedForDay.some(i => i.type === 'hotel') :
                                        cat === t('actividades', language) ? addedForDay.some(i => i.type === 'activity') :
                                        addedForDay.some(i => i.type === 'car');
                        
                        return (
                          <td key={day.dia} className="border p-2 text-xs text-center">
                            {cat === t('vuelos', language) && day.vuelos?.length ? (
                              <span className="text-blue-600">✈️ {day.vuelos[0].aerolinea}</span>
                            ) : cat === t('alojamiento', language) && day.alojamiento ? (
                              <span className="text-purple-600">🏨 {day.alojamiento.nombre}</span>
                            ) : cat === t('actividades', language) && day.actividades?.length ? (
                              <span className="text-orange-600">{day.actividades.length + (hasAdded ? addedForDay.filter(i => i.type === 'activity').length : 0)} act.</span>
                            ) : cat === t('coche', language) && day.coche ? (
                              <span className="text-green-600">🚗 {day.coche.tipoVehiculo}</span>
                            ) : hasAdded ? (
                              <span className="text-primary font-medium">{t('agregado', language)}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        );
                      })}
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