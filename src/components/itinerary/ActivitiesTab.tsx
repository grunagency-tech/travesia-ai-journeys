import { ItineraryData } from "@/services/openai";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, DollarSign, Filter, MapPin } from "lucide-react";
import { useState } from "react";

interface ActivitiesTabProps {
    data: ItineraryData;
}

const getActivityImage = (title: string, destination?: string) => {
    const t = title.toLowerCase();

    // Museums & Culture
    if (t.includes('museo') || t.includes('galería') || t.includes('arte') || t.includes('historia') || t.includes('palacio') || t.includes('castillo')) {
        return "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=600&q=80"; // Bright Museum Gallery
    }
    // Food & Dining
    if (t.includes('comida') || t.includes('cena') || t.includes('almuerzo') || t.includes('gastronim') || t.includes('mercado') || t.includes('restaurante') || t.includes('bar') || t.includes('taco') || t.includes('sushi') || t.includes('pizza')) {
        return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80"; // Delicious Food Spread
    }
    // Outdoors & Nature
    if (t.includes('parque') || t.includes('jardín') || t.includes('caminata') || t.includes('paseo') || t.includes('aire libre') || t.includes('playa') || t.includes('naturaleza') || t.includes('montaña')) {
        return "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80"; // Forest/Park Path
    }
    // Shopping
    if (t.includes('compra') || t.includes('shopping') || t.includes('tienda') || t.includes('centro comercial') || t.includes('mall')) {
        return "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80"; // Shopping Bags/Street
    }
    // Landmarks / Generic City
    if (t.includes('tour') || t.includes('visita') || t.includes('centro') || t.includes('plaza') || t.includes('barrio')) {
        return "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80"; // City view
    }

    // Default Fallback (Generic Travel)
    return "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80";
};

const ActivitiesTab = ({ data }: ActivitiesTabProps) => {
    // Extract all activities from the itinerary
    const allActivities = Array.isArray(data.itinerario) ? data.itinerario.flatMap(day =>
        Array.isArray(day.actividades) ? day.actividades.map(act => ({
            ...act,
            day: day.dia
        })) : []
    ) : [];

    const [filter, setFilter] = useState("all");

    return (
        <div className="space-y-6">
            {/* Header & Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-600" />
                        Actividades y Experiencias
                    </h3>
                    <p className="text-sm text-gray-500">Explora las mejores actividades de tu viaje</p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2 text-gray-600">
                        <Filter className="w-4 h-4" /> Filtros
                    </Button>
                    {/* Mock filters for visual completeness */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setFilter("all")}
                            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${filter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setFilter("paid")}
                            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${filter === 'paid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            De pago
                        </button>
                        <button
                            onClick={() => setFilter("free")}
                            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${filter === 'free' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Gratis
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allActivities.length > 0 ? (
                    allActivities.map((act, idx) => (
                        <Card key={idx} className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
                            <div className="h-40 bg-gray-200 relative overflow-hidden">
                                <img
                                    src={getActivityImage(act.titulo, data.destino)}
                                    alt={act.titulo}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute top-2 right-2">
                                    <Badge variant="secondary" className="bg-white/90 backdrop-blur text-gray-800 font-bold border-0 shadow-sm">
                                        Día {act.day}
                                    </Badge>
                                </div>
                            </div>

                            <div className="p-4 flex-1 flex flex-col">
                                <h4 className="font-bold text-gray-900 mb-2 line-clamp-1" title={act.titulo}>{act.titulo}</h4>
                                <p className="text-sm text-gray-600 line-clamp-2 flex-1 mb-4" title={act.descripcion}>
                                    {act.descripcion || "Disfruta de esta increíble experiencia en tu viaje."}
                                </p>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{act.hora === 'morning' ? 'Mañana' : act.hora === 'afternoon' ? 'Tarde' : 'Noche'} (2-3h aprox)</span>
                                    </div>
                                    {act.ubicacion && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="truncate">{act.ubicacion}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                                    <div className="font-bold text-gray-900 flex items-center">
                                        {act.costoAprox > 0 ? `$${act.costoAprox}` : 'Gratis'}
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 text-xs border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800" asChild>
                                        <a href={act.link || `https://www.google.com/search?q=${encodeURIComponent(act.titulo + " " + (data.destino || ""))}`} target="_blank" rel="noopener noreferrer">
                                            Ver más
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        No se encontraron actividades específicas en el itinerario.
                    </div>
                )}

                {/* Placeholder "Add Custom Activity" Card */}
                <button className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-all h-full min-h-[300px]">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                        <Activity className="w-6 h-6" />
                    </div>
                    <span className="font-medium text-sm">Explorar más actividades</span>
                </button>
            </div>
        </div>
    );
};

export default ActivitiesTab;
