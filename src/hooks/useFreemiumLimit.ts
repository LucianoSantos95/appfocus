import { usePlan } from "@/contexts/PlanContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";

// Lowered 20 → 10 so the free ceiling is actually FELT (nobody ever hit 20).
// This is the primary upgrade-pressure lever; tune this single number as needed.
const FREE_LIMIT = 10;
const WARNING_THRESHOLD = Math.floor(FREE_LIMIT * 0.8); // 8/10

export function useFreemiumLimit(currentCount: number) {
  const { plan } = usePlan();
  const { isAdmin } = useTeamPermissions();

  const isFree = plan === "gratuito" && !isAdmin;
  const limitReached = isFree && currentCount >= FREE_LIMIT;
  const isNearLimit = isFree && !limitReached && currentCount >= WARNING_THRESHOLD;

  return {
    canAdd: !limitReached,
    limitReached,
    isNearLimit,
    currentCount,
    maxCount: FREE_LIMIT,
    isFree,
  };
}
