import { MainLayout } from "@/components/layout/MainLayout";
import { UpgradeBanner } from "@/components/ui/upgrade-banner";
import { ModuleCard } from "@/components/ui/module-card";
import { StatCard } from "@/components/ui/stat-card";
import { AgendaWidget } from "@/components/dashboard/AgendaWidget";
import { BulletinBoard } from "@/components/dashboard/BulletinBoard";
import { FAQSection } from "@/components/dashboard/FAQSection";
import { HelpSection } from "@/components/dashboard/HelpSection";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  Users,
  Megaphone,
  FolderKanban,
  UserCheck,
  ListTodo,
  GitBranch,
  BookOpen,
  TrendingUp,
  Wallet,
  Target,
  Briefcase,
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
    description: "Gerencie colaboradores e vagas",
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
    description: "Acompanhe projetos e entregas",
    path: "/projetos",
  },
  {
    icon: UserCheck,
    title: "Clientes",
    description: "Cadastro e relacionamento",
    path: "/clientes",
  },
  {
    icon: ListTodo,
    title: "Atividades",
    description: "Tarefas e metas do negócio",
    path: "/atividades",
  },
  {
    icon: GitBranch,
    title: "Processos",
    description: "Documente processos internos",
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

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Principal</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do seu negócio em um só lugar
          </p>
        </div>

        {/* Upgrade Banner */}
        <UpgradeBanner />

        {/* Module Grid */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Módulos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {modules.map((module) => (
              <ModuleCard
                key={module.path}
                icon={module.icon}
                title={module.title}
                description={module.description}
                onClick={() => navigate(module.path)}
              />
            ))}
          </div>
        </section>

        {/* Two Column Layout: Agenda + Bulletin */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AgendaWidget />
          <BulletinBoard />
        </div>

        {/* Stats Overview */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Resumos Essenciais
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Wallet}
              label="Lucro Líquido"
              value="R$ 24.580"
              trend={{ value: 12.5, isPositive: true }}
              variant="success"
            />
            <StatCard
              icon={Users}
              label="Colaboradores"
              value="8"
              variant="default"
            />
            <StatCard
              icon={Target}
              label="Campanhas Ativas"
              value="3"
              variant="default"
            />
            <StatCard
              icon={Briefcase}
              label="Projetos em Andamento"
              value="5"
              trend={{ value: 2, isPositive: true }}
              variant="default"
            />
          </div>
        </section>

        {/* FAQ and Help */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FAQSection />
          <HelpSection />
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
