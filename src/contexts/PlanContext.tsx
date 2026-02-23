import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { PRODUCT_TO_PLAN } from "@/lib/stripe-plans";

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
  const { user, session } = useAuth();
  const [plan, setPlan] = useState("gratuito");
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const fetchFeatures = useCallback(async (currentPlan: string) => {
    const { data: feats } = await supabase
      .from("plan_features")
      .select("*")
      .eq("plan", currentPlan);
    setFeatures(feats || []);
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error || !data) {
        console.warn("check-subscription error, falling back to local", error);
        return;
      }

      if (data.subscribed && data.product_id) {
        const stripePlan = PRODUCT_TO_PLAN[data.product_id] || "gratuito";
        setPlan(stripePlan);
        setSubscriptionEnd(data.subscription_end || null);
        await fetchFeatures(stripePlan);
      } else {
        setPlan("gratuito");
        setSubscriptionEnd(null);
        await fetchFeatures("gratuito");
      }
    } catch (err) {
      console.warn("Failed to check subscription", err);
    }
  }, [session?.access_token, fetchFeatures]);

  useEffect(() => {
    if (!user) {
      setPlan("gratuito");
      setFeatures([]);
      setSubscriptionEnd(null);
      setIsLoading(false);
      return;
    }

    const init = async () => {
      // First load local subscription as fallback
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      const localPlan = sub?.plan || "gratuito";
      setPlan(localPlan);
      await fetchFeatures(localPlan);
      setIsLoading(false);

      // Then check Stripe for real status
      await refreshSubscription();
    };

    init();
  }, [user, fetchFeatures, refreshSubscription]);

  // Periodic refresh every 60 seconds
  useEffect(() => {
    if (!session?.access_token) return;
    const interval = setInterval(refreshSubscription, 60_000);
    return () => clearInterval(interval);
  }, [session?.access_token, refreshSubscription]);

  const canAccess = (module: string, action: string): boolean => {
    if (module === "guia") return true;
    const feature = features.find(
      (f) => f.module === module && f.action === action
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
