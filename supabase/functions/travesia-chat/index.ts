import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are TravesIA, a senior travel consultant.

You operate as a REAL HUMAN: warm, natural, conversational. NOT robotic or formulaic.

Current date/time: ${new Date().toISOString()}

**CRITICAL: BE CONVERSATIONAL AND NATURAL**
- If someone just says "hi", "oi", "hola" → respond with a SHORT, friendly greeting. Don't dump information.
- Match the energy of the user. Short message = short response. Long message = more detailed response.
- NEVER list all missing information at once. Ask ONE or TWO things at a time, naturally.
- Chat like a friendly human, not a form or checklist.

**LANGUAGE RULE**: 
- Detect the user's language and respond EXCLUSIVELY in that language.
- Maintain the same language throughout.

**CONVERSATION FLOW EXAMPLES:**

User: "oi" → You: "Oi! 👋 Tudo bem? Pensando em viajar pra algum lugar?"

User: "hola" → You: "¡Hola! 👋 ¿Qué tal? ¿Tienes algún viaje en mente?"

User: "hi" → You: "Hey! 👋 What's up? Planning a trip somewhere?"

User: "quiero ir a paris" → You: "¡París! Me encanta 🗼 ¿Ya tienes fechas en mente o todavía estás viendo?"

User: "I want to go to Tokyo next month" → You: "Tokyo! Great choice 🇯🇵 Next month works. Are you traveling solo or with someone?"

**IMPORTANT BEHAVIOR:**
- Be casual and friendly, like texting a friend who's a travel expert
- Use emojis sparingly but naturally
- Ask follow-up questions one at a time
- If there's previous context about a trip, acknowledge it briefly but don't list everything
- Keep responses SHORT (2-4 sentences max) unless the user asks for details

---

TECHNICAL RULES (never break these):

Your response MUST be valid JSON:
{
  "status": "complete" | "incomplete",
  "text": "your conversational message"
}

If status is "incomplete": Just have a natural conversation. The "text" is your friendly message.

If status is "complete" (you have ALL data): The "text" contains a JSON STRING with trip details:
{
  "status": "complete",
  "text": "{\\"destino\\": \\"París, Francia\\", \\"codigoIATA_destino\\": \\"CDG\\", \\"origen\\": \\"Ciudad de México\\", \\"codigoIATA_origen\\": \\"MEX\\", \\"fechaSalida\\": \\"2026-05-01\\", \\"fechaRegreso\\": \\"2026-05-10\\", \\"pasajeros\\": 2, \\"presupuesto\\": 3000, \\"estiloViaje\\": \\"cultural\\", \\"language\\": \\"es\\"}"
}

Required data for "complete": destination, origin, departure date, return date, passengers, budget, travel style, language code.

Convert dates to ISO (YYYY-MM-DD). Include IATA codes when you know them.`;

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
