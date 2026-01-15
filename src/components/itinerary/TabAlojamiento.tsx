import { useState } from "react";
import { Hotel, Star, MapPin, ChevronDown, Plus, ExternalLink, Wifi, Car, Utensils, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AccommodationOption } from "./types";
import { getHotelImage } from "@/lib/getPlaceholderImage";

interface TabAlojamientoProps {
  options?: AccommodationOption[] | string[];
  recommendation?: string;
  recommendedZone?: string;
  costPerNight?: number;
  onAddAccommodation?: (accommodation: AccommodationOption) => void;
}

// Amenity icons mapping
const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3 h-3" />,
  parking: <Car className="w-3 h-3" />,
  restaurant: <Utensils className="w-3 h-3" />,
  gym: <Dumbbell className="w-3 h-3" />,
};

const TabAlojamiento = ({
  options = [],
  recommendation,
  recommendedZone,
  costPerNight,
  onAddAccommodation
}: TabAlojamientoProps) => {
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const toggleCard = (idx: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedCards(newExpanded);
  };

  // Normalize options to AccommodationOption[]
  const normalizedOptions: AccommodationOption[] = options.map((opt, idx) => {
    if (typeof opt === 'string') {
      return {
        nombre: opt,
        ubicacion: recommendedZone,
        precioPorNoche: costPerNight,
      };
    }
    return opt;
  });

  const topOptions = normalizedOptions.slice(0, 3);
  const remainingOptions = normalizedOptions.slice(3);

  // If no structured options, create one from the recommendation
  const displayOptions = topOptions.length > 0 ? topOptions : (recommendation ? [{
    nombre: recommendation,
    ubicacion: recommendedZone,
    precioPorNoche: costPerNight,
  }] : []);

  const getImageForHotel = (hotel: AccommodationOption): string => {
    if (hotel.imagen) return hotel.imagen;
    return getHotelImage();
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Hotel className="w-5 h-5 text-primary" />
        Opciones de alojamiento
      </h3>

      {displayOptions.length > 0 ? (
        <div className="space-y-4">
          {displayOptions.map((hotel, idx) => {
            const isExpanded = expandedCards.has(idx);
            
            return (
              <Card key={idx} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="w-full md:w-48 h-44 md:h-auto bg-muted relative overflow-hidden">
                      <img 
                        src={getImageForHotel(hotel)} 
                        alt={hotel.nombre}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          // Fallback to gradient if image fails
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 absolute inset-0">
                        <Hotel className="w-12 h-12 text-purple-400" />
                      </div>
                      {hotel.tipo && (
                        <Badge className="absolute top-2 left-2 bg-black/60 text-white text-xs">
                          {hotel.tipo}
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Name & Rating */}
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-lg">{hotel.nombre}</h4>
                            {hotel.calificacion && (
                              <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-sm font-medium">{hotel.calificacion}</span>
                              </div>
                            )}
                          </div>

                          {/* Location */}
                          {hotel.ubicacion && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className={isExpanded ? '' : 'line-clamp-1'}>{hotel.ubicacion}</span>
                            </p>
                          )}

                          {/* Amenities - show when expanded */}
                          {hotel.amenities && hotel.amenities.length > 0 && isExpanded && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {hotel.amenities.map((amenity, aidx) => (
                                <span key={aidx} className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                  {amenityIcons[amenity.toLowerCase()] || null}
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Tags */}
                          {hotel.etiquetas && hotel.etiquetas.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {hotel.etiquetas.slice(0, isExpanded ? undefined : 3).map((tag, tagIdx) => (
                                <Badge key={tagIdx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {!isExpanded && hotel.etiquetas.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{hotel.etiquetas.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Expand/Collapse button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => toggleCard(idx)}
                          >
                            <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            {isExpanded ? 'Ver menos' : 'Ver más'}
                          </Button>
                        </div>

                        {/* Price & Actions */}
                        <div className="text-left md:text-right min-w-[140px]">
                          {hotel.precioPorNoche && (
                            <div className="mb-2">
                              <p className="text-xl font-bold text-primary">
                                ${hotel.precioPorNoche.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">por noche</p>
                            </div>
                          )}
                          {hotel.precioTotal && isExpanded && (
                            <p className="text-sm text-muted-foreground mb-2">
                              Total: ${hotel.precioTotal.toLocaleString()}
                            </p>
                          )}
                          <div className="flex flex-row md:flex-col gap-1.5">
                            {hotel.link && (
                              <Button 
                                size="sm"
                                variant="default"
                                className="flex-1 md:flex-none"
                                onClick={() => window.open(hotel.link, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Reservar
                              </Button>
                            )}
                            <Button 
                              size="sm"
                              variant={hotel.link ? "outline" : "default"}
                              className="flex-1 md:flex-none"
                              onClick={() => onAddAccommodation?.(hotel)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Agregar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl">
          <Hotel className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No hay opciones de alojamiento</p>
          <p className="text-sm mt-1">Las opciones aparecerán aquí cuando estén disponibles</p>
        </div>
      )}

      {/* Show More Options */}
      {remainingOptions.length > 0 && (
        <Collapsible open={showAllOptions} onOpenChange={setShowAllOptions}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full">
              <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showAllOptions ? 'rotate-180' : ''}`} />
              Ver {remainingOptions.length} opciones más
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            {remainingOptions.map((hotel, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        <img 
                          src={getImageForHotel(hotel)} 
                          alt={hotel.nombre} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '';
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{hotel.nombre}</p>
                        <p className="text-sm text-muted-foreground truncate">{hotel.ubicacion}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5 flex-shrink-0">
                      {hotel.precioPorNoche && (
                        <p className="font-semibold text-primary whitespace-nowrap">${hotel.precioPorNoche.toLocaleString()}/noche</p>
                      )}
                      {hotel.link && (
                        <Button size="sm" variant="default" onClick={() => window.open(hotel.link, '_blank')}>
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Reservar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Zone Recommendation */}
      {recommendedZone && (
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <h4 className="font-medium text-purple-900 flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4" />
            Zona recomendada
          </h4>
          <p className="text-sm text-purple-700">{recommendedZone}</p>
        </div>
      )}
    </div>
  );
};

export default TabAlojamiento;
