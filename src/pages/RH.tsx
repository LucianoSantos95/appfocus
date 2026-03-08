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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Briefcase,
  Plus,
  Search,
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Upload,
  Edit,
  Trash2,
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
import { useColaboradores } from "@/hooks/useColaboradores";
import { PlanGateButton } from "@/components/plan/PlanGateButton";

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
  avatar?: string;
  bio?: string;
}

interface Vaga {
  id: string;
  title: string;
  department: string;
  level: string;
  salaryRange: string;
  status: "aberta" | "em_analise" | "processo_recrutamento" | "fechada";
  priority: "alta" | "media" | "baixa";
  channel: string;
  description?: string;
  requirements?: string[];
}


const departments = ["Tecnologia", "Marketing", "Projetos", "Financeiro", "RH", "Comercial"];
const levels = ["Estágio", "Auxiliar", "Junior", "Pleno", "Senior", "Especialista", "Gerente", "Diretor"];

const statusColaborador = {
  ativo: { label: "Ativo", class: "bg-success/10 text-success" },
  ferias: { label: "Férias", class: "bg-warning/10 text-warning" },
  licenca: { label: "Licença", class: "bg-primary/10 text-primary" },
  desligado: { label: "Desligado", class: "bg-muted text-muted-foreground" },
};

const statusVaga = {
  aberta: { label: "Aberta", class: "bg-success/10 text-success" },
  em_analise: { label: "Em Análise", class: "bg-warning/10 text-warning" },
  processo_recrutamento: { label: "Processo Recrutamento", class: "bg-primary/10 text-primary" },
  fechada: { label: "Fechada", class: "bg-muted text-muted-foreground" },
};

const priorityStyles = {
  alta: "bg-destructive/10 text-destructive",
  media: "bg-warning/10 text-warning",
  baixa: "bg-success/10 text-success",
};

