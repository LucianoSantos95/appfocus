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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FileText,
  Trash2,
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
import { useToast } from "@/hooks/use-toast";

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
  contractType?: string;
  contractValue?: number;
}

interface FinanceEntry {
  id: string;
  description: string;
  value: number;
  client: string;
  category: string;
  status: "pendente" | "pago";
  date: string;
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
    contractType: "Consultoria",
    contractValue: 125000,
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
    contractType: "Serviços",
    contractValue: 85000,
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
    contractType: "Desenvolvimento",
    contractValue: 45000,
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
    name: "Nova Startup",
    email: "contato@novastartup.com",
    phone: "(11) 99999-5555",
    status: "prospecto",
    totalValue: 0,
    lastInteraction: "2025-01-28",
    segment: "Tecnologia",
    company: "Nova Startup",
  },
  {
    id: "6",
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
  { name: "Tecnologia", value: 3, color: "hsl(var(--primary))" },
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
const contractTypes = ["Consultoria", "Serviços", "Desenvolvimento", "Licenciamento", "Suporte", "Projeto"];

export default function Clientes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const [clienteToConvert, setClienteToConvert] = useState<Cliente | null>(null);
  const [conversionForm, setConversionForm] = useState({
    contractType: "",
    contractValue: "",
    paymentStatus: "pendente" as "pendente" | "pago",
  });

  const clientesAtivos = clientes.filter((c) => c.status === "ativo").length;
  const totalRevenue = clientes.reduce((sum, c) => sum + c.totalValue, 0);
  const prospectos = clientes.filter((c) => c.status === "prospecto").length;

  const prospectosClientes = clientes.filter((c) => c.status === "prospecto");
  const ativosClientes = clientes.filter((c) => c.status === "ativo");

  const handleUpdateCliente = (updated: Cliente) => {
    setClientes(clientes.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedCliente(null);
  };

  const handleDeleteCliente = (id: string) => {
    setClientes(clientes.filter((c) => c.id !== id));
    setSelectedCliente(null);
  };

  const handleConvertToActive = (cliente: Cliente) => {
    setClienteToConvert(cliente);
    setShowConversionDialog(true);
  };

  const handleConfirmConversion = () => {
    if (!clienteToConvert || !conversionForm.contractType || !conversionForm.contractValue) return;

    const contractValue = parseFloat(conversionForm.contractValue);

    // Update client status to active
    const updatedCliente: Cliente = {
      ...clienteToConvert,
      status: "ativo",
      totalValue: contractValue,
      contractType: conversionForm.contractType,
      contractValue: contractValue,
      lastInteraction: new Date().toISOString().split("T")[0],
    };

    setClientes(clientes.map((c) => (c.id === clienteToConvert.id ? updatedCliente : c)));

    // Create finance entry
    const newFinanceEntry: FinanceEntry = {
      id: Date.now().toString(),
      description: `${clienteToConvert.name} - ${conversionForm.contractType}`,
      value: contractValue,
      client: clienteToConvert.name,
      category: "Serviços",
      status: conversionForm.paymentStatus,
      date: new Date().toISOString().split("T")[0],
    };

    setFinanceEntries([...financeEntries, newFinanceEntry]);

    toast({
      title: "Cliente convertido com sucesso!",
      description: `${clienteToConvert.name} agora é um cliente ativo. Entrada financeira de R$ ${contractValue.toLocaleString("pt-BR")} criada.`,
    });

    setShowConversionDialog(false);
    setClienteToConvert(null);
    setConversionForm({ contractType: "", contractValue: "", paymentStatus: "pendente" });
  };

  const renderClienteCard = (c: Cliente, showConvertButton = false) => (
    <div
      key={c.id}
      className="bg-card rounded-xl border border-border/50 shadow-premium p-5 hover:border-primary/30 transition-colors cursor-pointer"
      onClick={() => setSelectedCliente(c)}
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
        {showConvertButton && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleConvertToActive(c);
            }}
            className="gap-1"
          >
            <FileText className="w-3 h-3" />
            Fechar Contrato
          </Button>
        )}
        {!showConvertButton && (
          <span className="text-xs text-muted-foreground">
            {new Date(c.lastInteraction).toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>
    </div>
  );

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
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-80 bg-muted border-border"
            />
          </div>
          <AddClienteDialog onAdd={(c) => setClientes([c, ...clientes])} />
        </div>

        {/* Clients Tabs */}
        <Tabs defaultValue="prospectos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="prospectos">Prospectos ({prospectosClientes.length})</TabsTrigger>
            <TabsTrigger value="ativos">Clientes Ativos ({ativosClientes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="prospectos" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prospectosClientes.map((c) => renderClienteCard(c, true))}
            </div>
            {prospectosClientes.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum prospecto encontrado
              </div>
            )}
          </TabsContent>

          <TabsContent value="ativos" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ativosClientes.map((c) => renderClienteCard(c))}
            </div>
            {ativosClientes.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum cliente ativo encontrado
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Client Dialog */}
      {selectedCliente && (
        <EditClienteDialog
          cliente={selectedCliente}
          open={!!selectedCliente}
          onOpenChange={(open) => !open && setSelectedCliente(null)}
          onUpdate={handleUpdateCliente}
          onDelete={handleDeleteCliente}
        />
      )}

      {/* Conversion Dialog */}
      <AlertDialog open={showConversionDialog} onOpenChange={setShowConversionDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar Contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Converter {clienteToConvert?.name} para cliente ativo. Isso criará uma entrada financeira automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Contrato</Label>
              <Select
                value={conversionForm.contractType}
                onValueChange={(v) => setConversionForm({ ...conversionForm, contractType: v })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {contractTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor do Contrato</Label>
              <Input
                type="number"
                value={conversionForm.contractValue}
                onChange={(e) => setConversionForm({ ...conversionForm, contractValue: e.target.value })}
                placeholder="0,00"
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Status do Pagamento</Label>
              <Select
                value={conversionForm.paymentStatus}
                onValueChange={(v: "pendente" | "pago") => setConversionForm({ ...conversionForm, paymentStatus: v })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmConversion}>Confirmar Conversão</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

function EditClienteDialog({
  cliente,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: {
  cliente: Cliente;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (c: Cliente) => void;
  onDelete: (id: string) => void;
}) {
  const [editedCliente, setEditedCliente] = useState(cliente);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    onUpdate(editedCliente);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome / Empresa</Label>
              <Input
                value={editedCliente.name}
                onChange={(e) => setEditedCliente({ ...editedCliente, name: e.target.value })}
                className="bg-muted border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editedCliente.email}
                  onChange={(e) => setEditedCliente({ ...editedCliente, email: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={editedCliente.phone}
                  onChange={(e) => setEditedCliente({ ...editedCliente, phone: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Segmento</Label>
                <Select
                  value={editedCliente.segment}
                  onValueChange={(v) => setEditedCliente({ ...editedCliente, segment: v })}
                >
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
                <Select
                  value={editedCliente.status}
                  onValueChange={(v: "ativo" | "inativo" | "prospecto") => setEditedCliente({ ...editedCliente, status: v })}
                >
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
            {editedCliente.status === "ativo" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Contrato</Label>
                  <Input
                    value={editedCliente.contractType || ""}
                    onChange={(e) => setEditedCliente({ ...editedCliente, contractType: e.target.value })}
                    className="bg-muted border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Total</Label>
                  <Input
                    type="number"
                    value={editedCliente.totalValue}
                    onChange={(e) => setEditedCliente({ ...editedCliente, totalValue: parseFloat(e.target.value) || 0 })}
                    className="bg-muted border-border"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{cliente.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(cliente.id);
                setShowDeleteConfirm(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
