import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FolderKanban,
  Clock,
  Plus,
  Search,
  ArrowLeft,
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ImportDialog } from "@/components/import/ImportDialog";
import { importConfigs } from "@/lib/import-configs";
import { useToast } from "@/hooks/use-toast";
import { useProjetos as useProjetosDB } from "@/hooks/useProjetos";
import { PlanGateButton } from "@/components/plan/PlanGateButton";
import { useFreemiumLimit } from "@/hooks/useFreemiumLimit";
import { UpgradeModal } from "@/components/plan/UpgradeModal";

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface SprintTask {
  id: string;
  title: string;
  completed: boolean;
  subtasks: SubTask[];
}

interface Sprint {
  id: string;
  name: string;
  tasks: SprintTask[];
  completed: boolean;
}

interface Projeto {
  id: string;
  name: string;
  status: "nao_iniciado" | "em_andamento" | "pausado" | "concluido";
  priority: "alta" | "media" | "baixa";
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  responsible: string;
  currentSprint: string;
  members: string[];
  progress: number;
  description?: string;
  sprints: Sprint[];
}






const statusProjeto = {
  nao_iniciado: { label: "Não Iniciado", class: "bg-muted text-muted-foreground" },
  em_andamento: { label: "Em Andamento", class: "bg-primary/10 text-primary" },
  pausado: { label: "Pausado", class: "bg-warning/10 text-warning" },
  concluido: { label: "Concluído", class: "bg-success/10 text-success" },
};

const priorityStyles = {
  alta: "bg-destructive/10 text-destructive",
  media: "bg-warning/10 text-warning",
  baixa: "bg-success/10 text-success",
};

function getProjectDeadlineStatus(endDate: string, progress: number) {
  const today = new Date();
  const end = new Date(endDate);
  const daysUntilDeadline = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (progress === 100) return { label: "Concluído", class: "bg-success/10 text-success", icon: CheckCircle2 };
  if (daysUntilDeadline < 0) return { label: "Atrasado", class: "bg-destructive/10 text-destructive", icon: AlertTriangle };
  if (daysUntilDeadline <= 7) return { label: "Próximo do prazo", class: "bg-warning/10 text-warning", icon: Clock };
  return { label: "Em dia", class: "bg-success/10 text-success", icon: CheckCircle2 };
}

