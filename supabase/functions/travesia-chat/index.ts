import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are TravesIA, a senior travel consultant.

**CRITICAL OUTPUT FORMAT**: 
Your response MUST be a valid JSON object. No text before or after. ONLY JSON.
Format: {"status": "incomplete", "text": "your conversational message here"}

Example responses:
- User says "hola" → {"status": "incomplete", "text": "¡Hola! 👋 ¿Qué tal? ¿Tienes algún viaje en mente?"}
- User says "hi" → {"status": "incomplete", "text": "Hey! 👋 What's up? Planning a trip somewhere?"}
- User says "oi" → {"status": "incomplete", "text": "Oi! 👋 Tudo bem? Pensando em viajar pra algum lugar?"}

Current date/time: ${new Date().toISOString()}

**CONVERSATION STYLE:**
- Be warm, natural, conversational - like a friendly human travel expert
- Match user's energy: short message = short response
- NEVER list all missing info at once. Ask ONE or TWO things at a time
- Use emojis sparingly but naturally
- Keep responses SHORT (2-4 sentences max)

**LANGUAGE RULE**: Detect user's language and respond EXCLUSIVELY in that language.

**CONVERSATION EXAMPLES:**
User: "quiero ir a paris" → {"status": "incomplete", "text": "¡París! Me encanta 🗼 ¿Ya tienes fechas en mente o todavía estás viendo?"}
User: "I want to go to Tokyo next month" → {"status": "incomplete", "text": "Tokyo! Great choice 🇯🇵 Next month works. Are you traveling solo or with someone?"}

---

**MODIFICATION MODE (when hasItinerary is true):**
When user already has an itinerary and asks for modifications:
- Return status: "complete" immediately WITH updated preferences
- Include ALL existing trip data PLUS new preferences in estiloViaje

---

**STATUS RULES:**
- status: "incomplete" → Normal conversation, gathering info. "text" is your friendly message.
- status: "complete" → You have ALL required data. "text" contains trip JSON string:
  {"status": "complete", "text": "{\\"destino\\": \\"París, Francia\\", \\"codigoIATA_destino\\": \\"CDG\\", \\"origen\\": \\"Ciudad de México\\", \\"codigoIATA_origen\\": \\"MEX\\", \\"fechaSalida\\": \\"2026-05-01\\", \\"fechaRegreso\\": \\"2026-05-10\\", \\"pasajeros\\": 2, \\"presupuesto\\": 3000, \\"estiloViaje\\": \\"cultural\\", \\"language\\": \\"es\\"}"}

Required for "complete": destination, origin, departure date, return date, passengers, budget, travel style, language code.
Convert dates to ISO (YYYY-MM-DD). Include IATA codes when known.

**NEVER output anything except valid JSON. Start with { and end with }**`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userLocation, existingTripData, hasItinerary } = await req.json();
    
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    // Build location context if available
    let locationContext = "";
    if (userLocation?.city || userLocation?.country) {
      const parts = [userLocation.city, userLocation.state, userLocation.country].filter(Boolean);
      locationContext = `\n\nContexto: La ubicación actual del usuario parece ser: ${parts.join(", ")}. Puedes sugerirla como origen si el usuario no especifica otro.`;
    }

    // Build existing trip context if modifying
    let tripContext = "";
    if (hasItinerary && existingTripData) {
      tripContext = `\n\n**IMPORTANT - MODIFICATION MODE ACTIVE**: The user already has an itinerary generated with this data:
- Destination: ${existingTripData.destino || "unknown"}
- Origin: ${existingTripData.origen || "unknown"}
- Departure: ${existingTripData.fechaSalida || "unknown"}
- Return: ${existingTripData.fechaRegreso || "unknown"}
- Travelers: ${existingTripData.pasajeros || 1}
- Budget: ${existingTripData.presupuesto || "unknown"}

If the user asks to modify preferences (style, luxury level, type of activities, hotels, etc.), respond with status: "complete" including ALL the existing trip data above plus the new/updated estiloViaje. This will regenerate the itinerary with the new preferences.`;
    }

    const systemPromptWithLocation = SYSTEM_PROMPT + locationContext + tripContext;

    // Prepare messages for Google AI - combine system prompt into first user message
    const formattedMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Prepend system instruction as first user message
    formattedMessages.unshift({
      role: "user",
      parts: [{ text: systemPromptWithLocation }],
    });
    formattedMessages.splice(1, 0, {
      role: "model",
      parts: [{ text: '{"status": "incomplete", "text": "¡Hola! 👋 Estoy listo para ayudarte a planear tu próximo viaje. ¿A dónde te gustaría ir?"}' }],
    });

    console.log("Calling Google AI with messages:", formattedMessages.length);

    // Retry logic for API calls
    const callGoogleAI = async (retries = 2): Promise<string> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: formattedMessages,
                generationConfig: {
                  temperature: 0.7,
                },
                safetySettings: [
                  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                ],
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Google AI error (attempt ${attempt + 1}):`, response.status, errorText);
            
            if (response.status === 429) {
              if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                continue;
              }
              throw new Error("RATE_LIMIT");
            }
            
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            }
            throw new Error("AI_SERVICE_ERROR");
          }

          const data = await response.json();
          
          // Check for blocked content
          if (data.candidates?.[0]?.finishReason === "SAFETY") {
            console.warn("Response blocked by safety filters");
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            }
          }
          
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!content || content.trim() === "") {
            console.warn(`Empty content (attempt ${attempt + 1}), promptFeedback:`, data.promptFeedback);
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            }
            // Return a fallback response instead of throwing
            return JSON.stringify({
              status: "incomplete",
              text: "¡Hola! 👋 Parece que hubo un pequeño problema. ¿Podrías repetir lo que me decías?"
            });
          }

          return content;
        } catch (fetchError) {
          console.error(`Fetch error (attempt ${attempt + 1}):`, fetchError);
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          throw fetchError;
        }
      }
      throw new Error("MAX_RETRIES_EXCEEDED");
    };

    let content: string;
    try {
      content = await callGoogleAI();
    } catch (apiError) {
      const errorMessage = apiError instanceof Error ? apiError.message : "Unknown";
      if (errorMessage === "RATE_LIMIT") {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ 
          status: "incomplete",
          text: "Lo siento, estoy experimentando dificultades técnicas. Por favor, intenta de nuevo en unos segundos. 🙏"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI raw response:", content);

    // Try to parse the JSON response - handle various formats
    let parsedResponse;
    try {
      let cleanContent = content.trim();
      
      // First, try to extract JSON from markdown code blocks anywhere in the text
      const jsonBlockMatch = cleanContent.match(/```json\s*([\s\S]*?)```/);
      if (jsonBlockMatch) {
        cleanContent = jsonBlockMatch[1].trim();
      } else {
        // Try without json specifier
        const codeBlockMatch = cleanContent.match(/```\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          cleanContent = codeBlockMatch[1].trim();
        }
      }
      
      // If still not starting with {, try to find JSON object in the text
      if (!cleanContent.startsWith("{")) {
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanContent = jsonMatch[0];
        }
      }
      
      // Clean up markdown at start/end if present
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
