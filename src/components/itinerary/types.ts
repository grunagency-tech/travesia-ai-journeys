// Tipos compartidos para el sistema de itinerarios

export interface ItineraryActivity {
  hora?: string;
  titulo?: string;
  descripcion?: string;
  ubicacion?: string;
  costoAprox?: number;
  tipo?: string;
  duracion?: string;
  imagen?: string;
}

export interface ItineraryDay {
  dia: number;
  fecha?: string;
  ciudad?: string;
  clima?: string;
  resumenDia?: string;
  actividades?: ItineraryActivity[];
  vuelos?: FlightOption[];
  alojamiento?: AccommodationOption;
  coche?: CarRentalOption;
}

export interface FlightOption {
  id?: string;
  aerolinea: string;
  origen?: string;
  destino?: string;
  fechaSalida?: string;
  fechaLlegada?: string;
  horaSalida?: string;
  horaLlegada?: string;
  duracion?: string;
  escalas?: number;
  precio?: number;
  calificacion?: number;
  link?: string;
}

export interface AccommodationOption {
  id?: string;
  nombre: string;
  imagen?: string;
  ubicacion?: string;
  calificacion?: number;
  tipo?: string;
  precioPorNoche?: number;
  precioTotal?: number;
  fechaCheckIn?: string;
  fechaCheckOut?: string;
  etiquetas?: string[];
  link?: string;
  distanciaCentro?: number;
  amenities?: string[];
}

export interface CarRentalOption {
  id?: string;
  empresa?: string;
  tipoVehiculo?: string;
  precio?: number;
  politicas?: string;
  puntoRecogida?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface ActivityOption {
  id?: string;
  nombre: string;
  imagen?: string;
  descripcion?: string;
  duracion?: string;
  precio?: number;
  etiquetas?: string[];
  tipo?: string;
  link?: string;
}

export interface LocalInfoData {
  clima?: {
    temperatura?: string;
    descripcion?: string;
    mejorEpoca?: string;
  };
  transporteLocal?: {
    descripcion?: string;
    opciones?: string[];
    consejos?: string[];
  };
  cultura?: {
    idioma?: string;
    moneda?: string;
    propinas?: string;
    costumbres?: string[];
  };
  conversionMoneda?: {
    monedaLocal?: string;
    tipoCambio?: number;
    monedaOrigen?: string;
  };
  consejosAhorro?: string[];
}

export interface ItineraryData {
  destino?: string;
  origen?: string;
  resumen?: {
    titulo?: string;
    descripcion?: string;
    presupuestoEstimado?: number;
    duracion?: number;
    highlights?: string[];
  };
  transporte?: {
    vuelos?: FlightOption[];
    transporteLocal?: string;
    alquilerCocheRecomendado?: boolean;
    opcionesCoche?: CarRentalOption[];
  };
  alojamiento?: {
    recomendacion?: string;
    zona?: string;
    costoPorNoche?: number;
    opciones?: AccommodationOption[];
  };
  actividades?: ActivityOption[];
  itinerario?: ItineraryDay[];
  comentarios?: {
    consejos?: string[];
    advertencias?: string[];
    mejorEpoca?: string;
  };
  infoLocal?: LocalInfoData;
}

export interface ItineraryPanelProps {
  data: ItineraryData;
  origin?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  customImage?: string;
  onAddToItinerary?: (item: FlightOption | AccommodationOption | CarRentalOption | ActivityOption, type: string, dayNumber?: number) => void;
}
