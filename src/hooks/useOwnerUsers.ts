import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OwnerUserRow {
  user_id: string;
  email: string;
  display_name: string;
  plan: string;
  signed_up_at: string;
  last_sign_in_at: string | null;
  last_active_at: string | null;
  actions_30d: number;
  actions_90d: number;
  active_days_30d: number;
  classificacao: string | null;
  actions_by_module: Record<string, number> | null;
  sessions_count: number;
  total_time_sec: number;
  avg_session_sec: number;
  funnel_stage: string | null;
}

export interface OwnerOverview {
  total_users: number;
  new_7d: number;
  new_30d: number;
  active_7d: number;
  active_30d: number;
  paid_users: number;
}

export function useOwnerUsers() {
  const [users, setUsers] = useState<OwnerUserRow[]>([]);
  const [overview, setOverview] = useState<OwnerOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const [listRes, ovRes] = await Promise.all([
      supabase.rpc("owner_users_list"),
      supabase.rpc("owner_users_overview"),
    ]);
    if (listRes.error) setError(listRes.error.message);
    setUsers(((listRes.data as unknown as OwnerUserRow[]) || []));
    setOverview(((ovRes.data as unknown as OwnerOverview[]) || [])[0] ?? null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { users, overview, isLoading, error, refetch: load };
}

export function formatDuration(sec: number): string {
  if (!sec || sec <= 0) return "sem dados";
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

export function formatDate(value: string | null): string {
  if (!value) return "sem dados";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function daysSince(value: string | null): number | null {
  if (!value) return null;
  return Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
}