export default function Projetos() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { projetos: dbProjetos, isLoading, addProjeto, updateProjeto, deleteProjeto: deleteProjetoDB, refetch: refetchProjetosDB } = useProjetosDB();
  const [searchTerm, setSearchTerm] = useState("");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const freemium = useFreemiumLimit(dbProjetos.length);
  const [selectedProjeto, setSelectedProjeto] = useState<Projeto | null>(null);

  // Map DB projetos to local type
  const projetos: Projeto[] = dbProjetos.map(p => ({
    id: p.id,
    name: p.name,
    status: (['nao_iniciado', 'em_andamento', 'pausado', 'concluido'].includes(p.status) ? p.status : 'nao_iniciado') as Projeto['status'],
    priority: (['alta', 'media', 'baixa'].includes(p.priority || '') ? p.priority : 'media') as Projeto['priority'],
    startDate: p.start_date || new Date().toISOString().split('T')[0],
    endDate: p.end_date || new Date().toISOString().split('T')[0],
    budget: p.budget || 0,
    spent: 0,
    responsible: p.responsible || '',
    currentSprint: '-',
    members: p.responsible ? [p.responsible] : [],
    progress: p.status === 'concluido' ? 100 : 0,
    description: p.description || undefined,
    sprints: [],
  }));

  const handleImportProjetos = () => {
    refetchProjetosDB();
    toast({ title: "Importação concluída", description: "Projetos importados e salvos no banco." });
  };

  const projetosAbertos = projetos.filter((p) => p.status === "nao_iniciado").length;
  const projetosAndamento = projetos.filter((p) => p.status === "em_andamento").length;
  const projetosPausados = projetos.filter((p) => p.status === "pausado").length;
  const projetosConcluidos = projetos.filter((p) => p.status === "concluido").length;

  const totalBudget = projetos.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projetos.reduce((sum, p) => sum + p.spent, 0);

  const statusData = [
    { name: "Em Andamento", value: projetosAndamento, color: "hsl(var(--primary))" },
    { name: "Não Iniciado", value: projetosAbertos, color: "hsl(var(--muted-foreground))" },
    { name: "Pausado", value: projetosPausados, color: "hsl(var(--warning))" },
    { name: "Concluído", value: projetosConcluidos, color: "hsl(var(--success))" },
  ];

  const budgetData = projetos.slice(0, 5).map(p => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
    orcamento: p.budget,
    gasto: p.spent,
  }));

  const handleUpdateProjeto = (updated: Projeto) => {
    updateProjeto(updated.id, {
      name: updated.name,
      status: updated.status,
      priority: updated.priority,
      start_date: updated.startDate,
      end_date: updated.endDate,
      budget: updated.budget,
      responsible: updated.responsible,
      description: updated.description,
    });
    setSelectedProjeto(updated);
  };

  const handleDeleteProjeto = (id: string) => {
    deleteProjetoDB(id);
    setSelectedProjeto(null);
  };

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
              <h1 className="text-2xl font-bold text-foreground">Projetos</h1>
              <p className="text-muted-foreground mt-1">
                Acompanhe o progresso das suas entregas
              </p>
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FolderKanban}
            label="Projetos Abertos"
            value={projetosAbertos.toString()}
            variant="default"
          />
          <StatCard
            icon={Clock}
            label="Em Andamento"
            value={projetosAndamento.toString()}
            variant="success"
          />
          <StatCard
            icon={DollarSign}
            label="Orçamento Total"
            value={totalBudget > 0 ? `R$ ${(totalBudget / 1000).toFixed(0)}K` : "R$ 0"}
            variant="default"
          />
          <StatCard
            icon={DollarSign}
            label="Total Gasto"
            value={totalSpent > 0 ? `R$ ${(totalSpent / 1000).toFixed(0)}K` : "R$ 0"}
            trend={totalBudget > 0 ? { value: Math.round((totalSpent / totalBudget) * 100), isPositive: false } : undefined}
            variant="warning"
          />
        </div>

        {/* Charts - Modern Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.1)] p-6 transition-all duration-300 hover:shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.15)]">
            <h3 className="font-semibold text-foreground mb-6">Orçamento vs Gasto</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={budgetData} layout="vertical">
                <defs>
                  <linearGradient id="barGradientOrc" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="barGradientGasto" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={80} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px -4px hsl(var(--primary)/0.15)",
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                />
                <Bar dataKey="orcamento" fill="url(#barGradientOrc)" name="Orçamento" radius={[0, 8, 8, 0]} />
                <Bar dataKey="gasto" fill="url(#barGradientGasto)" name="Gasto" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.1)] p-6 transition-all duration-300 hover:shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.15)]">
            <h3 className="font-semibold text-foreground mb-6">Status dos Projetos</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <defs>
                  <filter id="pieGlowP">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                  filter="url(#pieGlowP)"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px -4px hsl(var(--primary)/0.15)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              {statusData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color, boxShadow: `0 0 8px ${d.color}50` }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-80 bg-muted border-border"
            />
          </div>
          <div className="flex items-center gap-2">
            <PlanGateButton module="projetos" action="create">
              <ImportDialog
                config={importConfigs.projetos}
                onImportComplete={handleImportProjetos}
                trigger={
                  <Button variant="outline" className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Importar Planilha
                  </Button>
                }
              />
            </PlanGateButton>
            <PlanGateButton module="projetos" action="create">
              <AddProjetoDialog onAdd={addProjeto} disabled={freemium.limitReached} onBlocked={() => setUpgradeModalOpen(true)} />
            </PlanGateButton>
          </div>
        </div>

        {/* Projects Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projetos.map((p) => {
            const deadlineStatus = getProjectDeadlineStatus(p.endDate, p.progress);
            const DeadlineIcon = deadlineStatus.icon;
            
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProjeto(p)}
                className="bg-card rounded-xl border border-border/50 shadow-premium p-5 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.currentSprint} • {p.responsible}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium capitalize",
                        priorityStyles[p.priority]
                      )}
                    >
                      {p.priority}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        statusProjeto[p.status].class
                      )}
                    >
                      {statusProjeto[p.status].label}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="text-foreground font-medium">{p.progress}%</span>
                    </div>
                    <Progress value={p.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Orçamento
                      </p>
                      <p className="text-foreground font-medium">R$ {p.budget.toLocaleString("pt-BR")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Gasto
                      </p>
                      <p className="text-foreground font-medium">R$ {p.spent.toLocaleString("pt-BR")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs flex items-center gap-1">
                        <Users className="w-3 h-3" /> Equipe
                      </p>
                      <p className="text-foreground font-medium">{p.members.length}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(p.startDate).toLocaleDateString("pt-BR")} - {new Date(p.endDate).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", deadlineStatus.class)}>
                      <DeadlineIcon className="w-3 h-3" />
                      {deadlineStatus.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Detail Dialog */}
      {selectedProjeto && (
        <ProjectDetailDialog
          projeto={selectedProjeto}
          open={!!selectedProjeto}
          onOpenChange={(open) => !open && setSelectedProjeto(null)}
          onUpdate={handleUpdateProjeto}
          onDelete={handleDeleteProjeto}
        />
      )}
      <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} currentCount={freemium.currentCount} maxCount={freemium.maxCount} moduleName="Projetos" />
    </MainLayout>
  );
}

