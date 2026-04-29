import { ReportPayloadBase } from "@/components/relatorios/SendReportDialog";

const fmtBRL = (v: number) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return "—"; }
};

// ===== RH =====
interface ColaboradorRH { id: string; name: string; department: string | null; status: string; salary: number | null; }
export function buildRHPayload(colaboradores: ColaboradorRH[]): ReportPayloadBase {
  const ativos = colaboradores.filter(c => c.status === "ativo");
  const folha = ativos.reduce((s, c) => s + Number(c.salary || 0), 0);
  const salarioMedio = ativos.length > 0 ? Math.round(folha / ativos.length) : 0;
  const deptMap: Record<string, number> = {};
  ativos.forEach(c => { const d = c.department || "Sem departamento"; deptMap[d] = (deptMap[d] || 0) + 1; });

  return {
    modulo: "rh",
    secao: "analise-rh",
    titulo: "Análise de RH",
    subtitulo: "Visão consolidada de equipe",
    sections: [
      {
        title: "Indicadores de RH",
        kpis: [
          { label: "Headcount Ativo", value: String(ativos.length) },
          { label: "Total de Colaboradores", value: String(colaboradores.length) },
          { label: "Folha Salarial", value: fmtBRL(folha) },
          { label: "Salário Médio", value: fmtBRL(salarioMedio) },
        ],
      },
      ...(Object.keys(deptMap).length > 0 ? [{
        title: "Distribuição por Departamento",
        rows: { columns: ["Departamento", "Colaboradores"], data: Object.entries(deptMap).map(([d, n]) => [d, String(n)]) },
      }] : []),
    ],
  };
}

// ===== Marketing =====
interface CampanhaMkt { id: string; name: string; budget: number | null; platforms: string | null; status: string; start_date: string | null; end_date: string | null; }
export function buildMarketingPayload(campanhas: CampanhaMkt[]): ReportPayloadBase {
  const totalBudget = campanhas.reduce((s, c) => s + Number(c.budget || 0), 0);
  const ativas = campanhas.filter(c => c.status === "ativa").length;
  const platMap: Record<string, { count: number; budget: number }> = {};
  campanhas.forEach(c => {
    const p = c.platforms || "Outros";
    if (!platMap[p]) platMap[p] = { count: 0, budget: 0 };
    platMap[p].count++; platMap[p].budget += Number(c.budget || 0);
  });

  return {
    modulo: "marketing",
    secao: "analise-marketing",
    titulo: "Análise de Marketing",
    subtitulo: "Performance de campanhas",
    sections: [
      {
        title: "Indicadores de Marketing",
        kpis: [
          { label: "Total de Campanhas", value: String(campanhas.length) },
          { label: "Campanhas Ativas", value: String(ativas) },
          { label: "Orçamento Total", value: fmtBRL(totalBudget) },
        ],
      },
      ...(Object.keys(platMap).length > 0 ? [{
        title: "Por Plataforma",
        rows: {
          columns: ["Plataforma", "Campanhas", "Orçamento"],
          data: Object.entries(platMap).map(([p, v]) => [p, String(v.count), fmtBRL(v.budget)]),
        },
      }] : []),
      ...(campanhas.length > 0 ? [{
        title: "Campanhas",
        rows: {
          columns: ["Nome", "Status", "Orçamento", "Início", "Fim"],
          data: campanhas.slice(0, 30).map(c => [c.name, c.status, fmtBRL(Number(c.budget || 0)), fmtDate(c.start_date), fmtDate(c.end_date)]),
        },
      }] : []),
    ],
  };
}

