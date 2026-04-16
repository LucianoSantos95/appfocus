import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OnboardingSession {
  id: string;
  user_id: string;
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

const COUPON_CODE = "NpOu4Cxn";

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
      .maybeSingle();
    if (data) setSession(data as any);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  const createSession = useCallback(async (segment: string, priorityPain: string) => {
    if (!user) return null;
    const { data } = await supabase
      .from("onboarding_sessions" as any)
      .insert({
        user_id: user.id,
        segment,
        priority_pain: priorityPain,
        current_step: "module_1",
      } as any)
      .select()
      .single();
    if (data) setSession(data as any);
    return data as OnboardingSession | null;
  }, [user]);

  const updateSession = useCallback(async (updates: Partial<OnboardingSession>) => {
    if (!user || !session) return;
    const { data } = await supabase
      .from("onboarding_sessions" as any)
      .update(updates as any)
      .eq("user_id", user.id)
      .select()
      .single();
    if (data) setSession(data as any);
  }, [user, session]);

  const completeModule = useCallback(async (moduleSlug: string) => {
    if (!session) return;
    const modules = [...(session.completed_modules || [])];
    if (!modules.includes(moduleSlug)) modules.push(moduleSlug);

    const stepNum = modules.length;
    const isComplete = stepNum >= 3;

    const updates: any = {
      completed_modules: modules,
      current_step: isComplete ? "completed" : `module_${stepNum + 1}`,
    };

    if (isComplete && !session.completed_at) {
      updates.completed_at = new Date().toISOString();
      updates.coupon_shown = true;
      updates.coupon_code = COUPON_CODE;
      updates.coupon_expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    }

    await updateSession(updates);
  }, [session, updateSession]);

  const addAchievement = useCallback(async (achievement: string) => {
    if (!session) return;
    const achs = [...(session.achievements || [])];
    if (!achs.includes(achievement)) {
      achs.push(achievement);
      await updateSession({ achievements: achs } as any);
    }
  }, [session, updateSession]);

  const needsOnboarding = !loading && user && !session;
  const isOnboardingComplete = session?.current_step === "completed";

  return {
    session, loading, createSession, updateSession, completeModule,
    addAchievement, needsOnboarding, isOnboardingComplete, fetchSession,
  };
}
