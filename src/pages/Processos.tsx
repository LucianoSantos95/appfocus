import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GitBranch,
  Plus,
  Search,
  ArrowLeft,
  MoreHorizontal,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Processo {
  id: string;
  name: string;
  description: string;
  department: string;
  owner: string;
  lastUpdated: string;
  status: "ativo" | "em_revisao" | "arquivado";
}

const mockProcessos: Processo[] = [
  {
    id: "1",
    name: "Onboarding de Clientes",
    description: "Processo padrão para receber e integrar novos clientes",
    department: "Comercial",
    owner: "Ana Silva",
    lastUpdated: "2025-01-20",
    status: "ativo",
  },
  {
    id: "2",
    name: "Aprovação de Despesas",
    description: "Fluxo de aprovação para despesas acima de R$ 500",
    department: "Financeiro",
    owner: "Diego Santos",
    lastUpdated: "2025-01-15",
    status: "ativo",
  },
  {
    id: "3",
    name: "Contratação de Funcionários",
    description: "Processo completo de recrutamento e seleção",
    department: "RH",
    owner: "Carla Oliveira",
    lastUpdated: "2025-01-10",
    status: "em_revisao",
  },
  {
    id: "4",
    name: "Gestão de Projetos",
    description: "Metodologia e etapas para gestão de projetos internos",
    department: "Projetos",
    owner: "Bruno Costa",
    lastUpdated: "2024-12-15",
    status: "ativo",
  },
];

const statusProcesso = {
  ativo: { label: "Ativo", class: "bg-success/10 text-success" },
  em_revisao: { label: "Em Revisão", class: "bg-warning/10 text-warning" },
  arquivado: { label: "Arquivado", class: "bg-muted text-muted-foreground" },
};

export default function Processos() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

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
                Documentação de processos internos
              </p>
            </div>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Processo
          </Button>
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

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockProcessos.map((p) => (
            <div
              key={p.id}
              className="bg-card rounded-xl border border-border/50 shadow-premium p-5 hover:border-primary/30 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{p.name}</p>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      {p.department}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {p.description}
              </p>
              <div className="flex items-center justify-between text-xs">
                <div className="text-muted-foreground">
                  <span>Responsável: </span>
                  <span className="text-foreground">{p.owner}</span>
                </div>
                <span
                  className={cn(
                    "px-2 py-1 rounded-full font-medium",
                    statusProcesso[p.status].class
                  )}
                >
                  {statusProcesso[p.status].label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
