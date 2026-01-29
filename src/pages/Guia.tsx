import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const guides = [
  {
    title: "Primeiros Passos",
    description: "Configure seu Hub Empresarial em 15 minutos",
    icon: PlayCircle,
    steps: [
      "Acesse o módulo Finanças e cadastre suas contas bancárias",
      "Registre suas primeiras receitas e despesas",
      "Observe os indicadores calculados automaticamente",
    ],
  },
  {
    title: "Gestão Financeira",
    description: "Controle completo das suas finanças",
    icon: DollarSign,
    steps: [
      "Cadastre todas as suas contas bancárias",
      "Registre receitas com cliente, categoria e forma de pagamento",
      "Acompanhe despesas fixas e variáveis",
      "Exporte relatórios em CSV quando necessário",
    ],
  },
  {
    title: "Gerenciando Projetos",
    description: "Acompanhe entregas e prazos",
    icon: FolderKanban,
    steps: [
      "Crie projetos com orçamento e prazo definidos",
      "Adicione membros da equipe responsáveis",
      "Atualize o status e sprint atual",
      "Monitore o progresso e gastos em tempo real",
    ],
  },
  {
    title: "Equipe e RH",
    description: "Organize sua estrutura de pessoal",
    icon: Users,
    steps: [
      "Cadastre colaboradores com cargo e departamento",
      "Gerencie status (ativo, férias, licença)",
      "Crie vagas e acompanhe processos seletivos",
    ],
  },
  {
    title: "Processos Internos",
    description: "Documente como as coisas funcionam",
    icon: FileText,
    steps: [
      "Registre processos por departamento",
      "Defina responsáveis e mantenha atualizado",
      "Consulte sempre que precisar de referência",
    ],
  },
  {
    title: "Configurações",
    description: "Personalize seu Hub",
    icon: Settings,
    steps: [
      "Ajuste preferências de visualização",
      "Gerencie permissões de acesso (Pro)",
      "Configure integrações e automações (Pro)",
    ],
  },
];

export default function Guia() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-9 w-9"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Guia de Uso</h1>
            <p className="text-muted-foreground mt-1">
              Aprenda a usar o Hub Empresarial em poucos minutos
            </p>
          </div>
        </div>

        {/* Intro Card */}
        <div className="bg-card rounded-xl border border-border/50 shadow-premium p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Bem-vindo ao Hub Empresarial
              </h2>
              <p className="text-muted-foreground">
                Sistema completo para organizar seu negócio com simplicidade
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O Hub Empresarial foi criado para que você estruture finanças, projetos e 
            rotinas básicas do seu negócio em menos de 15 minutos, mesmo sem experiência 
            prévia com sistemas de gestão. Siga os guias abaixo para começar.
          </p>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides.map((guide, index) => (
            <div
              key={index}
              className="bg-card rounded-xl border border-border/50 shadow-premium p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <guide.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{guide.title}</h3>
                  <p className="text-xs text-muted-foreground">{guide.description}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {guide.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Pro Features */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20 p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Funcionalidades Pro
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Evolua para o Hub Empresarial Pro e desbloqueie:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Relatórios avançados",
              "Automações",
              "Integrações",
              "Usuários ilimitados",
              "Suporte prioritário",
              "Dashboard personalizado",
              "Exportação PDF",
              "API de integração",
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
