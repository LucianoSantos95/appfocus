import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageMeta } from "@/components/seo/PageMeta";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ListTodo,
  Plus,
  Search,
  ArrowLeft,
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  GripVertical,
  FileSpreadsheet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ImportDialog } from "@/components/import/ImportDialog";
import { importConfigs } from "@/lib/import-configs";
import { useToast } from "@/hooks/use-toast";
import { useTarefas as useTarefasDB } from "@/hooks/useTarefas";
import { Loader2 } from "lucide-react";
import { PlanGateButton } from "@/components/plan/PlanGateButton";
import { useFreemiumLimit } from "@/hooks/useFreemiumLimit";
import { UpgradeModal } from "@/components/plan/UpgradeModal";

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Atividade {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "urgente" | "alta" | "media" | "baixa";
  status: "pendente" | "concluida";
  category: "tarefa" | "meta";
  responsible?: string;
  subtasks: SubTask[];
}



const priorityStyles = {
  urgente: { text: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
  alta: { text: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
  media: { text: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  baixa: { text: "text-success", bg: "bg-success/10", border: "border-success/30" },
};

const priorityLabels = {
  urgente: "Urgente",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export default function Tarefas() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tarefas: dbTarefas, isLoading, addTarefa, updateTarefa, deleteTarefa, refetch: refetchTarefasDB } = useTarefasDB();
  const [searchTerm, setSearchTerm] = useState("");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const freemium = useFreemiumLimit(dbTarefas.length);
  const [selectedAtividade, setSelectedAtividade] = useState<Atividade | null>(null);

  // Map DB tarefas to local Atividade type
  const atividades: Atividade[] = dbTarefas.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description || '',
    dueDate: t.due_date || new Date().toISOString().split('T')[0],
    priority: (['urgente', 'alta', 'media', 'baixa'].includes(t.priority || '') ? t.priority : 'media') as Atividade['priority'],
    status: (t.status === 'concluida' ? 'concluida' : 'pendente') as Atividade['status'],
    category: (t.category === 'meta' ? 'meta' : 'tarefa') as Atividade['category'],
    responsible: t.responsible || undefined,
    subtasks: [],
  }));

  const handleImportTarefas = () => {
    refetchTarefasDB();
    toast({ title: "Importação concluída", description: "Tarefas importadas e salvas no banco." });
  };

  const pendentes = atividades.filter((a) => a.status === "pendente").length;
  const concluidas = atividades.filter((a) => a.status === "concluida").length;
  const metas = atividades.filter((a) => a.category === "meta").length;
  const urgentes = atividades.filter((a) => (a.priority === "alta" || a.priority === "urgente") && a.status === "pendente").length;

  const statusData = [
    { name: "Pendentes", value: pendentes, color: "hsl(var(--warning))" },
    { name: "Concluídas", value: concluidas, color: "hsl(var(--success))" },
  ];

  const priorityData = [
    { name: "Urgente", count: atividades.filter((a) => a.priority === "urgente").length },
    { name: "Alta", count: atividades.filter((a) => a.priority === "alta").length },
    { name: "Média", count: atividades.filter((a) => a.priority === "media").length },
    { name: "Baixa", count: atividades.filter((a) => a.priority === "baixa").length },
  ];

  const toggleStatus = (id: string) => {
    const a = atividades.find(a => a.id === id);
    if (a) {
      updateTarefa(id, { status: a.status === "pendente" ? "concluida" : "pendente" });
    }
  };

  const handleUpdateAtividade = (updated: Atividade) => {
    updateTarefa(updated.id, {
      title: updated.title,
      description: updated.description,
      due_date: updated.dueDate,
      priority: updated.priority,
      status: updated.status,
      category: updated.category,
      responsible: updated.responsible,
    });
    setSelectedAtividade(null);
  };

  const handleDeleteAtividade = (id: string) => {
    deleteTarefa(id);
    setSelectedAtividade(null);
  };

  const getAtividadesByPriority = (priority: Atividade["priority"]) => {
    return atividades.filter((a) => a.priority === priority && a.status === "pendente");
  };

  const todasAtividades = atividades;
  const concluidasAtividades = atividades.filter((a) => a.status === "concluida");

  const renderAtividadeItem = (a: Atividade) => (
    <div
      key={a.id}
      onClick={() => setSelectedAtividade(a)}
      className={cn(
        "p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors cursor-pointer",
        a.status === "concluida" && "opacity-60"
      )}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={a.status === "concluida"}
          onCheckedChange={() => toggleStatus(a.id)}
          className="mt-1"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {a.category === "meta" ? (
            <Target className="w-4 h-4 text-primary flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
          <p
            className={cn(
              "font-medium text-foreground",
              a.status === "concluida" && "line-through"
            )}
          >
            {a.title}
          </p>
        </div>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
          {a.description}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs">
          <span className="text-muted-foreground">
            Prazo: {new Date(a.dueDate).toLocaleDateString("pt-BR")}
          </span>
          <span className={cn("font-medium capitalize px-2 py-0.5 rounded-full", priorityStyles[a.priority].bg, priorityStyles[a.priority].text)}>
            {priorityLabels[a.priority]}
          </span>
          {a.responsible && (
            <span className="text-muted-foreground">• {a.responsible}</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderKanbanColumn = (priority: Atividade["priority"], label: string) => {
    const items = getAtividadesByPriority(priority);
    return (
      <div className={cn("flex-1 min-w-[250px] rounded-lg border p-3", priorityStyles[priority].border, priorityStyles[priority].bg)}>
        <div className="flex items-center justify-between mb-3">
          <h4 className={cn("font-semibold", priorityStyles[priority].text)}>{label}</h4>
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", priorityStyles[priority].bg, priorityStyles[priority].text)}>
            {items.length}
          </span>
        </div>
        <div className="space-y-2">
          {items.map((a) => (
            <div
              key={a.id}
              onClick={() => setSelectedAtividade(a)}
              className="bg-card rounded-lg p-3 shadow-sm border border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm line-clamp-2">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(a.dueDate).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">Nenhuma tarefa</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <PageMeta title="Atividades" description="Gerencie tarefas e metas do seu negócio. Organize suas atividades diárias." />
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
              <h1 className="text-2xl font-bold text-foreground">Tarefas</h1>
              <p className="text-muted-foreground mt-1">
                Tarefas e metas do negócio
              </p>
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Clock}
            label="Pendentes"
            value={pendentes.toString()}
            variant="warning"
          />
          <StatCard
            icon={CheckCircle2}
            label="Concluídas"
            value={concluidas.toString()}
            variant="success"
          />
          <StatCard
            icon={Target}
            label="Metas"
            value={metas.toString()}
            variant="default"
          />
          <StatCard
            icon={AlertTriangle}
            label="Urgentes"
            value={urgentes.toString()}
            variant="destructive"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border/50 shadow-premium p-6">
            <h3 className="font-semibold text-foreground mb-4">Status das Atividades</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "#ffffff",
                  }}
                  labelStyle={{ color: "#ffffff" }}
                  itemStyle={{ color: "#ffffff" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-2">
              {statusData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/50 shadow-premium p-6">
            <h3 className="font-semibold text-foreground mb-4">Por Prioridade</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Search + New Activity Button */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 bg-muted border-border"
            />
          </div>
          <div className="flex items-center gap-2">
            <PlanGateButton module="atividades" action="create">
              <ImportDialog
                config={importConfigs.tarefas}
                onImportComplete={handleImportTarefas}
                trigger={
                  <Button variant="outline" className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Importar Planilha
                  </Button>
                }
              />
            </PlanGateButton>
            <PlanGateButton module="atividades" action="create">
              <AddAtividadeDialog onAdd={addTarefa} disabled={freemium.limitReached} onBlocked={() => setUpgradeModalOpen(true)} />
            </PlanGateButton>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="todas" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="concluidas">Concluídas</TabsTrigger>
          </TabsList>

          <TabsContent value="todas" className="mt-6">
            <div className="bg-card rounded-xl border border-border/50 shadow-premium divide-y divide-border/50">
              {todasAtividades.map(renderAtividadeItem)}
            </div>
          </TabsContent>

          <TabsContent value="kanban" className="mt-6">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {renderKanbanColumn("urgente", "Urgente")}
              {renderKanbanColumn("alta", "Alta")}
              {renderKanbanColumn("media", "Média")}
              {renderKanbanColumn("baixa", "Baixa")}
            </div>
          </TabsContent>

          <TabsContent value="concluidas" className="mt-6">
            <div className="bg-card rounded-xl border border-border/50 shadow-premium divide-y divide-border/50">
              {concluidasAtividades.map(renderAtividadeItem)}
              {concluidasAtividades.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhuma tarefa concluída</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      {selectedAtividade && (
        <EditAtividadeDialog
          atividade={selectedAtividade}
          open={!!selectedAtividade}
          onOpenChange={(open) => !open && setSelectedAtividade(null)}
          onUpdate={handleUpdateAtividade}
          onDelete={handleDeleteAtividade}
        />
      )}
      <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} currentCount={freemium.currentCount} maxCount={freemium.maxCount} moduleName="Atividades" />
    </MainLayout>
  );
}

function EditAtividadeDialog({
  atividade,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: {
  atividade: Atividade;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (a: Atividade) => void;
  onDelete: (id: string) => void;
}) {
  const [editedAtividade, setEditedAtividade] = useState(atividade);
  const [newSubtask, setNewSubtask] = useState("");

  const handleSave = () => {
    onUpdate(editedAtividade);
    onOpenChange(false);
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtask: SubTask = {
      id: Date.now().toString(),
      title: newSubtask,
      completed: false,
    };
    setEditedAtividade({
      ...editedAtividade,
      subtasks: [...editedAtividade.subtasks, subtask],
    });
    setNewSubtask("");
  };

  const handleToggleSubtask = (subtaskId: string) => {
    setEditedAtividade({
      ...editedAtividade,
      subtasks: editedAtividade.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      ),
    });
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    setEditedAtividade({
      ...editedAtividade,
      subtasks: editedAtividade.subtasks.filter((s) => s.id !== subtaskId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar Tarefa</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={editedAtividade.title}
              onChange={(e) => setEditedAtividade({ ...editedAtividade, title: e.target.value })}
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={editedAtividade.description}
              onChange={(e) => setEditedAtividade({ ...editedAtividade, description: e.target.value })}
              className="bg-muted border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Input
                type="date"
                value={editedAtividade.dueDate}
                onChange={(e) => setEditedAtividade({ ...editedAtividade, dueDate: e.target.value })}
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input
                value={editedAtividade.responsible || ""}
                onChange={(e) => setEditedAtividade({ ...editedAtividade, responsible: e.target.value })}
                placeholder="Nome do responsável"
                className="bg-muted border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={editedAtividade.priority}
                onValueChange={(v: Atividade["priority"]) => setEditedAtividade({ ...editedAtividade, priority: v })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={editedAtividade.category}
                onValueChange={(v: "tarefa" | "meta") => setEditedAtividade({ ...editedAtividade, category: v })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="tarefa">Tarefa</SelectItem>
                  <SelectItem value="meta">Meta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subtasks */}
          <div className="space-y-3">
            <Label>Subtarefas</Label>
            <div className="flex gap-2">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Nova subtarefa"
                className="bg-muted border-border"
                onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
              />
              <Button onClick={handleAddSubtask} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {editedAtividade.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={() => handleToggleSubtask(subtask.id)}
                  />
                  <span className={cn("flex-1 text-sm", subtask.completed && "line-through text-muted-foreground")}>
                    {subtask.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSubtask(subtask.id)}
                    className="h-6 w-6 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <Button
            variant="destructive"
            onClick={() => onDelete(atividade.id)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddAtividadeDialog({ onAdd, disabled, onBlocked }: { onAdd: (a: { title: string; description?: string; due_date?: string; priority?: string; status?: string; category?: string; responsible?: string }) => Promise<unknown>; disabled?: boolean; onBlocked?: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "media" as string,
    category: "tarefa" as string,
    responsible: "",
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && disabled) { onBlocked?.(); return; }
    setOpen(newOpen);
  };

  const handleSubmit = async () => {
    if (!form.title) return;

    await onAdd({
      title: form.title,
      description: form.description || undefined,
      due_date: form.dueDate || undefined,
      priority: form.priority,
      status: "pendente",
      category: form.category,
      responsible: form.responsible || undefined,
    });

    setForm({ title: "", description: "", dueDate: "", priority: "media", category: "tarefa", responsible: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Atividade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Nova Atividade</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Revisar proposta comercial"
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalhes da atividade..."
              className="bg-muted border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input
                value={form.responsible}
                onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                placeholder="Nome"
                className="bg-muted border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v: Atividade["priority"]) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.category} onValueChange={(v: "tarefa" | "meta") => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="tarefa">Tarefa</SelectItem>
                  <SelectItem value="meta">Meta</SelectItem>
                </SelectContent>
              </Select>
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
