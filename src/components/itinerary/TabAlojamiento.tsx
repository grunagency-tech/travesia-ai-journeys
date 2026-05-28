import { useState, useMemo } from "react";
import { Hotel, Star, MapPin, ChevronDown, Plus, ExternalLink, Wifi, Car, Utensils, Dumbbell, DollarSign, Award, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AccommodationOption } from "./types";
import { getHotelImage } from "@/lib/getPlaceholderImage";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/itineraryTranslations";

// Generate a reliable hotel search URL - Google Maps for finding the hotel
const generateHotelSearchUrl = (hotelName: string, destination?: string): string => {
  const query = destination ? `${hotelName} ${destination}` : hotelName;
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
};

interface TabAlojamientoProps {
  options?: AccommodationOption[] | string[];
  recommendation?: string;
  recommendedZone?: string;
  costPerNight?: number;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  onAddAccommodation?: (accommodation: AccommodationOption) => void;
}

// Amenity icons mapping
const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3 h-3" />,
  parking: <Car className="w-3 h-3" />,
  restaurant: <Utensils className="w-3 h-3" />,
  gym: <Dumbbell className="w-3 h-3" />,
};

// Category info for hotels
type HotelCategory = 'cheapest' | 'best-rated' | 'best-location';

const getCategoryInfo = (category?: HotelCategory, lang: string = 'ES'): { icon: React.ReactNode; label: string; color: string } => {
  switch (category) {
    case 'cheapest':
      return { icon: <DollarSign className="w-3.5 h-3.5" />, label: t('masBarato', lang as any), color: 'bg-green-100 text-green-700 border-green-200' };
    case 'best-rated':
      return { icon: <Award className="w-3.5 h-3.5" />, label: t('mejorCalificado', lang as any), color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    case 'best-location':
      return { icon: <Navigation className="w-3.5 h-3.5" />, label: t('mejorUbicado', lang as any), color: 'bg-blue-100 text-blue-700 border-blue-200' };
    default:
      return { icon: null, label: '', color: '' };
  }
};

// Categorize hotels: cheapest, best-rated, best-location
const categorizeHotels = (hotels: AccommodationOption[]): (AccommodationOption & { categoria?: HotelCategory })[] => {
  if (!hotels || hotels.length === 0) return [];
  
  const categorized: (AccommodationOption & { categoria?: HotelCategory })[] = [];
  const usedIds = new Set<string>();
  
  const getHotelId = (h: AccommodationOption) => h.id || `${h.nombre}-${h.precioPorNoche}`;
  
  // 1. Find the cheapest hotel
  const sortedByPrice = [...hotels].sort((a, b) => (a.precioPorNoche || 999999) - (b.precioPorNoche || 999999));
  if (sortedByPrice.length > 0) {
    const cheapest = { ...sortedByPrice[0], categoria: 'cheapest' as HotelCategory };
    categorized.push(cheapest);
    usedIds.add(getHotelId(cheapest));
  }
  
  // 2. Find the best-rated hotel
  const sortedByRating = [...hotels].sort((a, b) => (b.calificacion || 0) - (a.calificacion || 0));
  for (const hotel of sortedByRating) {
    if (!usedIds.has(getHotelId(hotel))) {
      const bestRated = { ...hotel, categoria: 'best-rated' as HotelCategory };
      categorized.push(bestRated);
      usedIds.add(getHotelId(bestRated));
      break;
    }
  }
  
  // 3. Find the best-located hotel (closest to center or first one with good location tags)
  const sortedByLocation = [...hotels].sort((a, b) => {
    // Prefer hotels with distanciaCentro
    const distA = a.distanciaCentro ?? 999;
    const distB = b.distanciaCentro ?? 999;
    if (distA !== distB) return distA - distB;
    
    // Check for location-related tags
    const locationTags = ['centro', 'central', 'downtown', 'céntrico', 'ubicación'];
    const hasLocationTagA = a.etiquetas?.some(t => locationTags.some(lt => t.toLowerCase().includes(lt))) ? 1 : 0;
    const hasLocationTagB = b.etiquetas?.some(t => locationTags.some(lt => t.toLowerCase().includes(lt))) ? 1 : 0;
    return hasLocationTagB - hasLocationTagA;
  });
  
  for (const hotel of sortedByLocation) {
    if (!usedIds.has(getHotelId(hotel))) {
      const bestLocation = { ...hotel, categoria: 'best-location' as HotelCategory };
      categorized.push(bestLocation);
      usedIds.add(getHotelId(bestLocation));
      break;
    }
  }
  
  // If we still need more hotels to have 3, add more by rating
  if (categorized.length < 3) {
    for (const hotel of sortedByRating) {
      if (!usedIds.has(getHotelId(hotel))) {
        const hasCategory = (cat: HotelCategory) => categorized.some(h => h.categoria === cat);
        let category: HotelCategory = 'cheapest';
        
        if (!hasCategory('best-location')) category = 'best-location';
        else if (!hasCategory('best-rated')) category = 'best-rated';
        
        const newHotel = { ...hotel, categoria: category };
        categorized.push(newHotel);
        usedIds.add(getHotelId(newHotel));
        
        if (categorized.length >= 3) break;
      }
    }
  }
  
  // Sort by category order: cheapest, best-rated, best-location
  const categoryOrder = { 'cheapest': 1, 'best-rated': 2, 'best-location': 3 };
  return categorized.sort((a, b) => 
    (categoryOrder[a.categoria || 'cheapest'] || 4) - (categoryOrder[b.categoria || 'cheapest'] || 4)
  );
};

const TabAlojamiento = ({
  options = [],
  recommendation,
  recommendedZone,
  costPerNight,
  startDate,
  endDate,
  travelers,
  onAddAccommodation
}: TabAlojamientoProps) => {
  const { language } = useLanguage();
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  // Calculate number of nights
  const totalNights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 1);
  }, [startDate, endDate]);

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

  // Categorize top 3 hotels
  const categorizedHotels = useMemo(() => categorizeHotels(normalizedOptions), [normalizedOptions]);
  
  // Get remaining hotels
  const remainingOptions = useMemo(() => {
    const topIds = new Set(categorizedHotels.map(h => h.id || `${h.nombre}-${h.precioPorNoche}`));
    return normalizedOptions.filter(h => !topIds.has(h.id || `${h.nombre}-${h.precioPorNoche}`));
  }, [normalizedOptions, categorizedHotels]);

  // If no structured options, create one from the recommendation
  const displayOptions = categorizedHotels.length > 0 ? categorizedHotels : (recommendation ? [{
    nombre: recommendation,
    ubicacion: recommendedZone,
    precioPorNoche: costPerNight,
  }] : []);

  const getImageForHotel = (hotel: AccommodationOption): string => {
    if (hotel.imagen) return hotel.imagen;
    // If hotel has an ID from Hotellook API, generate the photo URL
    if (hotel.id && /^\d+$/.test(hotel.id)) {
      return `https://photo.hotellook.com/image_v2/limit/h${hotel.id}_1/800/520.auto`;
    }
    return getHotelImage();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
          <Hotel className="w-5 h-5 text-primary" />
          {t('mejoresAlojamientos', language)}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{t('seleccionamosEstadia', language)}</p>
        
        {/* Category Legend */}
        {categorizedHotels.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
              <DollarSign className="w-3 h-3 mr-1" />{t('masBarato', language)}
            </Badge>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">
              <Award className="w-3 h-3 mr-1" />{t('mejorCalificado', language)}
            </Badge>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
              <Navigation className="w-3 h-3 mr-1" />{t('mejorUbicado', language)}
            </Badge>
          </div>
        )}
      </div>

      {displayOptions.length > 0 ? (
        <div className="space-y-4">
          {displayOptions.map((hotel, idx) => {
            const isExpanded = expandedCards.has(idx);
            const hotelWithCategory = hotel as AccommodationOption & { categoria?: HotelCategory };
            const categoryInfo = getCategoryInfo(hotelWithCategory.categoria, language);
            
            return (
              <Card 
                key={idx} 
                className="overflow-hidden hover:shadow-md transition-shadow border-l-4"
                style={{ 
                  borderLeftColor: hotelWithCategory.categoria === 'cheapest' ? '#22c55e' : 
                                   hotelWithCategory.categoria === 'best-rated' ? '#eab308' : 
                                   hotelWithCategory.categoria === 'best-location' ? '#3b82f6' : 'transparent' 
                }}
              >
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
                          {/* Name & Rating & Category */}
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-lg">{hotel.nombre}</h4>
                            {hotel.calificacion && (
                              <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-sm font-medium">{hotel.calificacion}</span>
                              </div>
                            )}
                            {categoryInfo.label && (
                              <Badge variant="outline" className={`text-xs ${categoryInfo.color}`}>
                                {categoryInfo.icon}
                                <span className="ml-1">{categoryInfo.label}</span>
                              </Badge>
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
                            {isExpanded ? t('verMenos', language) : t('verMas', language)}
                          </Button>
                        </div>

                        {/* Price & Actions */}
                        <div className="text-left md:text-right min-w-[140px]">
                          {hotel.precioPorNoche && (
                            <div className="mb-2">
                              <p className="text-xl font-bold text-primary">
                                ${hotel.precioPorNoche.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">{t('porNoche', language)}</p>
                              {totalNights > 0 && (
                                <p className="text-sm font-semibold text-foreground mt-1">
                                  Total: ${(hotel.precioPorNoche * totalNights).toLocaleString()}
                                </p>
                              )}
                              {totalNights > 0 && (
                                <p className="text-[10px] text-muted-foreground">
                                  {totalNights} {totalNights === 1 ? t('unaNoche', language) : t('noches', language)}
                                </p>
                              )}
                            </div>
                          )}
                          <div className="flex flex-row md:flex-col gap-1.5">
                            <Button 
                              size="sm"
                              variant="default"
                              className="flex-1 md:flex-none"
                              onClick={() => {
                                const url = generateHotelSearchUrl(hotel.nombre || '', hotel.ubicacion);
                                window.open(url, '_blank');
                              }}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              {t('reservar', language)}
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="flex-1 md:flex-none"
                              onClick={() => {
                                const hotelWithTotal = {
                                  ...hotel,
                                  precioTotal: hotel.precioPorNoche && totalNights > 0 
                                    ? hotel.precioPorNoche * totalNights 
                                    : hotel.precioTotal,
                                  fechaCheckIn: startDate,
                                  fechaCheckOut: endDate,
                                };
                                onAddAccommodation?.(hotelWithTotal);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              {t('agregar', language)}
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
          <p className="font-medium">{t('noAlojamiento', language)}</p>
          <p className="text-sm mt-1">{t('opcionesAparecen', language)}</p>
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
                        <p className="font-semibold text-primary whitespace-nowrap">${hotel.precioPorNoche.toLocaleString()}/{t('porNoche', language)}</p>
                      )}
                      <Button size="sm" variant="default" onClick={() => {
                        const url = generateHotelSearchUrl(hotel.nombre || '', hotel.ubicacion);
                        window.open(url, '_blank');
                      }}>
                         <ExternalLink className="w-3 h-3 mr-1" />
                         {t('reservar', language)}
                      </Button>
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
            {t('zonaRecomendada', language)}
          </h4>
          <p className="text-sm text-purple-700">{recommendedZone}</p>
        </div>
      )}
    </div>
  );
};

export default TabAlojamiento;
