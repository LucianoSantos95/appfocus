import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageMeta } from "@/components/seo/PageMeta";
import { WelcomeChoiceModal } from "@/components/onboarding/WelcomeChoiceModal";
import { OnboardingWelcomeModal } from "@/components/onboarding/OnboardingWelcomeModal";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { useDemoData } from "@/contexts/DemoDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ASSISTANT_MESSAGES, type DemoModule } from "@/lib/demo-data";
import { seedDemoData } from "@/lib/demo-seed";

const MODULE_ROUTES: Record<DemoModule, string> = {
  financeiro: "/financas",
  clientes: "/clientes",
  projetos: "/projetos",
  painel: "/",
};

// Maps the pain point selected in OnboardingWelcomeModal to a demo module
// so the WelcomeChoiceModal can highlight the most relevant option.
const PAIN_TO_MODULE: Record<string, DemoModule> = {
  financas: "financeiro",
  clientes: "clientes",
  projetos: "projetos",
  tarefas: "painel",
};

export function OnboardingFlow() {
  const { user } = useAuth();
  const { session, loading, createSession, needsOnboarding } = useOnboardingSession();
  const { startDemo } = useDemoData();
  const navigate = useNavigate();

  // "welcome" → collect segment + pain via OnboardingWelcomeModal
  // "choose"  → pick demo module via WelcomeChoiceModal
  const [step, setStep] = useState<"welcome" | "choose">("welcome");
  const [collectedSegment, setCollectedSegment] = useState("pme");

  // Set localStorage flag as soon as the user lands here.
  // Prevents Index.tsx from re-redirecting if the user dismisses the modal.
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`onb_visited_${user.id}`, "1");
    }
  }, [user?.id]);

  // If they already completed onboarding, send them home.
  useEffect(() => {
    if (!loading && session) {
      navigate("/", { replace: true });
    }
  }, [loading, session, navigate]);

  const handleWelcomeComplete = useCallback((segment: string, _pain: string) => {
    setCollectedSegment(segment);
    setStep("choose");
  }, []);

  const handleChoose = useCallback(
    async (module: DemoModule) => {
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

      // Use the real segment collected in OnboardingWelcomeModal
      await createSession(collectedSegment, module, userName);

      if (user) {
        await seedDemoData(module, user.id);
      }

      startDemo(module);

      localStorage.setItem(
        "hub_assistant_pending_message",
        JSON.stringify({ module, content: ASSISTANT_MESSAGES[module] })
      );

      navigate(MODULE_ROUTES[module], { replace: true });
    },
    [user, collectedSegment, createSession, startDemo, navigate]
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

  // Only show "Redirecionando..." when there is actually a session — the
  // effect above will navigate home. Using `needsOnboarding` here caused a
  // deadlock: this page sets the `onb_visited_` flag on mount, which flips
  // `needsOnboarding` to false and left users stuck on a black screen.
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

      {/* Step 1: collect segment + priority pain */}
      <OnboardingWelcomeModal
        open={step === "welcome"}
        onComplete={handleWelcomeComplete}
        onSkip={() => setStep("choose")}
      />

      {/* Step 2: pick demo module */}
      {step === "choose" && (
        <WelcomeChoiceModal firstName={firstName} onChoose={handleChoose} />
      )}
    </MainLayout>
  );
}
