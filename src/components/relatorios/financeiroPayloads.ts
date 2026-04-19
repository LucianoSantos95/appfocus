import { ReportPayloadBase } from "@/components/relatorios/SendReportDialog";

const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

interface MonthlyData { month: string; receitas: number; despesas: number; lucro: number; margem: number; }
interface MonthDetail {
  saldoInicial: number; recPagas: number; despPagas: number; liquidoMes: number;
  saldoAtual: number; recPendentes: number; despPendentes: number; saldoPendente: number;
  pendentes: { date: string | null; type: string; value: number; description?: string | null }[];
}
interface Totals { rec: number; desp: number; lucro: number; margem: number; ticketMedio: number; }
interface DRE { receitaBruta: number; totalDespesas: number; lucroLiq: number; }
interface Categoria { name: string; value: number; }
interface Inadimplencia { total: number; pct: number; count: number; }

export function buildMonthDetailPayload(monthLabel: string, year: number, d: MonthDetail): ReportPayloadBase {
  return {
    modulo: "financeiro",
    secao: `detalhamento-${monthLabel.toLowerCase().replace(/\s+/g, "-")}`,
    titulo: "Detalhamento Financeiro do Mês",
    subtitulo: monthLabel,
    periodo: monthLabel,
    sections: [
      {
        title: "Resumo do Mês",
        kpis: [
          { label: "Saldo Inicial", value: fmtBRL(d.saldoInicial) },
          { label: "Saldo Atual", value: fmtBRL(d.saldoAtual) },
          { label: "Realizados (líquido)", value: fmtBRL(d.liquidoMes) },
          { label: "A Efetuar (líquido)", value: fmtBRL(d.saldoPendente) },
          { label: "Receitas Pagas", value: fmtBRL(d.recPagas) },
          { label: "Despesas Pagas", value: fmtBRL(d.despPagas) },
          { label: "Receitas Pendentes", value: fmtBRL(d.recPendentes) },
          { label: "Despesas Pendentes", value: fmtBRL(d.despPendentes) },
        ],
      },
      ...(d.pendentes.length > 0 ? [{
        title: `Pagamentos Pendentes (${d.pendentes.length})`,
        rows: {
          columns: ["Data", "Descrição", "Tipo", "Valor"],
          data: d.pendentes.map(p => [
            p.date ? `${p.date.substring(8, 10)}/${p.date.substring(5, 7)}` : "—",
            p.description || "(sem descrição)",
            p.type,
            `${p.type === "receita" ? "+" : "-"} ${fmtBRL(Number(p.value))}`,
          ]),
        },
      }] : []),
    ],
  };
}

export function buildAnnualOverviewPayload(year: number, totals: Totals, monthly: MonthlyData[]): ReportPayloadBase {
  return {
    modulo: "financeiro",
    secao: `visao-anual-${year}`,
    titulo: "Visão Anual Financeira",
    subtitulo: `Ano ${year}`,
    periodo: String(year),
    sections: [
      {
        title: "Indicadores do Ano",
        kpis: [
          { label: "Receita Total", value: fmtBRL(totals.rec) },
          { label: "Despesas Totais", value: fmtBRL(totals.desp) },
          { label: "Lucro Líquido", value: fmtBRL(totals.lucro) },
          { label: "Margem de Lucro", value: `${totals.margem}%` },
          { label: "Ticket Médio", value: fmtBRL(totals.ticketMedio) },
        ],
      },
      {
        title: "Resultado Mensal",
        rows: {
          columns: ["Mês", "Receitas", "Despesas", "Lucro", "Margem"],
          data: monthly.map(m => [m.month, fmtBRL(m.receitas), fmtBRL(m.despesas), fmtBRL(m.lucro), `${m.margem}%`]),
        },
      },
    ],
  };
}

export function buildDREPayload(year: number, dre: DRE, topCategorias: Categoria[]): ReportPayloadBase {
  return {
    modulo: "financeiro",
    secao: `dre-${year}`,
    titulo: "DRE Simplificado",
    subtitulo: `Demonstração de Resultados — ${year}`,
    periodo: String(year),
    sections: [
      {
        title: "DRE Resumido",
        kpis: [
          { label: "Receita Bruta", value: fmtBRL(dre.receitaBruta) },
          { label: "Total de Despesas", value: fmtBRL(dre.totalDespesas) },
          { label: "Resultado Líquido", value: fmtBRL(dre.lucroLiq) },
        ],
      },
      ...(topCategorias.length > 0 ? [{
        title: "Top Categorias de Despesa",
        rows: {
          columns: ["Categoria", "Valor"],
          data: topCategorias.map(c => [c.name, fmtBRL(c.value)]),
        },
      }] : []),
    ],
  };
}

