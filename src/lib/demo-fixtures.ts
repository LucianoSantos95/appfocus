/**
 * Fixtures usados exclusivamente pelo modo demonstração (rota /demo).
 * Nunca são gravados no banco — servem apenas para popular a UI quando
 * sessionStorage.demo_mode = "1". Chaves seguem o formato "<prefix>:demo".
 */

const today = new Date();
const addDays = (d: number) => {
  const t = new Date(today);
  t.setDate(t.getDate() + d);
  return t.toISOString().split("T")[0];
};
const isoDays = (d: number) => {
  const t = new Date(today);
  t.setDate(t.getDate() + d);
  return t.toISOString();
};

export const DEMO_USER = {
  id: "demo-user",
  email: "avaliador@demo.hub",
  user_metadata: { full_name: "Avaliador Demo" },
} as const;

export const demoClientes = [
  { id: "d-c1", nome: "Fernando Almeida", email: "fernando@empresaabc.com", telefone: "(11) 97654-3210", empresa: "Empresa ABC", segmento: "Tecnologia", status: "ativo", tipo_contrato: "mensal", valor_total: 4500, potencial: "alto", classificacao: "quente", prioridade_contato: "alta", palavras_chave: ["saas", "b2b"], proxima_acao_sugerida: "Agendar reunião de renovação", analisado_em: isoDays(-2), ultima_interacao: addDays(-3), anexo_url: null, created_at: isoDays(-40), updated_at: isoDays(-2) },
  { id: "d-c2", nome: "Patrícia Lima", email: "patricia@startupxyz.com", telefone: "(21) 98765-1234", empresa: "Startup XYZ", segmento: "SaaS", status: "prospecto", tipo_contrato: null, valor_total: 0, potencial: "medio", classificacao: "morno", prioridade_contato: "media", palavras_chave: ["mvp", "seed"], proxima_acao_sugerida: "Enviar proposta", analisado_em: isoDays(-1), ultima_interacao: addDays(-5), anexo_url: null, created_at: isoDays(-15), updated_at: isoDays(-1) },
  { id: "d-c3", nome: "Roberto Dias", email: "roberto@comerciork.com", telefone: "(31) 99876-5432", empresa: "Comércio RK", segmento: "Varejo", status: "ativo", tipo_contrato: "anual", valor_total: 12000, potencial: "alto", classificacao: "quente", prioridade_contato: "alta", palavras_chave: ["varejo"], proxima_acao_sugerida: "Upsell módulo Marketing", analisado_em: isoDays(-3), ultima_interacao: addDays(-1), anexo_url: null, created_at: isoDays(-70), updated_at: isoDays(-1) },
  { id: "d-c4", nome: "Marina Souza", email: "marina@boutiquem.com.br", telefone: "(11) 91111-2222", empresa: "Boutique M", segmento: "Moda", status: "prospecto", tipo_contrato: null, valor_total: 0, potencial: "medio", classificacao: "morno", prioridade_contato: "media", palavras_chave: ["moda", "e-commerce"], proxima_acao_sugerida: "Ligar para qualificar", analisado_em: null, ultima_interacao: addDays(-10), anexo_url: null, created_at: isoDays(-8), updated_at: isoDays(-8) },
  { id: "d-c5", nome: "Instituto Rê", email: "contato@institutore.org", telefone: "(21) 3333-4444", empresa: "Instituto Rê", segmento: "Terceiro setor", status: "ativo", tipo_contrato: "mensal", valor_total: 1800, potencial: "baixo", classificacao: "frio", prioridade_contato: "baixa", palavras_chave: ["ong"], proxima_acao_sugerida: "Renovação em 60 dias", analisado_em: isoDays(-5), ultima_interacao: addDays(-15), anexo_url: null, created_at: isoDays(-120), updated_at: isoDays(-15) },
  { id: "d-c6", nome: "Café da Vila", email: "andre@cafedavila.com", telefone: "(11) 95555-6677", empresa: "Café da Vila", segmento: "Alimentação", status: "ativo", tipo_contrato: "mensal", valor_total: 990, potencial: "medio", classificacao: "morno", prioridade_contato: "media", palavras_chave: ["food"], proxima_acao_sugerida: "Enviar case", analisado_em: isoDays(-6), ultima_interacao: addDays(-7), anexo_url: null, created_at: isoDays(-90), updated_at: isoDays(-7) },
  { id: "d-c7", nome: "Nova Escola Digital", email: "diretor@novaescola.edu", telefone: "(41) 3222-1111", empresa: "Nova Escola", segmento: "Educação", status: "prospecto", tipo_contrato: null, valor_total: 0, potencial: "alto", classificacao: "quente", prioridade_contato: "alta", palavras_chave: ["edtech"], proxima_acao_sugerida: "Demo com diretor", analisado_em: isoDays(-1), ultima_interacao: addDays(-2), anexo_url: null, created_at: isoDays(-6), updated_at: isoDays(-1) },
];

