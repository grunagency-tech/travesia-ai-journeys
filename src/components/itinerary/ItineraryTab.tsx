import { ItineraryData } from "@/services/openai";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PlusCircle, Eye, CalendarClock, MapPin } from "lucide-react";

interface ItineraryTabProps {
    data: ItineraryData;
}

const ItineraryTab = ({ data }: ItineraryTabProps) => {
    const itinerario = data.itinerario || [];

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-100">
                <Button variant="outline" size="sm" className="gap-2 text-indigo-600 border-indigo-100 hover:bg-indigo-50">
                    <Eye className="w-4 h-4" />
                    Vista rápida
                </Button>
                <Button variant="outline" size="sm" className="gap-2 hover:bg-slate-50">
                    <PlusCircle className="w-4 h-4" />
                    Agregar vuelo
                </Button>
                <Button variant="outline" size="sm" className="gap-2 hover:bg-slate-50">
                    <PlusCircle className="w-4 h-4" />
                    Agregar alojamiento
                </Button>
                <Button variant="outline" size="sm" className="gap-2 hover:bg-slate-50">
                    <PlusCircle className="w-4 h-4" />
                    Agregar coche
                </Button>
                <Button variant="outline" size="sm" className="gap-2 hover:bg-slate-50">
                    <PlusCircle className="w-4 h-4" />
                    Agregar actividad
                </Button>
            </div>

            {/* Accordion List */}
            <Accordion type="single" collapsible className="w-full space-y-4">
                {itinerario.map((day, index) => (
                    <AccordionItem
                        key={index}
                        value={`day-${day.dia}`}
                        className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm"
                    >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline bg-white hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4 text-left w-full">
                                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex flex-col items-center justify-center text-indigo-700 shrink-0">
                                    <span className="text-xs font-semibold uppercase">Día</span>
                                    <span className="text-xl font-bold leading-none">{day.dia}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-900">
                                            {day.fecha ? new Date(day.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : `Día ${day.dia}`}
                                        </span>
                                        {/* Placeholder for weather or city if available per day */}
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-1">{day.resumenDia || "Exploración y actividades"}</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 bg-gray-50/50">
                            <div className="pt-4 space-y-3 pl-4 border-l-2 border-indigo-100 ml-6">
                                {day.actividades.map((act, actIdx) => (
                                    <div key={actIdx} className="relative pl-6 pb-2 last:pb-0">
                                        {/* Timeline dot */}
                                        <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full border-2 border-white bg-indigo-400 shadow-sm"></div>

                                        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className="font-medium text-gray-900">{act.titulo}</h4>
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                                                    {act.hora === 'morning' ? 'Mañana' : act.hora === 'afternoon' ? 'Tarde' : act.hora === 'evening' ? 'Noche' : act.hora}
                                                </span>
                                            </div>

                                            {act.descripcion && (
                                                <p className="text-sm text-gray-600 mt-1">{act.descripcion}</p>
                                            )}

                                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                                                {act.ubicacion && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {act.ubicacion}
                                                    </div>
                                                )}
                                                {act.costoAprox > 0 ? (
                                                    <div className="font-medium text-green-600">
                                                        ${act.costoAprox}
                                                    </div>
                                                ) : (
                                                    <div className="font-medium text-green-600">Gratis</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};

export default ItineraryTab;
