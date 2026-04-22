/**
 * Operation templates per niche segment.
 * Applied automatically right after the user picks a segment in the welcome modal.
 *
 * Each template provides:
 *  - pipeline: 3-5 processes representing the segment's typical workflow
 *  - tasks: 3-5 ready-to-execute tasks aligned with the priority pain
 *  - categories: suggested financial categories (shown as a pinned bulletin note)
 */

export type SegmentId = "agencia" | "consultoria" | "freelancer" | "pme";

export interface NicheTemplate {
  label: string;
  pipeline: Array<{ name: string; description: string; department: string }>;
  tasks: Array<{ title: string; description: string; priority: "baixa" | "media" | "alta"; category: string }>;
  categories: { receitas: string[]; despesas: string[] };
}

export const NICHE_TEMPLATES: Record<SegmentId, NicheTemplate> = {
  agencia: {
    label: "Agência",
    pipeline: [
      { name: "Briefing & Proposta", description: "Captação de briefing do cliente e envio de proposta comercial", department: "Comercial" },
      { name: "Kickoff & Planejamento", description: "Reunião de kickoff, definição de cronograma e responsáveis", department: "Operações" },
      { name: "Produção Criativa", description: "Execução de peças, conteúdos e entregas criativas", department: "Criação" },
      { name: "Aprovação do Cliente", description: "Envio para validação e ajustes solicitados", department: "Atendimento" },
      { name: "Entrega & Faturamento", description: "Entrega final, emissão de NF e cobrança", department: "Financeiro" },
    ],
    tasks: [
      { title: "Cadastrar 3 clientes ativos", description: "Adicione seus clientes em contrato no módulo Clientes", priority: "alta", category: "Comercial" },
      { title: "Configurar primeiro projeto", description: "Crie um projeto com prazo, orçamento e responsável", priority: "alta", category: "Operações" },
      { title: "Definir equipe criativa", description: "Cadastre os colaboradores no módulo RH", priority: "media", category: "RH" },
      { title: "Planejar campanha do mês", description: "Estruture a primeira campanha em Marketing", priority: "media", category: "Marketing" },
    ],
    categories: {
      receitas: ["Retainer Mensal", "Projeto Pontual", "Mídia Paga (repasse)", "Consultoria Estratégica"],
      despesas: ["Freelancers", "Ferramentas SaaS", "Mídia Paga", "Folha de Pagamento", "Estrutura"],
    },
  },

  consultoria: {
    label: "Consultoria",
    pipeline: [
      { name: "Diagnóstico Inicial", description: "Reunião exploratória e mapeamento da dor do cliente", department: "Comercial" },
      { name: "Proposta de Engajamento", description: "Envio de proposta com escopo, prazos e investimento", department: "Comercial" },
      { name: "Execução do Projeto", description: "Entregas conforme cronograma e metodologia definida", department: "Operações" },
      { name: "Apresentação de Resultados", description: "Workshop de resultados e recomendações", department: "Operações" },
      { name: "Pós-venda & Recorrência", description: "Acompanhamento e oferta de novos engajamentos", department: "Comercial" },
    ],
    tasks: [
      { title: "Mapear carteira de prospects", description: "Cadastre leads qualificados no módulo Clientes", priority: "alta", category: "Comercial" },
      { title: "Documentar metodologia", description: "Registre seu processo no módulo Processos", priority: "alta", category: "Conhecimento" },
      { title: "Definir tabela de honorários", description: "Configure faixas de preço por tipo de projeto", priority: "media", category: "Financeiro" },
      { title: "Agendar follow-up de prospects", description: "Crie tarefas recorrentes de relacionamento", priority: "media", category: "Comercial" },
    ],
    categories: {
      receitas: ["Honorários Fixos", "Projetos Sob Demanda", "Workshops", "Mentorias"],
      despesas: ["Deslocamento", "Ferramentas SaaS", "Material de Apoio", "Marketing", "Pró-labore"],
    },
  },

  freelancer: {
    label: "Freelancer",
    pipeline: [
      { name: "Captação de Lead", description: "Origem do contato (indicação, plataforma, marketing)", department: "Comercial" },
      { name: "Orçamento Enviado", description: "Proposta detalhada com escopo e prazo", department: "Comercial" },
      { name: "Em Execução", description: "Projeto ativo conforme cronograma acordado", department: "Operações" },
      { name: "Revisões & Entrega", description: "Ajustes finais e entrega do material", department: "Operações" },
      { name: "Pagamento Recebido", description: "Confirmação do pagamento e fechamento", department: "Financeiro" },
    ],
    tasks: [
      { title: "Listar clientes ativos", description: "Cadastre quem está pagando este mês", priority: "alta", category: "Comercial" },
      { title: "Lançar receitas do mês", description: "Registre os jobs faturados no Financeiro", priority: "alta", category: "Financeiro" },
      { title: "Criar lista de prospects", description: "Quem você quer captar nas próximas semanas", priority: "media", category: "Comercial" },
      { title: "Separar pró-labore mensal", description: "Defina quanto retira de salário fixo", priority: "media", category: "Financeiro" },
    ],
    categories: {
      receitas: ["Jobs Pontuais", "Recorrência Mensal", "Royalties", "Comissões"],
      despesas: ["Pró-labore", "Impostos (DAS/MEI)", "Ferramentas", "Cursos", "Equipamento"],
    },
  },

  pme: {
    label: "PME",
    pipeline: [
      { name: "Atração de Clientes", description: "Marketing, indicações e canais de aquisição", department: "Marketing" },
      { name: "Vendas & Negociação", description: "Conversão de leads em clientes", department: "Comercial" },
      { name: "Operação & Entrega", description: "Execução do produto ou serviço contratado", department: "Operações" },
      { name: "Financeiro & Cobrança", description: "Faturamento, cobrança e conciliação", department: "Financeiro" },
      { name: "Pós-venda & Fidelização", description: "Suporte, retenção e expansão de receita", department: "Atendimento" },
    ],
    tasks: [
      { title: "Mapear receita do mês", description: "Lance todas as entradas confirmadas", priority: "alta", category: "Financeiro" },
      { title: "Listar despesas fixas", description: "Aluguel, salários, ferramentas, impostos", priority: "alta", category: "Financeiro" },
      { title: "Cadastrar equipe", description: "Adicione todos os colaboradores no RH", priority: "media", category: "RH" },
      { title: "Revisar contas bancárias", description: "Garanta saldo correto em cada conta", priority: "media", category: "Financeiro" },
    ],
    categories: {
      receitas: ["Vendas de Produtos", "Prestação de Serviços", "Recorrências", "Outras Receitas"],
      despesas: ["Folha de Pagamento", "Aluguel", "Ferramentas", "Impostos", "Marketing", "Insumos"],
    },
  },
};

export function getNicheTemplate(segment: string | null | undefined): NicheTemplate {
  const key = (segment || "pme") as SegmentId;
  return NICHE_TEMPLATES[key] || NICHE_TEMPLATES.pme;
}
