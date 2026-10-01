import { useCallback, useEffect, useState } from "react";
import { buscarTodas } from "@/lib/buscarTodas";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { TrafegoOrigem } from "@/components/admin/TrafegoOrigem";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Percent, Eye, MousePointerClick, UserPlus, TrendingDown, TrendingUp, Mail, MailOpen, Star, Minus, SlidersHorizontal, ChevronDown, Download, ArrowUpRight, RefreshCw, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

interface Linha { tipo: string; produto: string | null; sessao: string | null; origem?: string | null; created_at: string }
interface EmailLinha {
  id: string;
  template_name: string;
  status: string;
  recipient_email: string;
  opened_at: string | null;
  created_at: string;
  metadata?: { produto?: string | null } | null;
}

// Abaixo disso a taxa de abertura é ruído estatístico — mostramos, mas fora do ranking.
const MIN_AMOSTRA_ABERTURA = 5;

const PERIODOS = [
  { v: "hoje",  label: "Hoje" },
  { v: "ontem", label: "Ontem" },
  { v: "7",   label: "Últimos 7 dias" },
  { v: "30",  label: "Últimos 30 dias" },
  { v: "0",   label: "Desde o início" },
];

// Origem do e-mail: de onde ele saiu, não qual template foi usado.
type Origem =
  | "produto"
  | "feedback"
  | "advisor"
  | "crosssell"
  | "followup"
  | "promo"
  | "manual"
  | "entrega"
  | "outro";

const ORIGEM_ROTULO: Record<Origem, string> = {
  produto: "Agradecimento produto",
  feedback: "Agradecimento feedback",
  advisor: "Agradecimento consultoria",
  crosssell: "Cross-sell",
  followup: "Follow-up de uso",
  promo: "Campanha promocional",
  manual: "Envio manual",
  entrega: "Entrega de compra",
  outro: "Não classificado",
};

// Mapa explícito: cada template conhecido tem sua categoria.
// Nada cai em "Envio manual" por descarte — só o broadcast do painel de E-mail.
const ORIGEM_POR_TEMPLATE: Record<string, Origem> = {
  thanks_produto: "produto",
  thanks_feedback: "feedback",
  thanks_advisor: "advisor",
  crosssell_produto: "crosssell",
  followup_uso: "followup",
  promo_inactive_reactivation: "promo",
  promo_engaged_20off: "promo",
  subscriber_broadcast: "manual",
  entrega_produto: "entrega",
};

