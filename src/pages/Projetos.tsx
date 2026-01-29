import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FolderKanban,
  Clock,
  Plus,
  Search,
  ArrowLeft,
  MoreHorizontal,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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
}

const mockProjetos: Projeto[] = [
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

  const projetosAbertos = mockProjetos.filter(
    (p) => p.status === "nao_iniciado"
  ).length;
  const projetosAndamento = mockProjetos.filter(
    (p) => p.status === "em_andamento"
  ).length;

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
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Projeto
          </Button>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Table */}
        <div className="bg-card rounded-xl border border-border/50 shadow-premium overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Projeto</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Prioridade</TableHead>
                <TableHead className="text-muted-foreground">Progresso</TableHead>
                <TableHead className="text-muted-foreground">Orçamento</TableHead>
                <TableHead className="text-muted-foreground">Equipe</TableHead>
                <TableHead className="text-muted-foreground w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockProjetos.map((p) => (
                <TableRow key={p.id} className="border-border/50">
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.currentSprint} • {p.responsible}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        statusProjeto[p.status].class
                      )}
                    >
                      {statusProjeto[p.status].label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium capitalize",
                        priorityStyles[p.priority]
                      )}
                    >
                      {p.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{p.progress}%</span>
                      </div>
                      <Progress value={p.progress} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="text-foreground">
                        R$ {p.spent.toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        de R$ {p.budget.toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {p.members.length}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
