import { MainLayout } from "@/components/layout/MainLayout";
import { PageMeta } from "@/components/seo/PageMeta";
import { OnboardingPrompt } from "@/components/guide/OnboardingPrompt";
import { OnboardingFeedbackPrompt } from "@/components/onboarding/OnboardingFeedbackPrompt";
import { OnboardingCouponBanner } from "@/components/onboarding/OnboardingCouponBanner";
import { GuidedTour } from "@/components/guide/GuidedTour";
import { ModuleCard } from "@/components/ui/module-card";
import { AgendaWidget } from "@/components/dashboard/AgendaWidget";
import { BulletinBoard } from "@/components/dashboard/BulletinBoard";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { UsageLimitWidget } from "@/components/dashboard/UsageLimitWidget";
import { PersistentCouponWidget } from "@/components/dashboard/PersistentCouponWidget";
import { WorldCupBanner } from "@/components/dashboard/WorldCupBanner";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { IntegrationsPulse } from "@/components/dashboard/IntegrationsPulse";
import { SetupGuide } from "@/components/dashboard/SetupGuide";
import { Stagger, StaggerItem } from "@/components/motion";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { useEngagementCoupon } from "@/hooks/useEngagementCoupon";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  DollarSign,
  Users,
  Megaphone,
  FolderKanban,
  UserCheck,
  ListTodo,
  GitBranch,
  BookOpen,
} from "lucide-react";


const modules = [
  {
    icon: DollarSign,
    title: "Finanças",
    description: "Controle receitas, despesas e fluxo de caixa",
    path: "/financas",
  },
  {
    icon: Users,
    title: "RH",
    description: "Gerencie sua equipe e freelancers",
    path: "/rh",
  },
  {
    icon: Megaphone,
    title: "Marketing",
    description: "Campanhas e ideias de conteúdo",
    path: "/marketing",
  },
  {
    icon: FolderKanban,
    title: "Projetos",
    description: "Acompanhe entregas e prazos dos clientes",
    path: "/projetos",
  },
  {
    icon: UserCheck,
    title: "Clientes",
    description: "CRM de carteira e prospecção",
    path: "/clientes",
  },
  {
    icon: ListTodo,
    title: "Atividades",
    description: "Tarefas e metas da operação",
    path: "/atividades",
  },
  {
    icon: GitBranch,
    title: "Processos",
    description: "Padronize playbooks e fluxos",
    path: "/processos",
  },
  {
    icon: BookOpen,
    title: "Guia de Uso",
    description: "Aprenda a usar o sistema",
    path: "/guia",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { needsOnboarding, session, loading: onbLoading } = useOnboardingSession();
  useEngagementCoupon();
  const [forceTour, setForceTour] = useState(false);

  // Redirect new users to onboarding
  useEffect(() => {
    if (!onbLoading && needsOnboarding) {
      navigate("/onboarding", { replace: true });
    }
  }, [onbLoading, needsOnboarding, navigate]);

  // Auto-trigger guided tour after completing/skipping onboarding
  useEffect(() => {
    if (onbLoading) return;
    if (localStorage.getItem("hub_auto_tour_pending") === "1") {
      localStorage.removeItem("hub_auto_tour_pending");
      localStorage.removeItem("hubTourCompleted");
      const t = setTimeout(() => setForceTour(true), 600);
      return () => clearTimeout(t);
    }
  }, [onbLoading]);

  return (
    <MainLayout>
      <PageMeta path="/" title="Painel Principal" description="Visão geral da sua operação em um só lugar. Gerencie finanças, equipe, marketing, entregas e clientes." />
      <div className="space-y-8">
        <WorldCupBanner />
        <PersistentCouponWidget />


        {/* Hero redesenhado — saudação + KPI hero + sparkline + KPIs secundários */}
        <DashboardHero />

        {/* Guia de ativação — sumível quando concluído/dispensado */}
        <SetupGuide />

        <UsageLimitWidget />

        {/* Integrações vivas + BulletinBoard rápido */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IntegrationsPulse />
          <BulletinBoard />
        </div>

        {/* Module Grid */}
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-4 tracking-tight">Módulos</h2>
          <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {modules.map((module) => (
              <StaggerItem key={module.path}>
                <ModuleCard
                  icon={module.icon}
                  title={module.title}
                  description={module.description}
                  onClick={() => navigate(module.path)}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* Agenda em destaque */}
        <AgendaWidget />

        {/* Activity Timeline */}
        <ActivityTimeline />

        <OnboardingPrompt />
        <OnboardingFeedbackPrompt />
        {session && <OnboardingCouponBanner session={session} />}
      </div>
      <GuidedTour forceRun={forceTour} onTourComplete={() => setForceTour(false)} />
    </MainLayout>
  );
};

export default Index;
