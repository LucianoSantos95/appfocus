import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Percent, ChevronLeft, ChevronRight, AlertTriangle, Receipt, Wallet, CheckCircle2, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Transacao {
  date: string | null;
  type: string;
  value: number;
  status: string;
  category?: string | null;
}

interface FinanceiroBIPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transacoes: Transacao[];
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  boxShadow: "0 8px 32px -4px hsl(var(--primary)/0.15)",
  color: "#ffffff",
};

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function FinanceiroBIPanel({ open, onOpenChange, transacoes }: FinanceiroBIPanelProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11

  const monthlyData = useMemo(() => {
    return monthLabels.map((label, i) => {
      const key = `${selectedYear}-${String(i + 1).padStart(2, "0")}`;
      let receitas = 0;
      let despesas = 0;
      transacoes.forEach((t) => {
        if (!t.date) return;
        if (t.date.substring(0, 7) === key) {
          if (t.type === "receita") receitas += Number(t.value);
          else despesas += Number(t.value);
        }
      });
      const yy = String(selectedYear).slice(-2);
      return {
        month: `${label} de ${yy}`,
        receitas,
        despesas,
        lucro: receitas - despesas,
        margem: receitas > 0 ? Math.round(((receitas - despesas) / receitas) * 100) : 0,
      };
    });
  }, [transacoes, selectedYear]);

  const projection = useMemo(() => {
    const last6 = monthlyData.filter(m => m.receitas > 0 || m.despesas > 0).slice(-6);
    const avgRec = last6.reduce((s, m) => s + m.receitas, 0) / Math.max(last6.length, 1);
    const avgDesp = last6.reduce((s, m) => s + m.despesas, 0) / Math.max(last6.length, 1);

    const result = monthlyData.map((m) => ({ ...m, recProj: undefined as number | undefined, despProj: undefined as number | undefined }));

    const nextYear = selectedYear + 1;
    for (let i = 0; i < 3; i++) {
      const yy = String(nextYear).slice(-2);
      result.push({
        month: `${monthLabels[i]} de ${yy}`,
        receitas: 0,
        despesas: 0,
        lucro: 0,
        margem: 0,
        recProj: Math.round(avgRec),
        despProj: Math.round(avgDesp),
      });
    }
    return result;
  }, [monthlyData, selectedYear]);

  const totals = useMemo(() => {
    const rec = monthlyData.reduce((s, m) => s + m.receitas, 0);
    const desp = monthlyData.reduce((s, m) => s + m.despesas, 0);
    const recCount = transacoes.filter(t => t.type === "receita" && t.date?.startsWith(String(selectedYear))).length;
    return { rec, desp, lucro: rec - desp, margem: rec > 0 ? Math.round(((rec - desp) / rec) * 100) : 0, ticketMedio: recCount > 0 ? Math.round(rec / recCount) : 0 };
  }, [monthlyData, transacoes, selectedYear]);

  // DRE - categorias dinâmicas
  const dre = useMemo(() => {
    const yearTxns = transacoes.filter(t => t.date?.startsWith(String(selectedYear)));
    const receitaBruta = yearTxns.filter(t => t.type === "receita").reduce((s, t) => s + Number(t.value), 0);
    const totalDespesas = yearTxns.filter(t => t.type === "despesa").reduce((s, t) => s + Number(t.value), 0);
    const lucroLiq = receitaBruta - totalDespesas;
    return { receitaBruta, totalDespesas, lucroLiq };
  }, [transacoes, selectedYear]);

  // Top 5 categorias de despesa
  const topCategorias = useMemo(() => {
    const map: Record<string, number> = {};
    transacoes.filter(t => t.type === "despesa" && t.date?.startsWith(String(selectedYear))).forEach(t => {
      const cat = t.category || "Outros";
      map[cat] = (map[cat] || 0) + Number(t.value);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [transacoes, selectedYear]);

  // Inadimplência
  const inadimplencia = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const atrasadas = transacoes.filter(t => t.type === "receita" && t.status === "pendente" && t.date && t.date < today);
    const totalAtrasado = atrasadas.reduce((s, t) => s + Number(t.value), 0);
    const pct = totals.rec > 0 ? Math.round((totalAtrasado / totals.rec) * 100) : 0;
    return { total: totalAtrasado, pct, count: atrasadas.length };
  }, [transacoes, totals.rec]);

  // Detalhamento do mês selecionado
  const monthDetail = useMemo(() => {
    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    const monthStart = `${monthKey}-01`;

    // Saldo Inicial: receitas pagas − despesas pagas de TODOS os meses anteriores ao mês selecionado
    const saldoInicial = transacoes
      .filter(t => t.status === "pago" && t.date && t.date < monthStart)
      .reduce((s, t) => s + (t.type === "receita" ? Number(t.value) : -Number(t.value)), 0);

    const monthTxns = transacoes.filter(t => t.date?.startsWith(monthKey));

    const recPagas = monthTxns.filter(t => t.type === "receita" && t.status === "pago").reduce((s, t) => s + Number(t.value), 0);
    const despPagas = monthTxns.filter(t => t.type === "despesa" && t.status === "pago").reduce((s, t) => s + Number(t.value), 0);
    const liquidoMes = recPagas - despPagas;
    const saldoAtual = saldoInicial + liquidoMes;

    const recPendentes = monthTxns.filter(t => t.type === "receita" && t.status === "pendente").reduce((s, t) => s + Number(t.value), 0);
    const despPendentes = monthTxns.filter(t => t.type === "despesa" && t.status === "pendente").reduce((s, t) => s + Number(t.value), 0);

    const pendentes = monthTxns
      .filter(t => t.status === "pendente")
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

    return {
      saldoInicial,
      recPagas,
      despPagas,
      liquidoMes,
      saldoAtual,
      recPendentes,
      despPendentes,
      saldoPendente: recPendentes - despPendentes,
      pendentes,
    };
  }, [transacoes, selectedYear, selectedMonth]);

  const monthLabel = `${monthLabels[selectedMonth]} ${selectedYear}`;
  const fmt = (v: number) => `R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };
  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>Análise Financeira Detalhada</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedYear(y => y - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-base font-semibold min-w-[50px] text-center">{selectedYear}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedYear(y => y + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receita ({selectedYear})</p>
              <p className="text-lg font-bold text-foreground">R$ {totals.rec.toLocaleString("pt-BR")}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Despesas ({selectedYear})</p>
              <p className="text-lg font-bold text-foreground">R$ {totals.desp.toLocaleString("pt-BR")}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Percent className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Margem de Lucro</p>
              <p className="text-lg font-bold text-foreground">{totals.margem}%</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ticket Médio</p>
              <p className="text-lg font-bold text-foreground">R$ {totals.ticketMedio.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </div>

        {/* Detalhamento do Mês */}
        <div className="rounded-xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-foreground">Detalhamento do Mês</h4>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[110px] text-center capitalize">{monthLabel}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {/* Saldo Inicial */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground font-medium">Saldo Inicial</p>
              </div>
              <p className={`text-xl font-bold ${monthDetail.saldoInicial >= 0 ? "text-primary" : "text-destructive"}`}>
                {monthDetail.saldoInicial < 0 ? "− " : ""}{fmt(monthDetail.saldoInicial)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">acumulado anterior</p>
            </div>

            {/* Realizados */}
            <div className="rounded-xl border border-success/20 bg-success/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <p className="text-xs text-muted-foreground font-medium">Realizados</p>
              </div>
              <div className="space-y-0.5 text-sm">
                <p className="text-success">+ {fmt(monthDetail.recPagas)}</p>
                <p className="text-destructive">− {fmt(monthDetail.despPagas)}</p>
                <div className="border-t border-border/50 pt-1 mt-1">
                  <p className={`font-bold ${monthDetail.liquidoMes >= 0 ? "text-success" : "text-destructive"}`}>
                    {monthDetail.liquidoMes < 0 ? "− " : ""}{fmt(monthDetail.liquidoMes)}
                  </p>
                </div>
              </div>
            </div>

            {/* Saldo Atual */}
            <div className="rounded-xl border border-success/30 bg-gradient-to-br from-success/10 to-success/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <p className="text-xs text-muted-foreground font-medium">Saldo Atual</p>
              </div>
              <p className={`text-2xl font-bold ${monthDetail.saldoAtual >= 0 ? "text-success" : "text-destructive"}`}>
                {monthDetail.saldoAtual < 0 ? "− " : ""}{fmt(monthDetail.saldoAtual)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">inicial + líquido</p>
            </div>

            {/* A Efetuar */}
            <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-warning" />
                <p className="text-xs text-muted-foreground font-medium">A Efetuar</p>
              </div>
              <div className="space-y-0.5 text-sm">
                <p className="text-success">+ {fmt(monthDetail.recPendentes)}</p>
                <p className="text-warning">− {fmt(monthDetail.despPendentes)}</p>
                <div className="border-t border-border/50 pt-1 mt-1">
                  <p className={`font-bold ${monthDetail.saldoPendente >= 0 ? "text-warning" : "text-destructive"}`}>
                    {monthDetail.saldoPendente < 0 ? "− " : ""}{fmt(monthDetail.saldoPendente)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mini-tabela de pendências */}
          {monthDetail.pendentes.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Pagamentos pendentes ({monthDetail.pendentes.length})
              </p>
              <div className="rounded-lg border border-border/60 overflow-hidden">
                {monthDetail.pendentes.slice(0, 5).map((t, i) => {
                  const tt = t as Transacao & { description?: string };
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-3 py-2 text-xs ${i % 2 === 0 ? "bg-muted/20" : ""}`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-muted-foreground tabular-nums w-14 shrink-0">
                          {t.date ? t.date.substring(8, 10) + "/" + t.date.substring(5, 7) : "—"}
                        </span>
                        <span className="text-foreground truncate">{tt.description || "(sem descrição)"}</span>
                        <span className="text-muted-foreground capitalize hidden sm:inline">{t.type}</span>
                      </div>
                      <span className={`font-semibold tabular-nums ${t.type === "receita" ? "text-success" : "text-warning"}`}>
                        {t.type === "receita" ? "+" : "−"} {fmt(Number(t.value))}
                      </span>
                    </div>
                  );
                })}
                {monthDetail.pendentes.length > 5 && (
                  <div className="px-3 py-2 text-xs text-center text-muted-foreground bg-muted/10">
                    + {monthDetail.pendentes.length - 5} pendência{monthDetail.pendentes.length - 5 > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Lucratividade */}
        <div className="rounded-xl border border-border p-5 mb-6">
          <h4 className="font-semibold text-foreground mb-4">Margem de Lucro Mensal (%)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gradMargemBI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Margem"]} />
              <Area type="monotone" dataKey="margem" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#gradMargemBI)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Fluxo de Caixa Futuro */}
        <div className="rounded-xl border border-border p-5 mb-6">
          <h4 className="font-semibold text-foreground mb-1">Fluxo de Caixa — Projeção</h4>
          <p className="text-xs text-muted-foreground mb-4">Ano {selectedYear} + 3 meses projetados (linha pontilhada)</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={projection}>
              <defs>
                <linearGradient id="gradRecBI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradDespBI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={9} axisLine={false} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]} />
              <Legend wrapperStyle={{ paddingTop: "12px" }} />
              <Area type="monotone" dataKey="receitas" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#gradRecBI)" name="Receitas" />
              <Area type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#gradDespBI)" name="Despesas" />
              <Area type="monotone" dataKey="recProj" stroke="hsl(var(--success))" strokeWidth={2} strokeDasharray="6 4" fill="none" name="Receita (projeção)" connectNulls={false} />
              <Area type="monotone" dataKey="despProj" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="6 4" fill="none" name="Despesa (projeção)" connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Despesas vs Receitas Detalhado */}
        <div className="rounded-xl border border-border p-5">
          <h4 className="font-semibold text-foreground mb-4">Receitas vs Despesas — Mensal</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={9} axisLine={false} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]} />
              <Legend wrapperStyle={{ paddingTop: "12px" }} />
              <Bar dataKey="receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Receitas" />
              <Bar dataKey="despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* DRE Simplificado */}
        <div className="rounded-xl border border-border p-5 mb-6">
          <h4 className="font-semibold text-foreground mb-4">DRE Simplificado ({selectedYear})</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-foreground font-medium">Receita Bruta</span>
              <span className="text-success font-semibold">R$ {dre.receitaBruta.toLocaleString("pt-BR")}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50 pl-4">
              <span className="text-muted-foreground">(-) Total de Despesas</span>
              <span className="text-destructive">R$ {dre.totalDespesas.toLocaleString("pt-BR")}</span>
            </div>
            {topCategorias.slice(0, 3).map(cat => (
              <div key={cat.name} className="flex justify-between py-1 pl-8 text-xs">
                <span className="text-muted-foreground">{cat.name}</span>
                <span className="text-muted-foreground">R$ {cat.value.toLocaleString("pt-BR")}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 font-bold text-base border-t border-border/50">
              <span className="text-foreground">(=) Resultado Líquido</span>
              <span className={dre.lucroLiq >= 0 ? "text-success" : "text-destructive"}>R$ {dre.lucroLiq.toLocaleString("pt-BR")}</span>
            </div>
          </div>
        </div>

        {/* Top 5 Categorias + Inadimplência side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="rounded-xl border border-border p-5">
            <h4 className="font-semibold text-foreground mb-4">Top 5 Categorias de Despesa</h4>
            {topCategorias.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topCategorias} layout="vertical">
                  <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" horizontal vertical={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v / 1000}k`} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Valor"]} />
                  <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[0, 6, 6, 0]} name="Valor" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma despesa encontrada</p>
            )}
          </div>

          <div className="rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h4 className="font-semibold text-foreground">Inadimplência</h4>
            </div>
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-warning">R$ {inadimplencia.total.toLocaleString("pt-BR")}</p>
                <p className="text-sm text-muted-foreground mt-1">{inadimplencia.count} receita{inadimplencia.count !== 1 ? "s" : ""} pendente{inadimplencia.count !== 1 ? "s" : ""} e vencida{inadimplencia.count !== 1 ? "s" : ""}</p>
              </div>
              <div className="rounded-lg bg-warning/10 p-3 text-center">
                <p className="text-sm font-medium text-warning">{inadimplencia.pct}% da receita total</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
