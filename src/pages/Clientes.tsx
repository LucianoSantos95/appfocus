import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageMeta } from "@/components/seo/PageMeta";
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
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { isValidHttpUrl } from "@/lib/validation";
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
import { useClientes, type Cliente, type ClienteInput } from "@/hooks/useClientes";
import { ClienteInsightsCard } from "@/components/clientes/ClienteInsightsCard";
import { ClienteAIBadge } from "@/components/clientes/ClienteAIBadge";
import { MeetingNotesEditor } from "@/components/clientes/MeetingNotesEditor";
import { SugestoesPainel } from "@/components/clientes/SugestoesPainel";
import { ImportDialog } from "@/components/import/ImportDialog";
import { importConfigs } from "@/lib/import-configs";
import { PlanGateButton } from "@/components/plan/PlanGateButton";
import { useFreemiumLimit } from "@/hooks/useFreemiumLimit";
import { UpgradeModal } from "@/components/plan/UpgradeModal";
import { ClientesBIPanel } from "@/components/bi/ClientesBIPanel";
import { usePlan } from "@/contexts/PlanContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { Maximize2 } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

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
  const {
    clientes,
    isLoading,
    isAnalyzing,
    addCliente,
    updateCliente,
    deleteCliente,
    analyzeAllClientes,
    convertToAtivo,
  } = useClientes();

  const [searchTerm, setSearchTerm] = useState("");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [biPanelOpen, setBiPanelOpen] = useState(false);
  const [biUpgradeOpen, setBiUpgradeOpen] = useState(false);
  const { plan } = usePlan();
  const { isAdmin } = useTeamPermissions();
  const freemium = useFreemiumLimit(clientes.length);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const [clienteToConvert, setClienteToConvert] = useState<Cliente | null>(null);
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [conversionForm, setConversionForm] = useState({
    contractType: "",
    contractValue: "",
    paymentStatus: "pendente" as "pendente" | "pago",
  });

  // Filter and compute data
  const filteredClientes = useMemo(() => {
    if (!searchTerm) return clientes;
    const term = searchTerm.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.segmento?.toLowerCase().includes(term)
    );
  }, [clientes, searchTerm]);

  const prospectosClientes = filteredClientes.filter((c) => c.status === "prospecto");
  const ativosClientes = filteredClientes.filter((c) => c.status === "ativo");

  const clientesAtivos = clientes.filter((c) => c.status === "ativo").length;
  const receitaAtivos = clientes
    .filter((c) => c.status === "ativo")
    .reduce((sum, c) => sum + (c.valor_total || 0), 0);
  const prospectos = clientes.filter((c) => c.status === "prospecto").length;

  // Chart data
  const segmentData = useMemo(() => {
    const counts: Record<string, number> = {};
    clientes.forEach((c) => {
      const seg = c.segmento || "Outros";
      counts[seg] = (counts[seg] || 0) + 1;
    });
    const colors = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [clientes]);

  const revenueData = useMemo(() => {
    return clientes
      .filter((c) => (c.valor_total || 0) > 0)
      .sort((a, b) => (b.valor_total || 0) - (a.valor_total || 0))
      .slice(0, 5)
      .map((c) => ({ name: c.nome, valor: c.valor_total || 0 }));
  }, [clientes]);

  // Suggestions for AI panel
  const sugestoes = useMemo(() => {
    return clientes
      .filter((c) => c.proxima_acao_sugerida)
      .map((c) => ({
        id: c.id,
        clienteId: c.id,
        clienteNome: c.nome,
        acao: c.proxima_acao_sugerida!,
        prioridade: c.prioridade_contato || "baixa",
        classificacao: c.classificacao,
      }));
  }, [clientes]);

  const handleUpdateCliente = async (updated: Partial<ClienteInput> & { id: string }) => {
    const { id, ...updates } = updated;
    await updateCliente(id, updates);
    setSelectedCliente(null);
  };

  const handleDeleteCliente = async (id: string) => {
    await deleteCliente(id);
    setSelectedCliente(null);
  };

  const handleConvertToActive = (cliente: Cliente) => {
    setClienteToConvert(cliente);
    setShowConversionDialog(true);
  };

  const handleConfirmConversion = async () => {
    if (!clienteToConvert || !conversionForm.contractType || !conversionForm.contractValue) return;

    const contractValue = parseFloat(conversionForm.contractValue);
    const success = await convertToAtivo(
      clienteToConvert.id,
      conversionForm.contractType,
      contractValue
    );

    if (success) {
      toast({
        title: "Cliente convertido com sucesso!",
        description: `${clienteToConvert.nome} agora é um cliente ativo.`,
      });
    }

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
            {c.nome.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-foreground">{c.nome}</p>
            <div className="flex items-center gap-2 mt-1">
              {c.segmento && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                  {c.segmento}
                </span>
              )}
              <ClienteAIBadge classificacao={c.classificacao} />
            </div>
          </div>
        </div>
        <span
          className={cn(
            "text-xs px-2 py-1 rounded-full font-medium",
            statusCliente[c.status as keyof typeof statusCliente]?.class || statusCliente.prospecto.class
          )}
        >
          {statusCliente[c.status as keyof typeof statusCliente]?.label || c.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-4 h-4" />
          <span className="truncate">{c.email || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="w-4 h-4" />
          <span>{c.telefone || "—"}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-1 text-foreground font-medium">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span>R$ {(c.valor_total || 0).toLocaleString("pt-BR")}</span>
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
        {!showConvertButton && c.ultima_interacao && (
          <span className="text-xs text-muted-foreground">
            {new Date(c.ultima_interacao).toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageMeta title="Clientes" description="Cadastro e relacionamento com clientes. CRM completo para sua empresa." />
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
            label="Receita Clientes Ativos"
            value={receitaAtivos > 0 ? `R$ ${(receitaAtivos / 1000).toFixed(0)}K` : "R$ 0"}
            trend={{ value: 12, isPositive: true }}
            variant="success"
          />
        </div>

        {/* Charts - Modern Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.1)] p-6 transition-all duration-300 hover:shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.15)]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Receita por Cliente</h3>
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => { if (plan === "gratuito" && !isAdmin) setBiUpgradeOpen(true); else setBiPanelOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      <Maximize2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Clique para análise detalhada</TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
            <div className="mt-4" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} layout="vertical">
                <defs>
                  <linearGradient id="barGradientClientes" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={90} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px -4px hsl(var(--primary)/0.15)",
                    color: "#ffffff",
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Receita"]}
                  labelStyle={{ color: "#ffffff" }}
                  itemStyle={{ color: "#ffffff" }}
                />
                <Bar dataKey="valor" fill="url(#barGradientClientes)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.1)] p-6 transition-all duration-300 hover:shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.15)]">
            <h3 className="font-semibold text-foreground mb-6">Por Segmento</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <defs>
                  <filter id="pieGlow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                  filter="url(#pieGlow)"
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px -4px hsl(var(--primary)/0.15)",
                    color: "#ffffff",
                  }}
                  labelStyle={{ color: "#ffffff" }}
                  itemStyle={{ color: "#ffffff" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              {segmentData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color, boxShadow: `0 0 8px ${d.color}50` }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights Card - Below Charts */}
        <PlanGateButton module="clientes" action="ai_analysis">
          <ClienteInsightsCard
            clientes={clientes}
            onAnalyzeAll={analyzeAllClientes}
            isAnalyzing={isAnalyzing}
            onOpenSugestoes={() => setShowSugestoes(true)}
          />
        </PlanGateButton>

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
          <div className="flex items-center gap-2">
            <PlanGateButton module="clientes" action="create">
              <ImportDialog
                config={importConfigs.clientes}
                onImportComplete={() => {
                  toast({
                    title: "Importação concluída",
                    description: "Os clientes foram importados com sucesso.",
                  });
                }}
                onAnalyzeAI={analyzeAllClientes}
                trigger={
                  <Button variant="outline" className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Importar Planilha
                  </Button>
                }
              />
            </PlanGateButton>
            <PlanGateButton module="clientes" action="create">
              <AddClienteDialog onAdd={addCliente} disabled={freemium.limitReached} onBlocked={() => setUpgradeModalOpen(true)} />
            </PlanGateButton>
          </div>
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
              Converter {clienteToConvert?.nome} para cliente ativo. Isso criará uma entrada financeira automaticamente.
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

      {/* AI Suggestions Panel */}
      <SugestoesPainel
        open={showSugestoes}
        onOpenChange={setShowSugestoes}
        sugestoes={sugestoes}
      />
      <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} currentCount={freemium.currentCount} maxCount={freemium.maxCount} moduleName="CRM" />
      <UpgradeModal open={biUpgradeOpen} onOpenChange={setBiUpgradeOpen} currentCount={0} maxCount={0} moduleName="Dashboards de BI" />
      <ClientesBIPanel open={biPanelOpen} onOpenChange={setBiPanelOpen} clientes={clientes.map(c => ({ id: c.id, nome: c.nome, status: c.status, valor_total: c.valor_total, segmento: c.segmento }))} />
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
  onUpdate: (c: Partial<ClienteInput> & { id: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [editedCliente, setEditedCliente] = useState({
    nome: cliente.nome,
    email: cliente.email || "",
    telefone: cliente.telefone || "",
    segmento: cliente.segmento || "",
    status: cliente.status,
    tipo_contrato: cliente.tipo_contrato || "",
    valor_total: cliente.valor_total || 0,
    anexo_url: cliente.anexo_url || "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    onUpdate({
      id: cliente.id,
      nome: editedCliente.nome,
      email: editedCliente.email || undefined,
      telefone: editedCliente.telefone || undefined,
      segmento: editedCliente.segmento || undefined,
      status: editedCliente.status,
      tipo_contrato: editedCliente.tipo_contrato || undefined,
      valor_total: editedCliente.valor_total,
      anexo_url: editedCliente.anexo_url || undefined,
    });
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              Editar Cliente
              <ClienteAIBadge classificacao={cliente.classificacao} />
            </DialogTitle>
          </DialogHeader>
          
          {cliente.proxima_acao_sugerida && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
              <p className="font-medium text-primary mb-1">💡 Sugestão da IA:</p>
              <p className="text-muted-foreground">{cliente.proxima_acao_sugerida}</p>
            </div>
          )}

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome / Empresa</Label>
              <Input
                value={editedCliente.nome}
                onChange={(e) => setEditedCliente({ ...editedCliente, nome: e.target.value })}
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
                  value={editedCliente.telefone}
                  onChange={(e) => setEditedCliente({ ...editedCliente, telefone: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Segmento</Label>
                <Select
                  value={editedCliente.segmento}
                  onValueChange={(v) => setEditedCliente({ ...editedCliente, segmento: v })}
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
                  onValueChange={(v) => setEditedCliente({ ...editedCliente, status: v })}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Contrato</Label>
                <Input
                  value={editedCliente.tipo_contrato}
                  onChange={(e) => setEditedCliente({ ...editedCliente, tipo_contrato: e.target.value })}
                  placeholder="Ex: Consultoria, Serviços..."
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Total (R$)</Label>
                <Input
                  type="number"
                  value={editedCliente.valor_total}
                  onChange={(e) => setEditedCliente({ ...editedCliente, valor_total: parseFloat(e.target.value) || 0 })}
                  className="bg-muted border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Link Contrato/Comprovante</Label>
              <Input
                value={editedCliente.anexo_url}
                onChange={(e) => setEditedCliente({ ...editedCliente, anexo_url: e.target.value })}
                placeholder="https://drive.google.com/... ou link do documento"
                className="bg-muted border-border"
              />
              {editedCliente.anexo_url && isValidHttpUrl(editedCliente.anexo_url) && (
                <a
                  href={editedCliente.anexo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  Visualizar anexo
                </a>
              )}
              {editedCliente.anexo_url && !isValidHttpUrl(editedCliente.anexo_url) && (
                <span className="text-sm text-destructive">
                  URL inválida (deve começar com http:// ou https://)
                </span>
              )}
            </div>

            {/* Meeting Notes Rich Text Editor */}
            <MeetingNotesEditor
              initialContent={(cliente as any).meeting_notes || ""}
              onSave={async (content) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const sb = (await import("@/integrations/supabase/client")).supabase as any;
                await sb.from("clientes").update({ meeting_notes: content }).eq("id", cliente.id);
              }}
            />

            {cliente.palavras_chave && cliente.palavras_chave.length > 0 && (
              <div className="space-y-2">
                <Label>Palavras-chave (IA)</Label>
                <div className="flex flex-wrap gap-2">
                  {cliente.palavras_chave.map((keyword, i) => (
                    <span
                      key={i}
                      className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground"
                    >
                      {keyword}
                    </span>
                  ))}
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
              Tem certeza que deseja excluir o cliente "{cliente.nome}"? Esta ação não pode ser desfeita.
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

function AddClienteDialog({ onAdd, disabled, onBlocked }: { onAdd: (c: ClienteInput) => Promise<Cliente | null>; disabled?: boolean; onBlocked?: () => void }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    segmento: "",
    status: "prospecto" as "ativo" | "inativo" | "prospecto",
    valor_total: "",
    anexo_url: "",
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && disabled) { onBlocked?.(); return; }
    setOpen(newOpen);
  };

  const handleSubmit = async () => {
    if (!form.nome || !form.email) return;

    setIsSubmitting(true);
    await onAdd({
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
      segmento: form.segmento,
      status: form.status,
      valor_total: parseFloat(form.valor_total) || 0,
      anexo_url: form.anexo_url || undefined,
      empresa: form.nome,
    });

    setForm({ nome: "", email: "", telefone: "", segmento: "", status: "prospecto", valor_total: "", anexo_url: "" });
    setIsSubmitting(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
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
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="bg-muted border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Segmento</Label>
              <Select value={form.segmento} onValueChange={(v) => setForm({ ...form, segmento: v })}>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor do Cliente (R$)</Label>
              <Input
                type="number"
                value={form.valor_total}
                onChange={(e) => setForm({ ...form, valor_total: e.target.value })}
                placeholder="0,00"
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Link Contrato/Comprovante</Label>
              <Input
                value={form.anexo_url}
                onChange={(e) => setForm({ ...form, anexo_url: e.target.value })}
                placeholder="https://..."
                className="bg-muted border-border"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
