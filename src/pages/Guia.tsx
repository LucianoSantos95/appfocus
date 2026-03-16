import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  ArrowLeft,
  CheckCircle,
  PlayCircle,
  FileText,
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
  Megaphone,
  RotateCcw,
  BarChart3,
  Upload,
  Receipt,
  Paperclip,
  PenTool,
  CalendarDays,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { GuidedTour, useTour } from "@/components/guide/GuidedTour";

const journeySteps = [
  {
    id: 1,
    title: "Primeiros 5 minutos",
    icon: PlayCircle,
    description: "Conheça o Hub e navegue pelos módulos",
    tasks: [
      "Explore o Painel Principal",
      "Conheça cada módulo disponível",
      "Familiarize-se com a navegação lateral",
    ],
  },
  {
    id: 2,
    title: "Configuração Inicial",
    icon: Settings,
    description: "Configure as bases do seu negócio",
    tasks: [
      "Cadastre suas contas bancárias em Finanças",
      "Adicione seu primeiro cliente",
      "Crie sua primeira tarefa no Kanban",
    ],
  },
  {
    id: 3,
    title: "Operação Diária",
    icon: Calendar,
    description: "Use o sistema no dia a dia",
    tasks: [
      "Registre receitas e despesas regularmente",
      "Gerencie projetos com sprints e prazos",
      "Acompanhe tarefas no quadro Kanban",
    ],
  },
  {
    id: 4,
    title: "Funcionalidades Avançadas",
    icon: Rocket,
    description: "Use recursos de importação, BI e mais",
    tasks: [
      "Importe extratos bancários (CSV/OFX)",
      "Explore os dashboards de BI",
      "Use o calendário de conteúdo no Marketing",
      "Anexe documentos em RH e Projetos",
    ],
  },
];

const modules = [
  {
    title: "Finanças",
    icon: DollarSign,
    path: "/financas",
    description: "Controle completo do seu fluxo de caixa",
    actions: [
      "Cadastrar contas bancárias",
      "Registrar receitas e despesas",
      "Importar extratos bancários (CSV/OFX)",
      "Visualizar dashboards de BI financeiro",
      "Exportar relatórios financeiros",
    ],
  },
  {
    title: "Clientes",
    icon: Users,
    path: "/clientes",
    description: "Gestão da sua base de clientes",
    actions: [
      "Cadastrar novos clientes",
      "Acompanhar prospectos e converter leads",
      "Anotações de reunião com editor rich text",
      "Análise inteligente com IA",
      "Dashboard de BI de clientes",
    ],
  },
  {
    title: "Projetos",
    icon: FolderKanban,
    path: "/projetos",
    description: "Acompanhe entregas e prazos",
    actions: [
      "Criar projetos com orçamento e sprints",
      "Anexar briefings e documentos ao projeto",
      "Atribuir equipe responsável",
      "Dashboard de BI de projetos",
    ],
  },
  {
    title: "Tarefas",
    icon: ClipboardList,
    path: "/tarefas",
    description: "Organize seu trabalho diário",
    actions: [
      "Criar tarefas com prioridade",
      "Organizar no quadro Kanban",
      "Definir prazos e responsáveis",
      "Acompanhar produtividade",
    ],
  },
  {
    title: "RH",
    icon: Users,
    path: "/rh",
    description: "Gerencie sua equipe",
    actions: [
      "Cadastrar colaboradores",
      "Upload de documentos e contratos (PDF/Imagens)",
      "Timeline de férias e aniversários de empresa",
      "Gerenciar vagas e processos seletivos",
    ],
  },
  {
    title: "Marketing",
    icon: Megaphone,
    path: "/marketing",
    description: "Impulsione suas vendas",
    actions: [
      "Planejar campanhas com orçamento",
      "Calendário de conteúdo com drag-and-drop",
      "Funil de marketing por etapas",
      "Dashboard de BI de marketing",
    ],
  },
  {
    title: "Processos",
    icon: FileText,
    path: "/processos",
    description: "Documente sua operação",
    actions: [
      "Registrar processos por área",
      "Definir responsáveis",
      "Manter documentação atualizada",
      "Consultar procedimentos",
    ],
  },
];

