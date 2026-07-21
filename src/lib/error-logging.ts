import { supabase } from "@/integrations/supabase/client";

// Best-effort front-end error sink → log-client-error edge function → client_errors table.
// Throttled + deduped so a loop can't flood the endpoint.
let lastSent = 0;
const seen = new Set<string>();

async function report(message: string, stack?: string) {
  if (!message) return;
  const now = Date.now();
  const key = message.slice(0, 120);
  if (seen.has(key)) return;
  if (now - lastSent < 1500) return;
  seen.add(key);
  lastSent = now;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.functions.invoke("log-client-error", {
      body: {
        message: message.slice(0, 1000),
        stack: stack?.slice(0, 4000),
        url: window.location.pathname,
        user_id: session?.user?.id ?? null,
      },
    });
  } catch {
    /* never let logging throw */
  }
}

export function initErrorLogging() {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (e) => report(e.message || String(e.error ?? ""), (e.error as Error)?.stack));
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason as { message?: string; stack?: string } | undefined;
    report(r?.message || String(r ?? "unhandledrejection"), r?.stack);
  });
}
