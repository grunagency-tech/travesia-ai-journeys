import { useState, useMemo } from "react";
import { Compass, Clock, DollarSign, Plus, Filter, Tag, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ActivityOption } from "./types";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [durationFilter, setDurationFilter] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityOption | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedTime, setSelectedTime] = useState<string>("morning");

  // Get unique types for filter
  const activityTypes = useMemo(() => {
    const types = new Set(activities.map(a => a.tipo).filter(Boolean));
    return Array.from(types) as string[];
  }, [activities]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      // Search filter
      if (searchTerm && !activity.nombre.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      // Type filter
      if (typeFilter !== "all" && activity.tipo !== typeFilter) {
        return false;
      }
      // Price filter
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
    if (selectedActivity) {
      onAddActivity?.(selectedActivity, selectedDay, selectedTime);
    }
    setAddDialogOpen(false);
    setSelectedActivity(null);
  };

  // If no structured activities, show highlights instead
  const hasActivities = activities.length > 0;

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Compass className="w-5 h-5 text-primary" />
        Actividades disponibles
      </h3>

      {hasActivities ? (
        <>
          {/* Filters */}
          <div className="bg-card rounded-xl border p-4">
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar actividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Type Filter */}
              {activityTypes.length > 0 && (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {activityTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Price Filter */}
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Precio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquier precio</SelectItem>
                  <SelectItem value="free">Gratis</SelectItem>
                  <SelectItem value="budget">Hasta $500</SelectItem>
                  <SelectItem value="mid">$500 - $2,000</SelectItem>
                  <SelectItem value="premium">+$2,000</SelectItem>
                </SelectContent>
              </Select>

              {/* Duration Filter */}
              <Select value={durationFilter} onValueChange={setDurationFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Duración" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquier duración</SelectItem>
                  <SelectItem value="short">Menos de 2h</SelectItem>
                  <SelectItem value="medium">2-4 horas</SelectItem>
                  <SelectItem value="long">Más de 4h</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Activities Grid */}
          {filteredActivities.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredActivities.map((activity, idx) => (
                <Card key={idx} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    {/* Image */}
                    <div className="h-40 bg-muted relative">
                      {activity.imagen ? (
                        <img 
                          src={activity.imagen} 
                          alt={activity.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                          <Compass className="w-12 h-12 text-orange-400" />
                        </div>
                      )}
                      {activity.tipo && (
                        <Badge className="absolute top-2 left-2 bg-black/60 text-white text-xs">
                          {activity.tipo}
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h4 className="font-semibold mb-1">{activity.nombre}</h4>
                      {activity.descripcion && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {activity.descripcion}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {activity.duracion && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {activity.duracion}
                            </span>
                          )}
                          <span className={`flex items-center gap-1 ${activity.precio && activity.precio > 0 ? '' : 'text-green-600'}`}>
                            <DollarSign className="w-4 h-4" />
                            {activity.precio && activity.precio > 0 
                              ? `$${activity.precio.toLocaleString()}` 
                              : 'Gratis'}
                          </span>
                        </div>
                        
                        <Button size="sm" onClick={() => handleAddClick(activity)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Agregar
                        </Button>
                      </div>

                      {/* Tags */}
                      {activity.etiquetas && activity.etiquetas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {activity.etiquetas.slice(0, 3).map((tag, tagIdx) => (
                            <Badge key={tagIdx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">
              <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No se encontraron actividades con estos filtros</p>
            </div>
          )}
        </>
      ) : highlights.length > 0 ? (
        // Show highlights if no structured activities
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Actividades destacadas del viaje:</p>
          {highlights.map((highlight, idx) => (
            <div key={idx} className="bg-card rounded-xl border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {idx + 1}
              </div>
              <p className="flex-1">{highlight}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl">
          <Compass className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No hay actividades disponibles</p>
          <p className="text-sm mt-1">Las actividades aparecerán aquí cuando estén disponibles</p>
        </div>
      )}

      {/* Add Activity Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar al itinerario</DialogTitle>
          </DialogHeader>
          
          {selectedActivity && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Selecciona el día y hora para <strong>{selectedActivity.nombre}</strong>
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Día</label>
                  <Select value={String(selectedDay)} onValueChange={(v) => setSelectedDay(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7].map(day => (
                        <SelectItem key={day} value={String(day)}>Día {day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Horario</label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Mañana</SelectItem>
                      <SelectItem value="afternoon">Tarde</SelectItem>
                      <SelectItem value="evening">Noche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmAdd}>
              Agregar al Día {selectedDay}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TabActividades;
