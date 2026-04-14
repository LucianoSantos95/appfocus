import { MainLayout } from "@/components/layout/MainLayout";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  PlayCircle,
  Settings,
  Users,
  DollarSign,
  FolderKanban,
  Clock,
  Lightbulb,
  Zap,
  Target,
  ArrowRight,
  Rocket,
  Calendar,
  ClipboardList,
  TrendingUp,
  RotateCcw,
  PartyPopper,
  Trophy,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef } from "react";
import { GuidedTour, useTour } from "@/components/guide/GuidedTour";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import confetti from "canvas-confetti";

interface OnboardingTask {
  id: string;
  label: string;
  path?: string;
  hint?: string;
}

interface OnboardingStage {
  id: string;
  title: string;
  icon: any;
  description: string;
  tasks: OnboardingTask[];
}

const stages: OnboardingStage[] = [
  {
    id: "explore",
    title: "Primeiros Passos",
    icon: PlayCircle,
    description: "Conheça a plataforma e veja como organizar sua operação",
    tasks: [
      { id: "explore-dashboard", label: "Explore o Painel Principal", path: "/" },
      { id: "explore-sidebar", label: "Navegue pelo menu lateral" },
      { id: "explore-agenda", label: "Adicione um compromisso na Agenda", path: "/" },
    ],
  },
  {
    id: "setup",
    title: "Configure sua Operação",
    icon: Settings,
    description: "Cadastre sua agência e primeiros clientes",
    tasks: [
      { id: "setup-bank", label: "Cadastre uma conta bancária", path: "/financas" },
      { id: "setup-client", label: "Adicione seu primeiro cliente", path: "/clientes" },
      { id: "setup-task", label: "Crie sua primeira tarefa", path: "/tarefas" },
      { id: "setup-profile", label: "Complete seu perfil" },
    ],
  },
  {
    id: "daily",
    title: "Operação Diária",
    icon: Calendar,
    description: "Gerencie entregas e finanças no dia a dia",
    tasks: [
      { id: "daily-transaction", label: "Registre uma receita ou despesa", path: "/financas" },
      { id: "daily-project", label: "Crie um projeto", path: "/projetos" },
      { id: "daily-kanban", label: "Mova uma tarefa no Kanban", path: "/tarefas" },
      { id: "daily-employee", label: "Cadastre um membro da equipe", path: "/rh" },
    ],
  },
  {
    id: "advanced",
    title: "Funcionalidades Avançadas",
    icon: Rocket,
    description: "Explore recursos que turbinarão sua operação",
    tasks: [
      { id: "adv-import", label: "Importe dados de uma planilha", path: "/financas" },
      { id: "adv-campaign", label: "Crie uma campanha de marketing", path: "/marketing" },
      { id: "adv-process", label: "Documente um playbook", path: "/processos" },
    ],
  },
  {
    id: "whatsapp",
    title: "Automação WhatsApp",
    icon: MessageCircle,
    description: "Receba alertas automáticos no seu WhatsApp",
    tasks: [
      { id: "wpp-open-profile", label: "Abra seu Perfil (clique no avatar no menu lateral)", hint: "Clique no seu nome no canto inferior esquerdo → Perfil" },
      { id: "wpp-add-number", label: "Digite seu número de WhatsApp", hint: "Formato: 5511999999999 (código do país + DDD + número, sem espaços)" },
      { id: "wpp-enable", label: "Ative o toggle 'Ativar notificações'", hint: "Você pode escolher quais alertas quer: Tarefas, Clientes e/ou Financeiro" },
      { id: "wpp-save", label: "Clique em 'Salvar preferências'", hint: "Pronto! Você receberá alertas diários às 8h no seu WhatsApp" },
    ],
  },
  {
    id: "ai-assistant",
    title: "Assistente de IA",
    icon: Sparkles,
    description: "Use o assistente inteligente para agilizar tarefas",
    tasks: [
      { id: "ai-open", label: "Abra o Assistente Focus (ícone no canto inferior direito)", hint: "Clique no logo do Hub para abrir o chat" },
      { id: "ai-ask", label: "Faça uma pergunta ao assistente", hint: "Experimente: 'O que está atrasado?' ou 'Resumo da minha operação'" },
      { id: "ai-voice", label: "Use o microfone para comando por voz", hint: "Clique no ícone do microfone e fale sua pergunta" },
      { id: "ai-crud", label: "Peça ao assistente para criar um registro", hint: "Exemplo: 'Criar tarefa revisar proposta para amanhã'" },
    ],
  },
];

const totalTasks = stages.reduce((acc, s) => acc + s.tasks.length, 0);

