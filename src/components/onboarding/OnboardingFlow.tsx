import { useCallback, useEffect } from "react";
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
  const { session, loading, createSession, needsOnboarding } = useOnboardingSession();
  const { startDemo } = useDemoData();
  const navigate = useNavigate();

  // If already has session, leave onboarding immediately
  useEffect(() => {
    if (!loading && session) {
      navigate("/", { replace: true });
    }
  }, [loading, session, navigate]);

  const handleChoose = useCallback(
    async (module: DemoModule) => {
      // 1. Resolve display name for session record
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

      // 2. Create onboarding session record (segment = chosen module)
      await createSession(module, module, userName);

      // 3. Seed fictitious demo data into the real tables so the user
      //    immediately sees the module populated.
      if (user) {
        await seedDemoData(module, user.id);
      }

      // 4. Activate demo overlay
      startDemo(module);

      // 4. Queue assistant message + auto-open flag for the chat widget
      localStorage.setItem(
        "hub_assistant_pending_message",
        JSON.stringify({ module, content: ASSISTANT_MESSAGES[module] })
      );

      // 5. Navigate to the chosen module route
      navigate(MODULE_ROUTES[module], { replace: true });
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

  if (!needsOnboarding) {
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
      <WelcomeChoiceModal firstName={firstName} onChoose={handleChoose} />
    </MainLayout>
  );
}
