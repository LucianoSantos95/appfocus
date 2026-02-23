import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface PlanContextType {
  plan: string;
  isLoading: boolean;
  canAccess: (module: string, action: string) => boolean;
  features: PlanFeature[];
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
  const [plan, setPlan] = useState("gratuito");
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlan("gratuito");
      setFeatures([]);
      setIsLoading(false);
      return;
    }

    const fetchPlan = async () => {
      // Get user subscription
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      const currentPlan = sub?.plan || "gratuito";
      setPlan(currentPlan);

      // Get features for this plan
      const { data: feats } = await supabase
        .from("plan_features")
        .select("*")
        .eq("plan", currentPlan);

      setFeatures(feats || []);
      setIsLoading(false);
    };

    fetchPlan();
  }, [user]);

  const canAccess = (module: string, action: string): boolean => {
    // Guia is always accessible
    if (module === "guia") return true;
    
    const feature = features.find(
      (f) => f.module === module && f.action === action
    );
    return feature?.enabled ?? false;
  };

  return (
    <PlanContext.Provider value={{ plan, isLoading, canAccess, features }}>
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