function ProjectDetailDialog({
  projeto,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: {
  projeto: Projeto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (p: Projeto) => void;
  onDelete: (id: string) => void;
}) {
  const [editedProjeto, setEditedProjeto] = useState(projeto);
  const [newMember, setNewMember] = useState("");
  const [expandedSprint, setExpandedSprint] = useState<string | null>(null);
  const [newSprintName, setNewSprintName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const deadlineStatus = getProjectDeadlineStatus(editedProjeto.endDate, editedProjeto.progress);

  const calculateProgress = (sprints: Sprint[]) => {
    if (sprints.length === 0) return 0;
    const completedSprints = sprints.filter((s) => s.completed).length;
    return Math.round((completedSprints / sprints.length) * 100);
  };

  const handleAddMember = () => {
    if (!newMember.trim()) return;
    setEditedProjeto({
      ...editedProjeto,
      members: [...editedProjeto.members, newMember],
    });
    setNewMember("");
  };

  const handleRemoveMember = (member: string) => {
    setEditedProjeto({
      ...editedProjeto,
      members: editedProjeto.members.filter((m) => m !== member),
    });
  };

  const handleAddSprint = () => {
    if (!newSprintName.trim()) return;
    const newSprint: Sprint = {
      id: Date.now().toString(),
      name: newSprintName,
      tasks: [],
      completed: false,
    };
    setEditedProjeto({
      ...editedProjeto,
      sprints: [...editedProjeto.sprints, newSprint],
    });
    setNewSprintName("");
  };

  const handleAddTask = (sprintId: string) => {
    if (!newTaskTitle.trim()) return;
    const newTask: SprintTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
      subtasks: [],
    };
    setEditedProjeto({
      ...editedProjeto,
      sprints: editedProjeto.sprints.map((s) =>
        s.id === sprintId ? { ...s, tasks: [...s.tasks, newTask] } : s
      ),
    });
    setNewTaskTitle("");
  };

  const handleToggleTask = (sprintId: string, taskId: string) => {
    const updatedSprints = editedProjeto.sprints.map((s) => {
      if (s.id !== sprintId) return s;
      const updatedTasks = s.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      const allCompleted = updatedTasks.every((t) => t.completed);
      return { ...s, tasks: updatedTasks, completed: allCompleted && updatedTasks.length > 0 };
    });
    
    const newProgress = calculateProgress(updatedSprints);
    setEditedProjeto({
      ...editedProjeto,
      sprints: updatedSprints,
      progress: newProgress,
    });
  };

  const handleSave = () => {
    onUpdate(editedProjeto);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            {editedProjeto.name}
            <span className={cn("text-xs px-2 py-1 rounded-full font-medium ml-2", deadlineStatus.class)}>
              {deadlineStatus.label}
            </span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="equipe">Equipe ({editedProjeto.members.length})</TabsTrigger>
            <TabsTrigger value="sprints">Sprints ({editedProjeto.sprints.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Projeto</Label>
                <Input
                  value={editedProjeto.name}
                  onChange={(e) => setEditedProjeto({ ...editedProjeto, name: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Input
                  value={editedProjeto.responsible}
                  onChange={(e) => setEditedProjeto({ ...editedProjeto, responsible: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={editedProjeto.description || ""}
                onChange={(e) => setEditedProjeto({ ...editedProjeto, description: e.target.value })}
                className="bg-muted border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editedProjeto.status}
                  onValueChange={(v: Projeto["status"]) => setEditedProjeto({ ...editedProjeto, status: v })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="nao_iniciado">Não Iniciado</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="pausado">Pausado</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={editedProjeto.priority}
                  onValueChange={(v: Projeto["priority"]) => setEditedProjeto({ ...editedProjeto, priority: v })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Orçamento</Label>
                <Input
                  type="number"
                  value={editedProjeto.budget}
                  onChange={(e) => setEditedProjeto({ ...editedProjeto, budget: parseFloat(e.target.value) || 0 })}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Gasto</Label>
                <Input
                  type="number"
                  value={editedProjeto.spent}
                  onChange={(e) => setEditedProjeto({ ...editedProjeto, spent: parseFloat(e.target.value) || 0 })}
                  className="bg-muted border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={editedProjeto.startDate}
                  onChange={(e) => setEditedProjeto({ ...editedProjeto, startDate: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={editedProjeto.endDate}
                  onChange={(e) => setEditedProjeto({ ...editedProjeto, endDate: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Progresso: {editedProjeto.progress}%</Label>
              <Progress value={editedProjeto.progress} className="h-3" />
            </div>
          </TabsContent>

          <TabsContent value="equipe" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                placeholder="Nome do membro"
                className="bg-muted border-border"
              />
              <Button onClick={handleAddMember} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {editedProjeto.members.map((member) => (
                <div key={member} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                      {member.charAt(0)}
                    </div>
                    <span className="text-foreground">{member}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMember(member)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sprints" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input
                value={newSprintName}
                onChange={(e) => setNewSprintName(e.target.value)}
                placeholder="Nome da Sprint (ex: Sprint 1)"
                className="bg-muted border-border"
              />
              <Button onClick={handleAddSprint} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {editedProjeto.sprints.map((sprint) => (
                <div key={sprint.id} className="border border-border/50 rounded-lg overflow-hidden">
                  <div
                    onClick={() => setExpandedSprint(expandedSprint === sprint.id ? null : sprint.id)}
                    className={cn(
                      "flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30",
                      sprint.completed && "bg-success/5"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {sprint.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Clock className="w-5 h-5 text-warning" />
                      )}
                      <span className="font-medium text-foreground">{sprint.name}</span>
                      <span className="text-xs text-muted-foreground">({sprint.tasks.length} tarefas)</span>
                    </div>
                    {expandedSprint === sprint.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>

                  {expandedSprint === sprint.id && (
                    <div className="p-3 border-t border-border/50 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Nova tarefa"
                          className="bg-muted border-border text-sm"
                          onKeyDown={(e) => e.key === "Enter" && handleAddTask(sprint.id)}
                        />
                        <Button onClick={() => handleAddTask(sprint.id)} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {sprint.tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 p-2 bg-muted/20 rounded">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => handleToggleTask(sprint.id, task.id)}
                          />
                          <span className={cn("text-sm", task.completed && "line-through text-muted-foreground")}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t border-border/50">
          <Button variant="destructive" onClick={() => onDelete(projeto.id)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir Projeto
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar Alterações</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddProjetoDialog({ onAdd, disabled, onBlocked }: { onAdd: (p: { name: string; status?: string; priority?: string; start_date?: string; end_date?: string; budget?: number; responsible?: string; description?: string }) => Promise<unknown>; disabled?: boolean; onBlocked?: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    responsible: "",
    budget: "",
    startDate: "",
    endDate: "",
    priority: "media" as "alta" | "media" | "baixa",
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && disabled) { onBlocked?.(); return; }
    setOpen(newOpen);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.responsible) return;

    await onAdd({
      name: form.name,
      status: "planejamento",
      priority: form.priority,
      start_date: form.startDate || undefined,
      end_date: form.endDate || undefined,
      budget: parseFloat(form.budget) || undefined,
      responsible: form.responsible,
    });

    setForm({ name: "", responsible: "", budget: "", startDate: "", endDate: "", priority: "media" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Projeto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Novo Projeto</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome do Projeto</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Novo Sistema CRM"
              className="bg-muted border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input
                value={form.responsible}
                onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                placeholder="Nome do responsável"
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Orçamento</Label>
              <Input
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="0,00"
                className="bg-muted border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="bg-muted border-border"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Select value={form.priority} onValueChange={(v: "alta" | "media" | "baixa") => setForm({ ...form, priority: v })}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
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
