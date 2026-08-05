import { useAuth } from "@/contexts/AuthContext";

export const PLATFORM_OWNER_EMAIL = "oluciano.dosantos@gmail.com";

/** Acesso exclusivo do dono da plataforma (validado também no banco). */
export function useOwnerAccess() {
  const { user, isLoading } = useAuth();
  const isOwner = (user?.email || "").toLowerCase() === PLATFORM_OWNER_EMAIL;
  return { isOwner, isLoading };
}
