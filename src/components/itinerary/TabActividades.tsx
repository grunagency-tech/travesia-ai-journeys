import { useState, useMemo } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/itineraryTranslations";
import { Compass, Clock, DollarSign, Plus, Filter, Search, MapPin, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ActivityOption } from "./types";
import { getActivityImage } from "@/lib/getPlaceholderImage";

interface TabActividadesProps {
  activities?: ActivityOption[];
  highlights?: string[];
  onAddActivity?: (activity: ActivityOption, day?: number, time?: string) => void;
}

const TabActividades = ({
  activities = [],
  highlights = [],
  onAddActivity
}: TabActividadesProps) => {
  const { currencySymbol, currency } = useCurrency();
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [durationFilter, setDurationFilter] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityOption | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedTime, setSelectedTime] = useState<string>("morning");
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const toggleCard = (idx: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(idx)) newExpanded.delete(idx);
    else newExpanded.add(idx);
    setExpandedCards(newExpanded);
  };

  const activityTypes = useMemo(() => {
    const types = new Set(activities.map(a => a.tipo).filter(Boolean));
    return Array.from(types) as string[];
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      if (searchTerm && !activity.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (typeFilter !== "all" && activity.tipo !== typeFilter) return false;
      if (priceFilter === "free" && activity.precio && activity.precio > 0) return false;
      if (priceFilter === "budget" && (activity.precio || 0) > 500) return false;
      if (priceFilter === "mid" && ((activity.precio || 0) < 500 || (activity.precio || 0) > 2000)) return false;
      if (priceFilter === "premium" && (activity.precio || 0) < 2000) return false;
      return true;
    });
  }, [activities, searchTerm, typeFilter, priceFilter, durationFilter]);

  const handleAddClick = (activity: ActivityOption) => {
    setSelectedActivity(activity);
    setAddDialogOpen(true);
  };

  const handleConfirmAdd = () => {
    if (selectedActivity) onAddActivity?.(selectedActivity, selectedDay, selectedTime);
    setAddDialogOpen(false);
    setSelectedActivity(null);
  };

  const getImageForActivity = (activity: ActivityOption): string => {
    if (activity.imagen) return activity.imagen;
    return getActivityImage(activity.nombre, activity.tipo);
  };

  const hasActivities = activities.length > 0;

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Compass className="w-5 h-5 text-primary" />
        {t('actividadesDisponibles', language)}
      </h3>

      {hasActivities ? (
        <>
          {/* Filters */}
          <div className="bg-card rounded-xl border p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder={t('buscarActividades', language)} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              {activityTypes.length > 0 && (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('todosLosTipos', language)}</SelectItem>
                    {activityTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                  </SelectContent>
                </Select>
              )}
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder={t('cualquierPrecio', language)} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('cualquierPrecio', language)}</SelectItem>
                  <SelectItem value="free">{t('gratis', language)}</SelectItem>
                  <SelectItem value="budget">{t('hasta500', language)}</SelectItem>
                  <SelectItem value="mid">{t('de500a2000', language)}</SelectItem>
                  <SelectItem value="premium">{t('mas2000', language)}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={durationFilter} onValueChange={setDurationFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder={t('cualquierDuracion', language)} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('cualquierDuracion', language)}</SelectItem>
                  <SelectItem value="short">{t('menosDe2h', language)}</SelectItem>
                  <SelectItem value="medium">{t('de2a4h', language)}</SelectItem>
                  <SelectItem value="long">{t('masDe4h', language)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredActivities.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredActivities.map((activity, idx) => {
                const isExpanded = expandedCards.has(idx);
                return (
                  <Card key={idx} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="h-44 bg-muted relative overflow-hidden">
                        <img src={getImageForActivity(activity)} alt={activity.nombre} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 absolute inset-0">
                          <Compass className="w-12 h-12 text-orange-400" />
                        </div>
                        {activity.tipo && <Badge className="absolute top-2 left-2 bg-black/60 text-white text-xs">{activity.tipo}</Badge>}
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold mb-1">{activity.nombre}</h4>
                        {activity.descripcion && (
                          <div className="mb-2">
                            <p className={`text-sm text-muted-foreground ${isExpanded ? '' : 'line-clamp-2'}`}>{activity.descripcion}</p>
                            {activity.descripcion.length > 100 && (
                              <Button variant="ghost" size="sm" className="text-xs h-6 px-1 text-primary hover:text-primary/80 -ml-1" onClick={() => toggleCard(idx)}>
                                <ChevronDown className={`w-3 h-3 mr-0.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                {isExpanded ? t('verMenos', language) : t('verMas', language)}
                              </Button>
                            )}
                          </div>
                        )}
                        <div className={`space-y-1 mb-3 ${isExpanded ? '' : 'max-h-12 overflow-hidden'}`}>
                          {activity.ubicacion && (
                            <p className="text-xs text-muted-foreground flex items-start gap-1">
                              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span className={isExpanded ? '' : 'line-clamp-1'}>{activity.ubicacion}</span>
                            </p>
                          )}
                          {activity.horarios && (
                            <p className="text-xs text-muted-foreground flex items-start gap-1">
                              <Calendar className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span className={isExpanded ? '' : 'line-clamp-1'}>{activity.horarios}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          {activity.duracion && (<span className="flex items-center gap-1"><Clock className="w-4 h-4" />{activity.duracion}</span>)}
                          <span className={`flex items-center gap-1 ${activity.precio && activity.precio > 0 ? '' : 'text-green-600'}`}>
                            <DollarSign className="w-4 h-4" />
                            {activity.precio && activity.precio > 0 ? `${currencySymbol}${activity.precio.toLocaleString()} ${currency}` : t('gratis', language)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="default" className="flex-1" onClick={() => handleAddClick(activity)}>
                            <Plus className="w-4 h-4 mr-1" />{t('agregar', language)}
                          </Button>
                        </div>
                        {activity.etiquetas && activity.etiquetas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {activity.etiquetas.slice(0, isExpanded ? undefined : 3).map((tag, tagIdx) => (
                              <Badge key={tagIdx} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                            {!isExpanded && activity.etiquetas.length > 3 && (
                              <Badge variant="outline" className="text-xs text-muted-foreground">+{activity.etiquetas.length - 3}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">
              <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{t('sinResultados', language)}</p>
            </div>
          )}
        </>
      ) : highlights.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('actividadesDestacadas', language)}</p>
          {highlights.map((highlight, idx) => (
            <div key={idx} className="bg-card rounded-xl border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">{idx + 1}</div>
              <p className="flex-1">{highlight}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl">
          <Compass className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">{t('noActividades', language)}</p>
          <p className="text-sm mt-1">{t('opcionesAparecen', language)}</p>
        </div>
      )}

      {/* Add Activity Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('agregarAlItinerario', language)}</DialogTitle></DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                {t('seleccionaDia', language)} <strong>{selectedActivity.nombre}</strong>
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('dia', language)}</label>
                  <Select value={String(selectedDay)} onValueChange={(v) => setSelectedDay(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7].map(day => (
                        <SelectItem key={day} value={String(day)}>{t('dia', language)} {day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('horario', language)}</label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">{t('manana', language)}</SelectItem>
                      <SelectItem value="afternoon">{t('tarde', language)}</SelectItem>
                      <SelectItem value="evening">{t('noche', language)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>{t('cancelar', language)}</Button>
            <Button onClick={handleConfirmAdd}>{t('agregarAlDia', language)} {selectedDay}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TabActividades;
