import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { isDemoMode } from "@/lib/demo-fixtures";

const REAL_ACTION_THRESHOLD = 3;
const POLL_INTERVAL_MS = 45_000;

/**
 * Ativa o cupom de 48h assim que o usuário atinge N=3 ações reais
 * (clientes + transações + tarefas criadas por ele, excluindo linhas [DEMO]).
 *
 * O `OnboardingCouponBanner` continua reagindo a `coupon_shown` — apenas o
 * momento da ativação muda: sai do "primeiro segundo dentro do módulo"
 * para o real "aha".
 */
export function useEngagementCoupon() {
  const { user } = useAuth();
  const { session, updateSession } = useOnboardingSession();
  const firedRef = useRef(false);

  const check = useCallback(async () => {
    if (firedRef.current) return;
    if (!user || !session) return;
    if (session.coupon_shown) { firedRef.current = true; return; }
    if (isDemoMode()) return;

    // Contamos apenas linhas reais (excluímos rótulo "[DEMO]" usado pelo seed).
    const notDemo = "not.ilike.%[DEMO]%";
    const [c, t, k] = await Promise.all([
      supabase.from("clientes")   .select("id", { count: "exact", head: true }).eq("user_id", user.id).or(`nome.${notDemo}`),
      supabase.from("transacoes") .select("id", { count: "exact", head: true }).eq("user_id", user.id).or(`descricao.${notDemo}`),
      supabase.from("tarefas")    .select("id", { count: "exact", head: true }).eq("user_id", user.id).or(`titulo.${notDemo}`),
    ]);

    const total = (c.count ?? 0) + (t.count ?? 0) + (k.count ?? 0);
    if (total < REAL_ACTION_THRESHOLD) return;

    firedRef.current = true;
    await updateSession({
      coupon_shown: true,
      coupon_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    } as any);
  }, [user, session, updateSession]);

  useEffect(() => {
    if (!user || !session || session.coupon_shown) return;

    void check();
    const iv = window.setInterval(() => { void check(); }, POLL_INTERVAL_MS);
    const onFocus = () => { void check(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(iv);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [user, session, check]);
}
