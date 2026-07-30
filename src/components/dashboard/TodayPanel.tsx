import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle, Clock, TrendingUp, CheckCircle2, Users, UserCheck,
  Sparkles, CircleDollarSign, FolderClock, CalendarCheck, ArrowRight,
  Flame, CalendarRange, type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
import { useTransacoes } from "@/hooks/useTransacoes";
import { useTarefas } from "@/hooks/useTarefas";
import { useProjetos } from "@/hooks/useProjetos";
import { useClientes } from "@/hooks/useClientes";
import { useDailyStreak } from "@/hooks/useDailyStreak";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_TAG } from "@/lib/demo-seed";
import { Button } from "@/components/ui/button";

// TodayPanel — o "gancho diário" (modelo Hooked). Recompensa variável: cada dia
// mostra um mix diferente de sinais puxados dos dados reais do usuário. Sexta vira
// "Revisão da semana". Fica no topo do dashboard, acima do DashboardHero.

const sb = supabase as any;

type Cat = "red" | "green" | "amber" | "primary";
interface Signal {
  key: string;
  cat: Cat;
  tag: string;
  icon: LucideIcon;
  node: ReactNode;
  path: string;
}

const catStyles: Record<Cat, { box: string; tag: string }> = {
  red: { box: "bg-destructive/10 text-destructive", tag: "text-destructive" },
  green: { box: "bg-success/10 text-success", tag: "text-success" },
  amber: { box: "bg-warning/10 text-warning", tag: "text-warning" },
  primary: { box: "bg-primary/10 text-primary", tag: "text-primary" },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
function firstName(user: any) {
  const n = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "";
  return String(n).split(/[ @]/)[0] || "";
}
function dayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
function brl(n: number) {
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}
const num = (v: ReactNode) => <span className="font-mono font-semibold tracking-tight">{v}</span>;
const notDemo = (s?: string | null) => !(s || "").includes(DEMO_TAG);
function rotate<T>(arr: T[], seed: number): T[] {
  if (arr.length < 2) return arr;
  const k = seed % arr.length;
  return arr.slice(k).concat(arr.slice(0, k));
}

const PLAN_LABEL: Record<string, string> = {
  gratuito: "grátis", plus: "Plus", pro: "Pro", enterprise: "Enterprise",
};
const SEGMENT_LABEL: Record<string, string> = {
  agencia: "Agência", consultoria: "Consultoria", freelancer: "Freelancer", pme: "PME",
};

export function TodayPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan } = usePlan();
  const streak = useDailyStreak();
  const { transacoes, isLoading: lt } = useTransacoes() as any;
  const { tarefas, isLoading: lk } = useTarefas() as any;
  const { projetos, isLoading: lp } = useProjetos() as any;
  const { clientes, isLoading: lc } = useClientes() as any;

  const [segment, setSegment] = useState<string>("");
  const [agenda, setAgenda] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prof } = await supabase.from("profiles").select("segment").eq("user_id", user.id).maybeSingle();
      setSegment(((prof as any)?.segment || "").toLowerCase());
      const { data: ag } = await sb.from("agenda_items").select("title,date,time,type,priority").eq("user_id", user.id).eq("date", dayStr(0));
      setAgenda(ag || []);
    })();
  }, [user]);

  const loading = (lt || lk || lp || lc) && !(transacoes?.length || tarefas?.length || projetos?.length || clientes?.length);

  const isFriday = new Date().getDay() === 5;
  const today = dayStr(0);
  const yesterday = dayStr(-1);
  const in3 = dayStr(3);
  const weekAgo = dayStr(-7);
  const twoWeeksAgo = dayStr(-14);
  const thirtyAgo = dayStr(-30);
  const seed = new Date().getDate() + new Date().getMonth() * 31;

  // Dados reais (sem [DEMO])
  const tx = useMemo(() => (transacoes || []).filter((t: any) => notDemo(t.description)), [transacoes]);
  const tk = useMemo(() => (tarefas || []).filter((t: any) => notDemo(t.title)), [tarefas]);
  const pj = useMemo(() => (projetos || []).filter((p: any) => notDemo(p.name)), [projetos]);
  const cl = useMemo(() => (clientes || []).filter((c: any) => notDemo(c.nome)), [clientes]);
  const ag = useMemo(() => (agenda || []).filter((a: any) => notDemo(a.title)), [agenda]);

  const hasRealData = tx.length || tk.length || pj.length || cl.length || ag.length;

  const { signals, weekly } = useMemo(() => {
    // ---- pools ----
    const criticals: Signal[] = [];
    const wins: Signal[] = [];
    const opps: Signal[] = [];
    const insights: Signal[] = [];

    // 🔴 Contas a receber vencidas / vencendo
    const receber = tx.filter((t: any) => t.type === "receita" && t.status === "pendente" && t.date);
    const recVencidas = receber.filter((t: any) => t.date < today);
    const recHoje = receber.filter((t: any) => t.date === today);
    const recBreve = receber.filter((t: any) => t.date > today && t.date <= in3);
    if (recVencidas.length) {
      const v = recVencidas.reduce((s: number, t: any) => s + Number(t.value), 0);
      criticals.push({ key: "rec-venc", cat: "red", tag: "Vencido", icon: CircleDollarSign, path: "/financas",
        node: <>{num(recVencidas.length)} conta{recVencidas.length > 1 ? "s" : ""} a receber vencida{recVencidas.length > 1 ? "s" : ""} — {num(brl(v))}</> });
    } else if (recHoje.length) {
      const v = recHoje.reduce((s: number, t: any) => s + Number(t.value), 0);
      criticals.push({ key: "rec-hoje", cat: "red", tag: "Vence hoje", icon: CircleDollarSign, path: "/financas",
        node: <>{num(recHoje.length)} conta{recHoje.length > 1 ? "s" : ""} a receber vence{recHoje.length > 1 ? "m" : ""} hoje — {num(brl(v))}</> });
    } else if (recBreve.length) {
      const v = recBreve.reduce((s: number, t: any) => s + Number(t.value), 0);
      opps.push({ key: "rec-breve", cat: "amber", tag: "A receber", icon: CircleDollarSign, path: "/financas",
        node: <>{num(recBreve.length)} conta{recBreve.length > 1 ? "s" : ""} a receber nos próximos dias — {num(brl(v))}</> });
    }

    // 🔴 Contas a pagar vencidas / hoje
    const pagar = tx.filter((t: any) => t.type === "despesa" && t.status === "pendente" && t.date && t.date <= today);
    if (pagar.length) {
      const v = pagar.reduce((s: number, t: any) => s + Number(t.value), 0);
      criticals.push({ key: "pagar", cat: "red", tag: "A pagar", icon: CircleDollarSign, path: "/financas",
        node: <>{num(pagar.length)} conta{pagar.length > 1 ? "s" : ""} a pagar vencida{pagar.length > 1 ? "s" : ""} — {num(brl(v))}</> });
    }

    // 🔴 Tarefas com prazo
    const tPend = tk.filter((t: any) => t.status !== "concluida" && t.due_date);
    const tVenc = tPend.filter((t: any) => t.due_date < today).length;
    const tHoje = tPend.filter((t: any) => t.due_date === today).length;
    if (tVenc > 0) {
      criticals.push({ key: "tar-venc", cat: "red", tag: "Atrasada", icon: Clock, path: "/atividades",
        node: <>{num(tVenc)} tarefa{tVenc > 1 ? "s" : ""} vencida{tVenc > 1 ? "s" : ""}</> });
    }
    if (tHoje > 0) {
      criticals.push({ key: "tar-hoje", cat: "red", tag: "Prazo hoje", icon: Clock, path: "/atividades",
        node: <>{num(tHoje)} tarefa{tHoje > 1 ? "s" : ""} vence{tHoje > 1 ? "m" : ""} hoje</> });
    }

    // 🔴 Projetos com deadline ≤ 2 dias
    const projPrazo = pj.filter((p: any) => p.end_date && p.status !== "concluido" && p.status !== "cancelado" && p.end_date >= today && p.end_date <= in3);
    projPrazo.slice(0, 1).forEach((p: any) => {
      const dias = Math.max(0, Math.round((new Date(p.end_date).getTime() - new Date(today).getTime()) / 86400000));
      const nome = String(p.name).replace(DEMO_TAG, "").trim();
      criticals.push({ key: "proj-" + p.id, cat: "red", tag: "Entrega", icon: FolderClock, path: "/projetos",
        node: <>Projeto <b className="font-medium">{nome}</b> entrega {dias === 0 ? "hoje" : dias === 1 ? "amanhã" : <>em {num(dias + " dias")}</>}</> });
    });

    // 🔴 Compromissos de hoje
    ag.slice(0, 1).forEach((a: any, i: number) => {
      criticals.push({ key: "ag-" + i, cat: "red", tag: "Agenda", icon: CalendarCheck, path: "/",
        node: <><b className="font-medium">{a.title}</b>{a.time ? <> às {num(String(a.time).slice(0, 5))}</> : ""}</> });
    });

    // 🟢 Caixa recebido na semana vs. anterior
    const recebidoSem = tx.filter((t: any) => t.type === "receita" && t.status === "pago" && t.date > weekAgo && t.date <= today)
      .reduce((s: number, t: any) => s + Number(t.value), 0);
    const recebidoAnt = tx.filter((t: any) => t.type === "receita" && t.status === "pago" && t.date > twoWeeksAgo && t.date <= weekAgo)
      .reduce((s: number, t: any) => s + Number(t.value), 0);
    if (recebidoSem > 0 && recebidoAnt > 0) {
      const pct = Math.round(((recebidoSem - recebidoAnt) / recebidoAnt) * 100);
      if (pct >= 0) {
        wins.push({ key: "caixa-win", cat: "green", tag: "Vitória", icon: TrendingUp, path: "/financas",
          node: <>Recebido na semana {num("+" + pct + "%")} — {num(brl(recebidoSem))}</> });
      } else {
        insights.push({ key: "caixa-down", cat: "amber", tag: "Atenção", icon: TrendingUp, path: "/financas",
          node: <>Recebido caiu {num(pct + "%")} vs. semana passada</> });
      }
    } else if (recebidoSem > 0) {
      wins.push({ key: "caixa-abs", cat: "green", tag: "Vitória", icon: TrendingUp, path: "/financas",
        node: <>{num(brl(recebidoSem))} recebidos nesta semana</> });
    }

    // 🟢 Tarefas concluídas ontem
    const concOntem = tk.filter((t: any) => t.completed_at && String(t.completed_at).slice(0, 10) === yesterday).length;
    if (concOntem > 0) {
      wins.push({ key: "conc-ontem", cat: "green", tag: "Vitória", icon: CheckCircle2, path: "/atividades",
        node: <>Você concluiu {num(concOntem)} tarefa{concOntem > 1 ? "s" : ""} ontem</> });
    }

    // 🟡 Clientes sem contato 30d+
    const inativos = cl.filter((c: any) => c.status === "ativo" && (!c.ultima_interacao || c.ultima_interacao < thirtyAgo)).length;
    if (inativos > 0) {
      opps.push({ key: "cli-inativos", cat: "amber", tag: "Oportunidade", icon: Users, path: "/clientes",
        node: <>{num(inativos)} cliente{inativos > 1 ? "s" : ""} sem contato há {num("30+ dias")}</> });
    }

    // 🟡 Lead quente parado
    const parados = cl.filter((c: any) => c.status === "prospecto" && (c.potencial === "alto" || c.classificacao === "vip")
      && c.ultima_interacao && c.ultima_interacao < dayStr(-4));
    parados.slice(0, 1).forEach((c: any) => {
      const dias = Math.round((new Date(today).getTime() - new Date(c.ultima_interacao).getTime()) / 86400000);
      const nome = String(c.nome).replace(DEMO_TAG, "").trim();
      opps.push({ key: "lead-" + c.id, cat: "amber", tag: "Lead quente", icon: UserCheck, path: "/clientes",
        node: <>Lead <b className="font-medium">{nome}</b> parado há {num(dias + " dias")}</> });
    });

    // 🟣 Insight rotativo — margem/despesa do mês
    const monthStart = today.slice(0, 8) + "01";
    const prevMonthStart = dayStr(0).slice(0, 4) + "-" + String(new Date().getMonth() === 0 ? 12 : new Date().getMonth()).padStart(2, "0") + "-01";
    const despMes = tx.filter((t: any) => t.type === "despesa" && t.date >= monthStart).reduce((s: number, t: any) => s + Number(t.value), 0);
    const despAnt = tx.filter((t: any) => t.type === "despesa" && t.date >= prevMonthStart && t.date < monthStart).reduce((s: number, t: any) => s + Number(t.value), 0);
    if (despAnt > 0 && despMes < despAnt) {
      const pct = Math.round(((despAnt - despMes) / despAnt) * 100);
      insights.push({ key: "desp-down", cat: "primary", tag: "Insight", icon: Sparkles, path: "/financas",
        node: <>Suas despesas caíram {num(pct + "%")} neste mês</> });
    }
    const recMes = tx.filter((t: any) => t.type === "receita" && t.date >= monthStart).reduce((s: number, t: any) => s + Number(t.value), 0);
    if (recMes > 0) {
      insights.push({ key: "rec-mes", cat: "primary", tag: "Insight", icon: Sparkles, path: "/financas",
        node: <>{num(brl(recMes))} de receita registrada no mês</> });
    }

    // ---- Modo Revisão da semana (sexta) ----
    const recSemana = tx.filter((t: any) => t.type === "receita" && t.status === "pago" && t.date > weekAgo && t.date <= today).reduce((s: number, t: any) => s + Number(t.value), 0);
    const despSemana = tx.filter((t: any) => t.type === "despesa" && t.status === "pago" && t.date > weekAgo && t.date <= today).reduce((s: number, t: any) => s + Number(t.value), 0);
    const saldoSemana = recSemana - despSemana;
    const concSemana = tk.filter((t: any) => t.completed_at && String(t.completed_at).slice(0, 10) > weekAgo).length;
    const porDia: Record<string, number> = {};
    tx.forEach((t: any) => { if (t.type === "receita" && t.status === "pago" && t.date > weekAgo) porDia[t.date] = (porDia[t.date] || 0) + Number(t.value); });
    const melhor = Object.entries(porDia).sort((a, b) => b[1] - a[1])[0];
    const propostas = tx.filter((t: any) => t.type === "receita" && t.status === "pendente");
    const propVal = propostas.reduce((s: number, t: any) => s + Number(t.value), 0);

    const weeklyRows: Signal[] = [];
    weeklyRows.push({ key: "w-saldo", cat: saldoSemana >= 0 ? "green" : "red", tag: "Semana fechada", icon: TrendingUp, path: "/financas",
      node: <>Saldo da semana {num((saldoSemana >= 0 ? "+" : "−") + brl(Math.abs(saldoSemana)))} · {num(concSemana)} tarefa{concSemana !== 1 ? "s" : ""} concluída{concSemana !== 1 ? "s" : ""}</> });
    if (melhor) {
      const dLabel = new Date(melhor[0] + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long" });
      weeklyRows.push({ key: "w-melhor", cat: "primary", tag: "Melhor dia", icon: Sparkles, path: "/financas",
        node: <><span className="capitalize">{dLabel}</span> foi o pico: {num(brl(melhor[1]))} recebidos</> });
    }
    if (propostas.length) {
      weeklyRows.push({ key: "w-prop", cat: "amber", tag: "Em jogo", icon: UserCheck, path: "/financas",
        node: <>{num(propostas.length)} proposta{propostas.length > 1 ? "s" : ""} aguardando — {num(brl(propVal))}</> });
    }

    // ---- Composição diária ----
    const daily: Signal[] = [];
    daily.push(...criticals.slice(0, 3));
    const secondary = rotate([...wins, ...opps], seed);
    for (const s of secondary) { if (daily.length >= 4) break; daily.push(s); }
    const rotInsights = rotate(insights, seed);
    if (rotInsights.length && daily.length < 5) daily.push(rotInsights[0]);

    return { signals: daily.slice(0, 5), weekly: weeklyRows };
  }, [tx, tk, pj, cl, ag, today, yesterday, in3, weekAgo, twoWeeksAgo, thirtyAgo, seed]);

  const name = firstName(user);
  const rows = isFriday ? weekly : signals;
  const showEmpty = !loading && rows.length === 0;
  const dateLabel = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  const dateCap = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
  const segLabel = SEGMENT_LABEL[segment] || "";
  const planLabel = PLAN_LABEL[plan] || plan;

  return (
    <div className="rounded-[20px] border border-border/60 bg-card shadow-premium overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border/50">
        <div className="min-w-0">
          <h2 className="font-display text-2xl md:text-[28px] leading-tight tracking-tight text-foreground">
            {isFriday ? <>É sexta{name ? `, ${name}` : ""} <span className="italic gradient-text">— vamos fechar a semana</span></>
                      : <>{greeting()}{name ? `, ` : ""}{name && <span className="italic gradient-text">{name}</span>}</>}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-2 flex-wrap font-mono">
            <span>{isFriday ? "Revisão da semana" : dateCap}</span>
            {segLabel && <><span className="opacity-40">·</span><span>{segLabel}</span></>}
          </p>
        </div>
        {streak !== null && streak > 0 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-warning/10 text-warning px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
            title="Dias seguidos acompanhando seu Hub"
          >
            <Flame className="w-3.5 h-3.5" />
            {streak <= 1 ? "Primeiro dia" : `${streak} dias seguidos`}
          </motion.div>
        )}
      </div>

      {/* Corpo */}
      <div className="px-3 py-2 min-h-[220px]">
        {loading ? (
          <div className="space-y-2 p-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className="w-9 h-9 rounded-[10px] bg-muted/60" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 w-20 rounded bg-muted/60" />
                  <div className="h-3 w-2/3 rounded bg-muted/50" />
                </div>
              </div>
            ))}
          </div>
        ) : showEmpty ? (
          <button onClick={() => navigate("/financas")} className="w-full flex items-center gap-3 rounded-2xl border border-dashed border-border p-4 text-left hover:border-primary/40 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Comece lançando uma movimentação</p>
              <p className="text-xs text-muted-foreground">Seu dia aparece aqui assim que houver dados reais na sua operação.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </button>
        ) : (
          <div className="space-y-1">
            {rows.map((s, i) => {
              const st = catStyles[s.cat];
              const Icon = s.icon;
              return (
                <motion.button
                  key={s.key}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(s.path)}
                  className="group w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-all hover:bg-muted/40 hover:translate-x-[3px]"
                >
                  <div className={`w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0 ${st.box}`}>
                    <Icon className="w-[17px] h-[17px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${st.tag}`}>{s.tag}</p>
                    <p className="text-sm text-foreground leading-snug">{s.node}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="flex items-center justify-between gap-3 flex-wrap px-6 py-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground inline-flex items-center gap-2">
          <CalendarRange className="w-3.5 h-3.5 text-primary" />
          {isFriday ? "Planeje a próxima semana" : "Revisão da semana toda sexta"}
        </p>
        <Button size="sm" onClick={() => navigate(isFriday ? "/relatorios" : "/atividades")} className="gap-1.5 group">
          {isFriday ? "Planejar semana" : "Ver tudo do dia"}
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
