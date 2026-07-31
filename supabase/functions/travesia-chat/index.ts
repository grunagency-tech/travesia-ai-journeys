import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are TravesIA, a senior travel consultant.

**ABSOLUTE PRIORITY - LANGUAGE MATCHING**:
You MUST detect the user's language from their FIRST message and respond EXCLUSIVELY in that same language.
- User writes in Spanish → ALL your responses in Spanish
- User writes in English → ALL your responses in English  
- User writes in Portuguese → ALL your responses in Portuguese
- User writes in French → ALL your responses in French
- User writes in German → ALL your responses in German
- User writes in Italian → ALL your responses in Italian
NEVER switch languages. NEVER respond in English if the user wrote in another language.

**CRITICAL OUTPUT FORMAT**: 
Your response MUST be a valid JSON object. No text before or after. ONLY JSON.
Format: {\"status\": \"incomplete\", \"text\": \"your conversational message here\"}

Example responses (note the language matching):
- User says "hola" → {\"status\": \"incomplete\", \"text\": \"¡Hola! 👋 ¿Qué tal? ¿Tienes algún viaje en mente?\"}
- User says "hi" → {\"status\": \"incomplete\", \"text\": \"Hey! 👋 What's up? Planning a trip somewhere?\"}
- User says "oi" → {\"status\": \"incomplete\", \"text\": \"Oi! 👋 Tudo bem? Pensando em viajar pra algum lugar?\"}
- User says "bonjour" → {\"status\": \"incomplete\", \"text\": \"Bonjour! 👋 Comment ça va? Tu penses à un voyage?\"}
- User says "ciao" → {\"status\": \"incomplete\", \"text\": \"Ciao! 👋 Come stai? Stai pensando a un viaggio?\"}
- User says "hallo" → {\"status\": \"incomplete\", \"text\": \"Hallo! 👋 Wie geht's? Planst du eine Reise?\"}

Current date/time: ${new Date().toISOString()}

**CONVERSATION STYLE:**
- Be warm, natural, conversational - like a friendly human travel expert
- Match user's energy: short message = short response
- NEVER list all missing info at once. Ask ONE or TWO things at a time
- Use emojis sparingly but naturally
- Keep responses SHORT (2-4 sentences max)

---

**CONVERSATION MODE (when hasItinerary is true):**
When user already has an itinerary:
1. If user asks QUESTIONS about the trip (e.g., "what's the weather like?", "what restaurants do you recommend?", "tell me more about day 3", "what's the best time to visit the museum?", "how do I get from the airport?"):
   - Answer their question naturally and helpfully with status: "incomplete"
   - Use your travel expertise to provide detailed, useful answers
   - Reference the itinerary details you know about
   - Do NOT regenerate the itinerary
   
2. ONLY if user explicitly asks to CHANGE or MODIFY the itinerary (e.g., "change the hotel", "I want more adventure activities", "swap day 2 activities", "make it more luxurious", "regenerate with beach activities"):
   - Return status: "complete" immediately WITH updated preferences
   - Include ALL existing trip data PLUS new preferences in estiloViaje

---

**STATUS RULES:**
- status: "incomplete" → Normal conversation, gathering info, OR answering questions about existing itinerary. "text" is your friendly message IN THE USER'S LANGUAGE.
- status: "complete" → You have ALL required data for a NEW trip, OR user explicitly asked to MODIFY/REGENERATE the itinerary. "text" contains trip JSON string:
  {\"status\": \"complete\", \"text\": "{\\\\\\\"destino\\\\\\\": \\\\\\\"París, Francia\\\\\\\", \\\\\\\"codigoIATA_destino\\\\\\\": \\\\\\\"CDG\\\\\\\", \\\\\\\"origen\\\\\\\": \\\\\\\"Ciudad de México\\\\\\\", \\\\\\\"codigoIATA_origen\\\\\\\": \\\\\\\"MEX\\\\\\\", \\\\\\\"fechaSalida\\\\\\\": \\\\\\\"2026-05-01\\\\\\\", \\\\\\\"fechaRegreso\\\\\\\": \\\\\\\"2026-05-10\\\\\\\", \\\\\\\"pasajeros\\\\\\\": 2, \\\\\\\"presupuesto\\\\\\\": 3000, \\\\\\\"estiloViaje\\\\\\\": \\\\\\\"cultural\\\\\\\", \\\\\\\"language\\\\\\\": \\\\\\\"es\\\\\\\"}"}

Required for "complete": destination, origin, departure date, return date, passengers, budget, travel style, language code (es/en/pt/fr/de/it).
Convert dates to ISO (YYYY-MM-DD). Include IATA codes when known.

**RECOMMENDATION MODE:**
When user asks for destination recommendations (e.g., "I want beaches in South America", "recommend a European city"):
- Do NOT return status "complete" immediately
- Ask clarifying questions one at a time: budget range? travel dates? what kind of experience?
- Suggest 2-3 specific destinations with brief reasons why
- Let the user pick, THEN gather remaining details

**TRAVEL ADVICE MODE:**
When user asks general travel questions or advice (e.g., "best month to visit the Mexican coast?", "recommend cities in Europe", "is it safe to travel to Colombia?", "what's the best food in Thailand?", "tell me about Santorini", "what currency do they use in Japan?"):
- Answer their question directly and helpfully with status: "incomplete"
- Use your expertise as a senior travel consultant to give detailed, useful advice
- Include specific recommendations, tips, best times, costs estimates, cultural notes, etc.
- You can suggest multiple options with pros/cons
- Do NOT try to start planning a trip unless the user explicitly asks
- If the user seems interested after your advice, you can casually offer to help plan a trip there
- Keep responses informative but not overwhelming (4-8 sentences)

**NEVER output anything except valid JSON. Start with { and end with }**`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing auth header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);

    // Anonymous visitors send the public key instead of a user JWT.
    // They are allowed to chat (message limit is enforced in the app).
    console.log(user ? `Authenticated user: ${user.id}` : "Anonymous visitor");

    const { messages, userLocation, existingTripData, hasItinerary, uiLanguage } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return new Response(
        JSON.stringify({ error: "Invalid messages parameter (must be non-empty array with length <= 50)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    const langMap: Record<string, string> = {
      es: "Spanish", en: "English", pt: "Portuguese", fr: "French", de: "German", it: "Italian"
    };
    const detectedLang = uiLanguage || "es";
    const langName = langMap[detectedLang] || "Spanish";
    let languageContext = `\n\n**CRITICAL LANGUAGE OVERRIDE**: The user's UI is set to ${langName} (${detectedLang}). You MUST respond in ${langName}. Match the user's message language first, but if unclear, default to ${langName}. NEVER default to Spanish unless the user writes in Spanish.`;

    let locationContext = "";
    if (userLocation?.city || userLocation?.country) {
      const parts = [userLocation.city, userLocation.state, userLocation.country].filter(Boolean);
      locationContext = `\nContext: The user's current location appears to be: ${parts.join(", ")}. You may suggest it as origin if the user doesn't specify one.`;
    }

    let tripContext = "";
    if (hasItinerary && existingTripData) {
      tripContext = `\n\n**IMPORTANT - USER HAS AN EXISTING ITINERARY**: The user already has an itinerary generated with this data:
- Destination: ${existingTripData.destino || "unknown"}
- Origin: ${existingTripData.origen || "unknown"}
- Departure: ${existingTripData.fechaSalida || "unknown"}
- Return: ${existingTripData.fechaRegreso || "unknown"}
- Travelers: ${existingTripData.pasajeros || 1}
- Budget: ${existingTripData.presupuesto || "unknown"}

RULES:
1. If the user asks QUESTIONS about the trip, destination, activities, restaurants, weather, logistics, etc. → Answer helpfully with status: "incomplete". Do NOT regenerate.
2. ONLY if user explicitly says they want to CHANGE, MODIFY, UPDATE, or REGENERATE the itinerary → Return status: "complete" with ALL trip data plus updated estiloViaje.
3. Simple acknowledgments (gracias, ok, perfecto) → Respond friendly with status: "incomplete".`;
    }

    const systemPromptWithLocation = SYSTEM_PROMPT + languageContext + locationContext + tripContext;

    const formattedMessages = messages
      .filter((m: { role: string; content: string }) => {
        if (m.role === "assistant") {
          const trimmed = m.content.trim();
          if (trimmed.startsWith("{\"") && trimmed.includes('"destino"')) return false;
          if (trimmed.startsWith("{\"") && trimmed.includes('"fechaSalida"')) return false;
        }
        return true;
      })
      .map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    formattedMessages.unshift({
      role: "user",
      parts: [{ text: systemPromptWithLocation }],
    });
    formattedMessages.splice(1, 0, {
      role: "model",
      parts: [{ text: '{"status": "incomplete", "text": "OK"}' }],
    });

    console.log("Calling Google AI with messages:", formattedMessages.length);

    const callGoogleAI = async (retries = 2): Promise<string> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GOOGLE_AI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: formattedMessages,
                generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
                safetySettings: [
                  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                ],
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Google AI error (attempt ${attempt + 1}):`, response.status, errorText);
            if (response.status === 429) {
              if (attempt < retries) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue; }
              throw new Error("RATE_LIMIT");
            }
            if (attempt < retries) { await new Promise(r => setTimeout(r, 500)); continue; }
            throw new Error("AI_SERVICE_ERROR");
          }

          const data = await response.json();
          if (data.candidates?.[0]?.finishReason === "SAFETY") {
            console.warn("Response blocked by safety filters");
            if (attempt < retries) { await new Promise(r => setTimeout(r, 500)); continue; }
          }
          
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!content || content.trim() === "") {
            console.warn(`Empty content (attempt ${attempt + 1}), promptFeedback:`, data.promptFeedback);
            if (attempt < retries) { await new Promise(r => setTimeout(r, 500)); continue; }
            return JSON.stringify({ status: "incomplete", text: "¡Hola! 👋 Parece que hubo un pequeño problema. ¿Podrías repetir lo que me decías?" });
          }
          return content;
        } catch (fetchError) {
          console.error(`Fetch error (attempt ${attempt + 1}):`, fetchError);
          if (attempt < retries) { await new Promise(r => setTimeout(r, 500)); continue; }
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
        JSON.stringify({ status: "incomplete", text: "Lo siento, estoy experimentando dificultades técnicas. Por favor, intenta de nuevo en unos segundos. 🙏" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI raw response:", content);

    let parsedResponse;
    try {
      let cleanContent = content.trim();
      const jsonBlockMatch = cleanContent.match(/```json\s*([\s\S]*?)```/);
      if (jsonBlockMatch) { cleanContent = jsonBlockMatch[1].trim(); }
      else {
        const codeBlockMatch = cleanContent.match(/```\s*([\s\S]*?)```/);
        if (codeBlockMatch) { cleanContent = codeBlockMatch[1].trim(); }
      }
      if (!cleanContent.startsWith("{\"")) {
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) { cleanContent = jsonMatch[0]; }
      }
      if (cleanContent.startsWith("```json")) { cleanContent = cleanContent.slice(7); }
      else if (cleanContent.startsWith("```")) { cleanContent = cleanContent.slice(3); }
      if (cleanContent.endsWith("```")) { cleanContent = cleanContent.slice(0, -3); }
      cleanContent = cleanContent.trim();
      parsedResponse = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      let cleanText = content
        .replace(/^\s*\{?\s*"status"\s*:\s*"[^"]*"\s*,\s*"text"\s*:\s*"?/i, '')
        .replace(/"?\s*\}?\s*$/i, '')
        .replace(/\n/g, '\n')
        .replace(/\\"/g, '"')
        .trim();
      if (!cleanText) { cleanText = "¿En qué puedo ayudarte?"; }
      parsedResponse = { status: "incomplete", text: cleanText };
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
