import { supabase } from "@/integrations/supabase/client";
import type { DemoModule } from "@/lib/demo-data";

export const DEMO_TAG = "[DEMO]";

// Once the user clears the demo data, we must never re-seed it (fixes the
// "excluo os exemplos e eles voltam" support ticket).
export const demoClearedKey = (userId: string) => `hub_demo_cleared_${userId}`;
export function isDemoCleared(userId: string): boolean {
  return typeof window !== "undefined" && localStorage.getItem(demoClearedKey(userId)) === "1";
}
export function markDemoCleared(userId: string) {
  if (typeof window !== "undefined") localStorage.setItem(demoClearedKey(userId), "1");
}

function daysFromNow(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Per-segment client lists
// All segments use: 3 ativo + 2 prospecto = 5 clients
// Ativo totals are kept intentionally consistent so ASSISTANT_MESSAGES match
// ---------------------------------------------------------------------------

type SegmentKey = "agencia" | "consultoria" | "freelancer" | "pme";

interface ClienteSeed {
  nome: string; email: string; telefone: string;
  segmento: string; status: "ativo" | "prospecto" | "inativo";
  valor_total: number; tipo_contrato: string;
  classificacao: "vip" | "padrao" | "novo" | "em_risco";
  potencial: "alto" | "medio" | "baixo";
}

const CLIENTES: Record<SegmentKey, ClienteSeed[]> = {
  agencia: [
    { nome: `Mar Azul Academia ${DEMO_TAG}`,      email: "contato@marazul.fit",       telefone: "(11) 99991-0001", segmento: "Saúde/Bem-estar", status: "ativo",     valor_total: 8000, tipo_contrato: "Social Media",       classificacao: "vip",     potencial: "alto" },
    { nome: `Loja Centro Modas ${DEMO_TAG}`,       email: "vendas@lojacentro.com.br",  telefone: "(11) 99992-0002", segmento: "Varejo/Moda",     status: "ativo",     valor_total: 7500, tipo_contrato: "Google Ads + SEO",  classificacao: "padrao",  potencial: "medio" },
    { nome: `Restaurante Sabor Certo ${DEMO_TAG}`, email: "rh@saborcerto.com.br",      telefone: "(11) 99993-0003", segmento: "Gastronomia",     status: "ativo",     valor_total: 4800, tipo_contrato: "Criação Conteúdo",  classificacao: "padrao",  potencial: "medio" },
    { nome: `Clínica Bem Estar ${DEMO_TAG}`,       email: "agenda@clinicabem.com",     telefone: "(11) 99994-0004", segmento: "Saúde",           status: "prospecto", valor_total: 0,    tipo_contrato: "A definir",         classificacao: "novo",    potencial: "alto" },
    { nome: `Boutique Amarela Moda ${DEMO_TAG}`,   email: "oi@boutiqueamarela.com",    telefone: "(11) 99995-0005", segmento: "Moda",            status: "prospecto", valor_total: 0,    tipo_contrato: "A definir",         classificacao: "novo",    potencial: "medio" },
  ],
  consultoria: [
    { nome: `Distribuidora Norte ${DEMO_TAG}`,     email: "financeiro@distnorte.com",  telefone: "(21) 99991-1001", segmento: "Distribuição",    status: "ativo",     valor_total: 8500, tipo_contrato: "Diagnóstico Financeiro",      classificacao: "vip",     potencial: "alto" },
    { nome: `Metalúrgica Santos ${DEMO_TAG}`,      email: "operacoes@metsantos.com",   telefone: "(31) 99992-1002", segmento: "Indústria",       status: "ativo",     valor_total: 12000,tipo_contrato: "Reestruturação Operacional",  classificacao: "padrao",  potencial: "alto" },
    { nome: `Rede Franquias Expresso ${DEMO_TAG}`, email: "expansao@rfexpresso.com",   telefone: "(11) 99993-1003", segmento: "Franquias",       status: "prospecto", valor_total: 0,    tipo_contrato: "A definir",                  classificacao: "novo",    potencial: "alto" },
    { nome: `Construtora Horizonte ${DEMO_TAG}`,   email: "projetos@horizonte.eng.br", telefone: "(41) 99994-1004", segmento: "Construção Civil", status: "prospecto", valor_total: 0,    tipo_contrato: "A definir",                  classificacao: "novo",    potencial: "medio" },
    { nome: `Gráfica Central Ltda ${DEMO_TAG}`,    email: "admin@graficacentral.com",  telefone: "(21) 99995-1005", segmento: "Gráfica/Print",   status: "inativo",   valor_total: 3200, tipo_contrato: "Encerrado",                  classificacao: "em_risco",potencial: "baixo" },
  ],
  freelancer: [
    { nome: `Dr. Carlos Alves ${DEMO_TAG}`,        email: "dr.alves@clinica.com",      telefone: "(11) 99991-2001", segmento: "Saúde",           status: "ativo",     valor_total: 2200, tipo_contrato: "Desenvolvimento de Site",   classificacao: "padrao",  potencial: "medio" },
    { nome: `Startup Verde Ltda ${DEMO_TAG}`,       email: "oi@startupverde.co",        telefone: "(11) 99992-2002", segmento: "Tecnologia",      status: "ativo",     valor_total: 5500, tipo_contrato: "Branding + App",            classificacao: "vip",     potencial: "alto" },
    { nome: `Ana Souza Coaching ${DEMO_TAG}`,       email: "ana@anasouza.coach",        telefone: "(11) 99993-2003", segmento: "Coaching",        status: "prospecto", valor_total: 0,    tipo_contrato: "A definir",                 classificacao: "novo",    potencial: "alto" },
    { nome: `Loja Fonseca Artesanato ${DEMO_TAG}`,  email: "contato@fonseca.art",       telefone: "(41) 99994-2004", segmento: "Artesanato",      status: "prospecto", valor_total: 0,    tipo_contrato: "A definir",                 classificacao: "novo",    potencial: "medio" },
    { nome: `Paulo H. Design ${DEMO_TAG}`,          email: "paulo@phdesign.com.br",     telefone: "(21) 99995-2005", segmento: "Design",          status: "inativo",   valor_total: 1200, tipo_contrato: "Encerrado",                 classificacao: "em_risco",potencial: "baixo" },
  ],
  pme: [
    { nome: `TechSolve Sistemas ${DEMO_TAG}`,       email: "comercial@techsolve.com.br",telefone: "(11) 99991-3001", segmento: "Tecnologia",      status: "ativo",     valor_total: 12500,tipo_contrato: "Mensal",              classificacao: "vip",     potencial: "alto" },
    { nome: `Studio Criativo SP ${DEMO_TAG}`,       email: "ola@studiocriativo.art",    telefone: "(11) 99992-3002", segmento: "Design",          status: "ativo",     valor_total: 7800, tipo_contrato: "Projeto",             classificacao: "padrao",  potencial: "medio" },
    { nome: `Distribuidora Farias ${DEMO_TAG}`,     email: "rh@farias.dist.br",         telefone: "(31) 99993-3003", segmento: "Distribuição",    status: "ativo",     valor_total: 3400, tipo_contrato: "Mensal",              classificacao: "padrao",  potencial: "medio" },
    { nome: `Invest Capital ${DEMO_TAG}`,            email: "deals@investcapital.com",   telefone: "(11) 99994-3004", segmento: "Financeiro",      status: "prospecto", valor_total: 0,    tipo_contrato: "A definir",           classificacao: "novo",    potencial: "alto" },
    { nome: `Comercial Santos Ltda ${DEMO_TAG}`,    email: "contato@comsantos.com.br",  telefone: "(41) 99995-3005", segmento: "Varejo",          status: "prospecto", valor_total: 0,    tipo_contrato: "A definir",           classificacao: "novo",    potencial: "medio" },
  ],
};

// ---------------------------------------------------------------------------
// Per-segment transaction lists
// Paid revenue always sums to R$ 11.700 (matches ASSISTANT_MESSAGES)
// Pending revenue always R$ 3.100
// Bank balance R$ 18.500
// ---------------------------------------------------------------------------

interface TransacaoSeed {
  description: string; value: number; type: "receita" | "despesa";
  category: string; status: "pago" | "pendente";
  daysOffset: number; client?: string; provider?: string;
}

const TRANSACOES: Record<SegmentKey, TransacaoSeed[]> = {
  agencia: [
    { description: `Social Media — Mar Azul Academia ${DEMO_TAG}`,   value: 4500, type: "receita", category: "Redes Sociais",         status: "pago",     daysOffset: -12, client:   "Mar Azul Academia" },
    { description: `Google Ads — Loja Centro Modas ${DEMO_TAG}`,     value: 7200, type: "receita", category: "Mídia Paga",            status: "pago",     daysOffset: -6,  client:   "Loja Centro Modas" },
    { description: `Criação Conteúdo — Sabor Certo ${DEMO_TAG}`,     value: 3100, type: "receita", category: "Produção Conteúdo",     status: "pendente", daysOffset: 5,   client:   "Restaurante Sabor Certo" },
    { description: `Ferramentas e plataformas digitais ${DEMO_TAG}`, value: 2200, type: "despesa", category: "Ferramentas",           status: "pago",     daysOffset: -3,  provider: "Adobe / Meta / Google" },
    { description: `Assinaturas Canva + Notion ${DEMO_TAG}`,         value: 480,  type: "despesa", category: "Ferramentas",           status: "pago",     daysOffset: -1,  provider: "Diversos SaaS" },
    { description: `Freelancer editor de vídeo ${DEMO_TAG}`,         value: 1500, type: "despesa", category: "Equipe",                status: "pendente", daysOffset: 7,   provider: "Marcos Editor" },
  ],
  consultoria: [
    { description: `Honorário Diagnóstico — Distribuidora Norte ${DEMO_TAG}`,  value: 4500, type: "receita", category: "Honorários",      status: "pago",     daysOffset: -12, client:   "Distribuidora Norte" },
    { description: `Honorário Reestruturação — Metalúrgica Santos ${DEMO_TAG}`,value: 7200, type: "receita", category: "Honorários",      status: "pago",     daysOffset: -6,  client:   "Metalúrgica Santos" },
    { description: `Relatório Final — Metalúrgica (parcela) ${DEMO_TAG}`,      value: 3100, type: "receita", category: "Honorários",      status: "pendente", daysOffset: 5,   client:   "Metalúrgica Santos" },
    { description: `Softwares de gestão e análise ${DEMO_TAG}`,                value: 420,  type: "despesa", category: "Ferramentas",     status: "pago",     daysOffset: -3,  provider: "Diversos SaaS" },
    { description: `Deslocamento e despesas de campo ${DEMO_TAG}`,             value: 290,  type: "despesa", category: "Estrutura",       status: "pago",     daysOffset: -1,  provider: "Reembolso" },
    { description: `Analista externo — apoio projeto ${DEMO_TAG}`,             value: 1500, type: "despesa", category: "Equipe",          status: "pendente", daysOffset: 7,   provider: "Cristina Analista" },
  ],
  freelancer: [
    { description: `Desenvolvimento Site — Dr. Carlos Alves ${DEMO_TAG}`,  value: 4500, type: "receita", category: "Desenvolvimento",    status: "pago",     daysOffset: -12, client:   "Dr. Carlos Alves" },
    { description: `Branding Completo — Startup Verde ${DEMO_TAG}`,        value: 7200, type: "receita", category: "Design/Branding",    status: "pago",     daysOffset: -6,  client:   "Startup Verde Ltda" },
    { description: `Logo + Manual Marca — Ana Coaching ${DEMO_TAG}`,       value: 3100, type: "receita", category: "Design/Branding",    status: "pendente", daysOffset: 5,   client:   "Ana Souza Coaching" },
    { description: `Adobe Creative Cloud ${DEMO_TAG}`,                     value: 290,  type: "despesa", category: "Ferramentas",        status: "pago",     daysOffset: -3,  provider: "Adobe" },
    { description: `Domínio e hospedagem clientes ${DEMO_TAG}`,            value: 180,  type: "despesa", category: "Infraestrutura",     status: "pago",     daysOffset: -1,  provider: "HostGator" },
    { description: `Tablet para apresentação de projetos ${DEMO_TAG}`,     value: 1500, type: "despesa", category: "Equipamentos",       status: "pendente", daysOffset: 7,   provider: "Magazine Luiza" },
  ],
  pme: [
    { description: `Serviços TI — TechSolve Sistemas ${DEMO_TAG}`,       value: 4500, type: "receita", category: "Serviços",           status: "pago",     daysOffset: -12, client:   "TechSolve Sistemas" },
    { description: `Projeto Identidade — Studio Criativo ${DEMO_TAG}`,   value: 7200, type: "receita", category: "Serviços",           status: "pago",     daysOffset: -6,  client:   "Studio Criativo SP" },
    { description: `Mensalidade — Distribuidora Farias ${DEMO_TAG}`,     value: 3100, type: "receita", category: "Mensalidade",        status: "pendente", daysOffset: 5,   client:   "Distribuidora Farias" },
    { description: `Aluguel do escritório ${DEMO_TAG}`,                  value: 2200, type: "despesa", category: "Estrutura",          status: "pago",     daysOffset: -3,  provider: "Imobiliária Central" },
    { description: `Assinaturas SaaS e ferramentas ${DEMO_TAG}`,         value: 480,  type: "despesa", category: "Ferramentas",        status: "pago",     daysOffset: -1,  provider: "Diversos" },
    { description: `Pagamento freelancer ${DEMO_TAG}`,                   value: 1500, type: "despesa", category: "Equipe",             status: "pendente", daysOffset: 7,   provider: "Maria Fernanda Design" },
  ],
};

// ---------------------------------------------------------------------------
// Per-segment project lists
// ---------------------------------------------------------------------------

interface ProjetoSeed {
  name: string; status: "em_andamento" | "planejamento" | "concluido";
  priority: "alta" | "media"; startOffset: number; endOffset: number;
  budget: number; responsible: string; description: string;
}

const PROJETOS: Record<SegmentKey, ProjetoSeed[]> = {
  agencia: [
    { name: `Rebranding Mar Azul Academia ${DEMO_TAG}`,       status: "em_andamento", priority: "alta",  startOffset: -20, endOffset: 15,  budget: 8000,  responsible: "Você",    description: "Redesign completo: logo, paleta e manual de marca." },
    { name: `Campanha Lançamento Sabor Certo ${DEMO_TAG}`,    status: "em_andamento", priority: "alta",  startOffset: -7,  endOffset: 20,  budget: 4800,  responsible: "Marketing",description: "Campanha multicanal para abertura do restaurante." },
    { name: `Site + SEO Loja Centro Modas ${DEMO_TAG}`,       status: "planejamento", priority: "media", startOffset: 2,   endOffset: 40,  budget: 7500,  responsible: "Equipe",  description: "E-commerce em WooCommerce com otimização para Google." },
    { name: `Gestão Social Media Boutique ${DEMO_TAG}`,       status: "concluido",    priority: "media", startOffset: -60, endOffset: -5,  budget: 3200,  responsible: "Você",    description: "3 meses de gestão de Instagram e TikTok." },
  ],
  consultoria: [
    { name: `Diagnóstico Financeiro Distribuidora ${DEMO_TAG}`,      status: "concluido",    priority: "alta",  startOffset: -40, endOffset: -10, budget: 4500,  responsible: "Você",    description: "Mapeamento completo do fluxo de caixa e dívidas." },
    { name: `Reestruturação Operacional Metalúrgica ${DEMO_TAG}`,    status: "em_andamento", priority: "alta",  startOffset: -20, endOffset: 30,  budget: 12000, responsible: "Você",    description: "Redesenho de processos e implantação de indicadores." },
    { name: `Consultoria Estratégica Rede Franquias ${DEMO_TAG}`,    status: "planejamento", priority: "media", startOffset: 5,   endOffset: 45,  budget: 18000, responsible: "Equipe",  description: "Diagnóstico e roadmap de expansão para 10 novas unidades." },
    { name: `Implantação ISO 9001 Construtora ${DEMO_TAG}`,          status: "planejamento", priority: "media", startOffset: 10,  endOffset: 60,  budget: 8500,  responsible: "Você",    description: "Preparação e auditoria interna para certificação." },
  ],
  freelancer: [
    { name: `Site Institucional Dr. Carlos Alves ${DEMO_TAG}`,  status: "concluido",    priority: "media", startOffset: -40, endOffset: -5,  budget: 2200,  responsible: "Você",    description: "Site em WordPress com agendamento online e SEO local." },
    { name: `Branding Completo Startup Verde ${DEMO_TAG}`,      status: "em_andamento", priority: "alta",  startOffset: -15, endOffset: 10,  budget: 5500,  responsible: "Você",    description: "Logo, paleta, tipografia, papelaria digital e guidelines." },
    { name: `App MVP Projeto Conceito ${DEMO_TAG}`,             status: "planejamento", priority: "alta",  startOffset: 5,   endOffset: 45,  budget: 8000,  responsible: "Você",    description: "Protótipo navegável + desenvolvimento React Native." },
    { name: `Identidade Visual Ana Coaching ${DEMO_TAG}`,       status: "em_andamento", priority: "media", startOffset: -10, endOffset: 20,  budget: 3100,  responsible: "Você",    description: "Logo, cartão e templates de Instagram para coaching." },
  ],
  pme: [
    { name: `Implantação Sistema TechSolve ${DEMO_TAG}`,        status: "em_andamento", priority: "alta",  startOffset: -20, endOffset: 15,  budget: 12000, responsible: "Você",    description: "Integração do ERP com o sistema de vendas online." },
    { name: `Site Corporativo Studio Criativo ${DEMO_TAG}`,     status: "planejamento", priority: "media", startOffset: 2,   endOffset: 40,  budget: 8500,  responsible: "Equipe",  description: "Novo site institucional em Next.js com portfólio." },
    { name: `Integração Distribuidora Farias ${DEMO_TAG}`,      status: "em_andamento", priority: "alta",  startOffset: -7,  endOffset: 20,  budget: 4500,  responsible: "Marketing",description: "Automação de pedidos e rastreamento de entregas." },
    { name: `Consultoria Implantação Invest ${DEMO_TAG}`,       status: "concluido",    priority: "media", startOffset: -60, endOffset: -5,  budget: 6000,  responsible: "Você",    description: "Diagnóstico financeiro e plano de investimentos." },
  ],
};

const BANK_ACCOUNTS: Record<SegmentKey, { name: string; institution: string }> = {
  agencia:     { name: `Conta Agência ${DEMO_TAG}`,     institution: "Banco Digital Agências" },
  consultoria: { name: `Conta PJ Consultora ${DEMO_TAG}`,institution: "Itaú Empresas" },
  freelancer:  { name: `Conta Freelancer ${DEMO_TAG}`,  institution: "Nubank PJ" },
  pme:         { name: `Conta Principal ${DEMO_TAG}`,   institution: "Bradesco Empresas" },
};

// ---------------------------------------------------------------------------
// Seed functions
// ---------------------------------------------------------------------------

async function seedFinanceiro(userId: string, segment: SegmentKey) {
  const bankDef = BANK_ACCOUNTS[segment];

  const { data: existing } = await supabase
    .from("contas_bancarias")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  let bankAccountId = existing?.[0]?.id ?? null;

  if (!bankAccountId) {
    const { data: newAccount } = await supabase
      .from("contas_bancarias")
      .insert({ user_id: userId, name: bankDef.name, institution: bankDef.institution, type: "corrente", balance: 18500 })
      .select("id")
      .single();
    bankAccountId = newAccount?.id ?? null;
  }

  const transactions = TRANSACOES[segment].map((t) => ({
    description: t.description,
    value: t.value,
    type: t.type,
    category: t.category,
    status: t.status,
    date: daysFromNow(t.daysOffset),
    client: t.client ?? null,
    provider: t.provider ?? null,
    user_id: userId,
    bank_account_id: bankAccountId,
  }));

  await supabase.from("transacoes").insert(transactions);
}

async function seedClientes(userId: string, segment: SegmentKey) {
  const clientes = CLIENTES[segment].map((c) => ({
    ...c,
    user_id: userId,
    ultima_interacao: daysFromNow(-5),
  }));
  await supabase.from("clientes").insert(clientes);
}

async function seedProjetos(userId: string, segment: SegmentKey) {
  const projetos = PROJETOS[segment].map((p) => ({
    name: p.name,
    status: p.status,
    priority: p.priority,
    start_date: daysFromNow(p.startOffset),
    end_date: daysFromNow(p.endOffset),
    budget: p.budget,
    responsible: p.responsible,
    description: p.description,
    user_id: userId,
  }));
  await supabase.from("projetos").insert(projetos);
}

// ---------------------------------------------------------------------------
// Wipe helpers (unchanged — DEMO_TAG filter is segment-agnostic)
// ---------------------------------------------------------------------------

async function wipeFinanceiro(userId: string) {
  await supabase.from("transacoes").delete().eq("user_id", userId);
  await supabase.from("contas_bancarias").delete().eq("user_id", userId);
}

async function wipeClientes(userId: string) {
  await supabase.from("campanha_clientes").delete().eq("user_id", userId);
  await supabase.from("client_recordings").delete().eq("user_id", userId);
  await supabase.from("clientes").delete().eq("user_id", userId);
}

async function wipeProjetos(userId: string) {
  await supabase.from("projetos").delete().eq("user_id", userId);
}

export async function wipeDemoData(module: DemoModule, userId: string) {
  const tag = `%${DEMO_TAG}%`;
  const tasks: PromiseLike<unknown>[] = [];

  if (module === "financeiro" || module === "painel") {
    tasks.push(
      supabase.from("transacoes").delete().eq("user_id", userId).ilike("description", tag),
      supabase.from("contas_bancarias").delete().eq("user_id", userId).ilike("name", tag),
    );
  }
  if (module === "clientes" || module === "painel") {
    tasks.push(supabase.from("clientes").delete().eq("user_id", userId).ilike("nome", tag));
  }
  if (module === "projetos" || module === "painel") {
    tasks.push(supabase.from("projetos").delete().eq("user_id", userId).ilike("name", tag));
  }

  await Promise.all(tasks);
}

export async function seedDemoData(module: DemoModule, userId: string, segment = "pme") {
  // Guard: never re-seed demo data if the user has already cleared it.
  if (isDemoCleared(userId)) return;

  // Normalise to a valid SegmentKey (WelcomeChoiceModal sends the raw id)
  const seg: SegmentKey = (["agencia", "consultoria", "freelancer", "pme"].includes(segment)
    ? segment
    : "pme") as SegmentKey;

  try {
    if (module === "financeiro") {
      await wipeFinanceiro(userId);
      await seedFinanceiro(userId, seg);
    } else if (module === "clientes") {
      await wipeClientes(userId);
      await seedClientes(userId, seg);
    } else if (module === "projetos") {
      await wipeProjetos(userId);
      await seedProjetos(userId, seg);
    } else if (module === "painel") {
      await Promise.all([wipeFinanceiro(userId), wipeClientes(userId), wipeProjetos(userId)]);
      await Promise.all([
        seedFinanceiro(userId, seg),
        seedClientes(userId, seg),
        seedProjetos(userId, seg),
      ]);
    }
  } catch (err) {
    console.error("[demo-seed] Failed to seed demo data:", err);
  }
}
