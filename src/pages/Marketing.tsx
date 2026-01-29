import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Megaphone,
  Lightbulb,
  Plus,
  Search,
  ArrowLeft,
  MoreHorizontal,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Campanha {
  id: string;
  name: string;
  objective: string;
  platforms: string[];
  budget: number;
  startDate: string;
  endDate: string;
  status: "ativa" | "pausada" | "finalizada" | "planejada";
  expectedResult: string;
  achievedResult?: string;
}

interface IdeiaConteudo {
  id: string;
  title: string;
  format: string;
  theme: string;
  priority: "alta" | "media" | "baixa";
  status: "ideia" | "producao" | "revisao" | "publicado";
  dueDate: string;
}

const mockCampanhas: Campanha[] = [
  {
    id: "1",
    name: "Lançamento Produto X",
    objective: "Gerar leads qualificados",
    platforms: ["Instagram", "Facebook", "Google Ads"],
    budget: 5000,
    startDate: "2025-01-15",
    endDate: "2025-02-15",
    status: "ativa",
    expectedResult: "500 leads",
    achievedResult: "320 leads",
  },
  {
    id: "2",
    name: "Black Friday 2025",
    objective: "Aumentar vendas",
    platforms: ["Instagram", "Email Marketing"],
    budget: 10000,
    startDate: "2025-11-20",
    endDate: "2025-11-30",
    status: "planejada",
    expectedResult: "R$ 100.000 em vendas",
  },
  {
    id: "3",
    name: "Branding Institucional",
    objective: "Aumentar awareness",
    platforms: ["LinkedIn", "YouTube"],
    budget: 3000,
    startDate: "2025-01-01",
    endDate: "2025-03-31",
    status: "ativa",
    expectedResult: "1M impressões",
    achievedResult: "650K impressões",
  },
];

const mockIdeias: IdeiaConteudo[] = [
  {
    id: "1",
    title: "5 dicas para aumentar produtividade",
    format: "Carrossel",
    theme: "Produtividade",
    priority: "alta",
    status: "producao",
    dueDate: "2025-01-30",
  },
  {
    id: "2",
    title: "Case de sucesso: Cliente X",
    format: "Vídeo",
    theme: "Cases",
    priority: "media",
    status: "ideia",
    dueDate: "2025-02-05",
  },
  {
    id: "3",
    title: "Tendências de mercado 2025",
    format: "Artigo",
    theme: "Tendências",
    priority: "alta",
    status: "revisao",
    dueDate: "2025-01-29",
  },
];

const statusCampanha = {
  ativa: { label: "Ativa", class: "bg-success/10 text-success" },
  pausada: { label: "Pausada", class: "bg-warning/10 text-warning" },
  finalizada: { label: "Finalizada", class: "bg-muted text-muted-foreground" },
  planejada: { label: "Planejada", class: "bg-primary/10 text-primary" },
};

const statusConteudo = {
  ideia: { label: "Ideia", class: "bg-muted text-muted-foreground" },
  producao: { label: "Em Produção", class: "bg-primary/10 text-primary" },
  revisao: { label: "Em Revisão", class: "bg-warning/10 text-warning" },
  publicado: { label: "Publicado", class: "bg-success/10 text-success" },
};

const priorityStyles = {
  alta: "bg-destructive/10 text-destructive",
  media: "bg-warning/10 text-warning",
  baixa: "bg-success/10 text-success",
};

export default function Marketing() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const campanhasAtivas = mockCampanhas.filter((c) => c.status === "ativa").length;
  const conteudosProducao = mockIdeias.filter(
    (i) => i.status === "producao" || i.status === "revisao"
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
              <h1 className="text-2xl font-bold text-foreground">Marketing</h1>
              <p className="text-muted-foreground mt-1">
                Campanhas e ideias de conteúdo
              </p>
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            icon={Target}
            label="Campanhas Ativas"
            value={campanhasAtivas.toString()}
            variant="success"
          />
          <StatCard
            icon={Lightbulb}
            label="Conteúdos em Produção"
            value={conteudosProducao.toString()}
            variant="default"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="campanhas" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted">
              <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
              <TabsTrigger value="conteudos">Ideias de Conteúdo</TabsTrigger>
            </TabsList>
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

          <TabsContent value="campanhas" className="space-y-4">
            <div className="flex justify-end">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Campanha
              </Button>
            </div>
            <div className="bg-card rounded-xl border border-border/50 shadow-premium overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Campanha</TableHead>
                    <TableHead className="text-muted-foreground">Plataformas</TableHead>
                    <TableHead className="text-muted-foreground">Orçamento</TableHead>
                    <TableHead className="text-muted-foreground">Período</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Resultado</TableHead>
                    <TableHead className="text-muted-foreground w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCampanhas.map((c) => (
                    <TableRow key={c.id} className="border-border/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.objective}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.platforms.slice(0, 2).map((p) => (
                            <span
                              key={p}
                              className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground"
                            >
                              {p}
                            </span>
                          ))}
                          {c.platforms.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{c.platforms.length - 2}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        R$ {c.budget.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(c.startDate).toLocaleDateString("pt-BR")} -{" "}
                        {new Date(c.endDate).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            statusCampanha[c.status].class
                          )}
                        >
                          {statusCampanha[c.status].label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-foreground">{c.achievedResult || "-"}</p>
                          <p className="text-xs text-muted-foreground">
                            Meta: {c.expectedResult}
                          </p>
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
          </TabsContent>

          <TabsContent value="conteudos" className="space-y-4">
            <div className="flex justify-end">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Ideia
              </Button>
            </div>
            <div className="bg-card rounded-xl border border-border/50 shadow-premium overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Título</TableHead>
                    <TableHead className="text-muted-foreground">Formato</TableHead>
                    <TableHead className="text-muted-foreground">Tema</TableHead>
                    <TableHead className="text-muted-foreground">Prazo</TableHead>
                    <TableHead className="text-muted-foreground">Prioridade</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockIdeias.map((i) => (
                    <TableRow key={i.id} className="border-border/50">
                      <TableCell className="font-medium text-foreground">
                        {i.title}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                          {i.format}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{i.theme}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(i.dueDate).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium capitalize",
                            priorityStyles[i.priority]
                          )}
                        >
                          {i.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            statusConteudo[i.status].class
                          )}
                        >
                          {statusConteudo[i.status].label}
                        </span>
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
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
