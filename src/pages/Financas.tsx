import { useState, useMemo, useEffect } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  Search,
  Download,
  ArrowLeft,
  MoreHorizontal,
  Building2,
  CreditCard,
  Edit,
  Trash2,
  FileText,
  X,
  FileSpreadsheet,
  ChevronDown,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock,
  Receipt,
  Filter,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  BarChart,
  Bar,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ImportDialog } from "@/components/import/ImportDialog";
import { SmartImportFinanceiroDialog } from "@/components/import/SmartImportFinanceiroDialog";
import { importConfigs } from "@/lib/import-configs";
import { ImportExtratoDialog } from "@/components/financas/ImportExtratoDialog";
import { ImportHistoryDialog } from "@/components/import/ImportHistoryDialog";
import { useToast } from "@/hooks/use-toast";
import { useTransacoes } from "@/hooks/useTransacoes";
import { useContasBancarias, ContaBancaria } from "@/hooks/useContasBancarias";
import { PlanGateButton } from "@/components/plan/PlanGateButton";
import { useFreemiumLimit } from "@/hooks/useFreemiumLimit";
import { UpgradeModal } from "@/components/plan/UpgradeModal";
import { FinanceiroBIPanel } from "@/components/bi/FinanceiroBIPanel";
import { usePlan } from "@/contexts/PlanContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { Maximize2, Sparkles } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

// Types
interface Transaction {
  id: string;
  description: string;
  value: number;
  date: string;
  category: string;
  type: "receita" | "despesa";
  status: "pago" | "pendente" | "atrasado";
  paymentMethod?: string;
  client?: string;
  provider?: string;
  notes?: string;
  bank_account_id?: string | null;
}

interface Category {
  id: string;
  name: string;
  type: "receita" | "despesa";
  color: string;
}

const CATEGORY_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(210, 70%, 55%)",
  "hsl(280, 60%, 55%)",
  "hsl(30, 80%, 55%)",
  "hsl(170, 60%, 45%)",
];

const paymentMethods = ["Transferência", "Boleto", "Cartão de crédito", "Cartão de débito", "Débito automático", "Pix", "Dinheiro"];
const accountTypes = [
  { value: "corrente", label: "Conta Corrente" },
  { value: "poupanca", label: "Conta Poupança" },
  { value: "investimento", label: "Conta Investimento" },
];

