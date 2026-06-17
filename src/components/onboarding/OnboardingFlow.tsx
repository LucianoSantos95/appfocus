import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageMeta } from "@/components/seo/PageMeta";
import { WelcomeChoiceModal } from "@/components/onboarding/WelcomeChoiceModal";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { useDemoData } from "@/contexts/DemoDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getAssistantMessage, type DemoModule } from "@/lib/demo-data";
import { seedDemoData } from "@/lib/demo-seed";
import { buildWowMoment } from "@/components/onboarding/WowMomentCard";

const MODULE_ROUTES: Record<DemoModule, string> = {
  financeiro: "/financas",
  clientes: "/clientes",
  projetos: "/projetos",
  painel: "/",
};

// buildWowMoment uses internal module names that differ from DemoModule keys
const WOW_MODULE_MAP: Record<DemoModule, string> = {
  financeiro: "financas",
  clientes: "clientes",
  projetos: "projetos",
  painel: "painel",
};

// Metadata seeded into each module, used to show concrete numbers in the WowMoment card
const WOW_META: Record<DemoModule, Record<string, unknown>> = {
  financeiro: { value: 11700 },
  clientes:   { nome: "seus primeiros clientes" },
  projetos:   {},
  painel:     { value: 11700 },
};

export function OnboardingFlow() {
  const { user } = useAuth();
  const { session, loading, createSession } = useOnboardingSession();
  const { startDemo, triggerWow } = useDemoData();
  const navigate = useNavigate();
  const [isSeeding, setIsSeeding] = useState(false);

  // Prevent Index.tsx from re-redirecting if the user is mid-onboarding
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`onb_visited_${user.id}`, "1");
    }
  }, [user?.id]);

  // Already completed onboarding → go home
  useEffect(() => {
    if (!loading && session) {
      navigate("/", { replace: true });
    }
  }, [loading, session, navigate]);

  const handleChoose = useCallback(
    async (module: DemoModule, segment: string) => {
      setIsSeeding(true);
      const seedStart = Date.now();
      try {
        let userName: string | null = null;
        if (user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", user.id)
            .maybeSingle();
          userName =
            prof?.display_name ??
            (user.user_metadata as any)?.full_name ??
            user.email ??
            null;
        }

        await createSession(segment, module, userName);

        if (user) {
          // Pass segment so demo data matches the user's context (agencia/consultoria/freelancer/pme)
          await seedDemoData(module, user.id, segment);
        }

        startDemo(module);

        // Queue WowMomentCard to fire on the destination page (1.2s delay via triggerWow)
        const ttvSeconds = (Date.now() - seedStart) / 1000;
        triggerWow(buildWowMoment(WOW_MODULE_MAP[module], ttvSeconds, WOW_META[module]));

        // AIChatWidget reads this on mount and auto-opens with the segment-aware message
        localStorage.setItem(
          "hub_assistant_pending_message",
          JSON.stringify({ module, content: getAssistantMessage(module, segment) })
        );

        navigate(MODULE_ROUTES[module], { replace: true });
      } finally {
        setIsSeeding(false);
      }
    },
    [user, createSession, startDemo, triggerWow, navigate]
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </MainLayout>
    );
  }

  if (session) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Redirecionando...</div>
        </div>
      </MainLayout>
    );
  }

  const firstName =
    (user?.user_metadata as any)?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "tudo bem";

  return (
    <MainLayout>
      <PageMeta title="Bem-vindo" description="Escolha por onde começar no Hub Empresarial" />
      <WelcomeChoiceModal
        firstName={firstName}
        onChoose={handleChoose}
        isLoading={isSeeding}
      />
    </MainLayout>
  );
}
