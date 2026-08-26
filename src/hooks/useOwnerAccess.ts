import { useAuth } from "@/contexts/AuthContext";
import { isOwnerEmail, PLATFORM_OWNER_EMAIL } from "@/lib/owner";

export { PLATFORM_OWNER_EMAIL };

/** Acesso exclusivo do dono da plataforma (validado também no banco). */
export function useOwnerAccess() {
  const { user, isLoading } = useAuth();
  return { isOwner: isOwnerEmail(user?.email), isLoading };
}
