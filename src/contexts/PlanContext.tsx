import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { isDemoMode } from "@/lib/demo-fixtures";


interface PlanContextType {
  plan: string;
  isLoading: boolean;
  canAccess: (module: string, action: string) => boolean;
  features: PlanFeature[];
  subscriptionEnd: string | null;
  refreshSubscription: () => Promise<void>;
}

interface PlanFeature {
  plan: string;
  module: string;
  action: string;
  enabled: boolean;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isAdmin } = useTeamPermissions();
  const demo = isDemoMode();
  const [plan, setPlan] = useState(demo ? "enterprise" : "gratuito");
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [isLoading, setIsLoading] = useState(!demo);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const fetchFeatures = useCallback(async (currentPlan: string) => {
    const { data: feats } = await supabase
      .from("plan_features")
      .select("*")
      .eq("plan", currentPlan);
    setFeatures(feats || []);
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (demo) return;
    if (!user) return;
    // Fonte de verdade: tabela local (o webhook Asaas mantém atualizada).
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, updated_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentPlan = sub?.plan || "gratuito";
    setPlan(currentPlan);
    setSubscriptionEnd(null);
    await fetchFeatures(currentPlan);
  }, [user, fetchFeatures, demo]);

  useEffect(() => {
    if (demo) return; // Demo: plano/enterprise fixo, sem fetch.
    if (!user) {
      setPlan("gratuito");
      setFeatures([]);
      setSubscriptionEnd(null);
      setIsLoading(false);
      return;
    }

    (async () => {
      await refreshSubscription();
      setIsLoading(false);
    })();
  }, [user, refreshSubscription, demo]);

  // Refresh periódico (5 min) para pegar mudanças do webhook.
  useEffect(() => {
    if (demo || !user) return;
    const interval = setInterval(refreshSubscription, 5 * 60_000);
    return () => clearInterval(interval);
  }, [user, refreshSubscription, demo]);

  const canAccess = (_module: string, _action: string): boolean => {
    if (demo) return true; // Demo libera todos os módulos, incluindo BI.
    if (isAdmin) return true;
    if (_module === "guia") return true;
    const feature = features.find(
      (f) => f.module === _module && f.action === _action
    );
    return feature?.enabled ?? false;
  };



  return (
    <PlanContext.Provider value={{ plan, isLoading, canAccess, features, subscriptionEnd, refreshSubscription }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error("usePlan must be used within a PlanProvider");
  }
  return context;
}
