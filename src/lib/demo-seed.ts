import { supabase } from "@/integrations/supabase/client";
import type { DemoModule } from "@/lib/demo-data";

// Marker appended to text fields so we can recognise (and optionally clean up) demo rows later.
export const DEMO_TAG = "[DEMO]";

function daysFromNow(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

async function seedFinanceiro(userId: string) {
  // Ensure at least one bank account exists for this user
  const { data: existingAccounts } = await supabase
    .from("contas_bancarias")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  let bankAccountId = existingAccounts?.[0]?.id ?? null;

  if (!bankAccountId) {
    const { data: newAccount } = await supabase
      .from("contas_bancarias")
      .insert({
        user_id: userId,
        name: `Conta Principal ${DEMO_TAG}`,
        institution: "Banco Demonstração",
        type: "corrente",
        balance: 18500,
      })
      .select("id")
      .single();
    bankAccountId = newAccount?.id ?? null;
  }

  const transactions = [
    { description: `Recebimento Cliente Alpha ${DEMO_TAG}`, value: 4500, type: "receita", category: "Serviços", status: "pago",     date: daysFromNow(-12), client: "Alpha Tech" },
    { description: `Recebimento Cliente Beta ${DEMO_TAG}`,  value: 7200, type: "receita", category: "Consultoria", status: "pago",  date: daysFromNow(-6),  client: "Beta Studio" },
    { description: `Recebimento Cliente Gamma ${DEMO_TAG}`, value: 3100, type: "receita", category: "Mensalidade", status: "pendente", date: daysFromNow(5),  client: "Gamma Corp" },
    { description: `Aluguel do escritório ${DEMO_TAG}`,     value: 2200, type: "despesa", category: "Estrutura",  status: "pago",     date: daysFromNow(-3),  provider: "Imobiliária Sul" },
    { description: `Assinaturas SaaS ${DEMO_TAG}`,          value: 480,  type: "despesa", category: "Ferramentas", status: "pago",    date: daysFromNow(-1),  provider: "Diversos" },
    { description: `Pagamento freelancer ${DEMO_TAG}`,      value: 1500, type: "despesa", category: "Equipe",    status: "pendente",  date: daysFromNow(7),   provider: "Maria Designer" },
  ].map((t) => ({ ...t, user_id: userId, bank_account_id: bankAccountId }));

  await supabase.from("transacoes").insert(transactions);
}

async function seedClientes(userId: string) {
  const clientes = [
    { nome: `Alpha Tech ${DEMO_TAG}`,   email: "contato@alpha.tech", telefone: "(11) 99999-1111", segmento: "Tecnologia", status: "ativo",     valor_total: 12500, tipo_contrato: "Mensal",  classificacao: "vip",    potencial: "alto" },
    { nome: `Beta Studio ${DEMO_TAG}`,  email: "ola@betastudio.com", telefone: "(21) 98888-2222", segmento: "Design",     status: "ativo",     valor_total: 7800,  tipo_contrato: "Projeto", classificacao: "padrao", potencial: "medio" },
    { nome: `Gamma Corp ${DEMO_TAG}`,   email: "rh@gammacorp.com.br", telefone: "(31) 97777-3333", segmento: "Indústria",  status: "prospecto", valor_total: 0,    tipo_contrato: "A definir", classificacao: "novo", potencial: "alto" },
    { nome: `Delta Ventures ${DEMO_TAG}`, email: "deals@delta.vc",    telefone: "(11) 96666-4444", segmento: "Financeiro", status: "prospecto", valor_total: 0,    tipo_contrato: "A definir", classificacao: "novo", potencial: "medio" },
    { nome: `Epsilon Café ${DEMO_TAG}`, email: "contato@epsiloncafe.com", telefone: "(41) 95555-5555", segmento: "Varejo",  status: "inativo",   valor_total: 3400,  tipo_contrato: "Encerrado", classificacao: "em_risco", potencial: "baixo" },
  ].map((c) => ({ ...c, user_id: userId, ultima_interacao: daysFromNow(-5) }));

  await supabase.from("clientes").insert(clientes);
}

async function seedProjetos(userId: string) {
  const projetos = [
    { name: `Rebranding Alpha Tech ${DEMO_TAG}`,   status: "em_andamento", priority: "alta",  start_date: daysFromNow(-20), end_date: daysFromNow(15),  budget: 12000, responsible: "Você",      description: "Redesign completo da identidade visual." },
    { name: `Site Beta Studio ${DEMO_TAG}`,        status: "planejamento", priority: "media", start_date: daysFromNow(2),   end_date: daysFromNow(40),  budget: 8500,  responsible: "Equipe",    description: "Novo site institucional em Next.js." },
    { name: `Campanha Lançamento Gamma ${DEMO_TAG}`, status: "em_andamento", priority: "alta",  start_date: daysFromNow(-7),  end_date: daysFromNow(20),  budget: 15000, responsible: "Marketing", description: "Campanha multicanal de lançamento." },
    { name: `Consultoria Delta ${DEMO_TAG}`,       status: "concluido",    priority: "media", start_date: daysFromNow(-60), end_date: daysFromNow(-5),  budget: 6000,  responsible: "Você",      description: "Diagnóstico financeiro." },
  ].map((p) => ({ ...p, user_id: userId }));

  await supabase.from("projetos").insert(projetos);
}

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

/**
 * Deletes only the [DEMO]-tagged rows that seedDemoData inserted.
 * Safe to call even if the user has added their own real data since
 * the ilike filter only matches rows containing the DEMO_TAG marker.
 */
export async function wipeDemoData(module: DemoModule, userId: string) {
  const tag = `%${DEMO_TAG}%`;
  const tasks: Promise<unknown>[] = [];

  if (module === "financeiro" || module === "painel") {
    tasks.push(
      supabase.from("transacoes").delete().eq("user_id", userId).ilike("description", tag),
      supabase.from("contas_bancarias").delete().eq("user_id", userId).ilike("name", tag),
    );
  }
  if (module === "clientes" || module === "painel") {
    tasks.push(
      supabase.from("clientes").delete().eq("user_id", userId).ilike("nome", tag),
    );
  }
  if (module === "projetos" || module === "painel") {
    tasks.push(
      supabase.from("projetos").delete().eq("user_id", userId).ilike("name", tag),
    );
  }

  await Promise.all(tasks);
}

export async function seedDemoData(module: DemoModule, userId: string) {
  try {
    // Always reset the relevant module(s) before seeding so the panel starts
    // from a clean state every time the user picks an option in onboarding.
    if (module === "financeiro") {
      await wipeFinanceiro(userId);
      await seedFinanceiro(userId);
    } else if (module === "clientes") {
      await wipeClientes(userId);
      await seedClientes(userId);
    } else if (module === "projetos") {
      await wipeProjetos(userId);
      await seedProjetos(userId);
    } else if (module === "painel") {
      await Promise.all([wipeFinanceiro(userId), wipeClientes(userId), wipeProjetos(userId)]);
      await Promise.all([
        seedFinanceiro(userId),
        seedClientes(userId),
        seedProjetos(userId),
      ]);
    }
  } catch (err) {
    console.error("[demo-seed] Failed to seed demo data:", err);
  }
}