function origemDe(template: string): Origem {
  return ORIGEM_POR_TEMPLATE[template] ?? "outro";
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

// Primeiro e-mail automático do Hub Central (thanks_*): tudo antes é da era Hub Empresarial
const HUB_CENTRAL_INICIO = "2026-08-25T21:56:58.927Z";


export function MetricasPanel() {
  const [dias, setDias] = useState("30");
  const [eventos, setEventos] = useState<Linha[]>([]);
  const [anteriores, setAnteriores] = useState<Linha[]>([]);
  const [emails, setEmails] = useState<EmailLinha[]>([]);
  const [notas, setNotas] = useState<Record<string, { media: number; qtd: number }>>({});
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [filtroOrigem, setFiltroOrigem] = useState<"todas" | Origem>("todas");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "sent" | "falhou" | "aberto" | "nao_aberto">("todos");
  const [verTodosEmails, setVerTodosEmails] = useState(false);
  const [diaDisparoSel, setDiaDisparoSel] = useState<string | null>(null);
  const [verTodosProdutos, setVerTodosProdutos] = useState(false);
  const [slugFiltro, setSlugFiltro] = useState<string | null>(null);

  const [produtoSel, setProdutoSel] = useState("todos");

  const comparavel = dias !== "0";

  // Eventos vêm paginados: o backend devolve no máximo 1000 linhas por requisição,
  // então buscamos página a página até acabar — sem teto fixo que quebre de novo.
  const buscarEventos = async (desde: string, ate?: string): Promise<Linha[]> => {
    const PAGINA = 1000;
    const todos: Linha[] = [];
    for (let i = 0; ; i++) {
      let q = sb.from("eventos").select("tipo,produto,sessao,origem,created_at")
        .gte("created_at", desde)
        .order("created_at", { ascending: true })
        .range(i * PAGINA, i * PAGINA + PAGINA - 1);
      if (ate) q = q.lt("created_at", ate);
      const { data, error } = await q;
      if (error || !data?.length) break;
      todos.push(...(data as Linha[]));
      if (data.length < PAGINA) break;
    }
    return todos;
  };

  const carregar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    // Hoje/Ontem usam o dia do navegador (meia-noite local). Hoje compara com
    // ontem até o mesmo horário; Ontem compara com anteontem inteiro.
    const DIA = 86400000;
    const meiaNoite = new Date(); meiaNoite.setHours(0, 0, 0, 0);
    let inicio: Date, fim: Date | null = null, antInicio: Date, antFim: Date;
    if (dias === "hoje") {
      inicio = meiaNoite;
      antInicio = new Date(meiaNoite.getTime() - DIA); antFim = new Date(Date.now() - DIA);
    } else if (dias === "ontem") {
      inicio = new Date(meiaNoite.getTime() - DIA); fim = meiaNoite;
      antInicio = new Date(meiaNoite.getTime() - 2 * DIA); antFim = inicio;
    } else {
      const janela = Number(dias) * DIA;
      inicio = dias === "0" ? new Date(0) : new Date(Date.now() - janela);
      antInicio = new Date(inicio.getTime() - janela); antFim = inicio;
    }
    const desde = inicio.toISOString();
    const ate = fim?.toISOString();

    let qLeads = sb.from("leads").select("id", { count: "exact", head: true })
      .neq("status", "legado").gte("created_at", desde);
    if (ate) qLeads = qLeads.lt("created_at", ate);

    const [ev, evAnt, ld, em, fb, prod] = await Promise.all([
      buscarEventos(desde, ate),
      dias === "0" ? Promise.resolve([] as Linha[]) : buscarEventos(antInicio.toISOString(), antFim.toISOString()),
      qLeads,
      buscarTodas<EmailLinha>(() => sb.from("email_send_log")
        .select("id,template_name,status,recipient_email,opened_at,created_at,metadata")
        .neq("status", "pending")
        // Só e-mails a partir do início do Hub Central (exclui toda a era Hub Empresarial)
        .gte("created_at", desde > HUB_CENTRAL_INICIO ? desde : HUB_CENTRAL_INICIO)
        .lt("created_at", ate ?? "9999-12-31")
        .order("created_at", { ascending: false })
        .order("id")).catch(() => [] as EmailLinha[]),

      buscarTodas<{ avaliacao: number | null; pagina: string | null }>(() =>
        sb.from("feedbacks").select("avaliacao,pagina").order("created_at").order("id")).catch(() => []),
      sb.from("produtos").select("slug,nome"),
    ]);

    setEventos(ev);
    setAnteriores(evAnt);
    setLeadsTotal(ld.count ?? 0);
    setEmails(em);

    const acc: Record<string, number[]> = {};
    for (const f of fb) {
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

  // Atualizar manual: recarrega tudo sem apagar a tela — só o botão indica o estado.
  const atualizar = async () => {
    setAtualizando(true);
    try { await carregar(true); } finally { setAtualizando(false); }
  };

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

  // filtro client-side: o seletor isola um produto; sem filtro, mostra só os mais clicados
  const TOP_PRODUTOS = 6;
  const produtoGrafico = slugFiltro
    ? porProduto.filter((p) => p.slug === slugFiltro)
    : verTodosProdutos
      ? porProduto
      : porProduto.slice(0, TOP_PRODUTOS);

  const periodoRotulo = dias === "0" ? "tudo" : dias === "hoje" || dias === "ontem" ? dias : `${dias}d`;

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

  // Cada disparo agrupado por dia + origem + produto: dá pra ler quando cada e-mail saiu.
  const porDisparo = Object.values(
    emails.reduce(
      (
        acc: Record<string, { dia: string; origem: Origem; produto: string; enviados: number; falhas: number; abertos: number; rastreados: number }>,
        e,
      ) => {
        const dia = chaveDia(e.created_at);
        const origem = origemDe(e.template_name);
        const produto = (e.metadata?.produto || "").trim();
        const k = `${dia}|${origem}|${produto}`;
        acc[k] ??= { dia, origem, produto, enviados: 0, falhas: 0, abertos: 0, rastreados: 0 };
        if (e.status === "sent") {
          acc[k].enviados++;
          if (temRastreio(e)) {
            acc[k].rastreados++;
            if (e.opened_at) acc[k].abertos++;
          }
        } else acc[k].falhas++;
        return acc;
      },
      {},
    ),
  ).sort((a, b) => (a.dia === b.dia ? b.enviados - a.enviados : b.dia.localeCompare(a.dia)));

  // Dias que tiveram disparo — viram marcação no calendário e opção de filtro.
  const diasComDisparo = Array.from(new Set(porDisparo.map((d) => d.dia))).sort((a, b) => b.localeCompare(a));
  const diaAtivo = (diaDisparoSel && diasComDisparo.includes(diaDisparoSel) ? diaDisparoSel : diasComDisparo[0]) ?? null;
  const disparosVisiveis = porDisparo.filter((d) => d.dia === diaAtivo);



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
  ] as { rot: string; val: number; ant: number; icone: typeof Eye; sub: string; exib?: string; pp?: number | null }[];
  // Conversão de ponta a ponta (leads ÷ visitas); variação em pontos percentuais
  const conv = visitas > 0 ? (leadsEv / visitas) * 100 : 0;
  const convAnt = anterior.visitas > 0 ? (anterior.leads / anterior.visitas) * 100 : null;
  etapas.push({
    rot: "Taxa de conversão", val: conv, ant: 0, icone: Percent,
    sub: `${leadsEv} leads de ${visitas} visitas`,
    exib: `${conv.toFixed(1).replace(".", ",")}%`,
    pp: convAnt === null ? null : Math.round((conv - convAnt) * 10) / 10,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Visitas e cliques vêm do próprio catálogo. O Google Analytics segue medindo tráfego e origem.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm" className="gap-1.5"
            onClick={atualizar} disabled={loading || atualizando}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${atualizando ? "animate-spin" : ""}`} />
            {atualizando ? "Atualizando…" : "Atualizar"}
          </Button>
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
                <span className="text-xs text-muted-foreground">{Object.values(notas).some((n) => n.qtd > 0) ? "cliques, leads, conversão e nota" : "cliques, leads e conversão"}</span>
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {etapas.map((e) => {
              const Icone = e.icone;
              const v = !comparavel ? null : e.exib !== undefined ? (e.pp ?? null) : variacao(e.val, e.ant);
              return (
                <Card key={e.rot}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icone className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider font-medium">{e.rot}</span>
                    </div>
                    <p className="mt-2 font-display text-4xl leading-none text-foreground tabular-nums">{e.exib ?? e.val}</p>
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
                              {v > 0 ? "+" : ""}{e.exib !== undefined ? `${String(v).replace(".", ",")} p.p.` : `${v}%`}
                            </span>
                            <span>vs. {dias === "hoje" ? "ontem no mesmo horário" : dias === "ontem" ? "anteontem" : `${dias} dias anteriores`}</span>
                          </>
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <TrafegoOrigem eventos={eventos} aoVivo={dias !== "ontem"} />

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
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={slugFiltro ?? "todos"}
                      onValueChange={(v) => setSlugFiltro(v === "todos" ? null : v)}
                    >
                      <SelectTrigger className="h-8 w-64 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-80">
                        <SelectItem value="todos">Todos os produtos ({porProduto.length})</SelectItem>
                        {porProduto.map((p) => (
                          <SelectItem key={p.slug} value={p.slug}>
                            {p.produto} · {p.cliques} clique{p.cliques === 1 ? "" : "s"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {slugFiltro ? (
                      <>
                        {(notas[slugFiltro]?.qtd ?? 0) > 0 && (
                          <Badge variant="outline" className="gap-1 text-yellow-400">
                            <Star className="w-3 h-3 fill-yellow-400" />
                            {notas[slugFiltro].media.toFixed(1)}
                            <span className="text-muted-foreground">({notas[slugFiltro].qtd})</span>
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSlugFiltro(null)}>
                          Limpar filtro
                        </Button>
                      </>
                    ) : porProduto.length > TOP_PRODUTOS ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 text-xs text-muted-foreground"
                        onClick={() => setVerTodosProdutos((v) => !v)}
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${verTodosProdutos ? "rotate-180" : ""}`} />
                        {verTodosProdutos
                          ? `Ver só os ${TOP_PRODUTOS} mais clicados`
                          : `Ver todos (${porProduto.length - TOP_PRODUTOS} a mais)`}
                      </Button>
                    ) : null}
                  </div>
                  {!slugFiltro && !verTodosProdutos && porProduto.length > TOP_PRODUTOS && (
                    <p className="text-xs text-muted-foreground">
                      Mostrando os {TOP_PRODUTOS} produtos mais clicados do período.
                    </p>
                  )}
                  <ChartContainer
                    config={grafico}
                    className="w-full"
                    style={{ height: Math.max(160, produtoGrafico.length * 48) }}
                  >
                    <BarChart data={produtoGrafico} layout="vertical" margin={{ left: 8, right: 56 }} barGap={4}>

                      <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="produto"
                        width={140}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: string) => (v.length > 22 ? `${v.slice(0, 21)}…` : v)}
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

                    {/* Data como filtro: calendário marca os dias que tiveram disparo */}
                    <div className="mt-4 border-t border-border/60 pt-4">
                      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Disparos por dia</p>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1.5" disabled={diasComDisparo.length === 0}>
                              <CalendarIcon className="w-3.5 h-3.5" />
                              {diaAtivo ? new Date(`${diaAtivo}T12:00:00Z`).toLocaleDateString("pt-BR") : "Escolher data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={diaAtivo ? new Date(`${diaAtivo}T12:00:00`) : undefined}
                              defaultMonth={diaAtivo ? new Date(`${diaAtivo}T12:00:00`) : undefined}
                              onSelect={(d) => {
                                if (!d) return;
                                const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                                if (diasComDisparo.includes(iso)) setDiaDisparoSel(iso);
                              }}
                              modifiers={{ disparo: diasComDisparo.map((d) => new Date(`${d}T12:00:00`)) }}
                              modifiersClassNames={{ disparo: "font-semibold text-primary underline underline-offset-4" }}
                              disabled={(d) => {
                                const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                                return !diasComDisparo.includes(iso);
                              }}
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {disparosVisiveis.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum disparo nesse dia.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                                <th className="py-1.5 pr-3 font-medium">Tipo</th>
                                <th className="py-1.5 pr-3 font-medium">Produto</th>
                                <th className="py-1.5 pr-3 font-medium text-right">Enviados</th>
                                <th className="py-1.5 font-medium text-right">Aberturas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {disparosVisiveis.map((t) => (
                                <tr key={`${t.dia}|${t.origem}|${t.produto}`} className="border-t border-border/40">
                                  <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{ORIGEM_ROTULO[t.origem]}</td>
                                  <td className="py-2 pr-3 text-muted-foreground max-w-[220px] truncate" title={t.produto || "—"}>
                                    {t.produto || "—"}
                                  </td>
                                  <td className="py-2 pr-3 text-right tabular-nums text-foreground">
                                    {t.enviados}
                                    {t.falhas > 0 && <span className="ml-1.5 text-destructive">+{t.falhas} falha{t.falhas === 1 ? "" : "s"}</span>}
                                  </td>
                                  <td className="py-2 text-right tabular-nums whitespace-nowrap">
                                    {t.rastreados > 0 ? (
                                      <span className={t.rastreados >= MIN_AMOSTRA_ABERTURA ? "text-primary" : "text-muted-foreground"}>
                                        {t.abertos} ({pct(t.abertos, t.rastreados)}%)
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">sem rastreio</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
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
