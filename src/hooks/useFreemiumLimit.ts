import { usePlan } from "@/contexts/PlanContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";

const FREE_LIMIT = 20;
const WARNING_THRESHOLD = Math.floor(FREE_LIMIT * 0.8); // 16/20

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
