const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "gemini-flash-latest";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const apiKey = Deno.env.get("GOOGLE_AI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");
  if (!apiKey) {
    return json({ ok: false, provider: "Gemini", model: MODEL, error: "missing_api_key" });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "ping" }] }],
          generationConfig: { maxOutputTokens: 1 },
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("ai-health gemini error", res.status, text.slice(0, 300));
      return json({ ok: false, provider: "Gemini", model: MODEL, status: res.status, error: "gemini_error" });
    }

    await res.json();
    return json({ ok: true, provider: "Gemini", model: MODEL });
  } catch (e) {
    console.error("ai-health exception", e);
    return json({ ok: false, provider: "Gemini", model: MODEL, error: "network_error" });
  }
});
