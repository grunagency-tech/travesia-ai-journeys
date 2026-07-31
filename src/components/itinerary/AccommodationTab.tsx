import { ItineraryData } from "@/services/openai";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Hotel, MapPin, Star, Wifi, Coffee, ArrowRight, ExternalLink } from "lucide-react";

interface AccommodationTabProps {
    data: ItineraryData;
}

const AccommodationTab = ({ data }: AccommodationTabProps) => {
    const hotels = Array.isArray(data.alojamiento?.recomendaciones) ? data.alojamiento?.recomendaciones : [];

    return (
        <div className="space-y-8">
            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Hotel className="w-5 h-5 text-amber-500" />
                    Mejores opciones de alojamiento
                </h3>

                <div className="grid grid-cols-1 gap-4">
                    {hotels.length > 0 ? (
                        hotels.slice(0, 3).map((hotel, idx) => (
                            <Card key={idx} className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex flex-col sm:flex-row h-full">
                                    {/* Image Placeholder */}
                                    <div className="w-full sm:w-48 bg-gray-200 relative min-h-[160px]">
                                        {/* We could use a real image search here if available, or a reliable placeholder */}
                                        <img
                                            src={`https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80&random=${idx}`}
                                            alt={hotel.nombre}
                                            className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold shadow-sm">
                                            {hotel.tipo}
                                        </div>
                                    </div>

                                    <div className="flex-1 p-5 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-lg text-gray-900 line-clamp-1">{hotel.nombre}</h4>
                                                <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold">
                                                    4.5 <Star className="w-3 h-3 fill-green-700" />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1 mb-3">
                                                <MapPin className="w-4 h-4" />
                                                {hotel.zona}
                                            </div>

                                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                {hotel.razon || "Excelente ubicación y servicios de primera clase para una estancia inolvidable."}
                                            </p>

                                            <div className="flex gap-3 mb-4">
                                                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                    <Wifi className="w-3 h-3" /> Wifi gratis
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                    <Coffee className="w-3 h-3" /> Desayuno
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                            <div>
                                                <span className="text-2xl font-bold text-gray-900">${typeof hotel.costo === 'number' ? hotel.costo.toLocaleString() : hotel.costo}</span>
                                                <span className="text-xs text-gray-500 ml-1">/ noche</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {hotel.link && (
                                                    <Button variant="outline" size="sm" className="text-gray-600" asChild>
                                                        <a href={hotel.link} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="w-4 h-4 mr-1" />
                                                            Ver
                                                        </a>
                                                    </Button>
                                                )}
                                                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                                                    Agregar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">
                            No hay recomendaciones de alojamiento disponibles.
                        </div>
                    )}
                </div>

                <div className="mt-4 text-center">
                    <Button variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                        Ver más opciones <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </section>
        </div>
    );
};

export default AccommodationTab;