const faqItems = [
  { question: "Como começo a usar o Hub Empresarial?", answer: "Siga o checklist acima! Comece cadastrando seus clientes e projetos da agência. Em 15 minutos você terá o básico configurado." },
  { question: "Como importo meu extrato bancário?", answer: "No módulo Finanças, clique em 'Importar Extrato'. Aceita CSV e OFX. As transações são detectadas automaticamente." },
  { question: "Os dados são salvos automaticamente?", answer: "Sim! Todas as alterações são salvas instantaneamente no banco de dados." },
  { question: "Posso usar em dispositivos móveis?", answer: "Sim! O Hub é totalmente responsivo e funciona em qualquer navegador." },
  { question: "Como funciona o Dashboard de BI?", answer: "Nos módulos Finanças, Clientes, Projetos e Marketing, clique no ícone de expandir nos gráficos para análises detalhadas da sua operação." },
  { question: "Como uso o Assistente de IA?", answer: "Clique no logo do Hub no canto inferior direito. Você pode digitar ou usar o microfone para fazer perguntas, criar tarefas, registrar clientes e muito mais." },
  { question: "O assistente entende comandos por voz?", answer: "Sim! Clique no ícone do microfone dentro do chat e fale sua solicitação. O assistente transcreve e executa automaticamente." },
];

const tips = [
  { icon: Zap, title: "Registre tudo na hora", desc: "Não deixe para depois. Registre transações assim que acontecerem." },
  { icon: Target, title: "Atualize status da carteira", desc: "Mantenha prospectos atualizados para não perder oportunidades." },
  { icon: Clock, title: "Revisão semanal", desc: "15 min por semana para revisar indicadores e ajustar estratégias." },
  { icon: TrendingUp, title: "Explore o BI", desc: "Os dashboards de BI revelam tendências que você não veria manualmente." },
];