export const demoProjetos = [
  { id: "d-p1", name: "Redesign do Site", description: "Modernizar site institucional", status: "em_andamento", priority: "alta", responsible: "Carlos Oliveira", budget: 12000, start_date: addDays(-15), end_date: addDays(45), cliente_id: null, created_at: isoDays(-15), updated_at: isoDays(-2) },
  { id: "d-p2", name: "App Mobile MVP", description: "Versão mínima do app", status: "planejamento", priority: "media", responsible: "Carlos Oliveira", budget: 25000, start_date: addDays(10), end_date: addDays(90), cliente_id: null, created_at: isoDays(-3), updated_at: isoDays(-3) },
  { id: "d-p3", name: "Automação de Processos", description: "Automatizar fluxos internos", status: "em_andamento", priority: "alta", responsible: "Ana Costa", budget: 8000, start_date: addDays(-7), end_date: addDays(30), cliente_id: null, created_at: isoDays(-7), updated_at: isoDays(-1) },
  { id: "d-p4", name: "Campanha Black Friday", description: "Landing + ads", status: "planejamento", priority: "alta", responsible: "Mariana Santos", budget: 5000, start_date: addDays(20), end_date: addDays(50), cliente_id: null, created_at: isoDays(-2), updated_at: isoDays(-2) },
  { id: "d-p5", name: "Integração ERP", description: "Conectar ao Bling", status: "em_andamento", priority: "media", responsible: "Carlos Oliveira", budget: 6000, start_date: addDays(-20), end_date: addDays(10), cliente_id: null, created_at: isoDays(-20), updated_at: isoDays(-4) },
  { id: "d-p6", name: "Rebranding", description: "Identidade visual", status: "concluido", priority: "media", responsible: "Ana Costa", budget: 15000, start_date: addDays(-90), end_date: addDays(-10), cliente_id: null, created_at: isoDays(-90), updated_at: isoDays(-10) },
];

export const demoTarefas = [
  { id: "d-t1", title: "Revisar proposta comercial", description: "Cliente Empresa ABC", priority: "alta", status: "pendente", category: "Comercial", responsible: "Ana Costa", due_date: addDays(2), completed_at: null, created_at: isoDays(-1), updated_at: isoDays(-1) },
  { id: "d-t2", title: "Atualizar relatório mensal", description: "Dados financeiros", priority: "media", status: "em_andamento", category: "Financeiro", responsible: "Carlos Oliveira", due_date: addDays(5), completed_at: null, created_at: isoDays(-2), updated_at: isoDays(-1) },
  { id: "d-t3", title: "Entrevistar candidato", description: "Vaga de designer", priority: "baixa", status: "pendente", category: "RH", responsible: "Mariana Santos", due_date: addDays(3), completed_at: null, created_at: isoDays(-1), updated_at: isoDays(-1) },
  { id: "d-t4", title: "Publicar post do blog", description: "Tema: IA na gestão", priority: "media", status: "pendente", category: "Marketing", responsible: "Mariana Santos", due_date: addDays(1), completed_at: null, created_at: isoDays(-1), updated_at: isoDays(-1) },
  { id: "d-t5", title: "Enviar NF-e do mês", description: "Emitir para 12 clientes", priority: "urgente", status: "pendente", category: "Financeiro", responsible: "Carlos Oliveira", due_date: addDays(0), completed_at: null, created_at: isoDays(-1), updated_at: isoDays(-1) },
  { id: "d-t6", title: "Aprovar layout do site", description: "Cliente Empresa ABC", priority: "media", status: "concluida", category: "Design", responsible: "Ana Costa", due_date: addDays(-2), completed_at: isoDays(-2), created_at: isoDays(-5), updated_at: isoDays(-2) },
  { id: "d-t7", title: "Revisar contrato Boutique M", description: "Cláusulas de renovação", priority: "alta", status: "em_andamento", category: "Jurídico", responsible: "Ana Costa", due_date: addDays(4), completed_at: null, created_at: isoDays(-2), updated_at: isoDays(-1) },
];

