import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type AuditAction = "login" | "create" | "update" | "delete";

export function useAuditLog() {
  const logEvent = useCallback(
    async (action: AuditAction, module: string, recordId?: string, details?: Record<string, unknown>) => {
      try {
        await supabase.rpc("log_audit_event", {
          p_action: action,
          p_module: module,
          p_record_id: recordId ?? null,
          p_details: details ? JSON.stringify(details) : "{}",
        } as never);
      } catch (err) {
        // Audit logging should never break the app
        console.error("Audit log error:", err);
      }
    },
    []
  );

  return { logEvent };
}
