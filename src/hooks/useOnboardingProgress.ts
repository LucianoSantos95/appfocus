import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useOnboardingProgress() {
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("onboarding_progress" as any)
      .select("step_id")
      .eq("user_id", user.id);
    if (data) {
      setCompletedSteps(new Set((data as any[]).map((d) => d.step_id)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const toggleStep = useCallback(
    async (stepId: string) => {
      if (!user) return;
      const isCompleted = completedSteps.has(stepId);

      if (isCompleted) {
        // Remove
        setCompletedSteps((prev) => {
          const next = new Set(prev);
          next.delete(stepId);
          return next;
        });
        await supabase
          .from("onboarding_progress" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("step_id", stepId);
      } else {
        // Add
        setCompletedSteps((prev) => new Set(prev).add(stepId));
        await supabase
          .from("onboarding_progress" as any)
          .insert({ user_id: user.id, step_id: stepId } as any);
      }
    },
    [user, completedSteps]
  );

  const isStepCompleted = useCallback(
    (stepId: string) => completedSteps.has(stepId),
    [completedSteps]
  );

  return { completedSteps, loading, toggleStep, isStepCompleted, totalCompleted: completedSteps.size };
}
