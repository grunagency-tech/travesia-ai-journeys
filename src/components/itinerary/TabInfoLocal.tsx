import { useState } from "react";
import { Info, Sun, Bus, Globe, DollarSign, Lightbulb, AlertTriangle, Calendar, Thermometer, Utensils, Shield, Phone, Shirt, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LocalInfoData, TransportOption } from "./types";

interface TabInfoLocalProps {
  localInfo?: LocalInfoData;
  consejos?: string[];
  advertencias?: string[];
  mejorEpoca?: string;
}

const TabInfoLocal = ({
  localInfo,
  consejos = [],
  advertencias = [],
  mejorEpoca
}: TabInfoLocalProps) => {
  const [conversionAmount, setConversionAmount] = useState<number>(100);

  const convertedAmount = localInfo?.conversionMoneda?.tipoCambio 
    ? (conversionAmount * localInfo.conversionMoneda.tipoCambio).toFixed(2)
    : null;

  // Helper to render transport options
  const renderTransportOption = (opcion: string | TransportOption, idx: number) => {
    if (typeof opcion === 'string') {
      return <Badge key={idx} variant="secondary">{opcion}</Badge>;
    }
    return (
      <div key={idx} className="p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{opcion.tipo}</span>
          {opcion.recomendado && <Badge className="bg-green-100 text-green-700 text-xs">Recomendado</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{opcion.descripcion}</p>
        {opcion.costoAproximado && (
          <p className="text-sm text-primary mt-1">💰 {opcion.costoAproximado}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Info className="w-5 h-5 text-primary" />
        Información local
      </h3>

      {/* Sub-tabs */}
      <Tabs defaultValue="clima" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-lg flex-wrap h-auto">
          <TabsTrigger value="clima" className="rounded-md">
            <Sun className="w-4 h-4 mr-1.5" />
            Clima
          </TabsTrigger>
          <TabsTrigger value="transporte" className="rounded-md">
            <Bus className="w-4 h-4 mr-1.5" />
            Transporte
          </TabsTrigger>
          <TabsTrigger value="cultura" className="rounded-md">
            <Globe className="w-4 h-4 mr-1.5" />
            Cultura
          </TabsTrigger>
          <TabsTrigger value="gastronomia" className="rounded-md">
            <Utensils className="w-4 h-4 mr-1.5" />
            Gastronomía
          </TabsTrigger>
          <TabsTrigger value="seguridad" className="rounded-md">
            <Shield className="w-4 h-4 mr-1.5" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        {/* Clima Tab */}
        <TabsContent value="clima" className="mt-4 space-y-4">
          {localInfo?.clima ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Sun className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div>
                    {localInfo.clima.temperatura && (
                      <p className="text-2xl font-bold">{localInfo.clima.temperatura}</p>
                    )}
                    {localInfo.clima.descripcion && (
                      <p className="text-muted-foreground">{localInfo.clima.descripcion}</p>
                    )}
                  </div>
                </div>
                {(localInfo.clima.mejorEpoca || mejorEpoca) && (
                  <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                    <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Mejor época para visitar</p>
                      <p className="text-sm text-blue-700">{localInfo.clima.mejorEpoca || mejorEpoca}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : mejorEpoca ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Mejor época para visitar</p>
                    <p className="text-muted-foreground">{mejorEpoca}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">
              <Thermometer className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No hay información de clima disponible</p>
            </div>
          )}
        </TabsContent>

        {/* Transporte Tab */}
        <TabsContent value="transporte" className="mt-4 space-y-4">
          {localInfo?.transporteLocal ? (
            <Card>
              <CardContent className="p-4 space-y-4">
                {localInfo.transporteLocal.descripcion && (
                  <p className="text-muted-foreground">{localInfo.transporteLocal.descripcion}</p>
                )}
                
                {localInfo.transporteLocal.opciones && localInfo.transporteLocal.opciones.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Opciones de transporte:</p>
                    <div className="space-y-2">
                      {localInfo.transporteLocal.opciones.map((opcion, idx) => renderTransportOption(opcion, idx))}
                    </div>
                  </div>
                )}

                {localInfo.transporteLocal.tarjetasTransporte && (
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-purple-900 mb-1">🎫 Tarjetas de transporte</p>
                    <p className="text-sm text-purple-700">{localInfo.transporteLocal.tarjetasTransporte}</p>
                  </div>
                )}

                {localInfo.transporteLocal.consejos && localInfo.transporteLocal.consejos.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-900 mb-2">💡 Consejos</p>
                    <ul className="space-y-1">
                      {localInfo.transporteLocal.consejos.map((consejo, idx) => (
                        <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                          <span className="text-green-500">•</span>
                          {consejo}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">
              <Bus className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No hay información de transporte disponible</p>
            </div>
          )}
        </TabsContent>

        {/* Cultura Tab */}
        <TabsContent value="cultura" className="mt-4 space-y-4">
          {localInfo?.cultura ? (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {localInfo.cultura.idioma && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">🗣️ Idioma</p>
                      <p className="font-medium">{localInfo.cultura.idioma}</p>
                    </div>
                  )}
                  {localInfo.cultura.moneda && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">💵 Moneda</p>
                      <p className="font-medium">{localInfo.cultura.moneda}</p>
                    </div>
                  )}
                </div>
                
                {localInfo.cultura.propinas && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">💰 Propinas</p>
                    <p className="text-sm text-muted-foreground">{localInfo.cultura.propinas}</p>
                  </div>
                )}

                {localInfo.cultura.vestimenta && (
                  <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                    <Shirt className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Vestimenta recomendada</p>
                      <p className="text-sm text-blue-700">{localInfo.cultura.vestimenta}</p>
                    </div>
                  </div>
                )}

                {localInfo.cultura.saludos && (
                  <div className="bg-purple-50 rounded-lg p-3 flex items-start gap-2">
                    <Users className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-purple-900">Saludos y etiqueta</p>
                      <p className="text-sm text-purple-700">{localInfo.cultura.saludos}</p>
                    </div>
                  </div>
                )}

                {localInfo.cultura.costumbres && localInfo.cultura.costumbres.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">📚 Costumbres locales</p>
                    <ul className="space-y-2">
                      {localInfo.cultura.costumbres.map((costumbre, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Globe className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                          {costumbre}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {localInfo.cultura.festividades && (
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-orange-900 mb-1">🎉 Festividades</p>
                    <p className="text-sm text-orange-700">{localInfo.cultura.festividades}</p>
                  </div>
                )}

                {/* Currency Conversion - inside Cultura tab */}
                {localInfo.conversionMoneda && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100 mt-4">
                    <p className="text-sm font-medium text-green-900 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Conversión de moneda
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-xs text-green-700 block mb-1">
                          {localInfo.conversionMoneda.monedaOrigen || 'USD'}
                        </label>
                        <Input
                          type="number"
                          value={conversionAmount}
                          onChange={(e) => setConversionAmount(Number(e.target.value))}
                          className="text-lg font-medium bg-white"
                        />
                      </div>
                      <span className="text-xl text-green-600">=</span>
                      <div className="flex-1">
                        <label className="text-xs text-green-700 block mb-1">
                          {localInfo.conversionMoneda.monedaLocal || 'Local'}
                        </label>
                        <div className="text-xl font-bold text-green-700 p-2 bg-white rounded-md border">
                          {convertedAmount || '—'}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      Tipo de cambio: 1 {localInfo.conversionMoneda.monedaOrigen || 'USD'} = {localInfo.conversionMoneda.tipoCambio} {localInfo.conversionMoneda.monedaLocal}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">
              <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No hay información cultural disponible</p>
            </div>
          )}
        </TabsContent>

        {/* Gastronomía Tab */}
        <TabsContent value="gastronomia" className="mt-4 space-y-4">
          {localInfo?.cultura?.comidaTradicional && localInfo.cultura.comidaTradicional.length > 0 ? (
            <Card>
              <CardContent className="p-4 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-600" />
                  Comida tradicional
                </h4>
                <div className="grid gap-3">
                  {localInfo.cultura.comidaTradicional.map((plato, idx) => (
                    <div key={idx} className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <p className="text-sm text-orange-800">{plato}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">
              <Utensils className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No hay información de gastronomía disponible</p>
            </div>
          )}
        </TabsContent>

        {/* Seguridad Tab */}
        <TabsContent value="seguridad" className="mt-4 space-y-4">
          {localInfo?.seguridad ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  {localInfo.seguridad.nivelSeguridad && (
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        localInfo.seguridad.nivelSeguridad.toLowerCase() === 'alto' ? 'bg-green-100' :
                        localInfo.seguridad.nivelSeguridad.toLowerCase() === 'medio' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        <Shield className={`w-6 h-6 ${
                          localInfo.seguridad.nivelSeguridad.toLowerCase() === 'alto' ? 'text-green-600' :
                          localInfo.seguridad.nivelSeguridad.toLowerCase() === 'medio' ? 'text-yellow-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Nivel de seguridad</p>
                        <p className="font-semibold text-lg">{localInfo.seguridad.nivelSeguridad}</p>
                      </div>
                    </div>
                  )}

                  {localInfo.seguridad.zonasEvitar && localInfo.seguridad.zonasEvitar.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                      <p className="text-sm font-medium text-red-900 mb-2">⚠️ Zonas a evitar</p>
                      <ul className="space-y-1">
                        {localInfo.seguridad.zonasEvitar.map((zona, idx) => (
                          <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            {zona}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {localInfo.seguridad.consejos && localInfo.seguridad.consejos.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-sm font-medium text-blue-900 mb-2">🛡️ Consejos de seguridad</p>
                      <ul className="space-y-1">
                        {localInfo.seguridad.consejos.map((consejo, idx) => (
                          <li key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                            <span className="text-blue-500">•</span>
                            {consejo}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contactos Útiles */}
              {localInfo.contactosUtiles && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Phone className="w-5 h-5 text-green-600" />
                      Contactos útiles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {localInfo.contactosUtiles.emergencias && (
                      <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                        <span className="text-sm font-medium text-red-900">🚨 Emergencias</span>
                        <span className="font-mono font-bold text-red-700">{localInfo.contactosUtiles.emergencias}</span>
                      </div>
                    )}
                    {localInfo.contactosUtiles.policiaTuristica && (
                      <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium text-blue-900">👮 Policía turística</span>
                        <span className="font-mono text-blue-700">{localInfo.contactosUtiles.policiaTuristica}</span>
                      </div>
                    )}
                    {localInfo.contactosUtiles.embajada && (
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <span className="text-sm font-medium text-purple-900">🏛️ Embajada</span>
                        <p className="text-sm text-purple-700 mt-1">{localInfo.contactosUtiles.embajada}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No hay información de seguridad disponible</p>
            </div>
          )}
        </TabsContent>
      </Tabs>


      {/* Tips & Warnings */}
      <div className="space-y-4">
        {/* Consejos de ahorro */}
        {(consejos.length > 0 || (localInfo?.consejosAhorro && localInfo.consejosAhorro.length > 0)) && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-green-800">
                <Lightbulb className="w-5 h-5" />
                Consejos para ahorrar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(consejos.length > 0 ? consejos : localInfo?.consejosAhorro || []).map((consejo, idx) => (
                  <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    {consejo}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Advertencias */}
        {advertencias.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5" />
                Advertencias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {advertencias.map((adv, idx) => (
                  <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    {adv}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TabInfoLocal;