// ===== Projetos =====
interface ProjetoBI { id: string; name: string; status: string; budget: number | null; start_date: string | null; end_date: string | null; priority: string | null; }
export function buildProjetosPayload(projetos: ProjetoBI[]): ReportPayloadBase {
  const totalBudget = projetos.reduce((s, p) => s + Number(p.budget || 0), 0);
  const concluidos = projetos.filter(p => p.status === "concluido").length;
  const ativos = projetos.filter(p => p.status === "em_andamento").length;
  const now = new Date();
  const criticos = projetos.filter(p => {
    if (!p.end_date || p.status === "concluido") return false;
    const diff = (new Date(p.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 7;
  });

  return {
    modulo: "projetos",
    secao: "analise-projetos",
    titulo: "Análise de Projetos",
    subtitulo: "Status e prazos",
    sections: [
      {
        title: "Indicadores de Projetos",
        kpis: [
          { label: "Total de Projetos", value: String(projetos.length) },
          { label: "Em Andamento", value: String(ativos) },
          { label: "Concluídos", value: String(concluidos) },
          { label: "Orçamento Total", value: fmtBRL(totalBudget) },
        ],
      },
      ...(criticos.length > 0 ? [{
        title: `Prazos Críticos (${criticos.length})`,
        rows: {
          columns: ["Projeto", "Status", "Prazo"],
          data: criticos.map(p => [p.name, p.status, fmtDate(p.end_date)]),
        },
      }] : []),
      ...(projetos.length > 0 ? [{
        title: "Projetos",
        rows: {
          columns: ["Nome", "Status", "Orçamento", "Início", "Fim"],
          data: projetos.slice(0, 30).map(p => [p.name, p.status, fmtBRL(Number(p.budget || 0)), fmtDate(p.start_date), fmtDate(p.end_date)]),
        },
      }] : []),
    ],
  };
}

// ===== Clientes =====
interface ClienteBI { id: string; nome: string; status: string; valor_total: number | null; segmento: string | null; }
export function buildClientesPayload(clientes: ClienteBI[]): ReportPayloadBase {
  const ativos = clientes.filter(c => c.status === "ativo");
  const receitaAtivos = ativos.reduce((s, c) => s + Number(c.valor_total || 0), 0);
  const segMap: Record<string, { count: number; total: number }> = {};
  clientes.forEach(c => {
    const s = c.segmento || "Não definido";
    if (!segMap[s]) segMap[s] = { count: 0, total: 0 };
    segMap[s].count++; segMap[s].total += Number(c.valor_total || 0);
  });
  const top = [...clientes].sort((a, b) => Number(b.valor_total || 0) - Number(a.valor_total || 0)).slice(0, 10);

  return {
    modulo: "clientes",
    secao: "analise-clientes",
    titulo: "Análise de Clientes",
    subtitulo: "Carteira e receita",
    sections: [
      {
        title: "Indicadores de Clientes",
        kpis: [
          { label: "Total de Clientes", value: String(clientes.length) },
          { label: "Clientes Ativos", value: String(ativos.length) },
          { label: "Receita (Ativos)", value: fmtBRL(receitaAtivos) },
        ],
      },
      ...(Object.keys(segMap).length > 0 ? [{
        title: "Por Segmento",
        rows: {
          columns: ["Segmento", "Clientes", "Valor Total"],
          data: Object.entries(segMap).map(([s, v]) => [s, String(v.count), fmtBRL(v.total)]),
        },
      }] : []),
      ...(top.length > 0 ? [{
        title: "Top 10 Clientes",
        rows: {
          columns: ["Cliente", "Status", "Valor"],
          data: top.map(c => [c.nome, c.status, fmtBRL(Number(c.valor_total || 0))]),
        },
      }] : []),
    ],
  };
}

// ===== Tarefas =====
interface TarefaBI { id: string; title: string; status: string; priority: string | null; category: string | null; due_date: string | null; completed_at: string | null; }
export function buildTarefasPayload(tarefas: TarefaBI[]): ReportPayloadBase {
  const todayStr = new Date().toISOString().split("T")[0];
  const pendentes = tarefas.filter(t => t.status === "pendente").length;
  const emAndamento = tarefas.filter(t => t.status === "em_andamento").length;
  const concluidas = tarefas.filter(t => t.status === "concluida").length;
  const vencidas = tarefas.filter(t => t.due_date && t.due_date < todayStr && t.status !== "concluida").length;
  const catMap: Record<string, number> = {};
  tarefas.forEach(t => { const c = t.category || "Sem categoria"; catMap[c] = (catMap[c] || 0) + 1; });

  return {
    modulo: "tarefas",
    secao: "analise-tarefas",
    titulo: "Análise de Atividades",
    subtitulo: "Status e produtividade",
    sections: [
      {
        title: "Indicadores de Atividades",
        kpis: [
          { label: "Total", value: String(tarefas.length) },
          { label: "Em Aberto", value: String(pendentes + emAndamento) },
          { label: "Concluídas", value: String(concluidas) },
          { label: "Vencidas", value: String(vencidas) },
        ],
      },
      ...(Object.keys(catMap).length > 0 ? [{
        title: "Por Categoria",
        rows: {
          columns: ["Categoria", "Quantidade"],
          data: Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([c, n]) => [c, String(n)]),
        },
      }] : []),
    ],
  };
}

// ===== Processo individual =====
interface ProcessoStep { id: string; title: string; description?: string; responsible?: string; duration?: string; }
interface ProcessoBI { id: string; name: string; description?: string | null; department?: string | null; owner?: string | null; status: string; steps: ProcessoStep[]; }
export function buildProcessoPayload(p: ProcessoBI): ReportPayloadBase {
  return {
    modulo: "processos",
    secao: `processo-${p.id}`,
    titulo: `Processo: ${p.name}`,
    subtitulo: p.description || undefined,
    sections: [
      {
        title: "Informações do Processo",
        kpis: [
          { label: "Departamento", value: p.department || "—" },
          { label: "Responsável", value: p.owner || "—" },
          { label: "Status", value: p.status },
          { label: "Total de Etapas", value: String(p.steps.length) },
        ],
      },
      ...(p.steps.length > 0 ? [{
        title: "Etapas do Processo",
        rows: {
          columns: ["#", "Etapa", "Descrição", "Responsável", "Duração"],
          data: p.steps.map((s, i) => [String(i + 1), s.title, s.description || "—", s.responsible || "—", s.duration || "—"]),
        },
      }] : []),
    ],
  };
}
