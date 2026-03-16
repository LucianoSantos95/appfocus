import { usePlan } from "@/contexts/PlanContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";

const FREE_LIMIT = 5;

export function useFreemiumLimit(currentCount: number) {
  const { plan } = usePlan();
  const { isAdmin } = useTeamPermissions();

  const isFree = plan === "gratuito" && !isAdmin;
  const limitReached = isFree && currentCount >= FREE_LIMIT;

  return {
    canAdd: !limitReached,
    limitReached,
    currentCount,
    maxCount: FREE_LIMIT,
    isFree,
  };
}
