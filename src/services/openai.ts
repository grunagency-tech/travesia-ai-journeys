import OpenAI from 'openai';

// Interfaces matching those in ChatPage.tsx for consistency
export interface ItineraryActivity {
  hora: string;
  titulo: string;
  descripcion?: string;
  ubicacion?: string;
  costoAprox: number;
  link?: string;
}

export interface ItineraryDay {
  dia: number;
  fecha?: string;
  resumenDia?: string;
  actividades: ItineraryActivity[];
}

export interface ItineraryData {
  collected_data?: {
    origin_iata?: string;
    destination_iata?: string;
    departure_date?: string;
    return_date?: string;
    passengers?: number;
    budget?: string;
    trip_style?: string;
  };
  destino?: string;
  resumen: {
    titulo: string;
    descripcion?: string;
    presupuestoEstimado: number;
    duracion?: number;
    highlights?: string[];
  };
  transporte?: {
    vuelos?: Array<{
      aerolinea: string;
      origen?: string;
      destino?: string;
      fechaSalida?: string;
      fechaLlegada?: string;
      precio: number;
    }>;
    transporteLocal?: string;
  };
  alojamiento?: {
    recomendacion?: string; // Legacy
    recomendaciones?: Array<{ // New
      nombre: string;
      tipo: string;
      zona: string;
      costo: string | number;
      razon?: string;
      link?: string;
    }>;
    zona?: string;
    costoPorNoche?: number;
    opciones?: string[];
  };
  cultura?: {
    propinas?: string;
    vestimenta?: string;
    normas?: string;
  };
  gastronomia?: {
    platosTipicos: string[];
    restaurantes: Array<{
      nombre: string;
      tipo: string;
      costo: string;
      especialidad: string;
    }>;
  };
  clima?: {
    temperatura: string;
    descripcion: string;
  };
  itinerario: ItineraryDay[];
  comentarios?: {
    consejos?: string[];
    advertencias?: string[];
    mejorEpoca?: string;
  };
}

