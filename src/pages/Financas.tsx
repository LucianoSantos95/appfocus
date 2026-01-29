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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  Search,
  Filter,
  Download,
  ArrowLeft,
  MoreHorizontal,
  Building2,
  CreditCard,
} from "lucide-react";
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
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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
}

interface BankAccount {
  id: string;
  name: string;
  institution: string;
  type: string;
  balance: number;
  currency: string;
}

// Mock Data
const mockTransactions: Transaction[] = [
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

const mockBankAccounts: BankAccount[] = [
  {
    id: "1",
    name: "Conta Principal",
    institution: "Banco Itaú",
    type: "Conta Corrente",
    balance: 45680.50,
    currency: "BRL",
  },
  {
    id: "2",
    name: "Reserva",
    institution: "Nubank",
    type: "Conta Poupança",
    balance: 12500.00,
    currency: "BRL",
  },
  {
    id: "3",
    name: "Operacional",
    institution: "Banco do Brasil",
    type: "Conta Corrente",
    balance: 8750.00,
    currency: "BRL",
  },
];

const chartData = [
  { month: "Set", receitas: 42000, despesas: 28000 },
  { month: "Out", receitas: 38000, despesas: 25000 },
  { month: "Nov", receitas: 55000, despesas: 32000 },
  { month: "Dez", receitas: 48000, despesas: 30000 },
  { month: "Jan", receitas: 48500, despesas: 7500 },
];

const categoryData = [
  { name: "Serviços", value: 48500, color: "hsl(var(--primary))" },
  { name: "Infraestrutura", value: 3500, color: "hsl(var(--destructive))" },
  { name: "Tecnologia", value: 1200, color: "hsl(var(--warning))" },
  { name: "Marketing", value: 2800, color: "hsl(var(--success))" },
];

const categories = [
  "Serviços",
  "Produtos",
  "Infraestrutura",
  "Tecnologia",
  "Marketing",
  "RH",
  "Impostos",
  "Outros",
];

const paymentMethods = [
  "Transferência",
  "Boleto",
  "Cartão de crédito",
  "Cartão de débito",
  "Débito automático",
  "Pix",
  "Dinheiro",
];

// Components
function FinanceOverview({ transactions }: { transactions: Transaction[] }) {
  const totalReceita = transactions
    .filter((t) => t.type === "receita" && t.status === "pago")
    .reduce((sum, t) => sum + t.value, 0);

  const totalDespesa = transactions
    .filter((t) => t.type === "despesa" && t.status === "pago")
    .reduce((sum, t) => sum + t.value, 0);

  const lucroLiquido = totalReceita - totalDespesa;

  const totalCaixa = mockBankAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={TrendingUp}
        label="Receita Total"
        value={`R$ ${totalReceita.toLocaleString("pt-BR")}`}
        variant="success"
      />
      <StatCard
        icon={TrendingDown}
        label="Despesas Totais"
        value={`R$ ${totalDespesa.toLocaleString("pt-BR")}`}
        variant="destructive"
      />
      <StatCard
        icon={Wallet}
        label="Lucro Líquido"
        value={`R$ ${lucroLiquido.toLocaleString("pt-BR")}`}
        trend={{ value: 12.5, isPositive: lucroLiquido > 0 }}
        variant={lucroLiquido > 0 ? "success" : "destructive"}
      />
      <StatCard
        icon={PiggyBank}
        label="Total em Caixa"
        value={`R$ ${totalCaixa.toLocaleString("pt-BR")}`}
        variant="default"
      />
    </div>
  );
}

function FinanceCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Evolução Financeira */}
      <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 shadow-premium p-6">
        <h3 className="font-semibold text-foreground mb-4">Evolução Financeira</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="receitas"
              stroke="hsl(var(--success))"
              fillOpacity={1}
              fill="url(#colorReceitas)"
              name="Receitas"
            />
            <Area
              type="monotone"
              dataKey="despesas"
              stroke="hsl(var(--destructive))"
              fillOpacity={1}
              fill="url(#colorDespesas)"
              name="Despesas"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Distribuição por Categoria */}
      <div className="bg-card rounded-xl border border-border/50 shadow-premium p-6">
        <h3 className="font-semibold text-foreground mb-4">Por Categoria</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {categoryData.map((cat) => (
            <div key={cat.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-muted-foreground">{cat.name}</span>
              </div>
              <span className="text-foreground font-medium">R$ {cat.value.toLocaleString("pt-BR")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TransactionTable({
  transactions,
  type,
}: {
  transactions: Transaction[];
  type: "receita" | "despesa";
}) {
  const filtered = transactions.filter((t) => t.type === type);

  const statusStyles = {
    pago: "bg-success/10 text-success",
    pendente: "bg-warning/10 text-warning",
    atrasado: "bg-destructive/10 text-destructive",
  };

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
          {filtered.map((t) => (
            <TableRow key={t.id} className="border-border/50">
              <TableCell>
                <div>
                  <p className="font-medium text-foreground">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.client || t.provider}
                  </p>
                </div>
              </TableCell>
              <TableCell
                className={cn(
                  "font-semibold",
                  type === "receita" ? "text-success" : "text-destructive"
                )}
              >
                {type === "receita" ? "+" : "-"} R${" "}
                {t.value.toLocaleString("pt-BR")}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(t.date).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell>
                <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                  {t.category}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium capitalize",
                    statusStyles[t.status]
                  )}
                >
                  {t.status}
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
  );
}

function BankAccountsSection({ accounts }: { accounts: BankAccount[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="bg-card rounded-xl border border-border/50 shadow-premium p-5"
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
            <p className="text-xs text-muted-foreground mb-1">{account.type}</p>
            <p className="text-2xl font-bold text-foreground">
              R$ {account.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AddTransactionDialog({ 
  type, 
  onAdd 
}: { 
  type: "receita" | "despesa";
  onAdd: (transaction: Transaction) => void;
}) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    value: "",
    date: "",
    category: "",
    paymentMethod: "",
    entity: "",
    receipt: "",
  });

  const handleSubmit = () => {
    if (!formData.description || !formData.value || !formData.date) return;
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      description: formData.description,
      value: parseFloat(formData.value),
      date: formData.date,
      category: formData.category || "Outros",
      type,
      status: "pendente",
      paymentMethod: formData.paymentMethod,
      ...(type === "receita" ? { client: formData.entity } : { provider: formData.entity }),
    };
    
    onAdd(transaction);
    setFormData({ description: "", value: "", date: "", category: "", paymentMethod: "", entity: "", receipt: "" });
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
          <DialogTitle className="text-foreground">
            {type === "receita" ? "Nova Receita" : "Nova Despesa"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input 
              id="description" 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Projeto Website" 
              className="bg-muted border-border" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valor</Label>
              <Input 
                id="value" 
                type="number" 
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="0,00" 
                className="bg-muted border-border" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input 
                id="date" 
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-muted border-border" 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="entity">
              {type === "receita" ? "Cliente" : "Fornecedor"}
            </Label>
            <Input
              id="entity"
              value={formData.entity}
              onChange={(e) => setFormData({ ...formData, entity: e.target.value })}
              placeholder={type === "receita" ? "Nome do cliente" : "Nome do fornecedor"}
              className="bg-muted border-border"
            />
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

export default function Financas() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);

  const handleAddTransaction = (transaction: Transaction) => {
    setTransactions([transaction, ...transactions]);
  };

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
              <h1 className="text-2xl font-bold text-foreground">Finanças</h1>
              <p className="text-muted-foreground mt-1">
                Controle completo do seu fluxo financeiro
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Overview */}
        <FinanceOverview transactions={transactions} />

        {/* Charts */}
        <FinanceCharts />

        {/* Tabs */}
        <Tabs defaultValue="receitas" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted">
              <TabsTrigger value="receitas">Receitas</TabsTrigger>
              <TabsTrigger value="despesas">Despesas</TabsTrigger>
              <TabsTrigger value="contas">Contas Bancárias</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64 bg-muted border-border"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="receitas" className="space-y-4">
            <div className="flex justify-end">
              <AddTransactionDialog type="receita" onAdd={handleAddTransaction} />
            </div>
            <TransactionTable transactions={transactions} type="receita" />
          </TabsContent>

          <TabsContent value="despesas" className="space-y-4">
            <div className="flex justify-end">
              <AddTransactionDialog type="despesa" onAdd={handleAddTransaction} />
            </div>
            <TransactionTable transactions={transactions} type="despesa" />
          </TabsContent>

          <TabsContent value="contas" className="space-y-4">
            <BankAccountsSection accounts={mockBankAccounts} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
