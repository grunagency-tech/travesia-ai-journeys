import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

type Health = {
  ok: boolean;
  provider?: string;
  model?: string;
  status?: number;
  error?: string;
};

export default function AIStatusBadge() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  const check = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-health");
      if (error) throw error;
      setHealth(data as Health);
    } catch {
      setHealth({ ok: false, provider: "Gemini", error: "unreachable" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  const label = loading
    ? "Verificando IA…"
    : health?.ok
      ? `${health.provider} · ${health.model}`
      : "IA sin conexión";

  const tone = loading
    ? "border-border text-muted-foreground"
    : health?.ok
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-destructive/30 bg-destructive/10 text-destructive";

  return (
    <button
      type="button"
      onClick={check}
      title={
        health?.ok
          ? `Conectado a ${health.provider} (${health.model}). Clic para volver a verificar.`
          : `Sin conexión con la IA${health?.status ? ` (HTTP ${health.status})` : ""}. Clic para reintentar.`
      }
      className={`hidden md:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shrink-0 transition-colors hover:opacity-80 ${tone}`}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : health?.ok ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      <span className="max-w-[180px] truncate">{label}</span>
      {!loading && <RefreshCw className="h-3 w-3 opacity-50" />}
    </button>
  );
}
