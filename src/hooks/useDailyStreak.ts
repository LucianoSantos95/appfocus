import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Tabela user_daily_activity (user_id, day) criada direto no banco (RLS: dono).
// Registra a presença de hoje e calcula a sequência de dias consecutivos —
// enquadrada como disciplina de gestão, não joguinho.
const sb = supabase as any;

function dayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function useDailyStreak(): number | null {
  const { user } = useAuth();
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const today = dayStr(0);
      // Marca hoje (não duplica se já existir)
      await sb
        .from("user_daily_activity")
        .upsert({ user_id: user.id, day: today }, { onConflict: "user_id,day", ignoreDuplicates: true });

      const { data } = await sb
        .from("user_daily_activity")
        .select("day")
        .eq("user_id", user.id)
        .gte("day", dayStr(-60))
        .order("day", { ascending: false });

      if (!active) return;
      const days = new Set<string>((data || []).map((r: any) => r.day));
      let n = 0;
      const cur = new Date(today + "T00:00:00");
      while (days.has(cur.toISOString().slice(0, 10))) {
        n++;
        cur.setDate(cur.getDate() - 1);
      }
      setStreak(n);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  return streak;
}