const advancedFeatures = [
  {
    icon: BarChart3,
    title: "Dashboards de BI",
    description: "Clique no ícone de expandir (⛶) nos gráficos de Finanças, Marketing, Projetos e Clientes para abrir análises detalhadas com múltiplos gráficos interativos.",
  },
  {
    icon: Receipt,
    title: "Importar Extrato Bancário",
    description: "Em Finanças, clique em 'Importar Extrato' para enviar arquivos CSV ou OFX do seu banco. As transações serão detectadas automaticamente com data, valor e tipo.",
  },
  {
    icon: Upload,
    title: "Upload de Documentos no RH",
    description: "No perfil de cada colaborador, você pode fazer upload de PDFs, contratos e imagens. Os documentos ficam salvos e acessíveis a qualquer momento.",
  },
  {
    icon: CalendarDays,
    title: "Calendário de Conteúdo",
    description: "Em Marketing, use o Calendário de Conteúdo para planejar postagens por data. Arraste e solte para reagendar, e clique para editar detalhes como plataforma e status.",
  },
  {
    icon: Paperclip,
    title: "Anexos de Projeto",
    description: "Dentro de cada projeto, acesse a aba 'Anexos' para enviar briefings, contratos e documentos relevantes. Tudo centralizado no card do projeto.",
  },
  {
    icon: PenTool,
    title: "Anotações de Reunião (Rich Text)",
    description: "No detalhe de cada cliente, use o editor de texto rico para fazer anotações de reunião com formatação (negrito, itálico, listas e links).",
  },
];

const productivityTips = [
  {
    icon: Zap,
    title: "Registre tudo imediatamente",
    description: "Não deixe para depois. Registre receitas e despesas assim que acontecerem.",
  },
  {
    icon: Target,
    title: "Use o status dos clientes",
    description: "Mantenha prospectos atualizados para não perder oportunidades de venda.",
  },
  {
    icon: Clock,
    title: "Revise semanalmente",
    description: "Dedique 15 minutos por semana para revisar indicadores e ajustar estratégias.",
  },
  {
    icon: TrendingUp,
    title: "Use os dashboards de BI",
    description: "Clique no ícone de expandir nos gráficos para análises detalhadas com múltiplos indicadores.",
  },
];

const faqItems = [
  {
    question: "Como começo a usar o Hub Empresarial?",
    answer: "Comece pelo módulo Finanças: cadastre suas contas bancárias e registre suas primeiras receitas e despesas. Depois, adicione seus clientes e crie suas primeiras tarefas. Em 15 minutos você terá o básico configurado.",
  },
  {
    question: "Como importo meu extrato bancário?",
    answer: "No módulo Finanças, clique no botão 'Importar Extrato'. Aceita arquivos CSV e OFX. O sistema detecta automaticamente as transações, mostra uma prévia e você confirma a importação.",
  },
  {
    question: "Como faço upload de documentos no RH?",
    answer: "Clique em um colaborador para abrir os detalhes. Na seção 'Documentos / Contratos', clique em Upload para enviar PDFs ou imagens (até 10MB). Os arquivos ficam salvos no perfil do colaborador.",
  },
  {
    question: "Como uso o Calendário de Conteúdo?",
    answer: "No módulo Marketing, o Calendário de Conteúdo mostra uma visualização mensal. Passe o mouse sobre um dia e clique em '+' para adicionar conteúdo. Arraste cards entre dias para reagendar.",
  },
  {
    question: "Como anexo arquivos a um projeto?",
    answer: "Clique em um projeto para abrir os detalhes, vá à aba 'Anexos' e clique em 'Anexar arquivo'. Você pode enviar briefings, contratos e qualquer documento relevante ao projeto.",
  },
  {
    question: "O que é o editor de anotações de reunião?",
    answer: "No detalhe de cada cliente, há um editor de texto rico onde você pode registrar anotações de reunião com formatação (negrito, itálico, listas). Clique em 'Salvar' para persistir as anotações.",
  },
  {
    question: "Como funciona o Dashboard de BI?",
    answer: "Nos módulos Finanças, Clientes, Projetos e Marketing, clique no ícone '⛶' ao lado dos gráficos para abrir um painel expandido com análises detalhadas, múltiplos gráficos e indicadores.",
  },
  {
    question: "Posso importar dados de planilhas?",
    answer: "Sim! Todos os módulos têm um botão 'Importar Planilha' que aceita arquivos .xlsx e .csv. O sistema faz mapeamento automático de colunas e importa em lote.",
  },
  {
    question: "Os dados são salvos automaticamente?",
    answer: "Sim! Todas as alterações são salvas instantaneamente no banco de dados. Não há necessidade de clicar em 'Salvar' — exceto nas anotações de reunião, que têm um botão de salvar explícito.",
  },
  {
    question: "Posso usar em dispositivos móveis?",
    answer: "O Hub Empresarial é totalmente responsivo. Você pode acessar de qualquer dispositivo com navegador web.",
  },
];

