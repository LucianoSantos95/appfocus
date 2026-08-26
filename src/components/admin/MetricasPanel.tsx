import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, MousePointerClick, UserPlus, TrendingDown, TrendingUp, Mail, Star, Minus } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
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

export function MetricasPanel() {
  const [dias, setDias] = useState("30");
  const [eventos, setEventos] = useState<Linha[]>([]);
  const [anteriores, setAnteriores] = useState<Linha[]>([]);
  const [emails, setEmails] = useState<EmailLinha[]>([]);
  const [notas, setNotas] = useState<Record<string, { media: number; qtd: number }>>({});
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [loading, setLoading] = useState(true);

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
  ).sort((a, b) => b.cliques - a.cliques);

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
  const ultimosEmails = emails.slice(0, 25);


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

          {/* Saúde dos e-mails automáticos */}
          <div>
            <h3 className="font-display text-xl tracking-tight text-foreground mb-3">E-mails automáticos</h3>
            <Card className={emailsFalhas > 0 ? "border-destructive/40 bg-destructive/[0.04]" : undefined}>
              <CardContent className="p-5">
                {porTemplate.length === 0 ? (
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
                    </div>
                    <div className="mt-4 space-y-2">
                      {porTemplate.map((t) => (
                        <div key={t.nome} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-foreground">{t.nome}</span>
                          <span className="flex items-center gap-2 tabular-nums">
                            <Badge variant="outline" className="text-muted-foreground">{t.enviados} ok</Badge>
                            {t.falhas > 0 && (
                              <Badge variant="outline" className="border-destructive/50 text-destructive">
                                {t.falhas} falha{t.falhas === 1 ? "" : "s"}
                              </Badge>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
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
