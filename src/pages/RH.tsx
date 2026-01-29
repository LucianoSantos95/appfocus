import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Briefcase,
  Plus,
  Search,
  ArrowLeft,
  MoreHorizontal,
  Mail,
  Phone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Colaborador {
  id: string;
  name: string;
  role: string;
  department: string;
  salary: number;
  startDate: string;
  status: "ativo" | "ferias" | "licenca" | "desligado";
  manager: string;
  email: string;
  phone: string;
}

interface Vaga {
  id: string;
  title: string;
  department: string;
  level: string;
  salary: string;
  status: "aberta" | "em_analise" | "fechada";
  priority: "alta" | "media" | "baixa";
  channel: string;
}

const mockColaboradores: Colaborador[] = [
  {
    id: "1",
    name: "Ana Silva",
    role: "Gerente de Projetos",
    department: "Projetos",
    salary: 12000,
    startDate: "2023-03-15",
    status: "ativo",
    manager: "Carlos Diretor",
    email: "ana.silva@empresa.com",
    phone: "(11) 99999-1111",
  },
  {
    id: "2",
    name: "Bruno Costa",
    role: "Desenvolvedor Senior",
    department: "Tecnologia",
    salary: 15000,
    startDate: "2022-08-01",
    status: "ativo",
    manager: "Ana Silva",
    email: "bruno.costa@empresa.com",
    phone: "(11) 99999-2222",
  },
  {
    id: "3",
    name: "Carla Oliveira",
    role: "Designer",
    department: "Marketing",
    salary: 8000,
    startDate: "2024-01-10",
    status: "ativo",
    manager: "Ana Silva",
    email: "carla.oliveira@empresa.com",
    phone: "(11) 99999-3333",
  },
  {
    id: "4",
    name: "Diego Santos",
    role: "Analista Financeiro",
    department: "Financeiro",
    salary: 7500,
    startDate: "2023-06-20",
    status: "ferias",
    manager: "Carlos Diretor",
    email: "diego.santos@empresa.com",
    phone: "(11) 99999-4444",
  },
];

const mockVagas: Vaga[] = [
  {
    id: "1",
    title: "Desenvolvedor Full Stack",
    department: "Tecnologia",
    level: "Pleno",
    salary: "R$ 10.000 - R$ 14.000",
    status: "aberta",
    priority: "alta",
    channel: "LinkedIn",
  },
  {
    id: "2",
    title: "Analista de Marketing",
    department: "Marketing",
    level: "Junior",
    salary: "R$ 4.000 - R$ 6.000",
    status: "em_analise",
    priority: "media",
    channel: "Indeed",
  },
];

const statusColaborador = {
  ativo: { label: "Ativo", class: "bg-success/10 text-success" },
  ferias: { label: "Férias", class: "bg-warning/10 text-warning" },
  licenca: { label: "Licença", class: "bg-primary/10 text-primary" },
  desligado: { label: "Desligado", class: "bg-muted text-muted-foreground" },
};

const statusVaga = {
  aberta: { label: "Aberta", class: "bg-success/10 text-success" },
  em_analise: { label: "Em Análise", class: "bg-warning/10 text-warning" },
  fechada: { label: "Fechada", class: "bg-muted text-muted-foreground" },
};

const priorityStyles = {
  alta: "bg-destructive/10 text-destructive",
  media: "bg-warning/10 text-warning",
  baixa: "bg-success/10 text-success",
};

export default function RH() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const totalColaboradores = mockColaboradores.filter(
    (c) => c.status !== "desligado"
  ).length;
  const vagasAbertas = mockVagas.filter((v) => v.status === "aberta").length;

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
              <h1 className="text-2xl font-bold text-foreground">
                Recursos Humanos
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie sua equipe e processos seletivos
              </p>
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            icon={Users}
            label="Total de Colaboradores"
            value={totalColaboradores.toString()}
            variant="default"
          />
          <StatCard
            icon={Briefcase}
            label="Vagas em Aberto"
            value={vagasAbertas.toString()}
            variant="warning"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="colaboradores" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted">
              <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
              <TabsTrigger value="vagas">Vagas</TabsTrigger>
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

          <TabsContent value="colaboradores" className="space-y-4">
            <div className="flex justify-end">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Colaborador
              </Button>
            </div>
            <div className="bg-card rounded-xl border border-border/50 shadow-premium overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Nome</TableHead>
                    <TableHead className="text-muted-foreground">Cargo</TableHead>
                    <TableHead className="text-muted-foreground">Departamento</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Contato</TableHead>
                    <TableHead className="text-muted-foreground w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockColaboradores.map((c) => (
                    <TableRow key={c.id} className="border-border/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Desde {new Date(c.startDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{c.role}</TableCell>
                      <TableCell>
                        <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                          {c.department}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            statusColaborador[c.status].class
                          )}
                        >
                          {statusColaborador[c.status].label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <Phone className="w-4 h-4 text-muted-foreground" />
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

          <TabsContent value="vagas" className="space-y-4">
            <div className="flex justify-end">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Vaga
              </Button>
            </div>
            <div className="bg-card rounded-xl border border-border/50 shadow-premium overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Vaga</TableHead>
                    <TableHead className="text-muted-foreground">Departamento</TableHead>
                    <TableHead className="text-muted-foreground">Nível</TableHead>
                    <TableHead className="text-muted-foreground">Faixa Salarial</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Prioridade</TableHead>
                    <TableHead className="text-muted-foreground w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockVagas.map((v) => (
                    <TableRow key={v.id} className="border-border/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{v.title}</p>
                          <p className="text-xs text-muted-foreground">{v.channel}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                          {v.department}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{v.level}</TableCell>
                      <TableCell className="text-foreground">{v.salary}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            statusVaga[v.status].class
                          )}
                        >
                          {statusVaga[v.status].label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium capitalize",
                            priorityStyles[v.priority]
                          )}
                        >
                          {v.priority}
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
