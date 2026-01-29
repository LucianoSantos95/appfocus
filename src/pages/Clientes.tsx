import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  UserCheck,
  Plus,
  Search,
  ArrowLeft,
  DollarSign,
  Users,
  TrendingUp,
  Mail,
  Phone,
  Building,
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

interface Cliente {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "ativo" | "inativo" | "prospecto";
  totalValue: number;
  lastInteraction: string;
  segment?: string;
  company?: string;
}

const initialClientes: Cliente[] = [
  {
    id: "1",
    name: "Tech Solutions Ltda",
    email: "contato@techsolutions.com",
    phone: "(11) 3333-1111",
    status: "ativo",
    totalValue: 125000,
    lastInteraction: "2025-01-28",
    segment: "Tecnologia",
    company: "Tech Solutions Ltda",
  },
  {
    id: "2",
    name: "Grupo ABC",
    email: "financeiro@grupoabc.com",
    phone: "(11) 3333-2222",
    status: "ativo",
    totalValue: 85000,
    lastInteraction: "2025-01-25",
    segment: "Varejo",
    company: "Grupo ABC",
  },
  {
    id: "3",
    name: "StartupCo",
    email: "ceo@startupco.io",
    phone: "(11) 99999-3333",
    status: "ativo",
    totalValue: 45000,
    lastInteraction: "2025-01-20",
    segment: "Tecnologia",
    company: "StartupCo",
  },
  {
    id: "4",
    name: "Empresa XYZ",
    email: "comercial@xyz.com.br",
    phone: "(11) 3333-4444",
    status: "prospecto",
    totalValue: 0,
    lastInteraction: "2025-01-15",
    segment: "Serviços",
    company: "Empresa XYZ",
  },
  {
    id: "5",
    name: "Antiga Corp",
    email: "contato@antigacorp.com",
    phone: "(11) 3333-5555",
    status: "inativo",
    totalValue: 32000,
    lastInteraction: "2024-08-10",
    segment: "Indústria",
    company: "Antiga Corp",
  },
];

const segmentData = [
  { name: "Tecnologia", value: 2, color: "hsl(var(--primary))" },
  { name: "Varejo", value: 1, color: "hsl(var(--success))" },
  { name: "Serviços", value: 1, color: "hsl(var(--warning))" },
  { name: "Indústria", value: 1, color: "hsl(var(--destructive))" },
];

const revenueData = [
  { name: "Tech Solutions", valor: 125000 },
  { name: "Grupo ABC", valor: 85000 },
  { name: "StartupCo", valor: 45000 },
  { name: "Antiga Corp", valor: 32000 },
];

const statusCliente = {
  ativo: { label: "Ativo", class: "bg-success/10 text-success" },
  inativo: { label: "Inativo", class: "bg-muted text-muted-foreground" },
  prospecto: { label: "Prospecto", class: "bg-primary/10 text-primary" },
};

const segments = ["Tecnologia", "Varejo", "Serviços", "Indústria", "Saúde", "Educação", "Financeiro"];

export default function Clientes() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);

  const clientesAtivos = clientes.filter((c) => c.status === "ativo").length;
  const totalRevenue = clientes.reduce((sum, c) => sum + c.totalValue, 0);
  const prospectos = clientes.filter((c) => c.status === "prospecto").length;

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
              <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
              <p className="text-muted-foreground mt-1">
                Cadastro e relacionamento com clientes
              </p>
            </div>
          </div>
          <AddClienteDialog onAdd={(c) => setClientes([c, ...clientes])} />
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total de Clientes"
            value={clientes.length.toString()}
            variant="default"
          />
          <StatCard
            icon={UserCheck}
            label="Clientes Ativos"
            value={clientesAtivos.toString()}
            variant="success"
          />
          <StatCard
            icon={TrendingUp}
            label="Prospectos"
            value={prospectos.toString()}
            variant="default"
          />
          <StatCard
            icon={DollarSign}
            label="Receita Total"
            value={`R$ ${(totalRevenue / 1000).toFixed(0)}K`}
            trend={{ value: 12, isPositive: true }}
            variant="success"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border/50 shadow-premium p-6">
            <h3 className="font-semibold text-foreground mb-4">Receita por Cliente</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={90} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Receita"]}
                />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl border border-border/50 shadow-premium p-6">
            <h3 className="font-semibold text-foreground mb-4">Por Segmento</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {segmentData.map((entry, index) => (
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
              {segmentData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-80 bg-muted border-border"
          />
        </div>

        {/* Clients Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((c) => (
            <div
              key={c.id}
              className="bg-card rounded-xl border border-border/50 shadow-premium p-5 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{c.name}</p>
                    {c.segment && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                        {c.segment}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium",
                    statusCliente[c.status].class
                  )}
                >
                  {statusCliente[c.status].label}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{c.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{c.phone}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-1 text-foreground font-medium">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>R$ {c.totalValue.toLocaleString("pt-BR")}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.lastInteraction).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

function AddClienteDialog({ onAdd }: { onAdd: (c: Cliente) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    segment: "",
    status: "prospecto" as "ativo" | "inativo" | "prospecto",
  });

  const handleSubmit = () => {
    if (!form.name || !form.email) return;
    
    const cliente: Cliente = {
      id: Date.now().toString(),
      name: form.name,
      email: form.email,
      phone: form.phone,
      status: form.status,
      totalValue: 0,
      lastInteraction: new Date().toISOString().split("T")[0],
      segment: form.segment,
      company: form.name,
    };
    
    onAdd(cliente);
    setForm({ name: "", email: "", phone: "", segment: "", status: "prospecto" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Novo Cliente</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome / Empresa</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome do cliente ou empresa"
              className="bg-muted border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@empresa.com"
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="bg-muted border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Segmento</Label>
              <Select value={form.segment} onValueChange={(v) => setForm({ ...form, segment: v })}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {segments.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: "ativo" | "inativo" | "prospecto") => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="prospecto">Prospecto</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
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
