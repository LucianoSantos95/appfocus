import { usePlan } from "@/contexts/PlanContext";

export function usePlanFeatures(module: string) {
  const { plan, canAccess, isLoading } = usePlan();

  return {
    plan,
    isLoading,
    canView: canAccess(module, "view"),
    canCreate: canAccess(module, "create"),
    canExport: canAccess(module, "export"),
    canUseAI: canAccess(module, "ai_analysis"),
    canUseAPI: canAccess(module, "api"),
  };
}
