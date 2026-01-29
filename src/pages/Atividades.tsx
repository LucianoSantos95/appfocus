import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
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
import {
  ListTodo,
  Plus,
  Search,
  ArrowLeft,
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
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

interface Atividade {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "alta" | "media" | "baixa";
  status: "pendente" | "concluida";
  category: "tarefa" | "meta";
}

const initialAtividades: Atividade[] = [
  {
    id: "1",
    title: "Revisar proposta comercial",
    description: "Finalizar proposta para cliente Tech Solutions",
    dueDate: "2025-01-29",
    priority: "alta",
    status: "pendente",
    category: "tarefa",
  },
  {
    id: "2",
    title: "Aumentar faturamento mensal em 15%",
    description: "Meta do primeiro trimestre",
    dueDate: "2025-03-31",
    priority: "alta",
    status: "pendente",
    category: "meta",
  },
  {
    id: "3",
    title: "Atualizar documentação de processos",
    description: "Revisar e atualizar SOPs do departamento",
    dueDate: "2025-02-15",
    priority: "media",
    status: "pendente",
    category: "tarefa",
  },
  {
    id: "4",
    title: "Contratar 2 desenvolvedores",
    description: "Expandir equipe de tecnologia",
    dueDate: "2025-02-28",
    priority: "media",
    status: "pendente",
    category: "meta",
  },
  {
    id: "5",
    title: "Enviar relatório semanal",
    description: "Consolidar métricas e enviar para diretoria",
    dueDate: "2025-01-27",
    priority: "baixa",
    status: "concluida",
    category: "tarefa",
  },
];

const statusData = [
  { name: "Pendentes", value: 4, color: "hsl(var(--warning))" },
  { name: "Concluídas", value: 1, color: "hsl(var(--success))" },
];

const priorityData = [
  { name: "Alta", count: 2 },
  { name: "Média", count: 2 },
  { name: "Baixa", count: 1 },
];

const priorityStyles = {
  alta: "text-destructive",
  media: "text-warning",
  baixa: "text-success",
};

export default function Atividades() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"todas" | "pendentes" | "concluidas">("todas");
  const [atividades, setAtividades] = useState<Atividade[]>(initialAtividades);

  const filteredAtividades = atividades.filter((a) => {
    if (filter === "pendentes") return a.status === "pendente";
    if (filter === "concluidas") return a.status === "concluida";
    return true;
  });

  const pendentes = atividades.filter((a) => a.status === "pendente").length;
  const concluidas = atividades.filter((a) => a.status === "concluida").length;
  const metas = atividades.filter((a) => a.category === "meta").length;
  const urgentes = atividades.filter((a) => a.priority === "alta" && a.status === "pendente").length;

  const toggleStatus = (id: string) => {
    setAtividades(atividades.map((a) =>
      a.id === id ? { ...a, status: a.status === "pendente" ? "concluida" : "pendente" } : a
    ));
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
              <h1 className="text-2xl font-bold text-foreground">Atividades</h1>
              <p className="text-muted-foreground mt-1">
                Tarefas e metas do negócio
              </p>
            </div>
          </div>
          <AddAtividadeDialog onAdd={(a) => setAtividades([a, ...atividades])} />
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
                  }}
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

        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "todas" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("todas")}
            >
              Todas
            </Button>
            <Button
              variant={filter === "pendentes" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("pendentes")}
            >
              Pendentes
            </Button>
            <Button
              variant={filter === "concluidas" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("concluidas")}
            >
              Concluídas
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 bg-muted border-border"
            />
          </div>
        </div>

        {/* List */}
        <div className="bg-card rounded-xl border border-border/50 shadow-premium divide-y divide-border/50">
          {filteredAtividades.map((a) => (
            <div
              key={a.id}
              className={cn(
                "p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors",
                a.status === "concluida" && "opacity-60"
              )}
            >
              <Checkbox
                checked={a.status === "concluida"}
                onCheckedChange={() => toggleStatus(a.id)}
                className="mt-1"
              />
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
                  <span className={cn("font-medium capitalize", priorityStyles[a.priority])}>
                    Prioridade {a.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

function AddAtividadeDialog({ onAdd }: { onAdd: (a: Atividade) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "media" as "alta" | "media" | "baixa",
    category: "tarefa" as "tarefa" | "meta",
  });

  const handleSubmit = () => {
    if (!form.title) return;
    
    const atividade: Atividade = {
      id: Date.now().toString(),
      title: form.title,
      description: form.description,
      dueDate: form.dueDate,
      priority: form.priority,
      status: "pendente",
      category: form.category,
    };
    
    onAdd(atividade);
    setForm({ title: "", description: "", dueDate: "", priority: "media", category: "tarefa" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <div className="grid grid-cols-3 gap-4">
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
