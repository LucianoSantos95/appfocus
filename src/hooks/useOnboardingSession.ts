import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveCampaignCoupon } from "@/lib/campaigns";

export interface OnboardingSession {
  id: string;
  user_id: string;
  user_name: string | null;
  segment: string | null;
  priority_pain: string | null;
  current_step: string;
  completed_modules: string[];
  achievements: string[];
  coupon_shown: boolean;
  coupon_code: string | null;
  coupon_expires_at: string | null;
  started_at: string;
  completed_at: string | null;
}

const COUPON_CODE = getActiveCampaignCoupon().code;

export function useOnboardingSession() {
  const { user } = useAuth();
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("onboarding_sessions" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .maybeSingle();
    if (data) setSession(data as any);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  const createSession = useCallback(async (segment: string, priorityPain: string, userName?: string | null) => {
    if (!user) return null;
    const { data } = await (supabase
      .from("onboarding_sessions" as any)
      .insert({
        user_id: user.id,
        user_name: userName ?? user.user_metadata?.full_name ?? user.email ?? null,
        segment,
        priority_pain: priorityPain,
        current_step: "demo",
        // Coupon is NOT activated on session start. useEngagementCoupon triggers it
        // after the user reaches 3 real actions, so it lands at a real "aha" moment.
        coupon_code: COUPON_CODE,
        coupon_shown: false,
      } as any)
      .select()
      .order("created_at", { ascending: false })
      .single() as any);
    if (data) setSession(data as OnboardingSession);
    return (data as OnboardingSession) || null;
  }, [user]);

  const updateSession = useCallback(async (updates: Partial<OnboardingSession>) => {
    if (!user || !session) return;
    const { data } = await supabase
      .from("onboarding_sessions" as any)
      .update(updates as any)
      .eq("user_id", user.id)
      .select()
      .order("created_at", { ascending: false })
      .single();
    if (data) setSession(data as any);
  }, [user, session]);

  const completeModule = useCallback(async (moduleSlug: string) => {
    if (!session) return;
    const modules = [...(session.completed_modules || [])];
    if (!modules.includes(moduleSlug)) modules.push(moduleSlug);
    await updateSession({ completed_modules: modules } as any);
  }, [session, updateSession]);

  const addAchievement = useCallback(async (achievement: string) => {
    if (!session) return;
    const achs = [...(session.achievements || [])];
    if (!achs.includes(achievement)) {
      achs.push(achievement);
      await updateSession({ achievements: achs } as any);
    }
  }, [session, updateSession]);

  /**
   * Called when user clicks "Começar com meus dados reais".
   * Moves to "exploring" step WITHOUT setting completed_at so re-engagement
   * emails keep firing until the user actually subscribes.
   */
  const startExploring = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("onboarding_sessions" as any)
      .update({ current_step: "exploring" } as any)
      .eq("user_id", user.id)
      .select()
      .order("created_at", { ascending: false })
      .maybeSingle();
    if (data) setSession(data as any);
  }, [user]);

  /**
   * Called when user clicks "Assinar agora".
   * Sets completed_at to mark the funnel step as done for analytics.
   */
  const finalizeOnboarding = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("onboarding_sessions" as any)
      .update({
        current_step: "completed",
        completed_at: new Date().toISOString(),
      } as any)
      .eq("user_id", user.id)
      .select()
      .order("created_at", { ascending: false })
      .maybeSingle();
    if (data) setSession(data as any);
  }, [user]);

  // A user "needs onboarding" if they have no session AND have never visited
  // the onboarding page. The localStorage flag prevents a redirect loop when
  // the user dismisses the modal before completing it.
  const hasVisitedOnboarding =
    typeof window !== "undefined" &&
    !!user?.id &&
    localStorage.getItem(`onb_visited_${user.id}`) === "1";

  const needsOnboarding = !loading && !!user && !session && !hasVisitedOnboarding;
  const isOnboardingComplete = session?.current_step === "completed";

  return {
    session, loading, createSession, updateSession, completeModule,
    addAchievement, startExploring, finalizeOnboarding,
    needsOnboarding, isOnboardingComplete, fetchSession,
  };
}
