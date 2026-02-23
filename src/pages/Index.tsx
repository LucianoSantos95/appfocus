import { MainLayout } from "@/components/layout/MainLayout";
import { ModuleCard } from "@/components/ui/module-card";
import { AgendaWidget } from "@/components/dashboard/AgendaWidget";
import { BulletinBoard } from "@/components/dashboard/BulletinBoard";
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

      </div>
    </MainLayout>
  );
};

export default Index;
