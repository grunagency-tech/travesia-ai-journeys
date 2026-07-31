import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItineraryData } from "@/services/openai";
import ItineraryHeader from "@/components/ItineraryHeader";
import { Calendar, Plane, Hotel, Activity, Info } from "lucide-react";
import ItineraryTab from "./ItineraryTab";
import TransportTab from "./TransportTab";
import AccommodationTab from "./AccommodationTab";
import ActivitiesTab from "./ActivitiesTab";
import LocalInfoTab from "./LocalInfoTab";

interface ItineraryContainerProps {
    data: ItineraryData;
    flightData?: any[];
    customImage?: string;
}

const ItineraryContainer = ({ data, flightData, customImage }: ItineraryContainerProps) => {
    // Merge flight data if available
    const mergedData = { ...data };
    if (flightData && flightData.length > 0) {
        mergedData.transporte = {
            ...mergedData.transporte,
            vuelos: flightData.map(f => ({
                aerolinea: f.airline || f.aerolinea || 'N/A',
                precio: f.price || f.precio || 0,
                fechaSalida: f.departure_at || f.fechaSalida,
                fechaLlegada: f.return_at || f.fechaLlegada, // Simplify for one way
                origen: f.origin || f.origen,
                destino: f.destination || f.destino,
                ...f // keep other props
            }))
        };
    }

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <div className="p-6 pb-0">
                <ItineraryHeader
                    title={data.resumen.titulo}
                    destination={data.destino}
                    // Assuming dates are in collected_data or inferred from itinerary
                    // For now purely relying on what data we have. 
                    // Note: ItineraryData interface might need check for exact date fields if not in top level
                    // ItineraryData from openai.ts has itinerary array with dates.
                    startDate={data.itinerario?.[0]?.fecha}
                    endDate={data.itinerario?.[data.itinerario.length - 1]?.fecha}
                    travelers={data.collected_data?.passengers}
                    price={`$${data.resumen.presupuestoEstimado?.toLocaleString()} MXN`}
                    customImage={customImage}
                />
            </div>

            <Tabs defaultValue="itinerario" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 border-b border-gray-200 bg-white">
                    <TabsList className="w-full justify-start h-12 bg-transparent p-0 gap-6">
                        <TabsTrigger
                            value="itinerario"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 pb-2 text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Itinerario</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="transporte"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 pb-2 text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Plane className="w-4 h-4" />
                                <span>Transporte</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="alojamiento"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 pb-2 text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Hotel className="w-4 h-4" />
                                <span>Alojamiento</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="actividades"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 pb-2 text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                <span>Actividades</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="info"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 pb-2 text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                <span>Info Local</span>
                            </div>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-auto bg-slate-50/50">
                    <TabsContent value="itinerario" className="h-full m-0">
                        <div className="p-6">
                            <ItineraryTab data={mergedData} />
                        </div>
                    </TabsContent>

                    <TabsContent value="transporte" className="h-full m-0">
                        <div className="p-6">
                            <TransportTab data={mergedData} />
                        </div>
                    </TabsContent>

                    <TabsContent value="alojamiento" className="h-full m-0">
                        <div className="p-6">
                            <AccommodationTab data={mergedData} />
                        </div>
                    </TabsContent>

                    <TabsContent value="actividades" className="h-full m-0">
                        <div className="p-6">
                            <ActivitiesTab data={mergedData} />
                        </div>
                    </TabsContent>

                    <TabsContent value="info" className="h-full m-0">
                        <div className="p-6">
                            <LocalInfoTab data={mergedData} />
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};

export default ItineraryContainer;
