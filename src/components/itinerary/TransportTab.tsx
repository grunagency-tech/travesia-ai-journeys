import { ItineraryData } from "@/services/openai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Car, Clock, ArrowRight, Star } from "lucide-react";

interface TransportTabProps {
    data: ItineraryData;
}

const TransportTab = ({ data }: TransportTabProps) => {
    const flights = data.transporte?.vuelos || [];

    return (
        <div className="space-y-8">
            {/* Flights Section */}
            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Plane className="w-5 h-5 text-blue-600" />
                    Vuelos recomendados
                </h3>

                <div className="space-y-4">
                    {flights.length > 0 ? (
                        flights.slice(0, 3).map((flight: any, idx) => (
                            <Card key={idx} className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row">
                                    {/* Flight Details */}
                                    <div className="flex-1 p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                {/* Placeholder logo */}
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {flight.aerolinea ? flight.aerolinea[0] : 'A'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{flight.aerolinea}</h4>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                        <span>4.5</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-bold text-gray-900">${flight.precio?.toLocaleString()}</div>
                                                <div className="text-xs text-gray-500">por persona</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 sm:gap-8 justify-between sm:justify-start">
                                            <div className="text-center sm:text-left">
                                                <div className="text-lg font-bold text-gray-900">{flight.fechaSalida ? new Date(flight.fechaSalida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'}</div>
                                                <div className="text-xs text-gray-500">{flight.origen || "N/A"}</div>
                                            </div>

                                            <div className="flex-1 px-4 flex flex-col items-center">
                                                <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {/* Mock Data for duration/stops if missing */}
                                                    {flight.duracion || "4h 30m"}
                                                </div>
                                                <div className="w-full h-[2px] bg-gray-200 relative">
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-400">
                                                        {flight.escalas === 0 ? "Directo" : "1 escala"}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-center sm:text-right">
                                                <div className="text-lg font-bold text-gray-900">{flight.fechaLlegada ? new Date(flight.fechaLlegada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'}</div>
                                                <div className="text-xs text-gray-500">{flight.destino || "N/A"}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="bg-gray-50 p-4 flex items-center justify-center min-w-[140px] border-t sm:border-t-0 sm:border-l border-gray-100">
                                        {flight.link ? (
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md" asChild>
                                                <a href={flight.link} target="_blank" rel="noopener noreferrer">
                                                    Ver Oferta
                                                </a>
                                            </Button>
                                        ) : (
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                                                Consultar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">
                            No se encontraron vuelos en este momento.
                        </div>
                    )}

                    <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        Ver más opciones <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </section>

            {/* Car Rental Section */}
            <section className="bg-orange-50 rounded-xl p-6 border border-orange-100">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                        <Car className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-1">¿Es buena idea alquilar coche?</h4>
                        <p className="text-sm text-gray-600 mb-4">
                            En {data.destino || "este destino"}, alquilar un coche te dará libertad para explorar zonas alejadas.
                        </p>

                        <div className="flex gap-3">
                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                                Sí, ver opciones
                            </Button>
                            <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-100">
                                No, gracias
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TransportTab;
