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
} from "lucide-react";
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
import { importConfigs } from "@/lib/import-configs";
import { useToast } from "@/hooks/use-toast";
import { useTransacoes } from "@/hooks/useTransacoes";

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
}

// Local-only types
interface BankAccount {
  id: string;
  name: string;
  institution: string;
  type: "principal" | "operacional" | "reserva";
  balance: number;
}

interface BankAccount {
  id: string;
  name: string;
  institution: string;
  type: "principal" | "operacional" | "reserva";
  balance: number;
}

interface Category {
  id: string;
  name: string;
  type: "receita" | "despesa";
  color: string;
}

// Mock Data
const initialTransactions: Transaction[] = [
  {
    id: "1",
    description: "Projeto Website E-commerce",
    value: 15000,
    date: "2025-01-28",
    category: "Serviços",
    type: "receita",
    status: "pago",
    paymentMethod: "Transferência",
    client: "Tech Solutions",
    notes: "Projeto concluído com sucesso",
  },
  {
    id: "2",
    description: "Aluguel escritório",
    value: 3500,
    date: "2025-01-25",
    category: "Infraestrutura",
    type: "despesa",
    status: "pago",
    paymentMethod: "Débito automático",
    provider: "Imobiliária Central",
  },
  {
    id: "3",
    description: "Consultoria mensal",
    value: 8500,
    date: "2025-01-22",
    category: "Serviços",
    type: "receita",
    status: "pago",
    paymentMethod: "Boleto",
    client: "Grupo ABC",
  },
  {
    id: "4",
    description: "Software e ferramentas",
    value: 1200,
    date: "2025-01-20",
    category: "Tecnologia",
    type: "despesa",
    status: "pago",
    paymentMethod: "Cartão de crédito",
  },
  {
    id: "5",
    description: "Marketing digital",
    value: 2800,
    date: "2025-01-18",
    category: "Marketing",
    type: "despesa",
    status: "pendente",
    paymentMethod: "Boleto",
    provider: "Agência XYZ",
  },
  {
    id: "6",
    description: "Projeto App Mobile",
    value: 25000,
    date: "2025-01-15",
    category: "Serviços",
    type: "receita",
    status: "pendente",
    paymentMethod: "Transferência",
    client: "StartupCo",
  },
];

const initialBankAccounts: BankAccount[] = [
  { id: "1", name: "Conta Principal", institution: "Banco Itaú", type: "principal", balance: 45680.5 },
  { id: "2", name: "Reserva", institution: "Nubank", type: "reserva", balance: 12500.0 },
  { id: "3", name: "Operacional", institution: "Banco do Brasil", type: "operacional", balance: 8750.0 },
];

const initialCategories: Category[] = [
  { id: "1", name: "Serviços", type: "receita", color: "hsl(var(--primary))" },
  { id: "2", name: "Produtos", type: "receita", color: "hsl(var(--success))" },
  { id: "3", name: "Consultoria", type: "receita", color: "hsl(var(--warning))" },
  { id: "4", name: "Infraestrutura", type: "despesa", color: "hsl(var(--destructive))" },
  { id: "5", name: "Tecnologia", type: "despesa", color: "hsl(var(--primary))" },
  { id: "6", name: "Marketing", type: "despesa", color: "hsl(var(--success))" },
  { id: "7", name: "RH", type: "despesa", color: "hsl(var(--warning))" },
  { id: "8", name: "Impostos", type: "despesa", color: "hsl(var(--destructive))" },
];

const chartData = [
  { month: "Set", receitas: 42000, despesas: 28000 },
  { month: "Out", receitas: 38000, despesas: 25000 },
  { month: "Nov", receitas: 55000, despesas: 32000 },
  { month: "Dez", receitas: 48000, despesas: 30000 },
  { month: "Jan", receitas: 48500, despesas: 7500 },
];

const paymentMethods = ["Transferência", "Boleto", "Cartão de crédito", "Cartão de débito", "Débito automático", "Pix", "Dinheiro"];
const accountTypes = [
  { value: "principal", label: "Conta Principal" },
  { value: "operacional", label: "Conta Operacional" },
  { value: "reserva", label: "Conta Reserva" },
];

