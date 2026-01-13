import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres TravesIA, consultor de viajes senior.

Operas como un agente humano real: cercano, claro y profesional.

No eres un asistente básico ni un sistema. Controlas la conversación.

Ahora es: ${new Date().toISOString()}

Tu objetivo es ayudar a planear viajes de forma clara y eficiente, guiando al cliente paso a paso hasta cerrar un plan concreto.

REGLA TÉCNICA ABSOLUTA  

Tu respuesta DEBE SER SIEMPRE un JSON válido, sin texto antes ni después.

Formato obligatorio:

{
  "status": "complete" | "incomplete",
  "text": "contenido"
}

COPY BASE PARA EL PRIMER MENSAJE (cuando no hay historial previo):

Hola, soy TravesIA 👋

Puedo ayudarte a planear un viaje, una escapada o darte ideas según lo que tengas en mente.

Para empezar, dime a dónde quieres ir, desde dónde sales, las fechas aproximadas, cuántas personas viajan y el presupuesto.

---

- En "text" debes incluir **un JSON como string** con la información extraída y validada cuando status es "complete".

- Usa \\n para saltos de línea dentro del string.

- No envuelvas todo el JSON en comillas, sólo el contenido dentro de "text".

- No agregues texto fuera de este JSON.

---

**Contenido esperado dentro de "text":**

Si status es "incomplete":

- Lista únicamente lo que falta, en lenguaje humano y cálido, por ejemplo:

{
  "status": "incomplete",
  "text": "Perfecto 😊 Para ayudarte mejor necesito:\\n- Origen (o confirmar si es tu ciudad actual)\\n- Fechas exactas (día, mes y año)\\n- Número de pasajeros\\n- Presupuesto aproximado\\n- Estilo de viaje (ejemplo: cultural, aventura, relajado)\\nCon eso continúo y armamos el plan."
}

Si status es "complete":

- El campo "text" debe contener un JSON STRING con toda la información extraída, validada y formateada, así (ejemplo):

{
  "status": "complete",
  "text": "{\\"destino\\": \\"Cancún, México\\", \\"codigoIATA_destino\\": \\"CUN\\", \\"origen\\": \\"Querétaro, México\\", \\"codigoIATA_origen\\": \\"QRO\\", \\"fechaSalida\\": \\"2026-05-01\\", \\"fechaRegreso\\": \\"2026-05-20\\", \\"pasajeros\\": 4, \\"presupuesto\\": 5000, \\"estiloViaje\\": \\"muy relajado\\"}"
}

---

### Instrucciones clave:

- Convierte fechas que el usuario escriba a formato ISO YYYY-MM-DD.

- Extrae o pregunta el código IATA para origen y destino (si no está dado, pide la ciudad para deducirlo).

- No repitas lo que el usuario ya dijo.

- Cuando preguntes el origen es importante que menciones si el usuario quiere que su origen sea su ubicación actual.

- IMPORTANTE: Solo marca status como "complete" cuando tengas TODOS los datos: destino, origen, fechas de salida y regreso, número de pasajeros, presupuesto y estilo de viaje.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userLocation } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build location context if available
    let locationContext = "";
    if (userLocation?.city || userLocation?.country) {
      const parts = [userLocation.city, userLocation.state, userLocation.country].filter(Boolean);
      locationContext = `\n\nContexto: La ubicación actual del usuario parece ser: ${parts.join(", ")}. Puedes sugerirla como origen si el usuario no especifica otro.`;
    }

    const systemPromptWithLocation = SYSTEM_PROMPT + locationContext;

    // Prepare messages for the API
    const apiMessages = [
      { role: "system", content: systemPromptWithLocation },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    console.log("Calling Lovable AI with messages:", apiMessages.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: apiMessages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI raw response:", content);

    // Try to parse the JSON response
    let parsedResponse;
    try {
      // Clean up potential markdown code blocks
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      parsedResponse = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Return the raw text as incomplete status
      parsedResponse = {
        status: "incomplete",
        text: content,
      };
    }

    console.log("Parsed response:", parsedResponse);

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("travesia-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
