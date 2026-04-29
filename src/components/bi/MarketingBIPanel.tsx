import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useMemo } from "react";
import { Target, DollarSign, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { SendReportButton } from "@/components/relatorios/SendReportButton";
import { buildMarketingPayload } from "@/components/relatorios/genericPayloads";

interface Campanha {
  id: string;
  name: string;
  budget: number | null;
  platforms: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

interface MarketingBIPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campanhas: Campanha[];
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  boxShadow: "0 8px 32px -4px hsl(var(--primary)/0.15)",
  color: "hsl(var(--popover-foreground))",
};

export function MarketingBIPanel({ open, onOpenChange, campanhas }: MarketingBIPanelProps) {
  const platformStats = useMemo(() => {
    const map: Record<string, { count: number; budget: number }> = {};
    campanhas.forEach((c) => {
      const plat = c.platforms || "Outros";
      if (!map[plat]) map[plat] = { count: 0, budget: 0 };
      map[plat].count++;
      map[plat].budget += Number(c.budget || 0);
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, campanhas: v.count, orcamento: v.budget }))
      .sort((a, b) => b.orcamento - a.orcamento);
  }, [campanhas]);

  const totalBudget = useMemo(() => campanhas.reduce((s, c) => s + Number(c.budget || 0), 0), [campanhas]);
  const activeCampaigns = useMemo(() => campanhas.filter((c) => c.status === "ativa").length, [campanhas]);
  const avgBudget = campanhas.length > 0 ? Math.round(totalBudget / campanhas.length) : 0;

  const ranked = useMemo(
    () =>
      [...campanhas]
        .sort((a, b) => Number(b.budget || 0) - Number(a.budget || 0))
        .slice(0, 10),
    [campanhas]
  );

  const statusColors: Record<string, string> = {
    ativa: "bg-success/10 text-success",
    planejamento: "bg-primary/10 text-primary",
    pausada: "bg-warning/10 text-warning",
    concluida: "bg-muted text-muted-foreground",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between gap-3">
            <span>Análise de Marketing Detalhada</span>
            <SendReportButton payload={buildMarketingPayload(campanhas)} label="Enviar por e-mail" />
          </DialogTitle>
        </DialogHeader>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Campanhas Ativas</p>
              <p className="text-lg font-bold text-foreground">{activeCampaigns}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Orçamento Total</p>
              <p className="text-lg font-bold text-foreground">R$ {totalBudget.toLocaleString("pt-BR")}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Orçamento Médio</p>
              <p className="text-lg font-bold text-foreground">R$ {avgBudget.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </div>

        {/* By Platform */}
        <div className="rounded-xl border border-border p-5 mb-6">
          <h4 className="font-semibold text-foreground mb-4">Comparativo por Plataforma</h4>
          {platformStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={platformStats} layout="vertical">
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" horizontal vertical={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v / 1000}k`} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`R$ ${v.toLocaleString("pt-BR")}`, name === "orcamento" ? "Orçamento" : "Campanhas"]} />
                <Legend wrapperStyle={{ paddingTop: "12px" }} />
                <Bar dataKey="orcamento" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} name="Orçamento" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma campanha encontrada</p>
          )}
        </div>

        {/* Ranking */}
        <div className="rounded-xl border border-border p-5">
          <h4 className="font-semibold text-foreground mb-4">Ranking de Campanhas</h4>
          <div className="space-y-2">
            {ranked.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-xs font-bold text-muted-foreground w-6 text-center">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.platforms || "—"}</p>
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColors[c.status] || "bg-muted text-muted-foreground")}>
                  {c.status}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  R$ {Number(c.budget || 0).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
            {ranked.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma campanha encontrada</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
