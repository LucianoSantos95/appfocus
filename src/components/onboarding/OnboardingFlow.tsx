import { useState, useCallback, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageMeta } from "@/components/seo/PageMeta";
import { OnboardingWelcomeModal } from "@/components/onboarding/OnboardingWelcomeModal";
import { OnboardingProgressBar } from "@/components/onboarding/OnboardingProgressBar";
import { OnboardingChat } from "@/components/onboarding/OnboardingChat";
import { OnboardingCouponBanner } from "@/components/onboarding/OnboardingCouponBanner";
import { WowMomentCard, buildWowMoment, type WowMoment } from "@/components/onboarding/WowMomentCard";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { useMilestones, formatDuration } from "@/hooks/useMilestones";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, PartyPopper, ArrowRight, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

export function OnboardingFlow() {
  const {
    session, loading, createSession, completeModule,
    addAchievement, needsOnboarding, isOnboardingComplete,
  } = useOnboardingSession();
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(true);

  const handleWelcomeComplete = useCallback(async (segment: string, pain: string) => {
    await createSession(segment, pain);
    setShowWelcome(false);
  }, [createSession]);

  const handleModuleComplete = useCallback(async (mod: string) => {
    await completeModule(mod);
    const achievementMap: Record<string, string> = {
      financas: "financial_manager",
      clientes: "networker",
    };
    if (achievementMap[mod]) {
      await addAchievement(achievementMap[mod]);
    }
    // Check if all complete
    const newCount = (session?.completed_modules?.length || 0) + 1;
    if (newCount >= 3) {
      await addAchievement("operation_running");
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }, [completeModule, addAchievement, session]);

  const handleAchievement = useCallback(async (ach: string) => {
    await addAchievement(ach);
  }, [addAchievement]);

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
        <OnboardingWelcomeModal open={true} onComplete={handleWelcomeComplete} />
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
            <div className="pt-4 flex justify-center gap-3">
              <Button onClick={() => navigate("/")} className="gap-2">
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
      </MainLayout>
    );
  }

  // Active onboarding
  return (
    <MainLayout>
      <PageMeta title="Configurando seu Hub" description="Siga o assistente para configurar sua operação" />
      <div className="max-w-3xl mx-auto space-y-6 py-4 animate-fade-in">
        {/* Header */}
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

        {/* Progress */}
        <Card className="p-5">
          <OnboardingProgressBar session={session} />
        </Card>

        {/* Chat */}
        <OnboardingChat
          session={session}
          onModuleComplete={handleModuleComplete}
          onAchievement={handleAchievement}
        />
      </div>
    </MainLayout>
  );
}