export default function Guia() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const { shouldRunTour, resetTour, onComplete } = useTour();

  const progressPercentage = (currentStep / journeySteps.length) * 100;

  const handleRestartTour = useCallback(() => {
    resetTour();
  }, [resetTour]);

  return (
    <MainLayout>
      <GuidedTour forceRun={shouldRunTour} onTourComplete={onComplete} />
      
      <div className="space-y-10 animate-fade-in pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Guia de Uso</h1>
              <p className="text-muted-foreground mt-1">Aprenda a usar o Hub Empresarial em poucos minutos</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRestartTour} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Refazer Tour
          </Button>
        </div>

        {/* Hero Section */}
        <div data-tour="hero" className="bg-gradient-to-br from-primary/10 via-card to-secondary/10 rounded-2xl border border-primary/20 shadow-glow p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center animate-float">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-2">Bem-vindo ao Hub Empresarial! 🚀</h2>
              <p className="text-muted-foreground max-w-2xl">
                Você está prestes a organizar seu negócio de forma simples e eficiente. 
                Siga este guia e em <span className="text-primary font-semibold">15 minutos</span> você 
                terá tudo configurado para começar.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-card/50 rounded-lg px-4 py-2 border border-border/50">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">~15 min</span>
            </div>
          </div>
        </div>

        {/* Journey Timeline */}
        <section className="space-y-6">
          <div data-tour="progress" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Sua Jornada de Configuração
              </h3>
              <span className="text-sm text-muted-foreground">Etapa {currentStep} de {journeySteps.length}</span>
            </div>
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">{Math.round(progressPercentage)}% concluído</p>
            </div>
          </div>

          <div data-tour="journey" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {journeySteps.map((step) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`group p-5 rounded-xl border text-left transition-all duration-300 ${
                  currentStep === step.id
                    ? "bg-primary/10 border-primary/50 shadow-glow"
                    : "bg-card border-border/50 hover:border-primary/30 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    currentStep === step.id ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary/20"
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    currentStep >= step.id ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                  }`}>
                    Etapa {step.id}
                  </span>
                </div>
                <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                <ul className="space-y-1.5">
                  {step.tasks.map((task, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </section>

        {/* Advanced Features Section */}
        <section className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Funcionalidades Avançadas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {advancedFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-xl border border-border/50 p-5 hover:border-primary/30 hover:shadow-glow transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground text-sm mb-2">{feature.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Module Cards */}
        <section data-tour="modules" className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-primary" />
            Conheça os Módulos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((module) => (
              <div
                key={module.title}
                className="group bg-card rounded-xl border border-border/50 shadow-premium p-5 hover:border-primary/30 hover:shadow-glow hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <module.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{module.title}</h4>
                    <p className="text-xs text-muted-foreground">{module.description}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-primary mb-2">O que você pode fazer:</p>
                  <ul className="space-y-1.5">
                    {module.actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => navigate(module.path)}
                >
                  Ir para {module.title}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Productivity Tips */}
        <section data-tour="tips" className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-warning" />
            Dicas de Produtividade
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {productivityTips.map((tip, index) => (
              <div
                key={index}
                className="bg-card rounded-xl border border-border/50 p-5 hover:border-warning/30 hover:shadow-glow transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mb-3">
                  <tip.icon className="w-5 h-5 text-warning" />
                </div>
                <h4 className="font-semibold text-foreground text-sm mb-1">{tip.title}</h4>
                <p className="text-xs text-muted-foreground">{tip.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section data-tour="faq" className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Perguntas Frequentes
          </h3>

          <div className="bg-card rounded-xl border border-border/50 shadow-premium">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
                  <AccordionTrigger className="px-5 hover:no-underline hover:text-primary">
                    <span className="text-left">{item.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section data-tour="cta" className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-primary/20 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Pronto para começar?</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Agora que você conhece o Hub Empresarial, é hora de colocar a mão na massa e organizar seu negócio!
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
          >
            Ir para o Painel Principal
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </section>
      </div>
    </MainLayout>
  );
}
