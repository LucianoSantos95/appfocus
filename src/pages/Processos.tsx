import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  GitBranch,
  Plus,
  Search,
  ArrowLeft,
  FileText,
  ChevronRight,
  DollarSign,
  Users,
  FolderKanban,
  Megaphone,
  ShoppingCart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Processo {
  id: string;
  name: string;
  description: string;
  department: string;
  owner: string;
  lastUpdated: string;
  status: "ativo" | "em_revisao" | "arquivado";
  icon: React.ElementType;
  steps: ProcessoStep[];
}

interface ProcessoStep {
  id: string;
  title: string;
  description: string;
  responsible?: string;
  duration?: string;
}

const initialProcessos: Processo[] = [
  {
    id: "1",
    name: "Processo Comercial",
    description: "Fluxo completo de prospecção até fechamento de vendas",
    department: "Comercial",
    owner: "Ana Silva",
    lastUpdated: "2025-01-20",
    status: "ativo",
    icon: ShoppingCart,
    steps: [
      { id: "1.1", title: "Prospecção", description: "Identificar potenciais clientes através de pesquisa de mercado, indicações e marketing", responsible: "SDR", duration: "1-2 dias" },
      { id: "1.2", title: "Qualificação", description: "Avaliar fit do lead com nosso ICP e capacidade de compra", responsible: "SDR", duration: "1 dia" },
      { id: "1.3", title: "Apresentação", description: "Realizar demonstração do produto/serviço e apresentar proposta de valor", responsible: "Closer", duration: "1-2 horas" },
      { id: "1.4", title: "Proposta", description: "Elaborar e enviar proposta comercial personalizada", responsible: "Closer", duration: "2-3 dias" },
      { id: "1.5", title: "Negociação", description: "Alinhar expectativas, esclarecer dúvidas e negociar condições", responsible: "Closer", duration: "3-5 dias" },
      { id: "1.6", title: "Fechamento", description: "Formalizar contrato e iniciar onboarding do cliente", responsible: "CS", duration: "1-2 dias" },
    ],
  },
  {
    id: "2",
    name: "Processo Financeiro",
    description: "Gestão de contas a pagar, receber e fluxo de caixa",
    department: "Financeiro",
    owner: "Diego Santos",
    lastUpdated: "2025-01-15",
    status: "ativo",
    icon: DollarSign,
    steps: [
      { id: "2.1", title: "Registro de Transação", description: "Cadastrar receita ou despesa no sistema com documentação", responsible: "Analista", duration: "15 min" },
      { id: "2.2", title: "Classificação", description: "Categorizar a transação por centro de custo e categoria", responsible: "Analista", duration: "5 min" },
      { id: "2.3", title: "Aprovação", description: "Submeter para aprovação conforme alçada (até R$500 automático)", responsible: "Gerente", duration: "1-2 dias" },
      { id: "2.4", title: "Execução", description: "Realizar pagamento ou confirmar recebimento", responsible: "Analista", duration: "1 dia" },
      { id: "2.5", title: "Conciliação", description: "Conciliar transação com extrato bancário", responsible: "Analista", duration: "1 dia" },
      { id: "2.6", title: "Relatório", description: "Consolidar dados para relatório mensal", responsible: "Controller", duration: "Mensal" },
    ],
  },
  {
    id: "3",
    name: "Gestão de Projetos",
    description: "Metodologia e etapas para gestão de projetos internos",
    department: "Projetos",
    owner: "Bruno Costa",
    lastUpdated: "2024-12-15",
    status: "ativo",
    icon: FolderKanban,
    steps: [
      { id: "3.1", title: "Iniciação", description: "Definir escopo, objetivos e stakeholders do projeto", responsible: "PM", duration: "1 semana" },
      { id: "3.2", title: "Planejamento", description: "Criar cronograma, alocar recursos e definir entregas", responsible: "PM", duration: "1-2 semanas" },
      { id: "3.3", title: "Execução", description: "Desenvolver entregas conforme planejamento em sprints", responsible: "Equipe", duration: "Variável" },
      { id: "3.4", title: "Monitoramento", description: "Acompanhar progresso, riscos e realizar ajustes", responsible: "PM", duration: "Contínuo" },
      { id: "3.5", title: "Entrega", description: "Realizar aceite formal e transição para operação", responsible: "PM", duration: "1 semana" },
      { id: "3.6", title: "Encerramento", description: "Documentar lições aprendidas e arquivar projeto", responsible: "PM", duration: "2-3 dias" },
    ],
  },
  {
    id: "4",
    name: "Onboarding de Colaboradores",
    description: "Processo de integração de novos funcionários",
    department: "RH",
    owner: "Carla Oliveira",
    lastUpdated: "2025-01-10",
    status: "em_revisao",
    icon: Users,
    steps: [
      { id: "4.1", title: "Pré-boarding", description: "Preparar documentação, equipamentos e acessos antes do início", responsible: "RH", duration: "3 dias" },
      { id: "4.2", title: "Recepção", description: "Boas-vindas, tour pela empresa e apresentação da equipe", responsible: "RH/Gestor", duration: "Meio dia" },
      { id: "4.3", title: "Treinamento Inicial", description: "Cultura, políticas, ferramentas e processos básicos", responsible: "RH", duration: "2 dias" },
      { id: "4.4", title: "Treinamento Técnico", description: "Capacitação específica para a função", responsible: "Gestor", duration: "1-2 semanas" },
      { id: "4.5", title: "Acompanhamento 30 dias", description: "Checkpoint de adaptação e feedbacks", responsible: "Gestor/RH", duration: "1 hora" },
      { id: "4.6", title: "Avaliação de Experiência", description: "Avaliação formal ao final do período de experiência", responsible: "Gestor", duration: "90 dias" },
    ],
  },
  {
    id: "5",
    name: "Campanhas de Marketing",
    description: "Fluxo de criação e execução de campanhas",
    department: "Marketing",
    owner: "Carla Oliveira",
    lastUpdated: "2025-01-05",
    status: "ativo",
    icon: Megaphone,
    steps: [
      { id: "5.1", title: "Briefing", description: "Definir objetivo, público-alvo, budget e KPIs", responsible: "Marketing", duration: "1-2 dias" },
      { id: "5.2", title: "Planejamento", description: "Escolher canais, formatos e cronograma", responsible: "Marketing", duration: "2-3 dias" },
      { id: "5.3", title: "Criação", description: "Desenvolver peças, copies e materiais", responsible: "Design/Conteúdo", duration: "3-5 dias" },
      { id: "5.4", title: "Aprovação", description: "Validar materiais com stakeholders", responsible: "Gerente", duration: "1-2 dias" },
      { id: "5.5", title: "Veiculação", description: "Publicar e distribuir campanha nos canais", responsible: "Marketing", duration: "Período da campanha" },
      { id: "5.6", title: "Análise", description: "Mensurar resultados e gerar relatório", responsible: "Marketing", duration: "Semanal/Final" },
    ],
  },
];

