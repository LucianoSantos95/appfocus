import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import {
  FolderKanban,
  Clock,
  Plus,
  Search,
  ArrowLeft,
  Users,
  Calendar,
  DollarSign,
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
}

const initialProjetos: Projeto[] = [
  {
    id: "1",
    name: "Redesign do Site Institucional",
    status: "em_andamento",
    priority: "alta",
    startDate: "2025-01-01",
    endDate: "2025-03-15",
    budget: 45000,
    spent: 18000,
    responsible: "Ana Silva",
    currentSprint: "Sprint 3",
    members: ["Ana Silva", "Bruno Costa", "Carla Oliveira"],
    progress: 45,
    description: "Modernização completa do site institucional",
  },
  {
    id: "2",
    name: "App Mobile Clientes",
    status: "em_andamento",
    priority: "alta",
    startDate: "2024-11-15",
    endDate: "2025-04-30",
    budget: 120000,
    spent: 65000,
    responsible: "Bruno Costa",
    currentSprint: "Sprint 8",
    members: ["Bruno Costa", "Diego Santos", "Eduardo Lima"],
    progress: 65,
  },
  {
    id: "3",
    name: "Automação de Marketing",
    status: "nao_iniciado",
    priority: "media",
    startDate: "2025-02-01",
    endDate: "2025-04-15",
    budget: 25000,
    spent: 0,
    responsible: "Carla Oliveira",
    currentSprint: "-",
    members: ["Carla Oliveira"],
    progress: 0,
  },
  {
    id: "4",
    name: "Integração ERP",
    status: "pausado",
    priority: "baixa",
    startDate: "2024-10-01",
    endDate: "2025-06-30",
    budget: 80000,
    spent: 32000,
    responsible: "Diego Santos",
    currentSprint: "Sprint 5",
    members: ["Diego Santos", "Ana Silva"],
    progress: 40,
  },
  {
    id: "5",
    name: "Portal do Cliente",
    status: "concluido",
    priority: "alta",
    startDate: "2024-08-01",
    endDate: "2025-01-15",
    budget: 55000,
    spent: 52000,
    responsible: "Bruno Costa",
    currentSprint: "Finalizado",
    members: ["Bruno Costa", "Carla Oliveira", "Eduardo Lima"],
    progress: 100,
  },
];

const statusData = [
  { name: "Em Andamento", value: 2, color: "hsl(var(--primary))" },
  { name: "Não Iniciado", value: 1, color: "hsl(var(--muted-foreground))" },
  { name: "Pausado", value: 1, color: "hsl(var(--warning))" },
  { name: "Concluído", value: 1, color: "hsl(var(--success))" },
];

const budgetData = [
  { name: "Site", orcamento: 45000, gasto: 18000 },
  { name: "App Mobile", orcamento: 120000, gasto: 65000 },
  { name: "Marketing", orcamento: 25000, gasto: 0 },
  { name: "ERP", orcamento: 80000, gasto: 32000 },
];

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

export default function Projetos() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [projetos, setProjetos] = useState<Projeto[]>(initialProjetos);

  const projetosAbertos = projetos.filter((p) => p.status === "nao_iniciado").length;
  const projetosAndamento = projetos.filter((p) => p.status === "em_andamento").length;

  const totalBudget = projetos.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projetos.reduce((sum, p) => sum + p.spent, 0);

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
          <AddProjetoDialog onAdd={(p) => setProjetos([p, ...projetos])} />
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
            value={`R$ ${(totalBudget / 1000).toFixed(0)}K`}
            variant="default"
          />
          <StatCard
            icon={DollarSign}
            label="Total Gasto"
            value={`R$ ${(totalSpent / 1000).toFixed(0)}K`}
            trend={{ value: Math.round((totalSpent / totalBudget) * 100), isPositive: false }}
            variant="warning"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border/50 shadow-premium p-6">
            <h3 className="font-semibold text-foreground mb-4">Orçamento vs Gasto</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={budgetData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                />
                <Bar dataKey="orcamento" fill="hsl(var(--muted))" name="Orçamento" radius={[0, 4, 4, 0]} />
                <Bar dataKey="gasto" fill="hsl(var(--primary))" name="Gasto" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl border border-border/50 shadow-premium p-6">
            <h3 className="font-semibold text-foreground mb-4">Status dos Projetos</h3>
            <ResponsiveContainer width="100%" height={180}>
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
            <div className="flex flex-wrap gap-4 justify-center mt-2">
              {statusData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
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
        </div>

        {/* Projects Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projetos.map((p) => (
            <div
              key={p.id}
              className="bg-card rounded-xl border border-border/50 shadow-premium p-5 hover:border-primary/30 transition-colors"
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

                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(p.startDate).toLocaleDateString("pt-BR")} - {new Date(p.endDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

function AddProjetoDialog({ onAdd }: { onAdd: (p: Projeto) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    responsible: "",
    budget: "",
    startDate: "",
    endDate: "",
    priority: "media" as "alta" | "media" | "baixa",
  });

  const handleSubmit = () => {
    if (!form.name || !form.responsible) return;
    
    const projeto: Projeto = {
      id: Date.now().toString(),
      name: form.name,
      status: "nao_iniciado",
      priority: form.priority,
      startDate: form.startDate,
      endDate: form.endDate,
      budget: parseFloat(form.budget) || 0,
      spent: 0,
      responsible: form.responsible,
      currentSprint: "-",
      members: [form.responsible],
      progress: 0,
    };
    
    onAdd(projeto);
    setForm({ name: "", responsible: "", budget: "", startDate: "", endDate: "", priority: "media" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
