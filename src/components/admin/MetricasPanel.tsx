import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, MousePointerClick, UserPlus, TrendingDown, TrendingUp, Mail, MailOpen, Star, Minus, SlidersHorizontal, ChevronDown, Download, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis } from "recharts";

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

// Linha de tendência: visitas, cliques e leads ao longo do tempo.
const graficoTendencia = {
  visitas: { label: "Visitas", color: "hsl(var(--primary) / 0.45)" },
  cliques: { label: "Cliques", color: "hsl(var(--muted-foreground))" },
  leads: { label: "Leads", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

// Visualizações (clique_produto) e downloads (lead_enviado) de um produto ao longo do tempo.
const graficoProduto = {
  visualizacoes: { label: "Visualizações", color: "hsl(var(--muted-foreground))" },
  downloads: { label: "Downloads", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

// Funil do catálogo: visita → clique → lead.
// A leitura que importa: onde a pessoa desiste.
//   pouco clique  = o produto não atrai
//   clique alto e lead baixo = o formulário está travando
const sb = supabase as any;

interface Linha { tipo: string; produto: string | null; sessao: string | null; created_at: string }
interface EmailLinha {
  id: string;
  template_name: string;
  status: string;
  recipient_email: string;
  opened_at: string | null;
  created_at: string;
}

const PERIODOS = [
  { v: "7",   label: "Últimos 7 dias" },
  { v: "30",  label: "Últimos 30 dias" },
  { v: "0",   label: "Desde o início" },
];

// Origem do e-mail: de onde ele saiu, não qual template foi usado.
type Origem = "produto" | "feedback" | "manual" | "advisor";

const ORIGEM_ROTULO: Record<Origem, string> = {
  produto: "Produto baixado",
  feedback: "Feedback",
  manual: "Envio manual",
  advisor: "Contato Advisor",
};

function origemDe(template: string): Origem {
  if (template === "thanks_produto") return "produto";
  if (template === "thanks_feedback") return "feedback";
  if (template === "thanks_advisor") return "advisor";
  return "manual"; // subscriber_broadcast, promo_*, campanhas antigas
}

// Rastreio de abertura só existe a partir da instrumentação do pixel.
// Antes disso não dá para dizer "não abriu" — dizemos "sem rastreio".
const RASTREIO_DESDE = new Date("2026-08-26T00:00:00Z").getTime();

function temRastreio(e: EmailLinha) {
  return new Date(e.created_at).getTime() >= RASTREIO_DESDE;
}


function chaveDia(iso: string) {
  return iso.slice(0, 10);
}

// Segunda-feira da semana da data — usado quando o período é longo demais pra dia a dia.
function chaveSemana(iso: string) {
  const d = new Date(iso);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

function fmtEixo(chave: string) {
  const [, m, d] = chave.split("-");
  return `${d}/${m}`;
}

// Exportação client-side: monta o CSV na memória e baixa via Blob.
// Separador ";" e BOM porque o destino é o Excel em pt-BR.
function celula(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function baixarCsv(nome: string, linhas: (string | number | null)[][]) {
  const csv = linhas.map((l) => l.map(celula).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}


export function MetricasPanel() {
  const [dias, setDias] = useState("30");
  const [eventos, setEventos] = useState<Linha[]>([]);
  const [anteriores, setAnteriores] = useState<Linha[]>([]);
  const [emails, setEmails] = useState<EmailLinha[]>([]);
  const [notas, setNotas] = useState<Record<string, { media: number; qtd: number }>>({});
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtroOrigem, setFiltroOrigem] = useState<"todas" | Origem>("todas");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "sent" | "falhou" | "aberto" | "nao_aberto">("todos");
  const [verTodosEmails, setVerTodosEmails] = useState(false);
  const [produtoSel, setProdutoSel] = useState("todos");

  const comparavel = dias !== "0";

  const carregar = useCallback(async () => {
    setLoading(true);
    const janela = Number(dias) * 86400000;
    const inicio = dias === "0" ? new Date(0) : new Date(Date.now() - janela);
    const desde = inicio.toISOString();
    const desdeAnterior = new Date(inicio.getTime() - janela).toISOString();

    const [ev, evAnt, ld, em, fb, prod] = await Promise.all([
      sb.from("eventos").select("tipo,produto,sessao,created_at").gte("created_at", desde),
      dias === "0"
        ? Promise.resolve({ data: [] })
        : sb.from("eventos").select("tipo,produto,sessao,created_at")
            .gte("created_at", desdeAnterior).lt("created_at", desde),
      sb.from("leads").select("id", { count: "exact", head: true })
        .neq("status", "legado").gte("created_at", desde),
      sb.from("email_send_log")
        .select("id,template_name,status,recipient_email,opened_at,created_at")
        .neq("status", "pending")
        .gte("created_at", desde)
        .order("created_at", { ascending: false })
        .limit(2000),

      sb.from("feedbacks").select("avaliacao,pagina"),
      sb.from("produtos").select("slug,nome"),
    ]);

    setEventos((ev.data as Linha[]) || []);
    setAnteriores((evAnt.data as Linha[]) || []);
    setLeadsTotal(ld.count ?? 0);
    setEmails((em.data as EmailLinha[]) || []);

    const acc: Record<string, number[]> = {};
    for (const f of ((fb.data as { avaliacao: number | null; pagina: string | null }[]) || [])) {
      if (!f.pagina || !f.avaliacao) continue;
      (acc[f.pagina] ??= []).push(f.avaliacao);
    }
    const mapaNotas: Record<string, { media: number; qtd: number }> = {};
    for (const [slug, lista] of Object.entries(acc)) {
      mapaNotas[slug] = { media: lista.reduce((a, b) => a + b, 0) / lista.length, qtd: lista.length };
    }
    setNotas(mapaNotas);

    const mapaNomes: Record<string, string> = {};
    for (const p of ((prod.data as { slug: string; nome: string }[]) || [])) mapaNomes[p.slug] = p.nome;
    setNomes(mapaNomes);

    setLoading(false);
  }, [dias]);

  useEffect(() => { carregar(); }, [carregar]);

  // Visitas contam sessões únicas — recarregar a página não infla o número
  const contar = (lista: Linha[]) => ({
    visitas: new Set(
      lista.filter((e) => e.tipo === "visita_catalogo").map((e) => e.sessao ?? Math.random().toString()),
    ).size,
    cliques: lista.filter((e) => e.tipo === "clique_produto").length,
    leads: lista.filter((e) => e.tipo === "lead_enviado").length,
  });

  const atual = contar(eventos);
  const anterior = contar(anteriores);
  const { visitas, cliques, leads: leadsEv } = atual;

  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

  const variacao = (agora: number, antes: number) =>
    antes > 0 ? Math.round(((agora - antes) / antes) * 100) : null;

  // Por produto: quantos clicaram vs quantos completaram
  const porProduto = Object.values(
    eventos.reduce((acc: Record<string, { slug: string; produto: string; cliques: number; leads: number }>, e) => {
      if (!e.produto) return acc;
      acc[e.produto] ??= { slug: e.produto, produto: nomes[e.produto] ?? e.produto, cliques: 0, leads: 0 };
      if (e.tipo === "clique_produto") acc[e.produto].cliques++;
      if (e.tipo === "lead_enviado") acc[e.produto].leads++;
      return acc;
    }, {}),
  )
    .sort((a, b) => b.cliques - a.cliques)
    // taxa vai como rótulo de texto, não como barra: a escala é outra
    .map((p) => ({ ...p, taxa: pct(p.leads, p.cliques) }));

  const periodoRotulo = dias === "0" ? "tudo" : `${dias}d`;
  const hoje = new Date().toISOString().slice(0, 10);

  const exportarEventos = () =>
    baixarCsv(`eventos-${periodoRotulo}-${hoje}.csv`, [
      ["data", "tipo", "produto", "sessao"],
      ...[...eventos]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((e) => [e.created_at, e.tipo, e.produto ?? "", e.sessao ?? ""]),
    ]);

  const exportarResumo = () =>
    baixarCsv(`resumo-por-produto-${periodoRotulo}-${hoje}.csv`, [
      ["produto", "slug", "cliques", "leads", "conversao_%", "nota_media", "avaliacoes"],
      ...porProduto.map((p) => [
        p.produto,
        p.slug,
        p.cliques,
        p.leads,
        p.taxa,
        notas[p.slug] ? notas[p.slug].media.toFixed(1).replace(".", ",") : "",
        notas[p.slug]?.qtd ?? 0,
      ]),
    ]);


  // Tendência: dia a dia; agrupa por semana quando o intervalo passa de ~60 dias
  const datas = eventos.map((e) => e.created_at).sort();
  const spanDias = datas.length
    ? (new Date(datas[datas.length - 1]).getTime() - new Date(datas[0]).getTime()) / 86400000
    : 0;
  const porSemana = dias === "0" && spanDias > 60;
  const chave = porSemana ? chaveSemana : chaveDia;

  const tendencia = Object.values(
    eventos.reduce((acc: Record<string, { data: string; visitas: Set<string>; cliques: number; leads: number }>, e) => {
      const k = chave(e.created_at);
      acc[k] ??= { data: k, visitas: new Set(), cliques: 0, leads: 0 };
      if (e.tipo === "visita_catalogo") acc[k].visitas.add(e.sessao ?? Math.random().toString());
      if (e.tipo === "clique_produto") acc[k].cliques++;
      if (e.tipo === "lead_enviado") acc[k].leads++;
      return acc;
    }, {}),
  )
    .map((d) => ({ data: d.data, visitas: d.visitas.size, cliques: d.cliques, leads: d.leads }))
    .sort((a, b) => a.data.localeCompare(b.data));

  // Visualizações e downloads por produto: mesmo agrupamento da tendência,
  // mas filtrando pelo produto escolhido no seletor.
  const slugsProduto = Array.from(
    new Set([
      ...Object.keys(nomes),
      ...eventos.map((e) => e.produto).filter((p): p is string => !!p),
    ]),
  ).sort((a, b) => (nomes[a] ?? a).localeCompare(nomes[b] ?? b));

  const eventosProduto = eventos.filter(
    (e) =>
      !!e.produto &&
      (e.tipo === "clique_produto" || e.tipo === "lead_enviado") &&
      (produtoSel === "todos" || e.produto === produtoSel),
  );

  const totalVisualizacoes = eventosProduto.filter((e) => e.tipo === "clique_produto").length;
  const totalDownloads = eventosProduto.filter((e) => e.tipo === "lead_enviado").length;

  const serieProduto = Object.values(
    eventosProduto.reduce((acc: Record<string, { data: string; visualizacoes: number; downloads: number }>, e) => {
      const k = chave(e.created_at);
      acc[k] ??= { data: k, visualizacoes: 0, downloads: 0 };
      if (e.tipo === "clique_produto") acc[k].visualizacoes++;
      else acc[k].downloads++;
      return acc;
    }, {}),
  ).sort((a, b) => a.data.localeCompare(b.data));


  // E-mails automáticos agrupados pela origem do disparo
  const porOrigem = Object.entries(
    emails.reduce((acc: Record<string, { enviados: number; falhas: number; abertos: number; rastreados: number }>, e) => {
      const o = origemDe(e.template_name);
      acc[o] ??= { enviados: 0, falhas: 0, abertos: 0, rastreados: 0 };
      if (e.status === "sent") {
        acc[o].enviados++;
        if (temRastreio(e)) {
          acc[o].rastreados++;
          if (e.opened_at) acc[o].abertos++;
        }
      } else acc[o].falhas++;
      return acc;
    }, {}),
  )
    .map(([origem, v]) => ({ origem: origem as Origem, ...v }))
    .sort((a, b) => b.enviados + b.falhas - (a.enviados + a.falhas));

  const emailsEnviados = porOrigem.reduce((s, t) => s + t.enviados, 0);
  const emailsFalhas = porOrigem.reduce((s, t) => s + t.falhas, 0);
  const emailsAbertos = porOrigem.reduce((s, t) => s + t.abertos, 0);
  const emailsRastreados = porOrigem.reduce((s, t) => s + t.rastreados, 0);
  // Lista de envios: filtro por origem e por situação (enviado / falhou / aberto)
  const emailsFiltrados = emails.filter((e) => {
    if (filtroOrigem !== "todas" && origemDe(e.template_name) !== filtroOrigem) return false;
    if (filtroStatus === "sent") return e.status === "sent";
    if (filtroStatus === "falhou") return e.status !== "sent";
    if (filtroStatus === "aberto") return e.status === "sent" && !!e.opened_at;
    if (filtroStatus === "nao_aberto") return e.status === "sent" && !e.opened_at && temRastreio(e);
    return true;
  });
  const ultimosEmails = verTodosEmails ? emailsFiltrados.slice(0, 50) : emailsFiltrados.slice(0, 5);
  const filtroAtivo = filtroOrigem !== "todas" || filtroStatus !== "todos";


  const etapas = [
    { rot: "Visitas",  val: visitas,  ant: anterior.visitas, icone: Eye,               sub: "sessões únicas" },
    { rot: "Cliques",  val: cliques,  ant: anterior.cliques, icone: MousePointerClick, sub: `${pct(cliques, visitas)}% de quem entrou` },
    { rot: "Leads",    val: leadsEv,  ant: anterior.leads,   icone: UserPlus,          sub: `${pct(leadsEv, cliques)}% de quem clicou` },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Visitas e cliques vêm do próprio catálogo. O Google Analytics segue medindo tráfego e origem.
        </p>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" disabled={loading}>
                <Download className="w-3.5 h-3.5" /> Exportar CSV
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Baixar dados do período</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={exportarEventos} className="flex-col items-start gap-0.5">
                <span>Eventos brutos ({eventos.length})</span>
                <span className="text-xs text-muted-foreground">data, tipo, produto, sessão</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={exportarResumo} className="flex-col items-start gap-0.5">
                <span>Resumo por produto ({porProduto.length})</span>
                <span className="text-xs text-muted-foreground">cliques, leads, conversão e nota</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Select value={dias} onValueChange={setDias}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIODOS.map((p) => <SelectItem key={p.v} value={p.v}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>


      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {etapas.map((e) => {
              const Icone = e.icone;
              const v = comparavel ? variacao(e.val, e.ant) : null;
              return (
                <Card key={e.rot}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icone className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider font-medium">{e.rot}</span>
                    </div>
                    <p className="mt-2 font-display text-4xl leading-none text-foreground tabular-nums">{e.val}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">{e.sub}</p>
                    {comparavel && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        {v === null ? (
                          <><Minus className="w-3 h-3" /> sem comparação</>
                        ) : (
                          <>
                            {v >= 0
                              ? <TrendingUp className="w-3 h-3 text-primary" />
                              : <TrendingDown className="w-3 h-3 text-destructive" />}
                            <span className={v >= 0 ? "text-primary" : "text-destructive"}>
                              {v > 0 ? "+" : ""}{v}%
                            </span>
                            <span>vs. {dias} dias anteriores</span>
                          </>
                        )}
                      </p>
                    )}
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

          {/* Tendência ao longo do tempo */}
          <div>
            <h3 className="font-display text-xl tracking-tight text-foreground mb-3">
              Tendência {porSemana ? "por semana" : "por dia"}
            </h3>
            {tendencia.length < 2 ? (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
                Ainda não há dados suficientes para desenhar uma tendência.
              </CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-5">
                  <ChartContainer config={graficoTendencia} className="w-full" style={{ height: 260 }}>
                    <LineChart data={tendencia} margin={{ left: 8, right: 16, top: 8 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="data" tickFormatter={fmtEixo} tickLine={false} axisLine={false} minTickGap={16} tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => fmtEixo(String(v))} />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="visitas" stroke="var(--color-visitas)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="cliques" stroke="var(--color-cliques)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="leads" stroke="var(--color-leads)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <h3 className="font-display text-xl tracking-tight text-foreground mb-3">Por produto</h3>
            {porProduto.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
                Nenhum clique registrado no período.
              </CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {porProduto.map((p) => {
                      const n = notas[p.slug];
                      return (
                        <Badge key={p.slug} variant="outline" className="gap-1.5 text-muted-foreground">
                          <span className="text-foreground">{p.produto}</span>
                          {n ? (
                            <span className="inline-flex items-center gap-0.5 text-yellow-400">
                              <Star className="w-3 h-3 fill-yellow-400" />
                              {n.media.toFixed(1)}
                              <span className="text-muted-foreground">({n.qtd})</span>
                            </span>
                          ) : (
                            <span>sem nota</span>
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                  <ChartContainer
                    config={grafico}
                    className="w-full"
                    style={{ height: Math.max(160, porProduto.length * 56) }}
                  >
                    <BarChart data={porProduto} layout="vertical" margin={{ left: 8, right: 56 }} barGap={4}>
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
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelFormatter={(v, p) => {
                              const d = p?.[0]?.payload as { produto: string; taxa: number } | undefined;
                              return d ? `${d.produto} · ${d.taxa}% de conversão` : String(v);
                            }}
                          />
                        }
                        cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="cliques" fill="var(--color-cliques)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="leads" fill="var(--color-leads)" radius={[0, 4, 4, 0]}>
                        {/* conversão como rótulo: mesma leitura, sem competir de escala */}
                        <LabelList
                          dataKey="taxa"
                          position="right"
                          offset={8}
                          className="fill-muted-foreground"
                          fontSize={11}
                          formatter={(v: number) => `${v}%`}
                        />
                      </Bar>
                    </BarChart>

                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Aprofundar em um produto ao longo do tempo */}
          <div>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <h3 className="font-display text-xl tracking-tight text-foreground">
                Visualizações e downloads por produto
              </h3>
              <Select value={produtoSel} onValueChange={setProdutoSel}>
                <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os produtos</SelectItem>
                  {slugsProduto.map((s) => (
                    <SelectItem key={s} value={s}>{nomes[s] ?? s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {produtoSel !== "todos" && (
              <div className="-mt-1 mb-3">
                <Button variant="link" size="sm" asChild className="h-auto p-0 gap-1 text-xs">
                  <Link to={`/admin?aba=leads&leadProduto=${encodeURIComponent(produtoSel)}`}>
                    Ver leads desse produto <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </Button>
              </div>
            )}


            <div className="grid gap-3 sm:grid-cols-2">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider font-medium">Visualizações</span>
                  </div>
                  <p className="mt-2 font-display text-4xl leading-none text-foreground tabular-nums">{totalVisualizacoes}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">quem abriu o produto</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserPlus className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider font-medium">Downloads</span>
                  </div>
                  <p className="mt-2 font-display text-4xl leading-none text-foreground tabular-nums">{totalDownloads}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {pct(totalDownloads, totalVisualizacoes)}% de quem visualizou
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-3">
              {serieProduto.length < 2 ? (
                <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Ainda não há dados suficientes para desenhar esse produto ao longo do tempo.
                </CardContent></Card>
              ) : (
                <Card>
                  <CardContent className="p-5">
                    <ChartContainer config={graficoProduto} className="w-full" style={{ height: 260 }}>
                      <LineChart data={serieProduto} margin={{ left: 8, right: 16, top: 8 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="data" tickFormatter={fmtEixo} tickLine={false} axisLine={false} minTickGap={16} tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => fmtEixo(String(v))} />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line type="monotone" dataKey="visualizacoes" stroke="var(--color-visualizacoes)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="downloads" stroke="var(--color-downloads)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>


          {/* Saúde dos e-mails automáticos */}
          <div>
            <h3 className="font-display text-xl tracking-tight text-foreground mb-3">E-mails automáticos</h3>
            <Card className={emailsFalhas > 0 ? "border-destructive/40 bg-destructive/[0.04]" : undefined}>
              <CardContent className="p-5">
                {porOrigem.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum e-mail disparado no período.</p>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Mail className={`w-4 h-4 ${emailsFalhas > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                      <span className="text-sm text-foreground tabular-nums">
                        {emailsEnviados} enviado{emailsEnviados === 1 ? "" : "s"}
                      </span>
                      <span className={`text-sm tabular-nums ${emailsFalhas > 0 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                        {emailsFalhas} falhou{emailsFalhas === 1 ? "" : "/falharam"}
                      </span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {emailsRastreados > 0
                          ? `${emailsAbertos} aberto${emailsAbertos === 1 ? "" : "s"} · ${pct(emailsAbertos, emailsRastreados)}% de abertura`
                          : "abertura sem rastreio no período"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {porOrigem.map((t) => (
                        <div key={t.origem} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-foreground">{ORIGEM_ROTULO[t.origem]}</span>
                          <span className="flex items-center gap-2 tabular-nums">
                            <Badge variant="outline" className="text-muted-foreground">{t.enviados} ok</Badge>
                            {t.rastreados > 0 && (
                              <Badge variant="outline" className="border-primary/50 text-primary gap-1">
                                <MailOpen className="w-3 h-3" />
                                {t.abertos} aberto{t.abertos === 1 ? "" : "s"} ({pct(t.abertos, t.rastreados)}%)
                              </Badge>
                            )}
                            {t.falhas > 0 && (
                              <Badge variant="outline" className="border-destructive/50 text-destructive">
                                {t.falhas} falha{t.falhas === 1 ? "" : "s"}
                              </Badge>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Últimos envios, um por linha: origem + abertura */}
                    <div className="mt-5 border-t border-border/60 pt-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Últimos envios</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 gap-1.5 px-2 ${filtroAtivo ? "text-primary" : "text-muted-foreground"}`}
                              aria-label="Filtrar envios"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                              <span className="text-xs">Filtrar</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>Origem</DropdownMenuLabel>
                            <DropdownMenuRadioGroup value={filtroOrigem} onValueChange={(v) => { setFiltroOrigem(v as typeof filtroOrigem); setVerTodosEmails(false); }}>
                              <DropdownMenuRadioItem value="todas">Todas</DropdownMenuRadioItem>
                              {(Object.keys(ORIGEM_ROTULO) as Origem[]).map((o) => (
                                <DropdownMenuRadioItem key={o} value={o}>{ORIGEM_ROTULO[o]}</DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Situação</DropdownMenuLabel>
                            <DropdownMenuRadioGroup value={filtroStatus} onValueChange={(v) => { setFiltroStatus(v as typeof filtroStatus); setVerTodosEmails(false); }}>
                              <DropdownMenuRadioItem value="todos">Todas</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="sent">Enviados</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="aberto">Abertos</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="nao_aberto">Não abertos</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="falhou">Falhas</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {ultimosEmails.length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhum envio com esse filtro.</p>
                      )}
                      {ultimosEmails.map((e) => {
                        const rastreado = temRastreio(e);
                        return (
                          <div key={e.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="truncate text-foreground" title={e.recipient_email}>
                              {e.recipient_email}
                            </span>
                            <span className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className="text-muted-foreground">
                                {ORIGEM_ROTULO[origemDe(e.template_name)]}
                              </Badge>
                              {e.status !== "sent" ? (
                                <Badge variant="outline" className="border-destructive/50 text-destructive">falhou</Badge>
                              ) : e.opened_at ? (
                                <Badge variant="outline" className="border-primary/50 text-primary gap-1">
                                  <MailOpen className="w-3 h-3" /> Aberto
                                </Badge>
                              ) : rastreado ? (
                                <Badge variant="outline" className="text-muted-foreground">Não aberto</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">sem rastreio</Badge>
                              )}
                            </span>
                          </div>
                        );
                      })}

                      {emailsFiltrados.length > 5 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-8 gap-1.5 text-muted-foreground"
                          onClick={() => setVerTodosEmails((v) => !v)}
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${verTodosEmails ? "rotate-180" : ""}`} />
                          {verTodosEmails ? "Ver menos" : `Ver mais (${emailsFiltrados.length - 5})`}
                        </Button>
                      )}
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground">
                      A abertura é medida por pixel de imagem — clientes como Gmail e Outlook às vezes bloqueiam ou
                      pré-carregam imagens, então a taxa é uma aproximação. Envios anteriores à instrumentação aparecem
                      como “sem rastreio”.
                    </p>

                    {emailsFalhas > 0 && (
                      <p className="mt-3 text-xs text-destructive">
                        Há falhas de envio no período — vale checar o log de e-mails antes que o usuário reclame.
                      </p>
                    )}
                  </>
                )}

              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">
            Total de leads no período (todas as origens, sem contar a base antiga): <span className="text-foreground tabular-nums">{leadsTotal}</span>
          </p>
        </>
      )}
    </div>
  );
}
