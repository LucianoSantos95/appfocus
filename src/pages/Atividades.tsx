import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ListTodo,
  Plus,
  Search,
  ArrowLeft,
  MoreHorizontal,
  Target,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Atividade {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "alta" | "media" | "baixa";
  status: "pendente" | "concluida";
  category: "tarefa" | "meta";
}

const mockAtividades: Atividade[] = [
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

const priorityStyles = {
  alta: "text-destructive",
  media: "text-warning",
  baixa: "text-success",
};

export default function Atividades() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"todas" | "pendentes" | "concluidas">("todas");

  const filteredAtividades = mockAtividades.filter((a) => {
    if (filter === "pendentes") return a.status === "pendente";
    if (filter === "concluidas") return a.status === "concluida";
    return true;
  });

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
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Atividade
          </Button>
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
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
