export interface ImportField {
  key: string;
  label: string;
  required?: boolean;
  aliases: string[];
  type?: 'string' | 'number' | 'date';
}

export interface ImportConfig {
  label: string;
  table?: string; // Supabase table name (if applicable)
  fields: ImportField[];
  supportsAI?: boolean;
}

export const importConfigs: Record<string, ImportConfig> = {
  clientes: {
    label: "Clientes",
    table: "clientes",
    supportsAI: true,
    fields: [
      { key: "nome", label: "Nome", required: true, aliases: ["Nome", "Nome do Cliente", "Cliente", "Razão Social", "Name"] },
      { key: "email", label: "Email", aliases: ["Email", "E-mail", "E-Mail", "Correio"] },
      { key: "telefone", label: "Telefone", aliases: ["Telefone", "Tel", "Fone", "Phone", "Celular"] },
      { key: "empresa", label: "Empresa", aliases: ["Empresa", "Razão Social", "Company", "Organização"] },
      { key: "segmento", label: "Segmento", aliases: ["Segmento", "Setor", "Área", "Ramo", "Indústria"] },
      { key: "status", label: "Status", aliases: ["Status", "Situação"], type: 'string' },
      { key: "valor_total", label: "Valor Total", aliases: ["Valor", "Valor Total", "Faturamento", "Revenue"], type: 'number' },
      { key: "tipo_contrato", label: "Tipo de Contrato", aliases: ["Contrato", "Tipo Contrato", "Tipo de Contrato", "Contract"] },
    ],
  },
  
  financas_transacoes: {
    label: "Transações Financeiras",
    fields: [
      { key: "description", label: "Descrição", required: true, aliases: ["Descrição", "Descricao", "Histórico", "Historico", "Nome"] },
      { key: "value", label: "Valor", required: true, aliases: ["Valor", "Montante", "Quantia"], type: 'number' },
      { key: "date", label: "Data", aliases: ["Data", "Vencimento", "Data Vencimento"], type: 'date' },
      { key: "category", label: "Categoria", aliases: ["Categoria", "Tipo Categoria", "Cat"] },
      { key: "type", label: "Tipo", aliases: ["Tipo", "Natureza"], type: 'string' },
      { key: "status", label: "Status", aliases: ["Status", "Situação", "Pago", "Pendente"] },
      { key: "client", label: "Cliente", aliases: ["Cliente", "Client", "Pagador"] },
      { key: "provider", label: "Fornecedor", aliases: ["Fornecedor", "Provider", "Beneficiário"] },
      { key: "paymentMethod", label: "Forma de Pagamento", aliases: ["Forma de Pagamento", "Pagamento", "Método"] },
    ],
  },
  
  rh_colaboradores: {
    label: "Colaboradores",
    fields: [
      { key: "name", label: "Nome", required: true, aliases: ["Nome", "Colaborador", "Funcionário", "Name"] },
      { key: "role", label: "Cargo", aliases: ["Cargo", "Função", "Funcao", "Position", "Role"] },
      { key: "department", label: "Departamento", aliases: ["Departamento", "Setor", "Área", "Department"] },
      { key: "salary", label: "Salário", aliases: ["Salário", "Salario", "Salary", "Remuneração"], type: 'number' },
      { key: "startDate", label: "Data de Admissão", aliases: ["Admissão", "Admissao", "Data Início", "Data Inicio", "Start Date"], type: 'date' },
      { key: "email", label: "Email", aliases: ["Email", "E-mail", "Correio"] },
      { key: "phone", label: "Telefone", aliases: ["Telefone", "Tel", "Phone", "Celular"] },
      { key: "status", label: "Status", aliases: ["Status", "Situação"] },
      { key: "manager", label: "Gestor", aliases: ["Gestor", "Manager", "Líder", "Supervisor"] },
    ],
  },
  
  rh_vagas: {
    label: "Vagas",
    fields: [
      { key: "title", label: "Título", required: true, aliases: ["Título", "Titulo", "Vaga", "Cargo", "Position"] },
      { key: "department", label: "Departamento", aliases: ["Departamento", "Setor", "Área"] },
      { key: "level", label: "Nível", aliases: ["Nível", "Nivel", "Senioridade", "Level"] },
      { key: "salaryRange", label: "Faixa Salarial", aliases: ["Faixa Salarial", "Salário", "Salary Range"] },
      { key: "status", label: "Status", aliases: ["Status", "Situação"] },
      { key: "priority", label: "Prioridade", aliases: ["Prioridade", "Priority", "Urgência"] },
      { key: "channel", label: "Canal", aliases: ["Canal", "Origem", "Source"] },
      { key: "description", label: "Descrição", aliases: ["Descrição", "Descricao", "Description"] },
    ],
  },
  
  projetos: {
    label: "Projetos",
    fields: [
      { key: "name", label: "Nome", required: true, aliases: ["Nome", "Projeto", "Project", "Título"] },
      { key: "status", label: "Status", aliases: ["Status", "Situação", "Estado"] },
      { key: "priority", label: "Prioridade", aliases: ["Prioridade", "Priority", "Urgência"] },
      { key: "startDate", label: "Data de Início", aliases: ["Início", "Inicio", "Start Date", "Data Início"], type: 'date' },
      { key: "endDate", label: "Data de Fim", aliases: ["Fim", "Prazo", "End Date", "Data Fim", "Deadline"], type: 'date' },
      { key: "budget", label: "Orçamento", aliases: ["Orçamento", "Orcamento", "Budget", "Valor"], type: 'number' },
      { key: "responsible", label: "Responsável", aliases: ["Responsável", "Responsavel", "PM", "Gerente", "Owner"] },
      { key: "description", label: "Descrição", aliases: ["Descrição", "Descricao", "Description"] },
    ],
  },
  
  tarefas: {
    label: "Tarefas",
    fields: [
      { key: "title", label: "Título", required: true, aliases: ["Título", "Titulo", "Tarefa", "Task", "Nome"] },
      { key: "description", label: "Descrição", aliases: ["Descrição", "Descricao", "Description", "Detalhes"] },
      { key: "dueDate", label: "Prazo", aliases: ["Prazo", "Vencimento", "Due Date", "Data Limite"], type: 'date' },
      { key: "priority", label: "Prioridade", aliases: ["Prioridade", "Priority", "Urgência"] },
      { key: "status", label: "Status", aliases: ["Status", "Situação", "Estado"] },
      { key: "category", label: "Categoria", aliases: ["Tipo", "Categoria", "Type", "Tarefa/Meta"] },
      { key: "responsible", label: "Responsável", aliases: ["Responsável", "Responsavel", "Assigned", "Owner"] },
    ],
  },
  
  marketing_campanhas: {
    label: "Campanhas",
    fields: [
      { key: "name", label: "Nome", required: true, aliases: ["Nome", "Campanha", "Campaign", "Título"] },
      { key: "objective", label: "Objetivo", aliases: ["Objetivo", "Objective", "Meta", "Goal"] },
      { key: "platforms", label: "Plataformas", aliases: ["Plataformas", "Canais", "Platforms", "Channels"] },
      { key: "budget", label: "Orçamento", aliases: ["Orçamento", "Orcamento", "Budget", "Investimento"], type: 'number' },
      { key: "startDate", label: "Data de Início", aliases: ["Início", "Inicio", "Start Date"], type: 'date' },
      { key: "endDate", label: "Data de Fim", aliases: ["Fim", "End Date", "Data Fim"], type: 'date' },
      { key: "status", label: "Status", aliases: ["Status", "Situação"] },
      { key: "responsible", label: "Responsável", aliases: ["Responsável", "Responsavel", "Owner"] },
    ],
  },
  
  marketing_conteudos: {
    label: "Conteúdos",
    fields: [
      { key: "title", label: "Título", required: true, aliases: ["Título", "Titulo", "Title", "Nome"] },
      { key: "format", label: "Formato", aliases: ["Formato", "Format", "Tipo"] },
      { key: "theme", label: "Tema", aliases: ["Tema", "Theme", "Assunto", "Tópico"] },
      { key: "priority", label: "Prioridade", aliases: ["Prioridade", "Priority"] },
      { key: "status", label: "Status", aliases: ["Status", "Situação"] },
      { key: "dueDate", label: "Prazo", aliases: ["Prazo", "Due Date", "Publicação"], type: 'date' },
      { key: "description", label: "Descrição", aliases: ["Descrição", "Descricao", "Description"] },
    ],
  },
  
  processos: {
    label: "Processos",
    fields: [
      { key: "name", label: "Nome", required: true, aliases: ["Nome", "Processo", "Process", "Título"] },
      { key: "description", label: "Descrição", aliases: ["Descrição", "Descricao", "Description"] },
      { key: "department", label: "Departamento", aliases: ["Departamento", "Setor", "Área", "Department"] },
      { key: "owner", label: "Responsável", aliases: ["Responsável", "Responsavel", "Owner", "Dono"] },
      { key: "status", label: "Status", aliases: ["Status", "Situação"] },
    ],
  },
};

export function getImportConfig(key: string): ImportConfig | undefined {
  return importConfigs[key];
}
