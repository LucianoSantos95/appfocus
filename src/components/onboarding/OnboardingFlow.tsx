import { useState, useCallback, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageMeta } from "@/components/seo/PageMeta";
import { OnboardingWelcomeModal } from "@/components/onboarding/OnboardingWelcomeModal";
import { OnboardingProgressBar } from "@/components/onboarding/OnboardingProgressBar";
import { OnboardingChat } from "@/components/onboarding/OnboardingChat";
import { OnboardingCouponBanner } from "@/components/onboarding/OnboardingCouponBanner";
import { OnboardingCouponPreview } from "@/components/onboarding/OnboardingCouponPreview";
import { WowMomentCard, buildWowMoment, type WowMoment } from "@/components/onboarding/WowMomentCard";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { useMilestones, formatDuration } from "@/hooks/useMilestones";
import { useNicheTemplate } from "@/hooks/useNicheTemplate";
import { getNicheTemplate } from "@/lib/niche-templates";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, PartyPopper, ArrowRight, Timer, SkipForward } from "lucide-react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AUTO_TOUR_FLAG = "hub_auto_tour_pending";

export function OnboardingFlow() {
  const {
    session, loading, createSession, completeModule,
    addAchievement, needsOnboarding, isOnboardingComplete,
  } = useOnboardingSession();
  const { recordMilestone, timeBetween, getMilestone } = useMilestones();
  const { apply: applyNicheTemplate } = useNicheTemplate();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);
  const [wowMoment, setWowMoment] = useState<WowMoment | null>(null);
  const [pendingInsight, setPendingInsight] = useState<{ insight: string; emoji?: string } | null>(null);

  // Record signup milestone on first mount with a user
  useEffect(() => {
    recordMilestone("signup");
  }, [recordMilestone]);

  useEffect(() => {
    if (!session?.started_at || session.current_step === "welcome") return;
    void recordMilestone("onboarding_started", {
      segment: session.segment,
      pain: session.priority_pain,
      source: "session_backfill",
      started_at: session.started_at,
    });
  }, [session?.started_at, session?.current_step, session?.segment, session?.priority_pain, recordMilestone]);

  const handleWelcomeComplete = useCallback(async (segment: string, pain: string) => {
    // Fetch display name from profile (fallback: metadata / email)
    let userName: string | null = null;
    if (user) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      userName = prof?.display_name ?? (user.user_metadata as any)?.full_name ?? user.email ?? null;
    }
    await createSession(segment, pain, userName);
    await recordMilestone("onboarding_started", { segment, pain });
    setShowWelcome(false);

    // Apply niche template (pipelines, key tasks, financial categories)
    const tpl = getNicheTemplate(segment);
    const result = await applyNicheTemplate(segment);
    if (result.ok && (result.created.processes + result.created.tasks + result.created.note) > 0) {
      toast({
        title: `Operação ${tpl.label} configurada ⚡`,
        description: `Adicionamos ${result.created.processes} etapas de pipeline, ${result.created.tasks} tarefas-chave e categorias financeiras prontas para uso.`,
      });
    }
  }, [createSession, recordMilestone, applyNicheTemplate, user]);

  const handleSkipOnboarding = useCallback(async () => {
    await recordMilestone("onboarding_skipped");
    localStorage.setItem(AUTO_TOUR_FLAG, "1");
    toast({
      title: "Sem problemas! Você pode retomar quando quiser.",
      description: "Vamos te mostrar um tour rápido do painel.",
    });
    navigate("/");
  }, [recordMilestone, navigate]);

  const handleModuleComplete = useCallback(async (mod: string, metadata: Record<string, any> = {}) => {
    await completeModule(mod);

    // Telemetry: first module completion is the "aha moment"
    const isFirst = (session?.completed_modules?.length || 0) === 0;
    if (isFirst) {
      await recordMilestone("first_real_data", { module: mod, ...metadata });
      await recordMilestone("aha_moment", { module: mod });
    }
    await recordMilestone("first_module_complete", { module: mod });

    // Build personalized WOW moment
    const ttv = timeBetween("onboarding_started", "first_real_data");
    const insightPayload = pendingInsight
      ? { insight: pendingInsight.insight, emoji: pendingInsight.emoji }
      : {};
    setWowMoment(buildWowMoment(mod, ttv, { ...metadata, ...insightPayload }));
    setPendingInsight(null);

    const achievementMap: Record<string, string> = {
      financas: "financial_manager",
      clientes: "networker",
    };
    if (achievementMap[mod]) {
      await addAchievement(achievementMap[mod]);
    }

    const newCount = (session?.completed_modules?.length || 0) + 1;
    if (newCount >= 3) {
      await addAchievement("operation_running");
      await recordMilestone("onboarding_complete");
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }, [completeModule, addAchievement, session, recordMilestone, timeBetween, pendingInsight]);

  const handleAchievement = useCallback(async (ach: string) => {
    await addAchievement(ach);
  }, [addAchievement]);

  const handleInsight = useCallback((payload: { insight: string; emoji?: string }) => {
    setPendingInsight(payload);
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </MainLayout>
    );
  }

  // Show welcome modal for new users
  if (needsOnboarding && showWelcome) {
    return (
      <MainLayout>
        <PageMeta title="Onboarding" description="Configure sua operação com o Hub Empresarial" />
        <OnboardingWelcomeModal open={true} onComplete={handleWelcomeComplete} onSkip={handleSkipOnboarding} />
      </MainLayout>
    );
  }

  // No session yet (shouldn't happen after welcome)
  if (!session) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Button onClick={() => setShowWelcome(true)}>Iniciar Onboarding</Button>
        </div>
      </MainLayout>
    );
  }

  // Completed state
  if (isOnboardingComplete) {
    const ttvSeconds = timeBetween("onboarding_started", "onboarding_complete");
    return (
      <MainLayout>
        <PageMeta title="Onboarding Concluído!" description="Sua operação está configurada" />
        <div className="max-w-2xl mx-auto space-y-6 py-8 animate-fade-in">
          <Card className="p-8 text-center space-y-4 bg-gradient-to-br from-primary/10 via-card to-card border-primary/20">
            <PartyPopper className="h-16 w-16 text-primary mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Parabéns! Sua operação está configurada! 🎉</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Você completou o onboarding e sua operação já está pronta. Agora é só usar o Hub no dia a dia!
            </p>
            <div className="mx-auto max-w-md rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">
              🎁 Seu cupom <span className="font-mono font-bold text-primary">FOCUS20</span> (20% OFF) será aplicado <span className="font-semibold">automaticamente</span> ao clicar em <span className="font-semibold">Assinar</span> em qualquer plano. Não precisa digitar nada!
            </div>
            {ttvSeconds !== null && (
              <div className="inline-flex items-center gap-2 mx-auto rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5">
                <Timer className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-foreground">
                  Você levou apenas <span className="font-bold text-primary">{formatDuration(ttvSeconds)}</span> para configurar seu Hub
                </span>
              </div>
            )}
            <div className="pt-4 flex justify-center gap-3">
              <Button
                onClick={() => {
                  localStorage.setItem(AUTO_TOUR_FLAG, "1");
                  navigate("/");
                }}
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Ir para o Painel
              </Button>
              <Button variant="outline" onClick={() => navigate("/planos")}>
                Ver Planos
              </Button>
            </div>
          </Card>

          <OnboardingProgressBar session={session} />
        </div>
        <OnboardingCouponBanner session={session} />
        <WowMomentCard moment={wowMoment} onDismiss={() => setWowMoment(null)} />
      </MainLayout>
    );
  }

  // Active onboarding
  return (
    <MainLayout>
      <PageMeta title="Configurando seu Hub" description="Siga o assistente para configurar sua operação" />
      <div className="max-w-3xl mx-auto space-y-6 py-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-2.5">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Configurando seu Hub</h1>
              <p className="text-sm text-muted-foreground">
                O Focus vai te guiar para configurar tudo em poucos minutos
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
            onClick={handleSkipOnboarding}
          >
            <SkipForward className="h-3.5 w-3.5" />
            Pular
          </Button>
        </div>

        {/* Coupon preview — creates anticipation early */}
        <OnboardingCouponPreview session={session} />

        {/* Progress */}
        <Card className="p-5">
          <OnboardingProgressBar session={session} />
        </Card>

        {/* Chat */}
        <OnboardingChat
          session={session}
          onModuleComplete={handleModuleComplete}
          onAchievement={handleAchievement}
          onInsight={handleInsight}
        />
      </div>
      <WowMomentCard moment={wowMoment} onDismiss={() => setWowMoment(null)} />
    </MainLayout>
  );
}
