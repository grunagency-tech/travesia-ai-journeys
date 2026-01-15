import { useState, useCallback } from "react";
import { Calendar, Plane, Hotel, Compass, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
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
  origin,
  startDate, 
  endDate, 
  travelers = 1,
  customImage 
}: ItineraryPanelProps) => {
  const { toast } = useToast();
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

  const destination = inferDestination();
  const title = data.resumen?.titulo || `Tu viaje a ${destination}`;
  const budget = data.resumen?.presupuestoEstimado;
  const duration = data.itinerario?.length || data.resumen?.duracion;

  // Handle adding activity to itinerary
  const handleAddActivity = useCallback((activity: ActivityOption, day?: number, time?: string) => {
    const newItem: AddedItem = {
      type: 'activity',
      item: activity,
      day: day || 1,
      time: time
    };
    
    setAddedItems(prev => [...prev, newItem]);
    
    toast({
      title: "Actividad agregada",
      description: `${activity.nombre} se agregó al Día ${day || 1}`,
    });

    // Switch to itinerary tab to show the addition
    setActiveTab("itinerario");
  }, [toast]);

  // Navigate to activities tab
  const handleNavigateToActivities = useCallback(() => {
    setActiveTab("actividades");
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
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Sticky tabs - scrollable on mobile */}
        <div className="sticky top-0 bg-background md:bg-muted/30 backdrop-blur-sm z-10 px-3 md:px-4 pt-3 md:pt-4 border-b md:border-b-0">
          <TabsList className="w-full justify-start h-auto p-1 bg-muted md:bg-card md:border rounded-xl overflow-x-auto flex-nowrap scrollbar-hide">
            <TabsTrigger 
              value="itinerario" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium whitespace-nowrap flex-shrink-0"
            >
              <Calendar className="w-4 h-4 mr-1 md:mr-1.5" />
              <span className="hidden xs:inline">Itinerario</span>
              <span className="xs:hidden">Plan</span>
            </TabsTrigger>
            <TabsTrigger 
              value="transporte"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium whitespace-nowrap flex-shrink-0"
            >
              <Plane className="w-4 h-4 mr-1 md:mr-1.5" />
              <span className="hidden xs:inline">Transporte</span>
              <span className="xs:hidden">Vuelos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="alojamiento"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium whitespace-nowrap flex-shrink-0"
            >
              <Hotel className="w-4 h-4 mr-1 md:mr-1.5" />
              <span className="hidden xs:inline">Alojamiento</span>
              <span className="xs:hidden">Hotel</span>
            </TabsTrigger>
            <TabsTrigger 
              value="actividades"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium whitespace-nowrap flex-shrink-0"
            >
              <Compass className="w-4 h-4 mr-1 md:mr-1.5" />
              <span className="hidden xs:inline">Actividades</span>
              <span className="xs:hidden">Qué ver</span>
            </TabsTrigger>
            <TabsTrigger 
              value="info"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium whitespace-nowrap flex-shrink-0"
            >
              <Info className="w-4 h-4 mr-1 md:mr-1.5" />
              <span className="hidden xs:inline">Info Local</span>
              <span className="xs:hidden">Info</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents - full width padding on mobile */}
        <div className="p-3 md:p-4">
          <TabsContent value="itinerario" className="mt-0">
            <TabItinerario 
              days={data.itinerario || []} 
              addedItems={addedItems}
              onAddActivity={handleNavigateToActivities}
            />
          </TabsContent>

          <TabsContent value="transporte" className="mt-0">
            <TabTransporte
              flights={data.transporte?.vuelos}
              carRentalRecommended={data.transporte?.alquilerCocheRecomendado}
              carOptions={data.transporte?.opcionesCoche}
              localTransport={data.transporte?.transporteLocal}
            />
          </TabsContent>

          <TabsContent value="alojamiento" className="mt-0">
            <TabAlojamiento
              options={data.alojamiento?.opciones}
              recommendation={data.alojamiento?.recomendacion}
              recommendedZone={data.alojamiento?.zona}
              costPerNight={data.alojamiento?.costoPorNoche}
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