export const demoTransacoes = [
  { id: "d-tr1", description: "Projeto de consultoria", value: 4500, type: "receita", category: "Serviços", status: "confirmado", date: addDays(-5), payment_method: "Transferência", client: "Empresa ABC", provider: null, notes: null, bank_account_id: "d-b1", created_at: isoDays(-5), updated_at: isoDays(-5) },
  { id: "d-tr2", description: "Aluguel do escritório", value: 2200, type: "despesa", category: "Infraestrutura", status: "confirmado", date: addDays(-2), payment_method: "Boleto", client: null, provider: "Imobiliária X", notes: null, bank_account_id: "d-b1", created_at: isoDays(-2), updated_at: isoDays(-2) },
  { id: "d-tr3", description: "Venda de produto digital", value: 1890, type: "receita", category: "Produtos", status: "pendente", date: addDays(3), payment_method: "Pix", client: "João Mendes", provider: null, notes: null, bank_account_id: "d-b2", created_at: isoDays(-1), updated_at: isoDays(-1) },
  { id: "d-tr4", description: "Anúncios Meta Ads", value: 850, type: "despesa", category: "Marketing", status: "confirmado", date: addDays(-4), payment_method: "Cartão", client: null, provider: "Meta", notes: null, bank_account_id: "d-b1", created_at: isoDays(-4), updated_at: isoDays(-4) },
  { id: "d-tr5", description: "Consultoria mensal Comércio RK", value: 3200, type: "receita", category: "Serviços", status: "confirmado", date: addDays(-6), payment_method: "Pix", client: "Comércio RK", provider: null, notes: null, bank_account_id: "d-b1", created_at: isoDays(-6), updated_at: isoDays(-6) },
  { id: "d-tr6", description: "Salários equipe", value: 16500, type: "despesa", category: "Folha", status: "confirmado", date: addDays(-3), payment_method: "Transferência", client: null, provider: null, notes: null, bank_account_id: "d-b1", created_at: isoDays(-3), updated_at: isoDays(-3) },
  { id: "d-tr7", description: "Assinatura Nova Escola", value: 1500, type: "receita", category: "Serviços", status: "pendente", date: addDays(7), payment_method: "Boleto", client: "Nova Escola", provider: null, notes: null, bank_account_id: "d-b2", created_at: isoDays(-1), updated_at: isoDays(-1) },
  { id: "d-tr8", description: "Ferramentas SaaS", value: 780, type: "despesa", category: "Software", status: "confirmado", date: addDays(-8), payment_method: "Cartão", client: null, provider: "Diversos", notes: null, bank_account_id: "d-b1", created_at: isoDays(-8), updated_at: isoDays(-8) },
];

export const demoColaboradores = [
  { id: "d-cl1", name: "Ana Costa", role: "Gerente de Projetos", department: "Operações", email: "ana@focus.demo", phone: "(11) 98765-4321", status: "ativo", salary: 6500, start_date: addDays(-365), manager: null, created_at: isoDays(-365), updated_at: isoDays(-30) },
  { id: "d-cl2", name: "Carlos Oliveira", role: "Desenvolvedor", department: "Tecnologia", email: "carlos@focus.demo", phone: "(11) 91234-5678", status: "ativo", salary: 5200, start_date: addDays(-180), manager: "Ana Costa", created_at: isoDays(-180), updated_at: isoDays(-30) },
  { id: "d-cl3", name: "Mariana Santos", role: "Analista de Marketing", department: "Marketing", email: "mariana@focus.demo", phone: "(21) 99876-5432", status: "ativo", salary: 4800, start_date: addDays(-90), manager: "Ana Costa", created_at: isoDays(-90), updated_at: isoDays(-30) },
  { id: "d-cl4", name: "Pedro Rocha", role: "Designer", department: "Criação", email: "pedro@focus.demo", phone: "(11) 98888-7777", status: "ativo", salary: 4500, start_date: addDays(-60), manager: "Mariana Santos", created_at: isoDays(-60), updated_at: isoDays(-10) },
  { id: "d-cl5", name: "Juliana Neves", role: "Financeiro", department: "Administração", email: "juliana@focus.demo", phone: "(11) 97777-8888", status: "ativo", salary: 5000, start_date: addDays(-200), manager: null, created_at: isoDays(-200), updated_at: isoDays(-20) },
  { id: "d-cl6", name: "Ricardo Menezes", role: "SDR", department: "Comercial", email: "ricardo@focus.demo", phone: "(21) 96666-5555", status: "ativo", salary: 3800, start_date: addDays(-45), manager: "Ana Costa", created_at: isoDays(-45), updated_at: isoDays(-5) },
];

