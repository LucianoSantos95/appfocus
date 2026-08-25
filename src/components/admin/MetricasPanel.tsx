import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, MousePointerClick, UserPlus, TrendingDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Barras por produto: cliques vs. leads, nos tokens do tema.
const grafico = {
  cliques: { label: "Cliques", color: "hsl(var(--muted-foreground))" },
  leads: { label: "Leads", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

// Funil do catálogo: visita → clique → lead.
// A leitura que importa: onde a pessoa desiste.
//   pouco clique  = o produto não atrai
//   clique alto e lead baixo = o formulário está travando
const sb = supabase as any;

interface Linha { tipo: string; produto: string | null; sessao: string | null }

const PERIODOS = [
  { v: "7",   label: "Últimos 7 dias" },
  { v: "30",  label: "Últimos 30 dias" },
  { v: "0",   label: "Desde o início" },
];

export function MetricasPanel() {
  const [dias, setDias] = useState("30");
  const [eventos, setEventos] = useState<Linha[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    const desde = dias === "0"
      ? new Date(0).toISOString()
      : new Date(Date.now() - Number(dias) * 86400000).toISOString();

    const [ev, ld] = await Promise.all([
      sb.from("eventos").select("tipo,produto,sessao").gte("created_at", desde),
      sb.from("leads").select("id", { count: "exact", head: true })
        .neq("status", "legado").gte("created_at", desde),
    ]);

    setEventos((ev.data as Linha[]) || []);
    setLeadsTotal(ld.count ?? 0);
    setLoading(false);
  }, [dias]);

  useEffect(() => { carregar(); }, [carregar]);

  // Visitas contam sessões únicas — recarregar a página não infla o número
  const visitas = new Set(
    eventos.filter((e) => e.tipo === "visita_catalogo").map((e) => e.sessao ?? Math.random().toString()),
  ).size;
  const cliques = eventos.filter((e) => e.tipo === "clique_produto").length;
  const leadsEv = eventos.filter((e) => e.tipo === "lead_enviado").length;

  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

  // Por produto: quantos clicaram vs quantos completaram
  const porProduto = Object.values(
    eventos.reduce((acc: Record<string, { produto: string; cliques: number; leads: number }>, e) => {
      if (!e.produto) return acc;
      acc[e.produto] ??= { produto: e.produto, cliques: 0, leads: 0 };
      if (e.tipo === "clique_produto") acc[e.produto].cliques++;
      if (e.tipo === "lead_enviado") acc[e.produto].leads++;
      return acc;
    }, {}),
  ).sort((a, b) => b.cliques - a.cliques);

  const etapas = [
    { rot: "Visitas",  val: visitas,  icone: Eye,                sub: "sessões únicas" },
    { rot: "Cliques",  val: cliques,  icone: MousePointerClick,  sub: `${pct(cliques, visitas)}% de quem entrou` },
    { rot: "Leads",    val: leadsEv,  icone: UserPlus,           sub: `${pct(leadsEv, cliques)}% de quem clicou` },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Visitas e cliques vêm do próprio catálogo. O Google Analytics segue medindo tráfego e origem.
        </p>
        <Select value={dias} onValueChange={setDias}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PERIODOS.map((p) => <SelectItem key={p.v} value={p.v}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {etapas.map((e) => {
              const Icone = e.icone;
              return (
                <Card key={e.rot}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icone className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider font-medium">{e.rot}</span>
                    </div>
                    <p className="mt-2 font-display text-4xl leading-none text-foreground tabular-nums">{e.val}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">{e.sub}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Diagnóstico — o objetivo de ter esses números */}
          {visitas > 0 && (
            <Card className="border-primary/25 bg-primary/[0.04]">
              <CardContent className="p-5 flex items-start gap-3">
                <TrendingDown className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Onde está o gargalo</p>
                  <p className="mt-1 text-muted-foreground leading-relaxed">
                    {cliques === 0
                      ? "Gente entrou mas ninguém clicou em nenhum produto. O catálogo não está despertando interesse — mexa na oferta ou na descrição antes de mexer no formulário."
                      : pct(cliques, visitas) < 20
                        ? `Só ${pct(cliques, visitas)}% de quem entra clica em algo. O problema está na vitrine: título, descrição ou a promessa não conectam.`
                        : pct(leadsEv, cliques) < 50
                          ? `${pct(cliques, visitas)}% clicam, mas só ${pct(leadsEv, cliques)}% completam. O interesse existe — quem está travando é o formulário.`
                          : `Funil saudável: ${pct(cliques, visitas)}% clicam e ${pct(leadsEv, cliques)}% completam. O gargalo agora é volume de tráfego, não conversão.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="font-display text-xl tracking-tight text-foreground mb-3">Por produto</h3>
            {porProduto.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
                Nenhum clique registrado no período.
              </CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-5">
                  <ChartContainer
                    config={grafico}
                    className="w-full"
                    style={{ height: Math.max(160, porProduto.length * 56) }}
                  >
                    <BarChart data={porProduto} layout="vertical" margin={{ left: 8, right: 16 }} barGap={4}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="produto"
                        width={130}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="cliques" fill="var(--color-cliques)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="leads" fill="var(--color-leads)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>


          <p className="text-xs text-muted-foreground">
            Total de leads no período (todas as origens, sem contar a base antiga): <span className="text-foreground tabular-nums">{leadsTotal}</span>
          </p>
        </>
      )}
    </div>
  );
}
