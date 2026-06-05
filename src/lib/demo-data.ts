export type DemoModule = "financeiro" | "clientes" | "projetos" | "painel";

export const dadosFinanceiro = {
  receitaMes: 18500,
  despesasMes: 7200,
  saldoAtual: 11300,
  transacoes: [
    { descricao: "Projeto — Agência Exemplo", tipo: "receita" as const, valor: 8500, data: "01/06/2026", categoria: "Serviços" },
    { descricao: "Projeto — Cliente Demo", tipo: "receita" as const, valor: 6000, data: "05/06/2026", categoria: "Serviços" },
    { descricao: "Ferramentas SaaS", tipo: "despesa" as const, valor: 890, data: "03/06/2026", categoria: "Software" },
    { descricao: "Freelancer — Design", tipo: "despesa" as const, valor: 2400, data: "08/06/2026", categoria: "Equipe" },
    { descricao: "Aluguel escritório", tipo: "despesa" as const, valor: 1800, data: "01/06/2026", categoria: "Estrutura" },
    { descricao: "Consultoria — Empresa XYZ", tipo: "receita" as const, valor: 4000, data: "10/06/2026", categoria: "Consultoria" },
  ],
  metas: { receitaMeta: 25000, progresso: 74 },
};

export const dadosClientes = [
  { nome: "Agência Exemplo", status: "Cliente Ativo", valor: 8500, proximoContato: "15/06/2026", responsavel: "Você", fase: "Ativo" },
  { nome: "Startup Demo Ltda", status: "Proposta Enviada", valor: 12000, proximoContato: "12/06/2026", responsavel: "Você", fase: "Negociação" },
  { nome: "Consultoria ABC", status: "Em Negociação", valor: 6500, proximoContato: "14/06/2026", responsavel: "Você", fase: "Qualificado" },
  { nome: "Empresa XYZ", status: "Lead", valor: 4000, proximoContato: "20/06/2026", responsavel: "Você", fase: "Prospecção" },
  { nome: "Studio Criativo", status: "Cliente Ativo", valor: 3200, proximoContato: "18/06/2026", responsavel: "Você", fase: "Ativo" },
];

export const dadosProjetos = [
  { nome: "Redesign Site — Agência Exemplo", cliente: "Agência Exemplo", status: "Em andamento", prazo: "20/06/2026", progresso: 65, prioridade: "Alta" },
  { nome: "Sistema CRM — Startup Demo", cliente: "Startup Demo Ltda", status: "Aguardando aprovação", prazo: "30/06/2026", progresso: 90, prioridade: "Alta" },
  { nome: "Campanha Marketing — ABC", cliente: "Consultoria ABC", status: "Em andamento", prazo: "25/06/2026", progresso: 40, prioridade: "Média" },
  { nome: "Identidade Visual — Studio", cliente: "Studio Criativo", status: "Planejamento", prazo: "10/07/2026", progresso: 15, prioridade: "Baixa" },
];

export const dadosPainel = {
  receitaMes: 18500,
  tarefasVencidas: 3,
  projetosAtrasados: 1,
  clientesSemContato: 2,
};

export const ASSISTANT_MESSAGES: Record<DemoModule, string> = {
  financeiro: `Esse é o seu painel financeiro 💰

Aqui você tem uma visão completa da saúde financeira da sua operação. Os dados que você está vendo são exemplos para te ajudar a entender como funciona.

No Hub você consegue:
→ Registrar receitas e despesas em segundos
→ Categorizar transações automaticamente
→ Ver seu fluxo de caixa em tempo real
→ Gerar relatórios para clientes

Para começar com seus dados reais, clique em **'+ Nova Transação'** ou me pergunte qualquer coisa sobre como usar o financeiro.`,
  clientes: `Esse é o seu CRM de clientes 👥

Aqui você centraliza toda sua carteira — desde o primeiro contato até o cliente fidelizado. Os dados que você vê são exemplos.

No Hub você consegue:
→ Organizar clientes por fase do funil
→ Registrar histórico de contatos
→ Definir próximos passos por cliente
→ Ver quem precisa de atenção hoje

Para adicionar seu primeiro cliente real, clique em **'+ Novo Cliente'** ou me pergunte como organizar sua carteira.`,
  projetos: `Esse é o seu gestor de projetos 📋

Aqui você acompanha todas as entregas, prazos e progresso dos seus projetos. Os dados que você vê são exemplos.

No Hub você consegue:
→ Criar projetos vinculados aos seus clientes
→ Acompanhar progresso em tempo real
→ Receber alertas de prazo
→ Ter visão clara de tudo que está em andamento

Para criar seu primeiro projeto real, clique em **'+ Novo Projeto'** ou me pergunte como começar.`,
  painel: `Bem-vindo ao Hub Empresarial 🚀

Você está vendo seu painel principal com dados de exemplo. Aqui está tudo que você pode fazer:

💰 **Finanças** — Controle receitas, despesas e fluxo de caixa
👥 **Clientes** — CRM completo com pipeline de vendas
📋 **Projetos** — Gestão de entregas e prazos
📊 **Marketing** — Campanhas e ideias de conteúdo
👤 **RH** — Gerencie sua equipe e freelancers
⚙️ **Processos** — Padronize fluxos da operação

Explore cada módulo no menu lateral ou me pergunte sobre qualquer área. Estou aqui para te ajudar!`,
};