export default function RH() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { colaboradores: dbColaboradores, isLoading, addColaborador, deleteColaborador, refetch: refetchColaboradores } = useColaboradores();
  const [searchTerm, setSearchTerm] = useState("");
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null);
  const [selectedVaga, setSelectedVaga] = useState<Vaga | null>(null);

  // Map DB colaboradores to local type
  const colaboradores: Colaborador[] = dbColaboradores.map(c => ({
    id: c.id,
    name: c.name,
    role: c.role || '',
    department: c.department || '',
    salary: c.salary || 0,
    startDate: c.start_date || '',
    status: (c.status === 'ferias' ? 'ferias' : c.status === 'licenca' ? 'licenca' : c.status === 'desligado' ? 'desligado' : 'ativo') as Colaborador['status'],
    manager: c.manager || '',
    email: c.email || '',
    phone: c.phone || '',
  }));

  const handleImportColaboradores = () => {
    refetchColaboradores();
  };

  const handleImportVagas = (records: Record<string, unknown>[]) => {
    const newVagas: Vaga[] = records.map((record, index) => ({
      id: `imported-${Date.now()}-${index}`,
      title: String(record.title || ''),
      department: String(record.department || ''),
      level: String(record.level || ''),
      salaryRange: String(record.salaryRange || ''),
      status: 'aberta' as const,
      priority: (record.priority === 'alta' ? 'alta' : record.priority === 'baixa' ? 'baixa' : 'media') as 'alta' | 'media' | 'baixa',
      channel: String(record.channel || ''),
      description: String(record.description || ''),
    }));
    setVagas([...newVagas, ...vagas]);
    toast({
      title: "Importação concluída",
      description: `${newVagas.length} vagas importadas com sucesso.`,
    });
  };

  const totalColaboradores = colaboradores.filter((c) => c.status !== "desligado").length;
  const vagasAbertas = vagas.filter((v) => v.status === "aberta").length;

  const handleDeleteVaga = (id: string) => {
    setVagas(vagas.filter((v) => v.id !== id));
    setSelectedVaga(null);
  };

  const departmentData = [
    { name: "Tecnologia", colaboradores: colaboradores.filter((c) => c.department === "Tecnologia").length, color: "hsl(var(--primary))" },
    { name: "Marketing", colaboradores: colaboradores.filter((c) => c.department === "Marketing").length, color: "hsl(var(--success))" },
    { name: "Projetos", colaboradores: colaboradores.filter((c) => c.department === "Projetos").length, color: "hsl(var(--warning))" },
    { name: "Financeiro", colaboradores: colaboradores.filter((c) => c.department === "Financeiro").length, color: "hsl(var(--destructive))" },
  ].filter((d) => d.colaboradores > 0);

  const salaryData = [
    { department: "Tecnologia", media: Math.round(colaboradores.filter((c) => c.department === "Tecnologia").reduce((sum, c) => sum + c.salary, 0) / Math.max(1, colaboradores.filter((c) => c.department === "Tecnologia").length)) },
    { department: "Projetos", media: Math.round(colaboradores.filter((c) => c.department === "Projetos").reduce((sum, c) => sum + c.salary, 0) / Math.max(1, colaboradores.filter((c) => c.department === "Projetos").length)) },
    { department: "Marketing", media: Math.round(colaboradores.filter((c) => c.department === "Marketing").reduce((sum, c) => sum + c.salary, 0) / Math.max(1, colaboradores.filter((c) => c.department === "Marketing").length)) },
    { department: "Financeiro", media: Math.round(colaboradores.filter((c) => c.department === "Financeiro").reduce((sum, c) => sum + c.salary, 0) / Math.max(1, colaboradores.filter((c) => c.department === "Financeiro").length)) },
  ].filter((d) => d.media > 0);

  const getFilteredColaboradores = (filter: "ativo" | "ferias" | "licenca" | "todos") => {
    if (filter === "todos") return colaboradores;
    return colaboradores.filter((c) => c.status === filter);
  };

  const handleUpdateVagaStatus = (id: string, status: Vaga["status"]) => {
    setVagas(vagas.map((v) => (v.id === id ? { ...v, status } : v)));
  };

  const handleDeleteColaborador = (id: string) => {
    deleteColaborador(id);
    setSelectedColaborador(null);
  };

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Recursos Humanos</h1>
              <p className="text-muted-foreground mt-1">Gerencie sua equipe e processos seletivos</p>
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard icon={Users} label="Total de Colaboradores" value={totalColaboradores.toString()} variant="default" />
          <StatCard icon={Briefcase} label="Vagas em Aberto" value={vagasAbertas.toString()} variant="warning" />
        </div>

        {/* Charts - Modern Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.1)] p-6 transition-all duration-300 hover:shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.15)]">
            <h3 className="font-semibold text-foreground mb-6">Colaboradores por Departamento</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <defs>
                  <filter id="pieGlowRH">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <Pie 
                  data={departmentData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={55} 
                  outerRadius={82} 
                  paddingAngle={4} 
                  dataKey="colaboradores"
                  strokeWidth={0}
                  filter="url(#pieGlowRH)"
                >
                  {departmentData.map((entry, index) => (
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
              {departmentData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color, boxShadow: `0 0 8px ${d.color}50` }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.1)] p-6 transition-all duration-300 hover:shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.15)]">
            <h3 className="font-semibold text-foreground mb-6">Média Salarial por Departamento</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salaryData} layout="vertical">
                <defs>
                  <linearGradient id="barGradientRH" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="department" stroke="hsl(var(--muted-foreground))" fontSize={11} width={80} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--popover))", 
                    border: "1px solid hsl(var(--border))", 
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px -4px hsl(var(--primary)/0.15)",
                  }} 
                  formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Média"]} 
                />
                <Bar dataKey="media" fill="url(#barGradientRH)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Seção de Colaboradores */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Colaboradores</h2>
            <div className="flex items-center gap-2">
              <PlanGateButton module="rh" action="create">
                <ImportDialog
                  config={importConfigs.rh_colaboradores}
                  onImportComplete={handleImportColaboradores}
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      Importar
                    </Button>
                  }
                />
              </PlanGateButton>
              <PlanGateButton module="rh" action="create">
                <AddColaboradorDialog onAdd={addColaborador} />
              </PlanGateButton>
            </div>
          </div>

          <Tabs defaultValue="ativo" className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="ativo">Ativos</TabsTrigger>
              <TabsTrigger value="ferias">Em Férias</TabsTrigger>
              <TabsTrigger value="licenca">Afastados</TabsTrigger>
              <TabsTrigger value="todos">Todos</TabsTrigger>
            </TabsList>

            {["ativo", "ferias", "licenca", "todos"].map((filter) => (
              <TabsContent key={filter} value={filter} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredColaboradores(filter as any).map((c) => (
                    <div
                      key={c.id}
                      className="bg-card rounded-xl border border-border/50 shadow-premium p-5 hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedColaborador(c)}
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={c.avatar} alt={c.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-foreground truncate">{c.name}</p>
                              <p className="text-sm text-muted-foreground">{c.role}</p>
                            </div>
                            <span className={cn("text-xs px-2 py-1 rounded-full font-medium flex-shrink-0", statusColaborador[c.status].class)}>
                              {statusColaborador[c.status].label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="w-4 h-4" />
                          <span>{c.department}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Desde {new Date(c.startDate).toLocaleDateString("pt-BR")}</span>
                        <span className="text-foreground font-medium">R$ {c.salary.toLocaleString("pt-BR")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Seção de Vagas (abaixo de Colaboradores) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Vagas</h2>
            <div className="flex items-center gap-2">
              <PlanGateButton module="rh" action="create">
                <ImportDialog
                  config={importConfigs.rh_vagas}
                  onImportComplete={handleImportVagas}
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      Importar
                    </Button>
                  }
                />
              </PlanGateButton>
              <PlanGateButton module="rh" action="create">
                <AddVagaDialog onAdd={(v) => setVagas([v, ...vagas])} />
              </PlanGateButton>
            </div>
          </div>

          <Tabs defaultValue="aberta" className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="aberta">Abertas</TabsTrigger>
              <TabsTrigger value="em_analise">Em Análise</TabsTrigger>
              <TabsTrigger value="processo_recrutamento">Recrutamento</TabsTrigger>
              <TabsTrigger value="todas">Todas</TabsTrigger>
            </TabsList>

            {["aberta", "em_analise", "processo_recrutamento", "todas"].map((filter) => (
              <TabsContent key={filter} value={filter} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vagas.filter((v) => filter === "todas" || v.status === filter).map((v) => (
                    <div
                      key={v.id}
                      className="bg-card rounded-xl border border-border/50 shadow-premium p-5 hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedVaga(v)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{v.title}</p>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{v.department}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Nível</span>
                          <span className="text-foreground font-medium">{v.level}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Faixa Salarial</span>
                          <span className="text-foreground font-medium">{v.salaryRange}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                        <span className={cn("text-xs px-2 py-1 rounded-full font-medium", statusVaga[v.status].class)}>{statusVaga[v.status].label}</span>
                        <span className={cn("text-xs px-2 py-1 rounded-full font-medium capitalize", priorityStyles[v.priority])}>{v.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Colaborador Detail Dialog */}
        <Dialog open={!!selectedColaborador} onOpenChange={() => setSelectedColaborador(null)}>
          <DialogContent className="sm:max-w-[600px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Detalhes do Colaborador</DialogTitle>
            </DialogHeader>
            {selectedColaborador && (
              <div className="space-y-6 py-4">
                <div className="flex items-center gap-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={selectedColaborador.avatar} alt={selectedColaborador.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                      {selectedColaborador.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground">{selectedColaborador.name}</h3>
                    <p className="text-muted-foreground">{selectedColaborador.role}</p>
                    <span className={cn("text-xs px-2 py-1 rounded-full font-medium mt-2 inline-block", statusColaborador[selectedColaborador.status].class)}>
                      {statusColaborador[selectedColaborador.status].label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Departamento</p>
                      <p className="font-medium text-foreground">{selectedColaborador.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Salário</p>
                      <p className="font-medium text-foreground">R$ {selectedColaborador.salary.toLocaleString("pt-BR")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Início</p>
                      <p className="font-medium text-foreground">{new Date(selectedColaborador.startDate).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground">{selectedColaborador.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium text-foreground">{selectedColaborador.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gestor</p>
                      <p className="font-medium text-foreground">{selectedColaborador.manager}</p>
                    </div>
                  </div>
                </div>

                {selectedColaborador.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground">Sobre</p>
                    <p className="font-medium text-foreground">{selectedColaborador.bio}</p>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between pt-4 border-t border-border/50">
              <Button variant="destructive" onClick={() => selectedColaborador && handleDeleteColaborador(selectedColaborador.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Colaborador
              </Button>
              <Button variant="outline" onClick={() => setSelectedColaborador(null)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Vaga Detail Dialog */}
        <Dialog open={!!selectedVaga} onOpenChange={() => setSelectedVaga(null)}>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Detalhes da Vaga</DialogTitle>
            </DialogHeader>
            {selectedVaga && (
              <div className="space-y-4 py-4">
                <div>
                  <h3 className="font-bold text-foreground text-lg">{selectedVaga.title}</h3>
                  <p className="text-muted-foreground">{selectedVaga.department} • {selectedVaga.level}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Faixa Salarial</p>
                    <p className="font-medium text-foreground">{selectedVaga.salaryRange}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Canal</p>
                    <p className="font-medium text-foreground">{selectedVaga.channel}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Status da Vaga</p>
                  <Select value={selectedVaga.status} onValueChange={(v: Vaga["status"]) => handleUpdateVagaStatus(selectedVaga.id, v)}>
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="aberta">Aberta</SelectItem>
                      <SelectItem value="em_analise">Em Análise</SelectItem>
                      <SelectItem value="processo_recrutamento">Processo Recrutamento</SelectItem>
                      <SelectItem value="fechada">Fechada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedVaga.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Descrição</p>
                    <p className="font-medium text-foreground">{selectedVaga.description}</p>
                  </div>
                )}
                {selectedVaga.requirements && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Requisitos</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedVaga.requirements.map((req, index) => (
                        <span key={index} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{req}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between pt-4 border-t border-border/50">
              <Button variant="destructive" onClick={() => selectedVaga && handleDeleteVaga(selectedVaga.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Vaga
              </Button>
              <Button variant="outline" onClick={() => setSelectedVaga(null)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

function AddColaboradorDialog({ onAdd }: { onAdd: (c: { name: string; role?: string; department?: string; salary?: number; email?: string; phone?: string; status?: string }) => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", role: "", department: "", salary: "", email: "", phone: "", avatar: "", bio: "",
  });

  const handleSubmit = async () => {
    if (!form.name || !form.role || !form.department) return;
    await onAdd({
      name: form.name,
      role: form.role,
      department: form.department,
      salary: parseFloat(form.salary) || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      status: "ativo",
    });
    setForm({ name: "", role: "", department: "", salary: "", email: "", phone: "", avatar: "", bio: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="w-4 h-4" />Novo Colaborador</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader><DialogTitle className="text-foreground">Novo Colaborador</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Foto (URL)</Label>
            <div className="flex items-center gap-3">
              <Input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="https://..." className="bg-muted border-border" />
              <Button variant="outline" size="icon"><Upload className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do colaborador" className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Ex: Desenvolvedor" className="bg-muted border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {departments.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Salário</Label>
              <Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="0,00" className="bg-muted border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@empresa.com" className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" className="bg-muted border-border" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSubmit}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddVagaDialog({ onAdd }: { onAdd: (v: Vaga) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", department: "", level: "", salaryRange: "", priority: "media" as "alta" | "media" | "baixa",
    channel: "", description: "", requirements: "",
  });

  const handleSubmit = () => {
    if (!form.title || !form.department || !form.level) return;
    const vaga: Vaga = {
      id: Date.now().toString(), title: form.title, department: form.department, level: form.level,
      salaryRange: form.salaryRange, status: "aberta", priority: form.priority, channel: form.channel,
      description: form.description,
      requirements: form.requirements ? form.requirements.split(",").map((r) => r.trim()) : [],
    };
    onAdd(vaga);
    setForm({ title: "", department: "", level: "", salaryRange: "", priority: "media", channel: "", description: "", requirements: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="w-4 h-4" />Nova Vaga</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader><DialogTitle className="text-foreground">Nova Vaga</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Título da Vaga</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Desenvolvedor Full Stack" className="bg-muted border-border" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {departments.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nível</Label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {levels.map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Faixa Salarial</Label>
              <Input value={form.salaryRange} onChange={(e) => setForm({ ...form, salaryRange: e.target.value })} placeholder="R$ 5.000 - R$ 8.000" className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v: "alta" | "media" | "baixa") => setForm({ ...form, priority: v })}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSubmit}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}