import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageMeta } from "@/components/seo/PageMeta";
import { WelcomeChoiceModal } from "@/components/onboarding/WelcomeChoiceModal";
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

export function OnboardingFlow() {
  const { user } = useAuth();
  const { session, loading, createSession } = useOnboardingSession();
  const { startDemo } = useDemoData();
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
          await seedDemoData(module, user.id);
        }

        startDemo(module);

        localStorage.setItem(
          "hub_assistant_pending_message",
          JSON.stringify({ module, content: ASSISTANT_MESSAGES[module] })
        );

        navigate(MODULE_ROUTES[module], { replace: true });
      } finally {
        setIsSeeding(false);
      }
    },
    [user, createSession, startDemo, navigate]
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
