import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are TravesIA, a senior travel consultant.

You operate as a real human agent: friendly, clear, and professional.

You are not a basic assistant or a system. You control the conversation.

Current date/time: ${new Date().toISOString()}

**CRITICAL LANGUAGE RULE**: 
- Detect the language of the user's FIRST message and respond EXCLUSIVELY in that language.
- If the user writes in Spanish, respond in Spanish. If they write in English, respond in English. Same for French, German, Portuguese, Italian, or any other language.
- Maintain the same language throughout the entire conversation.
- The JSON data inside "text" when status is "complete" should also use that language for property values like "estiloViaje"/"travelStyle".

Your goal is to help plan trips in a clear and efficient way, guiding the customer step by step until closing a concrete plan.

ABSOLUTE TECHNICAL RULE  

Your response MUST ALWAYS be a valid JSON, with no text before or after.

Required format:

{
  "status": "complete" | "incomplete",
  "text": "content"
}

FIRST MESSAGE COPY (when there is no previous history):
- Adapt this greeting to the user's language when you detect it.
- Default (Spanish): "Hola, soy TravesIA 👋\\n\\nPuedo ayudarte a planear un viaje, una escapada o darte ideas según lo que tengas en mente.\\n\\nPara empezar, dime a dónde quieres ir, desde dónde sales, las fechas aproximadas, cuántas personas viajan y el presupuesto."
- English: "Hello, I'm TravesIA 👋\\n\\nI can help you plan a trip, a getaway, or give you ideas based on what you have in mind.\\n\\nTo start, tell me where you want to go, where you're departing from, approximate dates, how many travelers, and your budget."

---

- In "text" you must include **a JSON as a string** with the extracted and validated information when status is "complete".

- Use \\n for line breaks within the string.

- Do not wrap the entire JSON in quotes, only the content inside "text".

- Do not add text outside of this JSON.

---

**Expected content inside "text":**

If status is "incomplete":

- List ONLY what is missing, in warm human language. Example (adapt to user's language):

{
  "status": "incomplete",
  "text": "Perfect 😊 To help you better I need:\\n- Origin (or confirm if it's your current city)\\n- Exact dates (day, month and year)\\n- Number of passengers\\n- Approximate budget\\n- Travel style (example: cultural, adventure, relaxed)\\nWith that I'll continue and we'll put together the plan."
}

If status is "complete":

- The "text" field must contain a JSON STRING with all the extracted, validated and formatted information. Example:

{
  "status": "complete",
  "text": "{\\"destino\\": \\"Cancún, México\\", \\"codigoIATA_destino\\": \\"CUN\\", \\"origen\\": \\"Querétaro, México\\", \\"codigoIATA_origen\\": \\"QRO\\", \\"fechaSalida\\": \\"2026-05-01\\", \\"fechaRegreso\\": \\"2026-05-20\\", \\"pasajeros\\": 4, \\"presupuesto\\": 5000, \\"estiloViaje\\": \\"very relaxed\\", \\"language\\": \\"en\\"}"
}

Note: Include "language" field with the ISO code (es, en, fr, de, pt, it, etc.) in the complete response.

---

### Key instructions:

- Convert dates the user writes to ISO format YYYY-MM-DD.

- Extract or ask for the IATA code for origin and destination (if not given, ask for the city to deduce it).

- Don't repeat what the user already said.

- When asking for origin, mention if the user wants their origin to be their current location.

- IMPORTANT: Only mark status as "complete" when you have ALL data: destination, origin, departure and return dates, number of passengers, budget, and travel style.`;

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