export const demoCampanhas = [
  { id: "d-cp1", name: "Lançamento Produto X", objective: "Gerar leads qualificados", platforms: "Instagram, Google Ads", status: "ativa", budget: 3500, start_date: addDays(-10), end_date: addDays(20), responsible: "Mariana Santos", created_at: isoDays(-10), updated_at: isoDays(-2) },
  { id: "d-cp2", name: "Black Friday 2026", objective: "Aumentar vendas em 30%", platforms: "Facebook, E-mail", status: "planejamento", budget: 5000, start_date: addDays(30), end_date: addDays(45), responsible: "Ana Costa", created_at: isoDays(-3), updated_at: isoDays(-3) },
  { id: "d-cp3", name: "Webinar de Gestão", objective: "Nutrir base", platforms: "YouTube, E-mail", status: "ativa", budget: 1200, start_date: addDays(-5), end_date: addDays(15), responsible: "Mariana Santos", created_at: isoDays(-5), updated_at: isoDays(-1) },
  { id: "d-cp4", name: "Retargeting Q4", objective: "Reconquistar leads frios", platforms: "Meta Ads", status: "ativa", budget: 2100, start_date: addDays(-15), end_date: addDays(15), responsible: "Ricardo Menezes", created_at: isoDays(-15), updated_at: isoDays(-1) },
  { id: "d-cp5", name: "Parceria Educacional", objective: "Co-marketing", platforms: "LinkedIn", status: "planejamento", budget: 800, start_date: addDays(20), end_date: addDays(60), responsible: "Ana Costa", created_at: isoDays(-1), updated_at: isoDays(-1) },
  { id: "d-cp6", name: "Campanha SEO Local", objective: "Ranquear cidades-alvo", platforms: "Google", status: "ativa", budget: 1500, start_date: addDays(-30), end_date: addDays(60), responsible: "Mariana Santos", created_at: isoDays(-30), updated_at: isoDays(-2) },
];

export const demoConteudos = [
  { id: "d-co1", title: "Post: 5 dicas de produtividade", description: "Carrossel prático para PMEs", platform: "Instagram", status: "agendado", scheduled_date: addDays(2), created_at: isoDays(-1), updated_at: isoDays(-1) },
  { id: "d-co2", title: "E-mail: Newsletter semanal", description: "Novidades e promoções", platform: "E-mail", status: "rascunho", scheduled_date: addDays(5), created_at: isoDays(-1), updated_at: isoDays(-1) },
  { id: "d-co3", title: "Vídeo: Case Comércio RK", description: "Depoimento em vídeo", platform: "YouTube", status: "producao", scheduled_date: addDays(12), created_at: isoDays(-3), updated_at: isoDays(-1) },
  { id: "d-co4", title: "Post LinkedIn: IA na gestão", description: "Thought leadership", platform: "LinkedIn", status: "agendado", scheduled_date: addDays(1), created_at: isoDays(-1), updated_at: isoDays(-1) },
  { id: "d-co5", title: "E-book: Guia do MEI", description: "Isca de captação", platform: "Blog", status: "rascunho", scheduled_date: addDays(20), created_at: isoDays(-2), updated_at: isoDays(-2) },
  { id: "d-co6", title: "Reels: Tour pelo Hub", description: "Demo em 30s", platform: "Instagram", status: "agendado", scheduled_date: addDays(4), created_at: isoDays(-1), updated_at: isoDays(-1) },
];

