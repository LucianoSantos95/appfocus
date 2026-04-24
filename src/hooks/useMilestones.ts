import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type MilestoneKey =
  | "signup"
  | "onboarding_started"
  | "first_real_data"
  | "first_module_complete"
  | "aha_moment"
  | "onboarding_complete"
  | "onboarding_skipped"
  | "plan_page_viewed"
  | "checkout_started"
  | "upgrade_completed";

export interface Milestone {
  id: string;
  user_id: string;
  milestone_key: MilestoneKey;
  metadata: Record<string, any>;
  reached_at: string;
}

export function useMilestones() {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("user_milestones" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("reached_at", { ascending: true });
    if (data) setMilestones(data as any);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const recordMilestone = useCallback(
    async (key: MilestoneKey, metadata: Record<string, any> = {}) => {
      if (!user) return null;
      const { data, error } = await (supabase
        .from("user_milestones" as any)
        .insert({ user_id: user.id, milestone_key: key, metadata } as any)
        .select()
        .maybeSingle() as any);

      // 23505 = unique_violation: milestone already recorded, treat as success
      if (error && (error as any).code !== "23505") {
        console.warn("[useMilestones] recordMilestone failed:", key, error);
        return null;
      }
      if (data) {
        setMilestones((prev) =>
          prev.some((m) => m.milestone_key === key) ? prev : [...prev, data as Milestone]
        );
      }
      return (data as Milestone | null) ?? null;
    },
    [user]
  );

  const getMilestone = useCallback(
    (key: MilestoneKey) => milestones.find((m) => m.milestone_key === key) || null,
    [milestones]
  );

  /** Time (in seconds) between two milestones. Returns null if either is missing. */
  const timeBetween = useCallback(
    (from: MilestoneKey, to: MilestoneKey): number | null => {
      const a = getMilestone(from);
      const b = getMilestone(to);
      if (!a || !b) return null;
      return Math.max(0, Math.round((new Date(b.reached_at).getTime() - new Date(a.reached_at).getTime()) / 1000));
    },
    [getMilestone]
  );

  return { milestones, loading, recordMilestone, getMilestone, timeBetween, refetch: fetch };
}

/** Format seconds as a friendly Portuguese duration ("3 min", "2h 15min") */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds < 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rem = min % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}min`;
}