export default function Financas() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { transacoes, isLoading: isLoadingTransacoes, deleteTransacao, refetch: refetchTransacoes } = useTransacoes();
  const [searchTerm, setSearchTerm] = useState("");
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialBankAccounts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  // Map DB transacoes to local Transaction type
  const transactions: Transaction[] = transacoes.map(t => ({
    id: t.id,
    description: t.description,
    value: t.value,
    date: t.date || new Date().toISOString().split('T')[0],
    category: t.category || 'Outros',
    type: (t.type === 'despesa' ? 'despesa' : 'receita') as 'receita' | 'despesa',
    status: (t.status === 'pago' ? 'pago' : t.status === 'atrasado' ? 'atrasado' : 'pendente') as 'pago' | 'pendente' | 'atrasado',
    paymentMethod: t.payment_method || undefined,
    client: t.client || undefined,
    provider: t.provider || undefined,
    notes: t.notes || undefined,
  }));

  const handleImportTransactions = () => {
    refetchTransacoes();
  };

  const totalReceita = transactions.filter((t) => t.type === "receita" && t.status === "pago").reduce((sum, t) => sum + t.value, 0);
  const totalDespesa = transactions.filter((t) => t.type === "despesa" && t.status === "pago").reduce((sum, t) => sum + t.value, 0);
  const lucroLiquido = totalReceita - totalDespesa;
  const totalCaixa = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  const categoryData = categories
    .filter((c) => c.type === "despesa")
    .map((c) => ({
      name: c.name,
      value: transactions.filter((t) => t.category === c.name && t.type === "despesa").reduce((sum, t) => sum + t.value, 0),
      color: c.color,
    }))
    .filter((c) => c.value > 0);

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

  const handleAddBankAccount = (account: Omit<BankAccount, "id">) => {
    setBankAccounts([...bankAccounts, { ...account, id: Date.now().toString() }]);
  };

  const handleUpdateBankAccount = () => {
    if (!editingAccount) return;
    setBankAccounts(bankAccounts.map((acc) => 
      acc.id === editingAccount.id ? editingAccount : acc
    ));
    setEditingAccount(null);
  };

  const handleDeleteBankAccount = (id: string) => {
    setBankAccounts(bankAccounts.filter((acc) => acc.id !== id));
    setEditingAccount(null);
  };

  const statusStyles = {
    pago: "bg-success/10 text-success",
    pendente: "bg-warning/10 text-warning",
    atrasado: "bg-destructive/10 text-destructive",
  };

  const accountTypeStyles = {
    principal: "bg-primary/10 text-primary",
    operacional: "bg-warning/10 text-warning",
    reserva: "bg-success/10 text-success",
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
              <h1 className="text-2xl font-bold text-foreground">Finanças</h1>
              <p className="text-muted-foreground mt-1">Controle completo do seu fluxo financeiro</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ImportDialog
              config={importConfigs.financas_transacoes}
              onImportComplete={handleImportTransactions}
              trigger={
                <Button variant="outline" className="gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Importar Planilha
                </Button>
              }
            />
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
          </div>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={TrendingUp} label="Receita Total" value={`R$ ${totalReceita.toLocaleString("pt-BR")}`} variant="success" />
          <StatCard icon={TrendingDown} label="Despesas Totais" value={`R$ ${totalDespesa.toLocaleString("pt-BR")}`} variant="destructive" />
          <StatCard icon={Wallet} label="Lucro Líquido" value={`R$ ${lucroLiquido.toLocaleString("pt-BR")}`} variant={lucroLiquido > 0 ? "success" : "destructive"} />
          <StatCard icon={PiggyBank} label="Total em Caixa" value={`R$ ${totalCaixa.toLocaleString("pt-BR")}`} variant="default" />
        </div>

        {/* Charts - Modern Style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.1)] p-6 transition-all duration-300 hover:shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.15)]">
            <h3 className="font-semibold text-foreground mb-6">Evolução Financeira</h3>
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
                />
                <Legend wrapperStyle={{ paddingTop: "16px" }} />
                <Area type="monotone" dataKey="receitas" stroke="hsl(var(--success))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReceitasFin)" name="Receitas" />
                <Area type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDespesasFin)" name="Despesas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Chart with Dialog */}
          <div className="bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.1)] p-6 transition-all duration-300 hover:shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.15)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Por Categoria</h3>
              <Button variant="ghost" size="sm" onClick={() => setCategoryDialogOpen(true)} className="h-8 w-8 p-0">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <defs>
                  <filter id="pieGlowFin">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <Pie 
                  data={categoryData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={55} 
                  outerRadius={78} 
                  paddingAngle={4} 
                  dataKey="value"
                  strokeWidth={0}
                  filter="url(#pieGlowFin)"
                >
                  {categoryData.map((entry, index) => (
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
                  formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-5 space-y-2.5">
              {categoryData.slice(0, 4).map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}50` }} />
                    <span className="text-muted-foreground">{cat.name}</span>
                  </div>
                  <span className="text-foreground font-medium">R$ {cat.value.toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Receitas e Despesas */}
        <Tabs defaultValue="receitas" className="space-y-6">
          <div className="flex items-center justify-between">
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

          <TabsContent value="receitas" className="space-y-4">
            <div className="flex justify-end">
              <AddTransactionDialog type="receita" categories={categories.filter((c) => c.type === "receita")} onAdd={() => refetchTransacoes()} />
            </div>
            <TransactionTable transactions={transactions.filter((t) => t.type === "receita")} type="receita" onSelect={setSelectedTransaction} onDelete={handleDeleteTransaction} statusStyles={statusStyles} />
          </TabsContent>

          <TabsContent value="despesas" className="space-y-4">
            <div className="flex justify-end">
              <AddTransactionDialog type="despesa" categories={categories.filter((c) => c.type === "despesa")} onAdd={() => refetchTransacoes()} />
            </div>
            <TransactionTable transactions={transactions.filter((t) => t.type === "despesa")} type="despesa" onSelect={setSelectedTransaction} onDelete={handleDeleteTransaction} statusStyles={statusStyles} />
          </TabsContent>
        </Tabs>

        {/* Contas Bancárias */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Contas Bancárias</h2>
            <AddBankAccountDialog onAdd={handleAddBankAccount} />
          </div>
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
                      <p className="text-xs text-muted-foreground">{account.institution}</p>
                    </div>
                  </div>
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium capitalize", accountTypeStyles[account.type])}>
                    {accountTypes.find((t) => t.value === account.type)?.label}
                  </span>
                  <p className="text-2xl font-bold text-foreground mt-2">R$ {account.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
          </div>
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
                    value={editingAccount.institution}
                    onChange={(e) => setEditingAccount({ ...editingAccount, institution: e.target.value })}
                    className="bg-muted border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={editingAccount.type}
                      onValueChange={(v: "principal" | "operacional" | "reserva") => setEditingAccount({ ...editingAccount, type: v })}
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

        {/* Transaction Detail Dialog */}
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
                    <p className="text-sm text-muted-foreground">Status</p>
                    <span className={cn("text-xs px-2 py-1 rounded-full font-medium capitalize", statusStyles[selectedTransaction.status])}>{selectedTransaction.status}</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                    <p className="font-medium text-foreground">{selectedTransaction.paymentMethod || "-"}</p>
                  </div>
                </div>
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
      </div>
    </MainLayout>
  );
}

function TransactionTable({ transactions, type, onSelect, onDelete, statusStyles }: { transactions: Transaction[]; type: "receita" | "despesa"; onSelect: (t: Transaction) => void; onDelete: (id: string) => void; statusStyles: Record<string, string> }) {
  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-premium overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-muted-foreground">Descrição</TableHead>
            <TableHead className="text-muted-foreground">Valor</TableHead>
            <TableHead className="text-muted-foreground">Data</TableHead>
            <TableHead className="text-muted-foreground">Categoria</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-muted-foreground w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id} className="border-border/50 cursor-pointer hover:bg-muted/30" onClick={() => onSelect(t)}>
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
                <span className={cn("text-xs px-2 py-1 rounded-full font-medium capitalize", statusStyles[t.status])}>{t.status}</span>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AddTransactionDialog({ type, categories, onAdd }: { type: "receita" | "despesa"; categories: Category[]; onAdd: (t: Transaction) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: "", value: "", date: "", category: "", paymentMethod: "", entity: "", notes: "" });

  const handleSubmit = () => {
    if (!form.description || !form.value || !form.date) return;
    const transaction: Transaction = {
      id: Date.now().toString(),
      description: form.description,
      value: parseFloat(form.value),
      date: form.date,
      category: form.category || "Outros",
      type,
      status: "pendente",
      paymentMethod: form.paymentMethod,
      notes: form.notes,
      ...(type === "receita" ? { client: form.entity } : { provider: form.entity }),
    };
    onAdd(transaction);
    setForm({ description: "", value: "", date: "", category: "", paymentMethod: "", entity: "", notes: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <div className="space-y-2">
            <Label>{type === "receita" ? "Cliente" : "Fornecedor"}</Label>
            <Input value={form.entity} onChange={(e) => setForm({ ...form, entity: e.target.value })} placeholder={type === "receita" ? "Nome do cliente" : "Nome do fornecedor"} className="bg-muted border-border" />
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

function AddBankAccountDialog({ onAdd }: { onAdd: (account: Omit<BankAccount, "id">) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", institution: "", type: "principal" as BankAccount["type"], balance: "" });

  const handleSubmit = () => {
    if (!form.name || !form.institution) return;
    onAdd({ name: form.name, institution: form.institution, type: form.type, balance: parseFloat(form.balance) || 0 });
    setForm({ name: "", institution: "", type: "principal", balance: "" });
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
            <Select value={form.type} onValueChange={(v: BankAccount["type"]) => setForm({ ...form, type: v })}>
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