export default function Financas() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { transacoes, isLoading: isLoadingTransacoes, addTransacao, updateTransacao, deleteTransacao, refetch: refetchTransacoes } = useTransacoes();
  const { contas: bankAccounts, addConta, updateConta, updateBalance, deleteConta } = useContasBancarias();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterBank, setFilterBank] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [biPanelOpen, setBiPanelOpen] = useState(false);
  const [biUpgradeOpen, setBiUpgradeOpen] = useState(false);
  const { plan } = usePlan();
  const { isAdmin } = useTeamPermissions();
  const freemium = useFreemiumLimit(transacoes.length);
  const [categories, setCategories] = useState<Category[]>([
    { id: "1", name: "Serviços", type: "receita", color: "hsl(var(--primary))" },
    { id: "2", name: "Produtos", type: "receita", color: "hsl(var(--success))" },
    { id: "3", name: "Consultoria", type: "receita", color: "hsl(var(--warning))" },
    { id: "4", name: "Infraestrutura", type: "despesa", color: "hsl(var(--destructive))" },
    { id: "5", name: "Tecnologia", type: "despesa", color: "hsl(var(--primary))" },
    { id: "6", name: "Marketing", type: "despesa", color: "hsl(var(--success))" },
    { id: "7", name: "RH", type: "despesa", color: "hsl(var(--warning))" },
    { id: "8", name: "Impostos", type: "despesa", color: "hsl(var(--destructive))" },
  ]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ContaBancaria | null>(null);

  // Map DB transacoes to local Transaction type, auto-marking overdue
  const today = new Date().toISOString().split('T')[0];
  const transactions: Transaction[] = useMemo(() => transacoes.map(t => {
    const rawStatus = t.status === 'pago' ? 'pago' : t.status === 'atrasado' ? 'atrasado' : 'pendente';
    const isOverdue = rawStatus === 'pendente' && t.date && t.date < today;
    const finalStatus = isOverdue ? 'atrasado' : rawStatus;

    return {
      id: t.id,
      description: t.description,
      value: t.value,
      date: t.date || new Date().toISOString().split('T')[0],
      category: t.category || 'Outros',
      type: (t.type === 'despesa' ? 'despesa' : 'receita') as 'receita' | 'despesa',
      status: finalStatus as 'pago' | 'pendente' | 'atrasado',
      paymentMethod: t.payment_method || undefined,
      client: t.client || undefined,
      provider: t.provider || undefined,
      notes: t.notes || undefined,
      bank_account_id: t.bank_account_id,
    };
  }), [transacoes, today]);

  // Auto-mark overdue transactions (side effect in useEffect, not render)
  useEffect(() => {
    const overdueIds = transacoes
      .filter(t => t.status === 'pendente' && t.date && t.date < today)
      .map(t => t.id);
    overdueIds.forEach(id => updateTransacao(id, { status: 'atrasado' }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transacoes.length]);

  const handleImportTransactions = () => {
    refetchTransacoes();
  };

  const totalReceita = transactions.filter((t) => t.type === "receita" && t.status === "pago").reduce((sum, t) => sum + t.value, 0);
  const totalDespesa = transactions.filter((t) => t.type === "despesa" && t.status === "pago").reduce((sum, t) => sum + t.value, 0);
  const lucroLiquido = totalReceita - totalDespesa;
  const totalCaixa = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  // Category charts separated by type
  const receitaCategoryData = useMemo(() => {
    const catMap = new Map<string, number>();
    transactions.filter(t => t.type === 'receita').forEach(t => {
      const cat = t.category || 'Outros';
      catMap.set(cat, (catMap.get(cat) || 0) + t.value);
    });
    return Array.from(catMap.entries())
      .filter(([, value]) => value > 0)
      .map(([name, value], idx) => ({
        name,
        value,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }));
  }, [transactions]);

  const despesaCategoryData = useMemo(() => {
    const catMap = new Map<string, number>();
    transactions.filter(t => t.type === 'despesa').forEach(t => {
      const cat = t.category || 'Outros';
      catMap.set(cat, (catMap.get(cat) || 0) + t.value);
    });
    return Array.from(catMap.entries())
      .filter(([, value]) => value > 0)
      .map(([name, value], idx) => ({
        name,
        value,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }));
  }, [transactions]);

  // Build evolution chart from REAL transaction data (last 6 months)
  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const now = new Date();
    const months: { month: string; receitas: number; despesas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthTx = transactions.filter(t => {
        const td = new Date(t.date);
        return td.getMonth() === m && td.getFullYear() === y;
      });
      months.push({
        month: monthNames[m],
        receitas: monthTx.filter(t => t.type === "receita").reduce((s, t) => s + t.value, 0),
        despesas: monthTx.filter(t => t.type === "despesa").reduce((s, t) => s + t.value, 0),
      });
    }
    return months;
  }, [transactions]);

  const handleExport = (format: "pdf" | "csv") => {
    if (format === "csv") {
      const headers = ["Descrição", "Valor", "Data", "Categoria", "Tipo", "Status"];
      const csvContent = [
        headers.join(","),
        ...transactions.map((t) => [t.description, t.value, t.date, t.category, t.type, t.status].join(",")),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `financas_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    } else {
      alert("Exportação em PDF será implementada em breve!");
    }
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransacao(id);
  };

  const handleBulkDelete = async (ids: string[]) => {
    for (const id of ids) {
      await deleteTransacao(id);
    }
    toast({ title: `${ids.length} transação(ões) excluída(s)` });
  };


  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    const oldStatus = tx.status;
    await updateTransacao(id, { status: newStatus });

    // Update bank balance when status changes to/from "pago"
    if (tx.bank_account_id) {
      const account = bankAccounts.find(a => a.id === tx.bank_account_id);
      if (account) {
        let balanceDelta = 0;
        if (oldStatus !== 'pago' && newStatus === 'pago') {
          // Became paid
          balanceDelta = tx.type === 'receita' ? tx.value : -tx.value;
        } else if (oldStatus === 'pago' && newStatus !== 'pago') {
          // Was paid, now unpaid — reverse
          balanceDelta = tx.type === 'receita' ? -tx.value : tx.value;
        }
        if (balanceDelta !== 0) {
          await updateBalance(account.id, account.balance + balanceDelta);
        }
      }
    }

    if (selectedTransaction && selectedTransaction.id === id) {
      setSelectedTransaction({ ...selectedTransaction, status: newStatus as Transaction['status'] });
    }
  };

  const handleAddTransaction = async (input: { description: string; value: number; date?: string; category?: string; type: string; status?: string; payment_method?: string; client?: string; provider?: string; notes?: string; bank_account_id?: string }) => {
    const result = await addTransacao(input);
    // If transaction is created as "pago" and has bank_account_id, update balance
    if (result && input.status === 'pago' && input.bank_account_id) {
      const account = bankAccounts.find(a => a.id === input.bank_account_id);
      if (account) {
        const delta = input.type === 'receita' ? input.value : -input.value;
        await updateBalance(account.id, account.balance + delta);
      }
    }
    return result;
  };

  const handleAddCategory = (name: string, type: "receita" | "despesa") => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name,
      type,
      color: type === "receita" ? "hsl(var(--success))" : "hsl(var(--destructive))",
    };
    setCategories([...categories, newCategory]);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  const handleAddBankAccount = async (account: { name: string; institution: string; type: string; balance: number }) => {
    await addConta(account);
  };

  const handleUpdateBankAccount = async () => {
    if (!editingAccount) return;
    await updateConta(editingAccount.id, {
      name: editingAccount.name,
      institution: editingAccount.institution || undefined,
      type: editingAccount.type,
      balance: editingAccount.balance,
    });
    setEditingAccount(null);
  };

  const handleDeleteBankAccount = async (id: string) => {
    await deleteConta(id);
    setEditingAccount(null);
  };

  const statusStyles = {
    pago: "bg-success/10 text-success",
    pendente: "bg-warning/10 text-warning",
    atrasado: "bg-destructive/10 text-destructive",
  };

  const accountTypeStyles: Record<string, string> = {
    corrente: "bg-primary/10 text-primary",
    poupanca: "bg-warning/10 text-warning",
    investimento: "bg-success/10 text-success",
  };

  const overdueCount = transactions.filter(t => t.status === 'atrasado').length;

  return (
    <MainLayout>
      <PageMeta path="/financas" title="Finanças" description="Controle receitas, despesas e fluxo de caixa da sua operação. Gestão financeira completa." />
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Finanças</h1>
              <p className="text-muted-foreground mt-1">Controle completo do seu fluxo financeiro</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PlanGateButton module="financas" action="create">
              <ImportExtratoDialog
                onImportComplete={handleImportTransactions}
                trigger={
                  <Button variant="outline" className="gap-2">
                    <Receipt className="w-4 h-4" />
                    Importar Extrato
                  </Button>
                }
              />
            </PlanGateButton>
            <PlanGateButton module="financas" action="create">
              <SmartImportFinanceiroDialog
                onImportComplete={handleImportTransactions}
                trigger={
                  <Button variant="outline" className="gap-2 border-primary/40 hover:bg-primary/5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Importar com IA
                  </Button>
                }
              />
            </PlanGateButton>
            <ImportHistoryDialog module="financeiro" />
            <PlanGateButton module="financas" action="export">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card border-border">
                  <DropdownMenuItem onClick={() => handleExport("pdf")}>
                    <FileText className="w-4 h-4 mr-2" /> Exportar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <FileText className="w-4 h-4 mr-2" /> Exportar CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </PlanGateButton>
          </div>
        </div>

        {/* Overdue Alert */}
        {overdueCount > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-foreground">
              Você tem <strong className="text-destructive">{overdueCount}</strong> transaç{overdueCount === 1 ? 'ão atrasada' : 'ões atrasadas'}. Verifique e atualize o status.
            </p>
          </div>
        )}

        {/* Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={TrendingUp} label="Receita Total" value={`R$ ${totalReceita.toLocaleString("pt-BR")}`} variant="success" />
          <StatCard icon={TrendingDown} label="Despesas Totais" value={`R$ ${totalDespesa.toLocaleString("pt-BR")}`} variant="destructive" />
          <StatCard icon={Wallet} label="Lucro Líquido" value={`R$ ${lucroLiquido.toLocaleString("pt-BR")}`} variant={lucroLiquido > 0 ? "success" : "destructive"} />
          <StatCard icon={PiggyBank} label="Total em Caixa" value={`R$ ${totalCaixa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} variant="default" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Evolution Chart */}
          <div className="lg:col-span-2 bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.1)] p-6 transition-all duration-300 hover:shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.15)]">
           <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Evolução Financeira</h3>
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
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorReceitasFin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorDespesasFin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))", 
                      border: "1px solid hsl(var(--border))", 
                      borderRadius: "12px",
                      boxShadow: "0 8px 32px -4px hsl(var(--primary)/0.15)",
                    }} 
                    formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                  />
                  <Legend wrapperStyle={{ paddingTop: "16px" }} />
                  <Area type="monotone" dataKey="receitas" stroke="hsl(var(--success))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReceitasFin)" name="Receitas" />
                  <Area type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDespesasFin)" name="Despesas" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
                <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Adicione transações para visualizar a evolução financeira</p>
              </div>
            )}
          </div>

          {/* Category Charts - Separated */}
          <div className="bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.1)] p-6 transition-all duration-300 hover:shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.15)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Por Categoria</h3>
              <Button variant="ghost" size="sm" onClick={() => setCategoryDialogOpen(true)} className="h-8 w-8 p-0">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
            <Tabs defaultValue="receita-cat" className="space-y-3">
              <TabsList className="bg-muted w-full h-8">
                <TabsTrigger value="receita-cat" className="flex-1 text-xs">Receitas</TabsTrigger>
                <TabsTrigger value="despesa-cat" className="flex-1 text-xs">Despesas</TabsTrigger>
              </TabsList>
              <TabsContent value="receita-cat">
                <CategoryPieChart data={receitaCategoryData} emptyLabel="receitas" />
              </TabsContent>
              <TabsContent value="despesa-cat">
                <CategoryPieChart data={despesaCategoryData} emptyLabel="despesas" />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Receitas e Despesas */}
        <Tabs defaultValue="receitas" className="space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <TabsList className="bg-muted">
              <TabsTrigger value="receitas">Receitas</TabsTrigger>
              <TabsTrigger value="despesas">Despesas</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-64 bg-muted border-border" />
              </div>
            </div>
          </div>

          {(() => {
            const activeFilterCount =
              (filterCategory !== "all" ? 1 : 0) +
              (filterBank !== "all" ? 1 : 0) +
              (filterStatus !== "all" ? 1 : 0) +
              (filterDateFrom ? 1 : 0) +
              (filterDateTo ? 1 : 0);

            const FilterPopover = (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="relative h-10 w-10" title="Filtros">
                    <Filter className="w-4 h-4" />
                    {activeFilterCount > 0 && (
                      <Badge
                        variant="default"
                        className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center rounded-full"
                      >
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[340px] bg-popover border-border p-4" align="end">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-foreground">Filtros</p>
                    {activeFilterCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs text-muted-foreground"
                        onClick={() => {
                          setFilterCategory("all");
                          setFilterBank("all");
                          setFilterStatus("all");
                          setFilterDateFrom("");
                          setFilterDateTo("");
                        }}
                      >
                        <X className="w-3 h-3" /> Limpar
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">De</Label>
                        <Input
                          type="date"
                          value={filterDateFrom}
                          onChange={(e) => setFilterDateFrom(e.target.value)}
                          className="bg-muted border-border h-9"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Até</Label>
                        <Input
                          type="date"
                          value={filterDateTo}
                          onChange={(e) => setFilterDateTo(e.target.value)}
                          className="bg-muted border-border h-9"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Categoria</Label>
                      <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="bg-muted border-border h-9"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="all">Todas as categorias</SelectItem>
                          {Array.from(new Set([...categories.map((c) => c.name), ...transactions.map((t) => t.category)]))
                            .filter(Boolean)
                            .map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Banco</Label>
                      <Select value={filterBank} onValueChange={setFilterBank}>
                        <SelectTrigger className="bg-muted border-border h-9"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="all">Todos os bancos</SelectItem>
                          <SelectItem value="none">Sem banco vinculado</SelectItem>
                          {bankAccounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="bg-muted border-border h-9"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="pago">Pago</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="atrasado">Atrasado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            );

            const filterTransactions = (type: "receita" | "despesa") =>
              transactions.filter(
                (t) =>
                  t.type === type &&
                  (searchTerm === "" || t.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
                  (filterCategory === "all" || t.category === filterCategory) &&
                  (filterBank === "all" || (filterBank === "none" ? !t.bank_account_id : t.bank_account_id === filterBank)) &&
                  (filterStatus === "all" || t.status === filterStatus) &&
                  (!filterDateFrom || t.date >= filterDateFrom) &&
                  (!filterDateTo || t.date <= filterDateTo)
              );

            return (
              <>
                <TabsContent value="receitas" className="space-y-4">
                  <div className="flex justify-end items-center gap-2">
                    {FilterPopover}
                    <PlanGateButton module="financas" action="create">
                      <AddTransactionDialog
                        type="receita"
                        categories={categories.filter((c) => c.type === "receita")}
                        bankAccounts={bankAccounts}
                        onAdd={handleAddTransaction}
                        disabled={freemium.limitReached}
                        onBlocked={() => setUpgradeModalOpen(true)}
                      />
                    </PlanGateButton>
                  </div>
                  <TransactionTable
                    transactions={filterTransactions("receita")}
                    type="receita"
                    bankAccounts={bankAccounts}
                    onSelect={setSelectedTransaction}
                    onDelete={handleDeleteTransaction}
                    onBulkDelete={handleBulkDelete}
                    onUpdateStatus={handleUpdateStatus}
                    statusStyles={statusStyles}
                  />
                </TabsContent>

                <TabsContent value="despesas" className="space-y-4">
                  <div className="flex justify-end items-center gap-2">
                    {FilterPopover}
                    <PlanGateButton module="financas" action="create">
                      <AddTransactionDialog
                        type="despesa"
                        categories={categories.filter((c) => c.type === "despesa")}
                        bankAccounts={bankAccounts}
                        onAdd={handleAddTransaction}
                        disabled={freemium.limitReached}
                        onBlocked={() => setUpgradeModalOpen(true)}
                      />
                    </PlanGateButton>
                  </div>
                  <TransactionTable
                    transactions={filterTransactions("despesa")}
                    type="despesa"
                    bankAccounts={bankAccounts}
                    onSelect={setSelectedTransaction}
                    onDelete={handleDeleteTransaction}
                    onBulkDelete={handleBulkDelete}
                    onUpdateStatus={handleUpdateStatus}
                    statusStyles={statusStyles}
                  />
                </TabsContent>
              </>
            );
          })()}
        </Tabs>

        {/* Contas Bancárias */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Contas Bancárias</h2>
            <PlanGateButton module="financas" action="create">
              <AddBankAccountDialog onAdd={handleAddBankAccount} />
            </PlanGateButton>
          </div>
          {bankAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma conta bancária cadastrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bankAccounts.map((account) => (
                <div 
                  key={account.id} 
                  className="bg-card rounded-xl border border-border/50 shadow-premium p-5 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => setEditingAccount(account)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{account.name}</p>
                        <p className="text-xs text-muted-foreground">{account.institution || '-'}</p>
                      </div>
                    </div>
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <span className={cn("text-xs px-2 py-1 rounded-full font-medium capitalize", accountTypeStyles[account.type] || "bg-muted text-muted-foreground")}>
                      {accountTypes.find((t) => t.value === account.type)?.label || account.type}
                    </span>
                    <p className="text-2xl font-bold text-foreground mt-2">R$ {account.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Bank Account Dialog */}
        <Dialog open={!!editingAccount} onOpenChange={() => setEditingAccount(null)}>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Conta Bancária</DialogTitle>
            </DialogHeader>
            {editingAccount && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nome da Conta</Label>
                  <Input
                    value={editingAccount.name}
                    onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                    className="bg-muted border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instituição</Label>
                  <Input
                    value={editingAccount.institution || ""}
                    onChange={(e) => setEditingAccount({ ...editingAccount, institution: e.target.value })}
                    className="bg-muted border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={editingAccount.type}
                      onValueChange={(v) => setEditingAccount({ ...editingAccount, type: v })}
                    >
                      <SelectTrigger className="bg-muted border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {accountTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Saldo</Label>
                    <Input
                      type="number"
                      value={editingAccount.balance}
                      onChange={(e) => setEditingAccount({ ...editingAccount, balance: parseFloat(e.target.value) || 0 })}
                      className="bg-muted border-border"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="destructive" onClick={() => editingAccount && handleDeleteBankAccount(editingAccount.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setEditingAccount(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateBankAccount}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Controle Mensal */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Controle Mensal</h2>
          <Tabs defaultValue="meses" className="space-y-4">
            <TabsList className="bg-muted">
              <TabsTrigger value="meses">Meses</TabsTrigger>
              <TabsTrigger value="grafico-mensal">Gráfico Mensal</TabsTrigger>
            </TabsList>

            <TabsContent value="meses">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(() => {
                  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                  return meses.map((mes, idx) => {
                    const monthNum = idx + 1;
                    const monthTransactions = transactions.filter((t) => {
                      const d = new Date(t.date);
                      return d.getMonth() + 1 === monthNum;
                    });
                    const recebido = monthTransactions.filter((t) => t.type === "receita").reduce((s, t) => s + t.value, 0);
                    const gasto = monthTransactions.filter((t) => t.type === "despesa").reduce((s, t) => s + t.value, 0);
                    const balanco = recebido - gasto;
                    const hasData = monthTransactions.length > 0;

                    return (
                      <Collapsible key={mes}>
                        <Card className={cn("border-border/50 transition-colors", hasData && "hover:border-primary/30")}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-foreground text-sm">{mes}</h3>
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                !hasData ? "bg-muted text-muted-foreground" :
                                balanco > 0 ? "bg-success/10 text-success" :
                                balanco < 0 ? "bg-destructive/10 text-destructive" :
                                "bg-warning/10 text-warning"
                              )}>
                                {!hasData ? "Sem dados" : balanco > 0 ? "Positivo" : balanco < 0 ? "Negativo" : "Equilíbrio"}
                              </span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Recebido</span>
                                <span className="text-success font-medium">R$ {recebido.toLocaleString("pt-BR")}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Gasto</span>
                                <span className="text-destructive font-medium">R$ {gasto.toLocaleString("pt-BR")}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-border/50">
                                <span className="text-muted-foreground font-medium">Balanço</span>
                                <span className={cn("font-bold", balanco >= 0 ? "text-success" : "text-destructive")}>
                                  R$ {balanco.toLocaleString("pt-BR")}
                                </span>
                              </div>
                            </div>
                            {hasData && (
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-full mt-3 gap-1 text-xs">
                                  <ChevronDown className="w-3 h-3" /> Detalhes
                                </Button>
                              </CollapsibleTrigger>
                            )}
                            <CollapsibleContent>
                              <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5 max-h-40 overflow-y-auto">
                                {monthTransactions.map((t) => (
                                  <div key={t.id} className="flex justify-between text-xs">
                                    <span className="text-muted-foreground truncate mr-2">{t.description}</span>
                                    <span className={cn("font-medium whitespace-nowrap", t.type === "receita" ? "text-success" : "text-destructive")}>
                                      {t.type === "receita" ? "+" : "-"}R$ {t.value.toLocaleString("pt-BR")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </CardContent>
                        </Card>
                      </Collapsible>
                    );
                  });
                })()}
              </div>
            </TabsContent>

            <TabsContent value="grafico-mensal">
              <div className="bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.1)] p-6">
                <h3 className="font-semibold text-foreground mb-6">Receitas vs Despesas por Mês</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={(() => {
                    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                    return meses.map((mes, idx) => {
                      const monthNum = idx + 1;
                      const monthTx = transactions.filter((t) => new Date(t.date).getMonth() + 1 === monthNum);
                      return {
                        month: mes,
                        receitas: monthTx.filter((t) => t.type === "receita").reduce((s, t) => s + t.value, 0),
                        despesas: monthTx.filter((t) => t.type === "despesa").reduce((s, t) => s + t.value, 0),
                      };
                    });
                  })()}>
                    <defs>
                      <linearGradient id="barReceitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.5} />
                      </linearGradient>
                      <linearGradient id="barDespesas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "0 8px 32px -4px hsl(var(--primary)/0.15)",
                      }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                    />
                    <Legend wrapperStyle={{ paddingTop: "16px" }} />
                    <Bar dataKey="receitas" fill="url(#barReceitas)" name="Receitas" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="despesas" fill="url(#barDespesas)" name="Despesas" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Transaction Detail Dialog with Status Change */}
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{selectedTransaction?.type === "receita" ? "Detalhes da Receita" : "Detalhes da Despesa"}</DialogTitle>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Descrição</p>
                    <p className="font-medium text-foreground">{selectedTransaction.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className={cn("font-bold text-lg", selectedTransaction.type === "receita" ? "text-success" : "text-destructive")}>
                      R$ {selectedTransaction.value.toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium text-foreground">{new Date(selectedTransaction.date).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="font-medium text-foreground">{selectedTransaction.category}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Select 
                      value={selectedTransaction.status} 
                      onValueChange={(v) => handleUpdateStatus(selectedTransaction.id, v)}
                    >
                      <SelectTrigger className="bg-muted border-border w-full">
                        <div className="flex items-center gap-2">
                          {selectedTransaction.status === 'pago' && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
                          {selectedTransaction.status === 'pendente' && <Clock className="w-3.5 h-3.5 text-warning" />}
                          {selectedTransaction.status === 'atrasado' && <AlertCircle className="w-3.5 h-3.5 text-destructive" />}
                          <span className="capitalize">{selectedTransaction.status}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="pago">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                            Pago
                          </div>
                        </SelectItem>
                        <SelectItem value="pendente">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-warning" />
                            Pendente
                          </div>
                        </SelectItem>
                        <SelectItem value="atrasado">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                            Atrasado
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                    <p className="font-medium text-foreground">{selectedTransaction.paymentMethod || "-"}</p>
                  </div>
                </div>

                {/* Bank account info */}
                {selectedTransaction.bank_account_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">Conta Bancária</p>
                    <p className="font-medium text-foreground">
                      {bankAccounts.find(a => a.id === selectedTransaction.bank_account_id)?.name || "-"}
                    </p>
                  </div>
                )}

                {selectedTransaction.status === 'atrasado' && (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <p className="text-xs text-foreground">
                      Esta transação está <strong className="text-destructive">atrasada</strong>. A data de vencimento ({new Date(selectedTransaction.date).toLocaleDateString("pt-BR")}) já passou. Atualize o status para "Pago" se já foi quitada.
                    </p>
                  </div>
                )}

                {(selectedTransaction.client || selectedTransaction.provider) && (
                  <div>
                    <p className="text-sm text-muted-foreground">{selectedTransaction.type === "receita" ? "Cliente" : "Fornecedor"}</p>
                    <p className="font-medium text-foreground">{selectedTransaction.client || selectedTransaction.provider}</p>
                  </div>
                )}
                {selectedTransaction.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p className="font-medium text-foreground">{selectedTransaction.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Category Management Dialog */}
        <CategoryDialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} categories={categories} onAdd={handleAddCategory} onDelete={handleDeleteCategory} />
        <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} currentCount={freemium.currentCount} maxCount={freemium.maxCount} moduleName="Financeiro" />
        <UpgradeModal open={biUpgradeOpen} onOpenChange={setBiUpgradeOpen} currentCount={0} maxCount={0} moduleName="Dashboards de BI" />
        <FinanceiroBIPanel open={biPanelOpen} onOpenChange={setBiPanelOpen} transacoes={transacoes} />
      </div>
    </MainLayout>
  );
}

// Category PieChart component
function CategoryPieChart({ data, emptyLabel }: { data: { name: string; value: number; color: string }[]; emptyLabel: string }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground">
        <PiggyBank className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-xs text-center">Sem {emptyLabel} para exibir</p>
      </div>
    );
  }
  return (
    <>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie 
            data={data} 
            cx="50%" 
            cy="50%" 
            innerRadius={45} 
            outerRadius={65} 
            paddingAngle={4} 
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
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
            formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]} 
            labelStyle={{ color: "#ffffff" }}
            itemStyle={{ color: "#ffffff" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-3 space-y-2">
        {data.slice(0, 5).map((cat) => (
          <div key={cat.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="text-muted-foreground">{cat.name}</span>
            </div>
            <span className="text-foreground font-medium">R$ {cat.value.toLocaleString("pt-BR")}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function TransactionTableRows({ transactions, type, bankAccounts, onSelect, onDelete, onUpdateStatus, statusStyles, selectedIds, onToggleSelect }: { transactions: Transaction[]; type: "receita" | "despesa"; bankAccounts: ContaBancaria[]; onSelect: (t: Transaction) => void; onDelete: (id: string) => void; onUpdateStatus: (id: string, status: string) => void; statusStyles: Record<string, string>; selectedIds: Set<string>; onToggleSelect: (id: string) => void }) {
  return (
    <>
      {transactions.map((t) => {
        const checked = selectedIds.has(t.id);
        return (
        <TableRow key={t.id} data-state={checked ? "selected" : undefined} className="border-border/50 cursor-pointer hover:bg-muted/30" onClick={() => onSelect(t)}>
          <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={checked} onCheckedChange={() => onToggleSelect(t.id)} aria-label="Selecionar transação" />
          </TableCell>
          <TableCell>
            <div>
              <p className="font-medium text-foreground">{t.description}</p>
              <p className="text-xs text-muted-foreground">{t.client || t.provider}</p>
            </div>
          </TableCell>
          <TableCell className={cn("font-semibold", type === "receita" ? "text-success" : "text-destructive")}>
            {type === "receita" ? "+" : "-"} R$ {t.value.toLocaleString("pt-BR")}
          </TableCell>
          <TableCell className="text-muted-foreground">{new Date(t.date).toLocaleDateString("pt-BR")}</TableCell>
          <TableCell>
            <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">{t.category}</span>
          </TableCell>
          <TableCell>
            <span className="text-xs text-muted-foreground">
              {t.bank_account_id ? bankAccounts.find(a => a.id === t.bank_account_id)?.name || '-' : '-'}
            </span>
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className={cn("text-xs px-2 py-1 rounded-full font-medium capitalize cursor-pointer hover:opacity-80 transition-opacity", statusStyles[t.status])}>
                  {t.status}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border-border" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onUpdateStatus(t.id, "pago")}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-success" /> Pago
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(t.id, "pendente")}>
                  <Clock className="w-3.5 h-3.5 mr-2 text-warning" /> Pendente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(t.id, "atrasado")}>
                  <AlertCircle className="w-3.5 h-3.5 mr-2 text-destructive" /> Atrasado
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border-border">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(t); }}>
                  <Edit className="w-4 h-4 mr-2" /> Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}>
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        );
      })}
    </>
  );
}

function TransactionTable({ transactions, type, bankAccounts, onSelect, onDelete, onBulkDelete, onUpdateStatus, statusStyles }: { transactions: Transaction[]; type: "receita" | "despesa"; bankAccounts: ContaBancaria[]; onSelect: (t: Transaction) => void; onDelete: (id: string) => void; onBulkDelete: (ids: string[]) => Promise<void> | void; onUpdateStatus: (id: string, status: string) => void; statusStyles: Record<string, string> }) {
  const [showAllDialog, setShowAllDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const PREVIEW_LIMIT = 5;
  const hasMore = transactions.length > PREVIEW_LIMIT;
  const previewItems = hasMore ? transactions.slice(0, PREVIEW_LIMIT) : transactions;

  // Clear selections that no longer exist (after delete or filter change)
  useEffect(() => {
    const valid = new Set(transactions.map(t => t.id));
    setSelectedIds(prev => {
      const next = new Set<string>();
      prev.forEach(id => { if (valid.has(id)) next.add(id); });
      return next.size === prev.size ? prev : next;
    });
  }, [transactions]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (items: Transaction[]) => {
    const ids = items.map(t => t.id);
    const allSelected = ids.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  };

  const handleConfirmBulkDelete = async () => {
    setDeleting(true);
    try {
      await onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const renderHeaderRow = (items: Transaction[]) => {
    const ids = items.map(t => t.id);
    const allSelected = ids.length > 0 && ids.every(id => selectedIds.has(id));
    const someSelected = ids.some(id => selectedIds.has(id)) && !allSelected;
    return (
      <TableRow className="border-border/50 hover:bg-transparent">
        <TableHead className="w-10">
          <Checkbox
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={() => toggleSelectAll(items)}
            aria-label="Selecionar todas"
          />
        </TableHead>
        <TableHead className="text-muted-foreground">Descrição</TableHead>
        <TableHead className="text-muted-foreground">Valor</TableHead>
        <TableHead className="text-muted-foreground">Data</TableHead>
        <TableHead className="text-muted-foreground">Categoria</TableHead>
        <TableHead className="text-muted-foreground">Banco</TableHead>
        <TableHead className="text-muted-foreground">Status</TableHead>
        <TableHead className="text-muted-foreground w-10"></TableHead>
      </TableRow>
    );
  };

  const selectionBar = selectedIds.size > 0 && (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-primary/5 border-b border-border/50">
      <span className="text-sm text-foreground">
        {selectedIds.size} selecionada{selectedIds.size > 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
          Limpar
        </Button>
        <Button variant="destructive" size="sm" className="gap-2" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="w-4 h-4" />
          Excluir selecionadas
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-card rounded-xl border border-border/50 shadow-premium overflow-hidden">
        {selectionBar}
        <Table>
          <TableHeader>{renderHeaderRow(previewItems)}</TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhuma {type === "receita" ? "receita" : "despesa"} registrada
                </TableCell>
              </TableRow>
            ) : (
              <TransactionTableRows transactions={previewItems} type={type} bankAccounts={bankAccounts} onSelect={onSelect} onDelete={onDelete} onUpdateStatus={onUpdateStatus} statusStyles={statusStyles} selectedIds={selectedIds} onToggleSelect={toggleSelect} />
            )}
          </TableBody>
        </Table>
        {hasMore && (
          <div className="flex justify-center py-3 border-t border-border/50">
            <Button variant="ghost" size="sm" className="gap-2 text-primary hover:text-primary" onClick={() => setShowAllDialog(true)}>
              Ver mais ({transactions.length - PREVIEW_LIMIT} restantes)
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showAllDialog} onOpenChange={setShowAllDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Todas as {type === "receita" ? "Receitas" : "Despesas"} ({transactions.length})
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden rounded-lg border border-border/50">
            {selectionBar}
            <Table>
              <TableHeader>{renderHeaderRow(transactions)}</TableHeader>
              <TableBody>
                <TransactionTableRows transactions={transactions} type={type} bankAccounts={bankAccounts} onSelect={onSelect} onDelete={onDelete} onUpdateStatus={onUpdateStatus} statusStyles={statusStyles} selectedIds={selectedIds} onToggleSelect={toggleSelect} />
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir {selectedIds.size} transação(ões)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. As transações selecionadas serão removidas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); handleConfirmBulkDelete(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AddTransactionDialog({ type, categories, bankAccounts, onAdd, disabled, onBlocked }: { type: "receita" | "despesa"; categories: Category[]; bankAccounts: ContaBancaria[]; onAdd: (input: { description: string; value: number; date?: string; category?: string; type: string; status?: string; payment_method?: string; client?: string; provider?: string; notes?: string; bank_account_id?: string }) => Promise<unknown>; disabled?: boolean; onBlocked?: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: "", value: "", date: "", category: "", paymentMethod: "", entity: "", notes: "", bankAccountId: "" });

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && disabled) {
      onBlocked?.();
      return;
    }
    setOpen(newOpen);
  };

  const handleSubmit = async () => {
    if (!form.description || !form.value || !form.date) return;
    await onAdd({
      description: form.description,
      value: parseFloat(form.value),
      date: form.date,
      category: form.category || "Outros",
      type,
      status: "pendente",
      payment_method: form.paymentMethod || undefined,
      notes: form.notes || undefined,
      bank_account_id: form.bankAccountId || undefined,
      ...(type === "receita" ? { client: form.entity || undefined } : { provider: form.entity || undefined }),
    });
    setForm({ description: "", value: "", date: "", category: "", paymentMethod: "", entity: "", notes: "", bankAccountId: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova {type === "receita" ? "Receita" : "Despesa"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{type === "receita" ? "Nova Receita" : "Nova Despesa"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Projeto Website" className="bg-muted border-border" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0,00" className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-muted border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {categories.map((cat) => (<SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {paymentMethods.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{type === "receita" ? "Cliente" : "Fornecedor"}</Label>
              <Input value={form.entity} onChange={(e) => setForm({ ...form, entity: e.target.value })} placeholder={type === "receita" ? "Nome do cliente" : "Nome do fornecedor"} className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label>Conta Bancária</Label>
              <Select value={form.bankAccountId} onValueChange={(v) => setForm({ ...form, bankAccountId: v })}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {bankAccounts.map((acc) => (<SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>))}
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

function AddBankAccountDialog({ onAdd }: { onAdd: (account: { name: string; institution: string; type: string; balance: number }) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", institution: "", type: "corrente", balance: "" });

  const handleSubmit = () => {
    if (!form.name) return;
    onAdd({ name: form.name, institution: form.institution, type: form.type, balance: parseFloat(form.balance) || 0 });
    setForm({ name: "", institution: "", type: "corrente", balance: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="w-4 h-4" />Novo Banco</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-card border-border">
        <DialogHeader><DialogTitle className="text-foreground">Novo Banco</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome da Conta</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Conta Principal" className="bg-muted border-border" />
          </div>
          <div className="space-y-2">
            <Label>Instituição</Label>
            <Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="Ex: Banco Itaú" className="bg-muted border-border" />
          </div>
          <div className="space-y-2">
            <Label>Tipo de Conta</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {accountTypes.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Saldo Atual</Label>
            <Input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} placeholder="0,00" className="bg-muted border-border" />
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

function CategoryDialog({ open, onOpenChange, categories, onAdd, onDelete }: { open: boolean; onOpenChange: (open: boolean) => void; categories: Category[]; onAdd: (name: string, type: "receita" | "despesa") => void; onDelete: (id: string) => void }) {
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"receita" | "despesa">("receita");

  const handleAdd = () => {
    if (!newCatName) return;
    onAdd(newCatName, newCatType);
    setNewCatName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader><DialogTitle className="text-foreground">Gerenciar Categorias</DialogTitle></DialogHeader>
        <Tabs defaultValue="receita" className="space-y-4">
          <TabsList className="bg-muted w-full">
            <TabsTrigger value="receita" className="flex-1">Receitas</TabsTrigger>
            <TabsTrigger value="despesa" className="flex-1">Despesas</TabsTrigger>
          </TabsList>
          <TabsContent value="receita" className="space-y-3">
            {categories.filter((c) => c.type === "receita").map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-foreground">{c.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(c.id)}><X className="w-4 h-4" /></Button>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="despesa" className="space-y-3">
            {categories.filter((c) => c.type === "despesa").map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-foreground">{c.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(c.id)}><X className="w-4 h-4" /></Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Nome da categoria" className="bg-muted border-border flex-1" />
          <Select value={newCatType} onValueChange={(v: "receita" | "despesa") => setNewCatType(v)}>
            <SelectTrigger className="bg-muted border-border w-32"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="despesa">Despesa</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAdd}><Plus className="w-4 h-4" /></Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
