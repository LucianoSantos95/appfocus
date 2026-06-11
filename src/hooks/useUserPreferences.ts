import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  notify_email_weekly_report: boolean;
  notify_email_product_updates: boolean;
  notify_inapp_tasks: boolean;
  notify_inapp_clientes: boolean;
  notify_inapp_financeiro: boolean;
  sidebar_collapsed: boolean;
  dashboard_widgets: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const DEFAULTS: Omit<UserPreferences, "id" | "user_id" | "created_at" | "updated_at"> = {
  theme: "system",
  language: "pt-BR",
  timezone: "America/Sao_Paulo",
  notify_email_weekly_report: true,
  notify_email_product_updates: true,
  notify_inapp_tasks: true,
  notify_inapp_clientes: true,
  notify_inapp_financeiro: true,
  sidebar_collapsed: false,
  dashboard_widgets: {},
};

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) { setIsLoading(false); return; }
    const { data } = await supabase
      .from("user_preferences" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setPreferences((data as UserPreferences) ?? null);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchPreferences(); }, [fetchPreferences]);

  const updatePreferences = useCallback(
    async (updates: Partial<Omit<UserPreferences, "id" | "user_id" | "created_at" | "updated_at">>) => {
      if (!user) return false;
      const now = new Date().toISOString();

      if (preferences) {
        const { data, error } = await supabase
          .from("user_preferences" as any)
          .update({ ...updates, updated_at: now } as any)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) return false;
        setPreferences(data as UserPreferences);
      } else {
        const { data, error } = await supabase
          .from("user_preferences" as any)
          .insert({ ...DEFAULTS, ...updates, user_id: user.id, updated_at: now } as any)
          .select()
          .single();
        if (error) return false;
        setPreferences(data as UserPreferences);
      }
      return true;
    },
    [user, preferences]
  );

  const effectivePrefs: Omit<UserPreferences, "id" | "user_id" | "created_at" | "updated_at"> =
    preferences ?? DEFAULTS;

  return { preferences: effectivePrefs, rawPreferences: preferences, isLoading, updatePreferences, refetch: fetchPreferences };
}
