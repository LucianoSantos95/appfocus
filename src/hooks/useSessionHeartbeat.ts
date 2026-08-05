import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isDemoMode } from "@/lib/demo-fixtures";

const HEARTBEAT_MS = 60_000; // 1 min
const SESSION_GAP_MS = 30 * 60_000; // nova sessão após 30 min inativo

/**
 * Registra o tempo de permanência na plataforma:
 * cria uma linha em user_sessions ao entrar e atualiza
 * last_seen_at/duration_sec a cada minuto enquanto a aba está visível.
 */
export function useSessionHeartbeat() {
  const { user } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const lastBeatRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!user || isDemoMode()) return;
    let cancelled = false;

    const start = async () => {
      const { data } = await supabase
        .from("user_sessions")
        .insert({ user_id: user.id })
        .select("id")
        .single();
      if (!cancelled && data) {
        sessionIdRef.current = data.id;
        startedAtRef.current = Date.now();
        lastBeatRef.current = Date.now();
      }
    };

    const beat = async () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      // Se ficou muito tempo parado, abre uma nova sessão
      if (now - lastBeatRef.current > SESSION_GAP_MS) {
        sessionIdRef.current = null;
        await start();
        return;
      }
      lastBeatRef.current = now;
      if (!sessionIdRef.current) return;
      const duration = Math.round((now - startedAtRef.current) / 1000);
      await supabase
        .from("user_sessions")
        .update({ last_seen_at: new Date().toISOString(), duration_sec: duration })
        .eq("id", sessionIdRef.current);
    };

    start();
    const interval = window.setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", beat);
      void beat();
    };
  }, [user]);
}
