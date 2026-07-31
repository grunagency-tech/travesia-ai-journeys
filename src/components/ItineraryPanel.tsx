import { useState, useCallback } from "react";
import { Calendar, Plane, Hotel, Compass, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/itineraryTranslations";
import {
  ItineraryHeader,
  TabItinerario,
  TabTransporte,
  TabAlojamiento,
  TabActividades,
  TabInfoLocal,
  ItineraryData,
  ItineraryPanelProps,
  ActivityOption,
  FlightOption,
  AccommodationOption,
  CarRentalOption
} from "@/components/itinerary";

interface AddedItem {
  type: 'flight' | 'hotel' | 'car' | 'activity';
  item: FlightOption | AccommodationOption | CarRentalOption | ActivityOption;
  day: number;
  time?: string;
}

const ItineraryPanel = ({
  data,
  destination: providedDestination,
  origin,
  startDate,
  endDate,
  travelers = 1,
  budget: userBudget,
  customImage,
  onImageResolved
}: ItineraryPanelProps) => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [addedItems, setAddedItems] = useState<AddedItem[]>([]);
  const [activeTab, setActiveTab] = useState("itinerario");

  const inferDestination = (): string => {
    if (data.destino) return data.destino;

    const titleRaw = data.resumen?.titulo ?? "";
    const cleaned = titleRaw
      .replace(/\(.*?\)/g, " ")
      .replace(/[^\p{L}\p{N}\s,–\-:]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Try to capture the text after "a/en/to/in" (e.g. "Tu viaje a Lisboa" -> "Lisboa")
    const afterPrep = cleaned.match(/(?:\b(a|en|to|in)\b)\s+(.+)/i)?.[2];
    const base = (afterPrep ?? cleaned).split(/[,:–\-]/)[0]?.trim();

    return base || "Destino";
  };

  const destination = providedDestination || inferDestination();
  const title = data.resumen?.titulo || `Tu viaje a ${destination}`;
  // Use user's original budget if provided, otherwise fall back to AI estimate
  const budget = userBudget || data.resumen?.presupuestoEstimado;
  const duration = data.itinerario?.length || data.resumen?.duracion;

  // Handle adding items to itinerary
  const handleAddActivity = useCallback((activity: ActivityOption, day?: number, time?: string) => {
    setAddedItems(prev => [...prev, { type: 'activity', item: activity, day: day || 1, time }]);
    toast({ title: t('actividadAgregada', language), description: `${activity.nombre} ${t('seAgregoAlDia', language)} ${day || 1}` });
    setActiveTab("itinerario");
  }, [toast, language]);

  const handleAddFlight = useCallback((flight: FlightOption) => {
    setAddedItems(prev => [...prev, { type: 'flight', item: flight, day: 1 }]);
    toast({ title: t('vueloAgregado', language), description: `${flight.aerolinea} — $${flight.precio?.toLocaleString() || ''}` });
    setActiveTab("itinerario");
  }, [toast, language]);

  const handleAddAccommodation = useCallback((hotel: AccommodationOption) => {
    setAddedItems(prev => [...prev, { type: 'hotel', item: hotel, day: 1 }]);
    const totalPrice = hotel.precioTotal || hotel.precioPorNoche || 0;
    toast({ title: t('alojamientoAgregado', language), description: `${hotel.nombre} — $${totalPrice.toLocaleString()}` });
    setActiveTab("itinerario");
  }, [toast, language]);

  const handleAddCar = useCallback((car: CarRentalOption) => {
    setAddedItems(prev => [...prev, { type: 'car', item: car, day: 1 }]);
    toast({ title: t('autoAgregado', language), description: `${car.empresa} — ${car.tipoVehiculo}` });
    setActiveTab("itinerario");
  }, [toast, language]);

  // Navigate to activities tab
  const handleNavigateToActivities = useCallback(() => {
    setActiveTab("actividades");
  }, []);
  const handleNavigateToTransporte = useCallback(() => {
    setActiveTab("transporte");
  }, []);
  const handleNavigateToAlojamiento = useCallback(() => {
    setActiveTab("alojamiento");
  }, []);

  return (
    <div className="h-full overflow-auto bg-background md:bg-muted/30">
      {/* Header with map - full width on mobile */}
      <div className="md:p-4 md:pb-0">
        <ItineraryHeader
          title={title}
          destination={destination}
          origin={origin || data.origen}
          startDate={startDate}
          endDate={endDate}
          travelers={travelers}
          budget={budget}
          duration={duration}
          customImage={customImage}
          onImageResolved={onImageResolved}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Sticky tabs - scrollable on mobile */}
        <div className="sticky top-0 bg-background md:bg-muted/30 backdrop-blur-sm z-10 px-3 md:px-4 pt-3 md:pt-4 border-b md:border-b-0">
          <TabsList className="w-full justify-start h-auto p-1 bg-muted md:bg-card md:border rounded-xl overflow-x-auto flex-nowrap scrollbar-hide">
            <TabsTrigger value="itinerario" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium whitespace-nowrap flex-shrink-0">
              <Calendar className="w-4 h-4 mr-1 md:mr-1.5" />
              <span className="hidden xs:inline">{t('tabItinerario', language)}</span>
              <span className="xs:hidden">{t('tabPlan', language)}</span>
            </TabsTrigger>
            <TabsTrigger value="transporte" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium whitespace-nowrap flex-shrink-0">
              <Plane className="w-4 h-4 mr-1 md:mr-1.5" />
              <span className="hidden xs:inline">{t('tabTransporte', language)}</span>
              <span className="xs:hidden">{t('tabVuelos', language)}</span>
            </TabsTrigger>
            <TabsTrigger value="alojamiento" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium whitespace-nowrap flex-shrink-0">
              <Hotel className="w-4 h-4 mr-1 md:mr-1.5" />
              <span className="hidden xs:inline">{t('tabAlojamiento', language)}</span>
              <span className="xs:hidden">{t('tabHotel', language)}</span>
            </TabsTrigger>
            <TabsTrigger value="actividades" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium whitespace-nowrap flex-shrink-0">
              <Compass className="w-4 h-4 mr-1 md:mr-1.5" />
              <span className="hidden xs:inline">{t('tabActividades', language)}</span>
              <span className="xs:hidden">{t('tabQueVer', language)}</span>
            </TabsTrigger>
            <TabsTrigger value="info" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium whitespace-nowrap flex-shrink-0">
              <Info className="w-4 h-4 mr-1 md:mr-1.5" />
              <span className="hidden xs:inline">{t('tabInfoLocal', language)}</span>
              <span className="xs:hidden">{t('tabInfo', language)}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents - full width padding on mobile */}
        <div className="p-3 md:p-4">
          <TabsContent value="itinerario" className="mt-0">
            <TabItinerario
              days={data.itinerario || []}
              addedItems={addedItems}
              travelers={travelers}
              startDate={startDate}
              endDate={endDate}
              onAddActivity={handleNavigateToActivities}
              onAddFlight={handleNavigateToTransporte}
              onAddAccommodation={handleNavigateToAlojamiento}
              onAddCar={handleNavigateToTransporte}
            />
          </TabsContent>

          <TabsContent value="transporte" className="mt-0">
            <TabTransporte
              flights={data.transporte?.vuelos}
              carRentalRecommended={data.transporte?.alquilerCocheRecomendado}
              carOptions={data.transporte?.opcionesCoche}
              localTransport={data.transporte?.transporteLocal}
              destination={destination}
              startDate={startDate}
              endDate={endDate}
              travelers={travelers}
              onAddFlight={handleAddFlight}
              onAddCar={handleAddCar}
            />
          </TabsContent>

          <TabsContent value="alojamiento" className="mt-0">
            <TabAlojamiento
              options={data.alojamiento?.opciones}
              recommendation={data.alojamiento?.recomendacion}
              recommendedZone={data.alojamiento?.zona}
              costPerNight={data.alojamiento?.costoPorNoche}
              startDate={startDate}
              endDate={endDate}
              travelers={travelers}
              destination={destination}
              onAddAccommodation={handleAddAccommodation}
            />
          </TabsContent>

          <TabsContent value="actividades" className="mt-0">
            <TabActividades
              activities={data.actividades}
              highlights={data.resumen?.highlights}
              onAddActivity={handleAddActivity}
            />
          </TabsContent>

          <TabsContent value="info" className="mt-0">
            <TabInfoLocal
              localInfo={data.infoLocal}
              consejos={data.comentarios?.consejos}
              advertencias={data.comentarios?.advertencias}
              mejorEpoca={data.comentarios?.mejorEpoca}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ItineraryPanel;