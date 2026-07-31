import { ItineraryData } from "@/services/openai";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CloudSun, Bus, BookOpen, Utensils, Coins, Lightbulb } from "lucide-react";

interface LocalInfoTabProps {
    data: ItineraryData;
}

const LocalInfoTab = ({ data }: LocalInfoTabProps) => {
    const clima = data.clima;
    const transporteLocal = data.transporte?.transporteLocal;
    const gastronomia = data.gastronomia;
    const consejos = data.comentarios?.consejos || [];

    return (
        <div className="space-y-6">
            <Tabs defaultValue="clima" className="w-full">
                <TabsList className="w-full justify-start h-10 bg-gray-100 p-1 rounded-lg mb-6">
                    <TabsTrigger value="clima" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-medium rounded-md">
                        <CloudSun className="w-3.5 h-3.5 mr-2" />
                        Clima
                    </TabsTrigger>
                    <TabsTrigger value="transporte" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-medium rounded-md">
                        <Bus className="w-3.5 h-3.5 mr-2" />
                        Transporte
                    </TabsTrigger>
                    <TabsTrigger value="cultura" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-medium rounded-md">
                        <BookOpen className="w-3.5 h-3.5 mr-2" />
                        Cultura & Tips
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="clima" className="space-y-4 animate-in fade-in-50 duration-300">
                    <Card className="p-6 border-blue-100 bg-blue-50/50">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <CloudSun className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-gray-900 mb-1">{clima?.temperatura || "24°C"}</h4>
                                <p className="text-gray-700 font-medium mb-2">{clima?.descripcion || "Clima agradable y soleado."}</p>
                                <p className="text-sm text-gray-500">Recuerda revisar el pronóstico antes de salir.</p>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Mock forecast cards could go here */}
                        <div className="bg-white border border-gray-100 p-4 rounded-xl text-center">
                            <span className="text-sm text-gray-500">Mejor época para viajar</span>
                            <div className="font-semibold text-gray-900 mt-1">{data.comentarios?.mejorEpoca || "Primavera / Otoño"}</div>
                        </div>
                        <div className="bg-white border border-gray-100 p-4 rounded-xl text-center">
                            <span className="text-sm text-gray-500">Lluvias</span>
                            <div className="font-semibold text-gray-900 mt-1">Baja probabilidad</div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="transporte" className="space-y-4 animate-in fade-in-50 duration-300">
                    <Card className="p-6">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Bus className="w-5 h-5 text-green-600" />
                            Cómo moverse
                        </h4>
                        <p className="text-gray-600 leading-relaxed">
                            {transporteLocal || "El transporte público es eficiente y económico. Se recomienda usar metro o autobús para distancias largas, y caminar para explorar el centro."}
                        </p>
                    </Card>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="p-4 bg-gray-50 border-gray-200">
                            <div className="font-semibold text-gray-900 mb-1">Taxi / Apps</div>
                            <p className="text-sm text-gray-600">Uber y taxis locales disponibles 24/7.</p>
                        </Card>
                        <Card className="p-4 bg-gray-50 border-gray-200">
                            <div className="font-semibold text-gray-900 mb-1">Caminar</div>
                            <p className="text-sm text-gray-600">Ideal para distancias cortas en el centro.</p>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="cultura" className="space-y-6 animate-in fade-in-50 duration-300">

                    {/* Cultural Norms Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {data.cultura?.propinas && (
                            <Card className="p-4 bg-emerald-50 border-emerald-100">
                                <h5 className="font-bold text-emerald-800 text-sm mb-2 flex items-center gap-2">
                                    <Coins className="w-4 h-4" /> Propinas
                                </h5>
                                <p className="text-xs text-emerald-700">{data.cultura.propinas}</p>
                            </Card>
                        )}
                        {data.cultura?.vestimenta && (
                            <Card className="p-4 bg-violet-50 border-violet-100">
                                <h5 className="font-bold text-violet-800 text-sm mb-2 flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4" /> Vestimenta
                                </h5>
                                <p className="text-xs text-violet-700">{data.cultura.vestimenta}</p>
                            </Card>
                        )}
                        {data.cultura?.normas && (
                            <Card className="p-4 bg-amber-50 border-amber-100">
                                <h5 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" /> Normas
                                </h5>
                                <p className="text-xs text-amber-700">{data.cultura.normas}</p>
                            </Card>
                        )}
                    </div>

                    {/* Gastronomy Teaser */}
                    <div>
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Utensils className="w-4 h-4 text-orange-500" />
                            Gastronomía Local
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {gastronomia?.platosTipicos?.map((plato, i) => (
                                <Badge key={i} variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-100">
                                    {plato}
                                </Badge>
                            )) || <span className="text-sm text-gray-500">Explora los sabores locales.</span>}
                        </div>
                    </div>

                    {/* Tips */}
                    <div>
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            Consejos de Viaje
                        </h4>
                        <ul className="space-y-3">
                            {consejos.length > 0 ? consejos.map((consejo, i) => (
                                <li key={i} className="flex gap-3 text-sm text-gray-600 bg-yellow-50/50 p-3 rounded-lg border border-yellow-100">
                                    <span className="text-yellow-500 font-bold">•</span>
                                    {consejo}
                                </li>
                            )) : (
                                <li className="text-sm text-gray-500">No olvides llevar adaptador de corriente y pasaporte vigente.</li>
                            )}
                        </ul>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Global Bottom Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                        <Coins className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 uppercase font-medium">Moneda</div>
                        <div className="font-bold text-gray-900">Peso Mexicano (MXN)</div>
                        <div className="text-xs text-green-600">1 USD = 20.00 MXN</div>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                        <Lightbulb className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 uppercase font-medium">Ahorro</div>
                        <div className="font-bold text-gray-900">Reserva con anticipación</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocalInfoTab;