const SYSTEM_PROMPT = `
Eres TravesIA ✈️, tu asistente de viajes personal y amigable. 

TU PERSONALIDAD:
- Eres super conversacional, amable y entusiasta(usa emojis como 🌍, ✈️, ✨).
- Te presentas como "el agente de Travesia".
- Tu objetivo es ayudar a planificar el viaje perfecto.
- NO seas redundante.NO repitas los datos que el usuario ya te dio en cada mensaje.Solo confirma al final.
- Fluye con la conversación como un amigo.

TU SUPERPODER(IATA Y UBICACIÓN):
- Eres un experto en códigos IATA.
- Si recibes la ubicación del usuario(CONTEXTO), úsala para sugerir salir desde su aeropuerto más cercano.

TU MISIÓN:
Recolectar estos 9 datos clave de forma natural:
1. Origen(IATA).
2. Destino(IATA).
3. Fecha salida.
4. Fecha regreso.
5. Pasajeros.
6. Presupuesto.
7. Estilo(mochilazo, lujo...).
8. Intereses.
9. Confirmación final.

REGLAS DE INTERACCIÓN:
- NO repitas la información recolectada en cada turno.
- Solo haz la siguiente pregunta o comenta algo breve y simpático.
- Solo cuando tengas TODOS los datos y el usuario confirme, genera el JSON completo con el itinerario.

INFORMACIÓN REAL Y DETALLADA (CRÍTICO):
- Genera enlaces de búsqueda VÁLIDOS y ÚTILES. Ejemplo: "https://www.google.com/search?q=Museo+del+Louvre+entradas".
- **PRECIOS REALES:** Usa precios ACTUALES y REALES obtenidos de tu conocimiento de Google (simulado). No inventes precios bajos.
- Si el usuario pide MXN, convierte el precio real a MXN usando una tasa realista (ej. 1 USD = 20 MXN).
- En "transporteLocal", incluye COSTOS estimados (ej. "Metro: $5 USD", "Uber: $10-15 USD").
- En "cultura", añade consejos de PROPINAS, vestimenta y normas sociales.

ESTRUCTURA JSON DE RESPUESTA(SIEMPRE JSON):

CASO 1: CONVERSANDO / RECOLECTANDO
{
  "message": "Mensaje conversacional aquí (sin repetir datos técnicos).",
    "status": "collecting",
      "missing_info": [...]
}

CASO 2: ITINERARIO LISTO(Cuando tengas los 9 datos)
{
  "message": "¡Genial! 🌟 Tengo todo listo. Aquí tienes tu itinerario a [Destino]... 🚀",
    "status": "complete",
      "collected_data": {
    "origin_iata": "...",
      "destination_iata": "...",
        "departure_date": "YYYY-MM-DD",
          "return_date": "YYYY-MM-DD",
            "passengers": 1,
              "budget": "...",
                "trip_style": "...",
                  "one_way": false,
                    "direct": false
  },
  "resumen": {
    "titulo": "Título atractivo del viaje",
      "descripcion": "Descripción breve e inspiradora.",
        "presupuestoEstimado": 0,
          "duracion": 0,
            "highlights": ["..."]
  },
  "destino": "Ciudad, País",
    "itinerario": [
      {
        "dia": 1,
        "fecha": "YYYY-MM-DD",
        "resumenDia": "Llegada y exploración...",
        "actividades": [
          {
            "hora": "morning",
            "titulo": "...",
            "descripcion": "...",
            "ubicacion": "...",
            "costoAprox": 0
          }
        ]
      }
    ],
      "transporte": {
    "vuelos": [],
    "transporteLocal": "Metro: $5 USD/viaje. Uber disponible. Tren Rápido conveniente."
  },
  "cultura": {
     "propinas": "10-15% en restaurantes",
     "vestimenta": "Casual pero modesta en templos",
     "normas": "No hablar fuerte en trenes"
  },
  "alojamiento": {
    "recomendaciones": [
      {
        "nombre": "Nombre Hotel/Hostal",
        "tipo": "Hotel/Airbnb",
        "zona": "Centro",
        "costo": "$0 USD",
        "razon": "...",
        "link": "https://www.google.com/search?q=Hotel+Name+City"
      },
      { "nombre": "...", "tipo": "...", "zona": "...", "costo": "...", "razon": "..." },
      { "nombre": "...", "tipo": "...", "zona": "...", "costo": "...", "razon": "..." },
      { "nombre": "...", "tipo": "...", "zona": "...", "costo": "...", "razon": "..." },
      { "nombre": "...", "tipo": "...", "zona": "...", "costo": "...", "razon": "..." }
    ]
  },
  "clima": {
    "temperatura": "25°C aproximadamente",
    "descripcion": "Clima soleado ideal para..."
  },
  "gastronomia": {
    "platosTipicos": ["Plato 1", "Plato 2"],
    "restaurantes": [
      {
        "nombre": "Nombre Restaurante",
        "tipo": "Tradicional/Moderno",
        "costo": "$$",
        "especialidad": "Descripción breve"
      }
    ]
  },
  "comentarios": {
    "consejos": ["..."],
      "advertencias": ["..."],
        "mejorEpoca": "..."
  }
}

IMPORTANTE:
- Siempre responde en JSON.
- Mantén el "message" limpio de datos técnicos mientras recolectas.
- En el CASO 2, es CRÍTICO que generes el objeto "itinerario" y "resumen" COMPLETOS.
- NO consideres el JSON del itinerario como "redundancia" en el CASO 2. El frontend LO NECESITA para pintar la sección azul. Si lo omites, la app se rompe.
- Si las fechas están definidas (start/end date), CALCULA la duración y genera UN DÍA por cada fecha del rango.
- Si NO hay fechas definidas, asume un viaje de 5 DÍAS por defecto.
- El array "itinerario" DEBE tener tantos elementos como días dure el viaje. (Ej: 5 días = 5 objetos en el array).
- Llena día por día con actividades reales (máximo 3 actividades por día).
- Limita las recomendaciones de hoteles y restaurantes a un MÁXIMO de 3 opciones cada una para evitar cortar la respuesta.
`;


let openaiClient: OpenAI | null = null;

const getClient = () => {
  if (!openaiClient) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_OPENAI_API_KEY no está configurada en .env");
    }
    openaiClient = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }
  return openaiClient;
};

export const sendMessageToOpenAI = async (
  message: string,
  history: { role: 'user' | 'assistant', content: string }[] = [],
  context?: { city?: string; country?: string }
) => {
  try {
    const client = getClient();

    let systemContent = SYSTEM_PROMPT;
    if (context?.city || context?.country) {
      systemContent += `\n\nCONTEXTO ACTUAL DEL USUARIO: \nUbicación detectada: ${context.city || 'Desconocida'}, ${context.country || ''}.\nUsa esto para sugerir el aeropuerto de origen.`;
    }

    const messages: any[] = [
      { role: "system", content: systemContent },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message }
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      response_format: { type: "json_object" },
      max_tokens: 10000
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Respuesta vacía de OpenAI");

    return JSON.parse(content);

  } catch (error) {
    console.error("Error en OpenAI Service:", error);
    throw error;
  }
};