export const demoProcessos = [
  { id: "d-pr1", name: "Onboarding de Clientes", description: "Boas-vindas e ativação de novos clientes", department: "Comercial", owner: "Ana Costa", status: "ativo", created_at: isoDays(-60), updated_at: isoDays(-10) },
  { id: "d-pr2", name: "Aprovação de Despesas", description: "Aprovação de gastos acima de R$500", department: "Financeiro", owner: "Juliana Neves", status: "ativo", created_at: isoDays(-50), updated_at: isoDays(-8) },
  { id: "d-pr3", name: "Recrutamento & Seleção", description: "Fluxo padrão de contratação", department: "RH", owner: "Mariana Santos", status: "ativo", created_at: isoDays(-40), updated_at: isoDays(-5) },
  { id: "d-pr4", name: "Publicação de Conteúdo", description: "Do brief à publicação", department: "Marketing", owner: "Mariana Santos", status: "ativo", created_at: isoDays(-30), updated_at: isoDays(-3) },
  { id: "d-pr5", name: "Suporte N1", description: "Atendimento inicial ao cliente", department: "Sucesso", owner: "Ricardo Menezes", status: "ativo", created_at: isoDays(-20), updated_at: isoDays(-2) },
  { id: "d-pr6", name: "Fechamento Mensal", description: "DRE e conciliação bancária", department: "Financeiro", owner: "Juliana Neves", status: "ativo", created_at: isoDays(-15), updated_at: isoDays(-1) },
];

export const demoContasBancarias = [
  { id: "d-b1", name: "Conta Principal", institution: "Banco do Brasil", type: "corrente", balance: 15420.5, created_at: isoDays(-200), updated_at: isoDays(-1) },
  { id: "d-b2", name: "Conta Poupança", institution: "Nubank", type: "poupanca", balance: 8300, created_at: isoDays(-100), updated_at: isoDays(-1) },
  { id: "d-b3", name: "Reserva Estratégica", institution: "Itaú", type: "poupanca", balance: 42000, created_at: isoDays(-300), updated_at: isoDays(-10) },
];

export const demoAgenda = [
  { id: "d-a1", title: "Reunião de alinhamento semanal", date: addDays(1), time: "09:00", type: "meeting", priority: "high", created_at: isoDays(-2), updated_at: isoDays(-2) },
  { id: "d-a2", title: "Call com Empresa ABC", date: addDays(2), time: "14:00", type: "meeting", priority: "medium", created_at: isoDays(-1), updated_at: isoDays(-1) },
  { id: "d-a3", title: "Entrega do relatório mensal", date: addDays(4), time: "17:00", type: "task", priority: "high", created_at: isoDays(-1), updated_at: isoDays(-1) },
  { id: "d-a4", title: "Gravação de podcast", date: addDays(6), time: "10:00", type: "meeting", priority: "medium", created_at: isoDays(-1), updated_at: isoDays(-1) },
  { id: "d-a5", title: "Revisão de OKRs", date: addDays(8), time: "15:00", type: "meeting", priority: "high", created_at: isoDays(-1), updated_at: isoDays(-1) },
];

export const demoBulletin = [
  { id: "d-bn1", content: "Bem-vindo ao modo demonstração! Explore livremente — nada aqui é salvo. 🚀", author: "Focus Hub", is_pinned: true, created_at: isoDays(-1), updated_at: isoDays(-1) },
  { id: "d-bn2", content: "Dica: cada módulo mostra os 5 primeiros registros. Clique em 'Ver mais' pra abrir tudo.", author: "Focus Hub", is_pinned: false, created_at: isoDays(-1), updated_at: isoDays(-1) },
  { id: "d-bn3", content: "Meta do mês: fechar 3 propostas de consultoria.", author: "Ana Costa", is_pinned: false, created_at: isoDays(-3), updated_at: isoDays(-3) },
];

/**
 * Registry por prefixo do key do useSharedResource.
 * Chaves geradas com user.id === "demo-user".
 */
export const DEMO_REGISTRY: Record<string, unknown> = {
  clientes: demoClientes,
  projetos: demoProjetos,
  tarefas: demoTarefas,
  transacoes: demoTransacoes,
  colaboradores: demoColaboradores,
  campanhas: demoCampanhas,
  conteudos: demoConteudos,
  processos: demoProcessos,
  contas_bancarias: demoContasBancarias,
  agenda: demoAgenda,
  agenda_items: demoAgenda,
  bulletin: demoBulletin,
  bulletin_notes: demoBulletin,
};

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem("demo_mode") === "1";
  } catch {
    return false;
  }
}

export function getDemoFixture(key: string): unknown | undefined {
  const prefix = key.split(":")[0];
  return DEMO_REGISTRY[prefix];
}
