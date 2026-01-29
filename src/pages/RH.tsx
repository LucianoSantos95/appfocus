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

const initialColaboradores: Colaborador[] = [
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
    bio: "Especialista em gestão de projetos com 8 anos de experiência",
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

const initialVagas: Vaga[] = [
  {
    id: "1",
    title: "Desenvolvedor Full Stack",
    department: "Tecnologia",
    level: "Pleno",
    salaryRange: "R$ 10.000 - R$ 14.000",
    status: "aberta",
    priority: "alta",
    channel: "LinkedIn",
    description: "Vaga para desenvolvedor com experiência em React e Node.js",
    requirements: ["React", "Node.js", "TypeScript", "3+ anos experiência"],
  },
  {
    id: "2",
    title: "Analista de Marketing",
    department: "Marketing",
    level: "Junior",
    salaryRange: "R$ 4.000 - R$ 6.000",
    status: "em_analise",
    priority: "media",
    channel: "Indeed",
    description: "Profissional para atuar com marketing digital",
  },
  {
    id: "3",
    title: "Estagiário de RH",
    department: "RH",
    level: "Estágio",
    salaryRange: "R$ 1.500 - R$ 2.000",
    status: "processo_recrutamento",
    priority: "baixa",
    channel: "Vagas.com",
  },
];

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
  const [searchTerm, setSearchTerm] = useState("");
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(initialColaboradores);
  const [vagas, setVagas] = useState<Vaga[]>(initialVagas);
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null);
  const [selectedVaga, setSelectedVaga] = useState<Vaga | null>(null);

  const totalColaboradores = colaboradores.filter((c) => c.status !== "desligado").length;
  const vagasAbertas = vagas.filter((v) => v.status === "aberta").length;

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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border/50 shadow-premium p-6">
            <h3 className="font-semibold text-foreground mb-4">Colaboradores por Departamento</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={departmentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="colaboradores">
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-4 justify-center mt-2">
              {departmentData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/50 shadow-premium p-6">
            <h3 className="font-semibold text-foreground mb-4">Média Salarial por Departamento</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salaryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <YAxis type="category" dataKey="department" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Média"]} />
                <Bar dataKey="media" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="colaboradores" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
            <TabsTrigger value="vagas">Vagas</TabsTrigger>
          </TabsList>

          <TabsContent value="colaboradores" className="space-y-6">
            <div className="flex justify-end">
              <AddColaboradorDialog onAdd={(c) => setColaboradores([c, ...colaboradores])} />
            </div>

            {/* Sub-tabs for Colaboradores */}
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
          </TabsContent>

          <TabsContent value="vagas" className="space-y-4">
            <div className="flex justify-end">
              <AddVagaDialog onAdd={(v) => setVagas([v, ...vagas])} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vagas.map((v) => (
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
        </Tabs>

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
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

function AddColaboradorDialog({ onAdd }: { onAdd: (c: Colaborador) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", role: "", department: "", salary: "", email: "", phone: "", avatar: "", bio: "",
  });

  const handleSubmit = () => {
    if (!form.name || !form.role || !form.department) return;
    const colaborador: Colaborador = {
      id: Date.now().toString(), name: form.name, role: form.role, department: form.department,
      salary: parseFloat(form.salary) || 0, startDate: new Date().toISOString().split("T")[0], status: "ativo",
      manager: "", email: form.email, phone: form.phone, avatar: form.avatar, bio: form.bio,
    };
    onAdd(colaborador);
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