import { useState } from "react";
import { Info, Sun, Bus, Globe, DollarSign, Lightbulb, AlertTriangle, Calendar, Thermometer } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LocalInfoData } from "./types";

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
  const [conversionAmount, setConversionAmount] = useState<number>(1000);

  const convertedAmount = localInfo?.conversionMoneda?.tipoCambio 
    ? (conversionAmount / localInfo.conversionMoneda.tipoCambio).toFixed(2)
    : null;

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Info className="w-5 h-5 text-primary" />
        Información local
      </h3>

      {/* Sub-tabs */}
      <Tabs defaultValue="clima" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-lg">
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
                {localInfo.clima.mejorEpoca && (
                  <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                    <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Mejor época para visitar</p>
                      <p className="text-sm text-blue-700">{localInfo.clima.mejorEpoca}</p>
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
                    <div className="flex flex-wrap gap-2">
                      {localInfo.transporteLocal.opciones.map((opcion, idx) => (
                        <Badge key={idx} variant="secondary">{opcion}</Badge>
                      ))}
                    </div>
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
                    <div>
                      <p className="text-sm text-muted-foreground">Idioma</p>
                      <p className="font-medium">{localInfo.cultura.idioma}</p>
                    </div>
                  )}
                  {localInfo.cultura.moneda && (
                    <div>
                      <p className="text-sm text-muted-foreground">Moneda</p>
                      <p className="font-medium">{localInfo.cultura.moneda}</p>
                    </div>
                  )}
                </div>
                
                {localInfo.cultura.propinas && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Propinas</p>
                    <p className="text-sm text-muted-foreground">{localInfo.cultura.propinas}</p>
                  </div>
                )}

                {localInfo.cultura.costumbres && localInfo.cultura.costumbres.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Costumbres locales</p>
                    <ul className="space-y-2">
                      {localInfo.cultura.costumbres.map((costumbre, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Globe className="w-4 h-4 mt-0.5 text-primary" />
                          {costumbre}
                        </li>
                      ))}
                    </ul>
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
      </Tabs>

      {/* Currency Conversion */}
      {localInfo?.conversionMoneda && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Conversión de moneda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground block mb-1">
                  {localInfo.conversionMoneda.monedaOrigen || 'MXN'}
                </label>
                <Input
                  type="number"
                  value={conversionAmount}
                  onChange={(e) => setConversionAmount(Number(e.target.value))}
                  className="text-lg font-medium"
                />
              </div>
              <span className="text-2xl text-muted-foreground">=</span>
              <div className="flex-1">
                <label className="text-sm text-muted-foreground block mb-1">
                  {localInfo.conversionMoneda.monedaLocal || 'Local'}
                </label>
                <div className="text-2xl font-bold text-primary p-2">
                  {convertedAmount || '—'}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tipo de cambio: 1 {localInfo.conversionMoneda.monedaLocal} = {localInfo.conversionMoneda.tipoCambio} {localInfo.conversionMoneda.monedaOrigen || 'MXN'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tips & Warnings */}
      <div className="space-y-4">
        {/* Consejos */}
        {consejos.length > 0 && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-green-800">
                <Lightbulb className="w-5 h-5" />
                Consejos para ahorrar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {consejos.map((consejo, idx) => (
                  <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    {consejo}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Savings Tips from localInfo */}
        {localInfo?.consejosAhorro && localInfo.consejosAhorro.length > 0 && consejos.length === 0 && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-green-800">
                <Lightbulb className="w-5 h-5" />
                Consejos para ahorrar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {localInfo.consejosAhorro.map((consejo, idx) => (
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