export function buildTopCategoriasPayload(year: number, top: Categoria[]): ReportPayloadBase {
  return {
    modulo: "financeiro",
    secao: `top-despesas-${year}`,
    titulo: "Top 5 Categorias de Despesa",
    subtitulo: `Ano ${year}`,
    periodo: String(year),
    sections: [{
      title: "Maiores Despesas por Categoria",
      rows: {
        columns: ["Categoria", "Valor"],
        data: top.map(c => [c.name, fmtBRL(c.value)]),
      },
    }],
  };
}

export function buildInadimplenciaPayload(year: number, inad: Inadimplencia, totalRec: number): ReportPayloadBase {
  return {
    modulo: "financeiro",
    secao: `inadimplencia-${year}`,
    titulo: "Relatório de Inadimplência",
    subtitulo: `Ano ${year}`,
    periodo: String(year),
    sections: [{
      title: "Receitas Vencidas e Pendentes",
      kpis: [
        { label: "Total Inadimplente", value: fmtBRL(inad.total) },
        { label: "Receitas Vencidas", value: String(inad.count) },
        { label: "% da Receita Total", value: `${inad.pct}%` },
        { label: "Receita Total no Ano", value: fmtBRL(totalRec) },
      ],
      notes: inad.count > 0 ? "Recomenda-se acionar a régua de cobrança para os clientes com receitas vencidas." : undefined,
    }],
  };
}

export function buildFluxoCaixaPayload(year: number, monthly: MonthlyData[]): ReportPayloadBase {
  return {
    modulo: "financeiro",
    secao: `fluxo-caixa-${year}`,
    titulo: "Fluxo de Caixa Mensal",
    subtitulo: `Ano ${year}`,
    periodo: String(year),
    sections: [{
      title: "Receitas vs Despesas",
      rows: {
        columns: ["Mês", "Receitas", "Despesas", "Saldo"],
        data: monthly.map(m => [m.month, fmtBRL(m.receitas), fmtBRL(m.despesas), fmtBRL(m.lucro)]),
      },
    }],
  };
}

export function buildCompletePayload(
  year: number,
  totals: Totals, monthly: MonthlyData[], dre: DRE,
  topCategorias: Categoria[], inad: Inadimplencia, monthDetail: MonthDetail, monthLabel: string,
): ReportPayloadBase {
  return {
    modulo: "financeiro",
    secao: `relatorio-completo-${year}`,
    titulo: "Relatório Financeiro Completo",
    subtitulo: `Análise consolidada — ${year}`,
    periodo: String(year),
    sections: [
      {
        title: "Indicadores Anuais",
        kpis: [
          { label: "Receita Total", value: fmtBRL(totals.rec) },
          { label: "Despesas Totais", value: fmtBRL(totals.desp) },
          { label: "Lucro Líquido", value: fmtBRL(totals.lucro) },
          { label: "Margem de Lucro", value: `${totals.margem}%` },
        ],
      },
      {
        title: `Detalhamento — ${monthLabel}`,
        kpis: [
          { label: "Saldo Inicial", value: fmtBRL(monthDetail.saldoInicial) },
          { label: "Saldo Atual", value: fmtBRL(monthDetail.saldoAtual) },
          { label: "Realizados", value: fmtBRL(monthDetail.liquidoMes) },
          { label: "A Efetuar", value: fmtBRL(monthDetail.saldoPendente) },
        ],
      },
      {
        title: "DRE Simplificado",
        kpis: [
          { label: "Receita Bruta", value: fmtBRL(dre.receitaBruta) },
          { label: "Despesas Totais", value: fmtBRL(dre.totalDespesas) },
          { label: "Resultado Líquido", value: fmtBRL(dre.lucroLiq) },
        ],
      },
      {
        title: "Resultado Mensal",
        rows: {
          columns: ["Mês", "Receitas", "Despesas", "Lucro", "Margem"],
          data: monthly.map(m => [m.month, fmtBRL(m.receitas), fmtBRL(m.despesas), fmtBRL(m.lucro), `${m.margem}%`]),
        },
      },
      ...(topCategorias.length > 0 ? [{
        title: "Top Categorias de Despesa",
        rows: {
          columns: ["Categoria", "Valor"],
          data: topCategorias.map(c => [c.name, fmtBRL(c.value)]),
        },
      }] : []),
      {
        title: "Inadimplência",
        kpis: [
          { label: "Total Vencido", value: fmtBRL(inad.total) },
          { label: "Qtd Receitas", value: String(inad.count) },
          { label: "% da Receita", value: `${inad.pct}%` },
        ],
      },
    ],
  };
}
