import { useTeamPermissionsContext } from "@/contexts/TeamPermissionsContext";

// Re-exports the shared TeamPermissionsContext so all existing callers
// get a single fetch per session instead of one fetch per component mount.
export function useTeamPermissions() {
  return useTeamPermissionsContext();
}