export default function Guia() {
  const navigate = useNavigate();
  const { shouldRunTour, resetTour, onComplete } = useTour();
  const { completedSteps, loading, toggleStep, isStepCompleted, totalCompleted } = useOnboardingProgress();
  const prevCompleted = useRef(totalCompleted);

  const progressPercentage = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;
  const allDone = totalCompleted === totalTasks && totalTasks > 0;

  // Fire confetti when completing a stage
  useEffect(() => {
    if (loading) return;
    if (totalCompleted > prevCompleted.current) {
      // Check if any stage just completed
      for (const stage of stages) {
        const stageTaskIds = stage.tasks.map((t) => t.id);
        const stageComplete = stageTaskIds.every((id) => completedSteps.has(id));
        const wasComplete = stageTaskIds.every((id) => {
          if (id === [...completedSteps].find((s) => s === id && !completedSteps.has(id))) return false;
          return completedSteps.has(id);
        });
        if (stageComplete) {
          // Mini confetti for stage completion
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
          break;
        }
      }
      // Big confetti for 100%
      if (allDone) {
        const duration = 2000;
        const end = Date.now() + duration;
        const frame = () => {
          confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
          confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
      }
    }
    prevCompleted.current = totalCompleted;
  }, [totalCompleted, loading, completedSteps, allDone]);

  const handleTaskToggle = useCallback(
    async (task: OnboardingTask) => {
      const wasCompleted = isStepCompleted(task.id);
      await toggleStep(task.id);
      // If marking as complete and has a path, navigate after short delay
      if (!wasCompleted && task.path) {
        setTimeout(() => navigate(task.path!), 600);
      }
    },
    [toggleStep, isStepCompleted, navigate]
  );

  const getStageProgress = (stage: OnboardingStage) => {
    const done = stage.tasks.filter((t) => isStepCompleted(t.id)).length;
    return { done, total: stage.tasks.length, percent: (done / stage.tasks.length) * 100 };
  };

  const handleRestartTour = useCallback(() => {
    resetTour();
  }, [resetTour]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageMeta title="Guia de Uso" description="Aprenda a usar o Hub Empresarial. Tutoriais e dicas para organizar sua operação." />
      <GuidedTour forceRun={shouldRunTour} onTourComplete={onComplete} />

      <div className="space-y-8 animate-fade-in pb-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Guia de Configuração</h1>
              <p className="text-muted-foreground mt-1">Configure seu Hub em poucos minutos</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRestartTour} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Tour Guiado
          </Button>
        </div>

        {/* Overall Progress Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-6 md:p-8">
          {allDone && (
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-success/10 pointer-events-none" />
          )}
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              allDone ? "bg-success/20" : "bg-primary/20"
            }`}>
              {allDone ? (
                <Trophy className="w-10 h-10 text-success" />
              ) : (
                <Target className="w-10 h-10 text-primary" />
              )}
            </div>
            <div className="text-center md:text-left flex-1">
              {allDone ? (
                <>
                  <h2 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2 justify-center md:justify-start">
                    Parabéns! Configuração completa! <PartyPopper className="w-6 h-6 text-warning" />
                  </h2>
                  <p className="text-muted-foreground">
                    Você completou todas as etapas. Seu Hub está pronto para uso!
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {totalCompleted === 0 ? "Vamos configurar seu Hub! 🚀" : `Continue de onde parou!`}
                  </h2>
                  <p className="text-muted-foreground">
                    {totalCompleted === 0
                      ? "Complete as tarefas abaixo para configurar tudo em ~15 min"
                      : `Você já completou ${totalCompleted} de ${totalTasks} tarefas. Continue!`}
                  </p>
                </>
              )}
            </div>
            <div className="flex flex-col items-center gap-1 min-w-[100px]">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={allDone ? "hsl(var(--success))" : "hsl(var(--primary))"}
                    strokeWidth="3"
                    strokeDasharray={`${progressPercentage}, 100`}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-foreground">{Math.round(progressPercentage)}%</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{totalCompleted}/{totalTasks} tarefas</span>
            </div>
          </div>
        </div>

        {/* Stages Checklist */}
        <div className="space-y-4">
          {stages.map((stage, stageIndex) => {
            const { done, total, percent } = getStageProgress(stage);
            const stageComplete = done === total;

            return (
              <div
                key={stage.id}
                className={`rounded-xl border transition-all duration-300 ${
                  stageComplete
                    ? "border-success/30 bg-success/5"
                    : "border-border/50 bg-card"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      stageComplete ? "bg-success/20" : "bg-primary/10"
                    }`}>
                      {stageComplete ? (
                        <CheckCircle2 className="w-6 h-6 text-success" />
                      ) : (
                        <stage.icon className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground text-lg">{stage.title}</h3>
                        {stageComplete && (
                          <Badge variant="outline" className="border-success/50 text-success bg-success/10 text-xs gap-1">
                            <Sparkles className="w-3 h-3" /> Concluído
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{stage.description}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className="text-sm font-medium text-foreground">{done}/{total}</span>
                      <Progress value={percent} className="h-1.5 w-24 mt-1" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
                    {stage.tasks.map((task) => {
                      const checked = isStepCompleted(task.id);
                      return (
                        <button
                          key={task.id}
                          onClick={() => handleTaskToggle(task)}
                          className={`flex flex-col rounded-lg px-3 py-2.5 text-left transition-all duration-200 group ${
                            checked
                              ? "bg-success/5 hover:bg-success/10"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <Checkbox
                              checked={checked}
                              className={`transition-colors flex-shrink-0 ${
                                checked ? "border-success bg-success data-[state=checked]:bg-success data-[state=checked]:border-success" : ""
                              }`}
                              tabIndex={-1}
                            />
                            <span className={`text-sm transition-all duration-200 flex-1 ${
                              checked ? "text-muted-foreground line-through" : "text-foreground"
                            }`}>
                              {task.label}
                            </span>
                            {task.path && !checked && (
                              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            )}
                          </div>
                          {task.hint && !checked && (
                            <p className="text-xs text-muted-foreground mt-1 ml-8">{task.hint}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completed CTA */}
        {allDone && (
          <div className="text-center rounded-2xl border border-success/20 bg-gradient-to-br from-success/5 to-success/10 p-8 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Seu Hub está 100% configurado! 🎉
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Agora é hora de usar o sistema no dia a dia e acompanhar o crescimento da sua operação.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/")}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              Ir para o Painel Principal
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Tips */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-warning" />
            Dicas de Produtividade
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {tips.map((tip, i) => (
              <div key={i} className="bg-card rounded-xl border border-border/50 p-4 hover:border-warning/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center mb-3">
                  <tip.icon className="w-4 h-4 text-warning" />
                </div>
                <h4 className="font-medium text-foreground text-sm mb-1">{tip.title}</h4>
                <p className="text-xs text-muted-foreground">{tip.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Perguntas Frequentes
          </h3>
          <div className="bg-card rounded-xl border border-border/50">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
                  <AccordionTrigger className="px-5 hover:no-underline hover:text-primary text-sm">
                    <span className="text-left">{item.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 text-muted-foreground text-sm">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Bottom CTA */}
        {!allDone && (
          <section className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl border border-primary/20 p-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Precisa de ajuda?</h3>
            <p className="text-muted-foreground mb-4 text-sm max-w-md mx-auto">
              Use o Tour Guiado para uma demonstração interativa de todos os recursos da plataforma.
            </p>
            <Button variant="outline" onClick={handleRestartTour} className="gap-2">
              <PlayCircle className="w-4 h-4" />
              Iniciar Tour Guiado
            </Button>
          </section>
        )}
      </div>
    </MainLayout>
  );
}
