import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ConsentType = "terms_of_service" | "privacy_policy" | "lgpd" | "marketing_emails";

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  version: string;
  accepted: boolean;
  ip_address: string | null;
  user_agent: string | null;
  accepted_at: string;
  created_at: string;
}

export function useConsentRecords() {
  const { user } = useAuth();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConsents = useCallback(async () => {
    if (!user) { setIsLoading(false); return; }
    const { data } = await supabase
      .from("consent_records" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setConsents((data as unknown as ConsentRecord[]) ?? []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchConsents(); }, [fetchConsents]);

  const recordConsent = useCallback(
    async (
      consentType: ConsentType,
      accepted: boolean,
      version = "1.0"
    ): Promise<boolean> => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("consent_records" as any)
        .insert({
          user_id: user.id,
          consent_type: consentType,
          version,
          accepted,
          user_agent: navigator.userAgent,
        } as any)
        .select()
        .single();
      if (error) return false;
      setConsents(prev => [data as unknown as ConsentRecord, ...prev]);
      return true;
    },
    [user]
  );

  const hasAccepted = useCallback(
    (consentType: ConsentType, version?: string): boolean => {
      const matching = consents.filter(c => c.consent_type === consentType && c.accepted);
      if (matching.length === 0) return false;
      if (version) return matching.some(c => c.version === version);
      return true;
    },
    [consents]
  );

  return { consents, isLoading, recordConsent, hasAccepted, refetch: fetchConsents };
}
