export type DemoModule = "financeiro" | "clientes" | "projetos" | "painel";

// Segment IDs must match the values set in WelcomeChoiceModal
type Segment = "agencia" | "consultoria" | "freelancer" | "pme";

// Messages are keyed by [module][segment].
// Each message opens with a concrete number from the demo data,
// delivers ONE clear first action, and ends with a question to pull
// the user into conversation.
export const ASSISTANT_MESSAGES: Record<DemoModule, Record<Segment, string>> = {
  financeiro: {
    agencia: `Financeiro da sua agência em um lugar só 💰

Você tem **R$ 11.700 em receita confirmada** nos últimos 30 dias e **R$ 3.100 a receber** da Gamma Corp.

→ Clique em **"+ Nova Transação"** para lançar seu primeiro recebimento de cliente real
→ Depois use "Relatório" para ver o fluxo do mês inteiro

Quanto você faturou no mês passado? Posso te ajudar a organizar isso aqui.`,

    consultoria: `Sua operação de consultoria financeiramente organizada 💰

**R$ 14.800 faturados** este mês — com um honorário de **R$ 3.100 ainda pendente** da Gamma Corp.

→ Clique em **"+ Nova Transação"** para registrar seu próximo recebimento
→ Use categorias por projeto para entender a margem de cada engajamento

Qual foi o seu último pagamento recebido? Vou te ajudar a lançar agora.`,

    freelancer: `Seu financeiro de freelancer, sem planilha 💰

**R$ 11.700 recebidos**, **R$ 3.100 ainda a receber** — e você sabe exatamente de quem.

→ Clique em **"+ Nova Transação"** para registrar seu último pagamento
→ Separe por cliente para saber quem é mais lucrativo no mês

Quanto você faturou nos últimos 3 meses? Posso te ajudar a calcular agora.`,

    pme: `Visibilidade financeira real para sua empresa 💰

**R$ 18.500 em caixa**, **R$ 11.700 em receita confirmada** e **R$ 3.100 a receber** da Gamma Corp.

→ Clique em **"+ Nova Transação"** para registrar uma entrada ou saída de hoje
→ Categorize para ver onde o dinheiro realmente vai

Quanto você tem em caixa agora? Vamos organizar isso juntos.`,
  },

  clientes: {
    agencia: `Sua carteira de clientes de agência organizada 👥

**3 contas ativas** e **2 prospects** no pipeline — **R$ 20.300 em contratos vigentes**.

→ Clique em **"+ Novo Cliente"** para cadastrar uma conta real da agência
→ Clique em "Alpha Tech" para ver como fica o histórico de cada conta

Qual cliente da agência você quer adicionar primeiro?`,

    consultoria: `Seu portfólio de clientes de consultoria 👥

**5 empresas na carteira**: 2 com contrato ativo, 2 em negociação, 1 encerrado.

→ Clique em **"+ Novo Cliente"** para cadastrar uma empresa que está em negociação
→ Registre próximos passos por cliente — nenhum lead esfria sem motivo

Qual empresa está mais próxima de fechar hoje?`,

    freelancer: `Seus clientes organizados como um profissional 👥

**5 clientes cadastrados** — 2 prospects, 2 ativos, 1 encerrado. Histórico completo de cada um.

→ Clique em **"+ Novo Cliente"** para adicionar quem está em proposta agora
→ Registre o próximo passo para nunca deixar um lead esfriar

Você tem algum prospect que está demorando para responder?`,

    pme: `Sua carteira de clientes com visibilidade total 👥

**5 clientes no sistema**, **R$ 23.700 em contratos vigentes**, 2 em negociação ativa.

→ Clique em **"+ Novo Cliente"** para cadastrar quem você atende hoje
→ Registre contato, contrato e histórico em um lugar só

Qual cliente você precisa fazer follow-up esta semana?`,
  },

  projetos: {
    agencia: `Seus projetos de agência com prazos e orçamentos 📋

**3 projetos ativos** — "Rebranding Alpha Tech" com prazo em **15 dias** e orçamento de **R$ 12.000**.

→ Clique em **"+ Novo Projeto"** para cadastrar seu próximo briefing
→ Vincule ao cliente para rastrear rentabilidade por conta

Tem algum projeto com prazo esta semana que precisa organizar?`,

    consultoria: `Seus engajamentos de consultoria controlados 📋

**"Consultoria Delta"** encerrado em R$ 6.000. **"Rebranding Alpha"** em andamento com **15 dias restantes**.

→ Clique em **"+ Novo Projeto"** para abrir um engajamento atual
→ Defina escopo, prazo e responsável para rastrear profitabilidade

Qual é o seu próximo deliverable para um cliente?`,

    freelancer: `Seus projetos freelance com controle total 📋

**4 jobs organizados** por prazo e orçamento. "Rebranding Alpha Tech" tem prazo em **15 dias** — atenção.

→ Clique em **"+ Novo Projeto"** para adicionar seu próximo job
→ Vincule ao cliente e receba alertas de prazo automáticos

Qual projeto você precisa entregar essa semana?`,

    pme: `Seus projetos com prazo e orçamento sob controle 📋

**4 projetos**, **R$ 41.500 em orçamento total**, sendo 2 em andamento e 1 atrasando.

→ Clique em **"+ Novo Projeto"** para adicionar um projeto ou entrega em andamento
→ Defina responsável e prazo — a equipe saberá exatamente o que está em jogo

Qual projeto está mais próximo do prazo agora?`,
  },

  painel: {
    agencia: `Visão geral da sua agência 🚀

Receita confirmada: **R$ 11.700** | A receber: **R$ 3.100** | Clientes ativos: **3** | Projetos: **3**

→ **Financeiro** → se o desafio hoje é fluxo de caixa e recebimentos
→ **Clientes** → se quer organizar contas e pipeline de novas marcas
→ **Projetos** → se precisa controlar briefings, prazos e entregas

O que mais trava sua agência hoje?`,

    consultoria: `Painel completo da sua consultoria 🚀

Honorários confirmados: **R$ 11.700** | Contratos vigentes: **R$ 23.700** | Leads em pipeline: **2**

→ **Financeiro** → para controlar honorários e projetar receita mensal
→ **Clientes** → para organizar pipeline e próximas reuniões
→ **Projetos** → para rastrear escopo e prazo de cada engajamento

Qual é o maior desafio de gestão da sua consultoria agora?`,

    freelancer: `Sua operação freelance em um lugar só 🚀

Receita do mês: **R$ 11.700** | A receber: **R$ 3.100** | Clientes ativos: **3** | Jobs rodando: **3**

→ **Financeiro** → para não perder controle do que entra e sai
→ **Clientes** → para nunca esquecer um follow-up
→ **Projetos** → para saber exatamente o que entregar e quando

O que mais trava seu trabalho freelance hoje?`,

    pme: `Painel completo da sua empresa 🚀

Receita confirmada: **R$ 11.700** | A receber: **R$ 3.100** | Clientes: **5** | Projetos ativos: **4**

→ **Financeiro** → para ver onde está o dinheiro e o que está pendente
→ **Clientes** → para organizar quem você atende e os próximos passos
→ **Projetos** → para controlar prazos, equipe e orçamento

Qual é a maior dor de gestão da sua empresa hoje?`,
  },
};

export function getAssistantMessage(module: DemoModule, segment: string): string {
  const segKey = segment as Segment;
  return (
    ASSISTANT_MESSAGES[module]?.[segKey] ??
    ASSISTANT_MESSAGES[module]?.["pme"] ??
    ""
  );
}