const statusProcesso = {
  ativo: { label: "Ativo", class: "bg-success/10 text-success" },
  em_revisao: { label: "Em Revisão", class: "bg-warning/10 text-warning" },
  arquivado: { label: "Arquivado", class: "bg-muted text-muted-foreground" },
};

const departments = ["Comercial", "Financeiro", "RH", "Marketing", "Projetos", "Tecnologia", "Operações"];

export default function Processos() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [processos, setProcessos] = useState<Processo[]>(initialProcessos);
  const [expandedProcesso, setExpandedProcesso] = useState<string | null>(null);

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
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
              <h1 className="text-2xl font-bold text-foreground">Processos</h1>
              <p className="text-muted-foreground mt-1">
                Documentação de processos internos - Onboarding e Playbooks
              </p>
            </div>
          </div>
          <AddProcessoDialog onAdd={(p) => setProcessos([p, ...processos])} />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar processos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-80 bg-muted border-border"
          />
        </div>

        {/* Processos List */}
        <div className="space-y-4">
          {processos.map((p) => (
            <Collapsible
              key={p.id}
              open={expandedProcesso === p.id}
              onOpenChange={(open) => setExpandedProcesso(open ? p.id : null)}
            >
              <div className="bg-card rounded-xl border border-border/50 shadow-premium overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <p.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-foreground">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            {p.department}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {p.steps.length} etapas
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full font-medium",
                          statusProcesso[p.status].class
                        )}
                      >
                        {statusProcesso[p.status].label}
                      </span>
                      <ChevronRight
                        className={cn(
                          "w-5 h-5 text-muted-foreground transition-transform",
                          expandedProcesso === p.id && "rotate-90"
                        )}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-5 pb-5 border-t border-border/50">
                    <div className="pt-4 space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Responsável: <span className="text-foreground">{p.owner}</span></span>
                        <span className="text-muted-foreground">Atualizado: {new Date(p.lastUpdated).toLocaleDateString("pt-BR")}</span>
                      </div>
                      
                      {/* Timeline Steps */}
                      <div className="relative">
                        <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-border" />
                        <div className="space-y-4">
                          {p.steps.map((step, index) => (
                            <div key={step.id} className="relative flex gap-4">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center z-10">
                                <span className="text-sm font-semibold text-primary">{index + 1}</span>
                              </div>
                              <div className="flex-1 bg-muted/30 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <p className="font-medium text-foreground">{step.title}</p>
                                  {step.duration && (
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                      {step.duration}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                                {step.responsible && (
                                  <span className="text-xs text-primary font-medium">
                                    Responsável: {step.responsible}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

function AddProcessoDialog({ onAdd }: { onAdd: (p: Processo) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    department: "",
    owner: "",
  });

  const handleSubmit = () => {
    if (!form.name || !form.department) return;
    
    const processo: Processo = {
      id: Date.now().toString(),
      name: form.name,
      description: form.description,
      department: form.department,
      owner: form.owner,
      lastUpdated: new Date().toISOString().split("T")[0],
      status: "em_revisao",
      icon: FileText,
      steps: [],
    };
    
    onAdd(processo);
    setForm({ name: "", description: "", department: "", owner: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Processo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Novo Processo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome do Processo</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Processo de Vendas"
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descreva o objetivo deste processo..."
              className="bg-muted border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                placeholder="Nome do responsável"
                className="bg-muted border-border"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
