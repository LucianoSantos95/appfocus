import { z } from "zod";

// ── Clientes ──
export const clienteSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  telefone: z.string().trim().max(20, "Telefone muito longo").optional().or(z.literal("")),
  segmento: z.string().trim().max(50).optional().or(z.literal("")),
  status: z.string().trim().max(30).optional(),
  valor_total: z.number().min(0, "Valor não pode ser negativo").optional(),
  tipo_contrato: z.string().trim().max(50).optional().or(z.literal("")),
  anexo_url: z.string().trim().url("URL inválida").max(500).optional().or(z.literal("")),
  empresa: z.string().trim().max(100).optional().or(z.literal("")),
});

// ── Projetos ──
export const projetoSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  status: z.string().trim().max(30).optional(),
  priority: z.string().trim().max(20).optional(),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  budget: z.number().min(0, "Orçamento não pode ser negativo").optional(),
  responsible: z.string().trim().max(100).optional().or(z.literal("")),
  description: z.string().trim().max(2000, "Descrição muito longa").optional().or(z.literal("")),
});

// ── Tarefas ──
export const tarefaSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(200, "Título muito longo"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
  priority: z.string().trim().max(20).optional(),
  status: z.string().trim().max(30).optional(),
  category: z.string().trim().max(50).optional().or(z.literal("")),
  responsible: z.string().trim().max(100).optional().or(z.literal("")),
});

// ── Processos ──
export const processoSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  department: z.string().trim().max(50).optional().or(z.literal("")),
  owner: z.string().trim().max(100).optional().or(z.literal("")),
  status: z.string().trim().max(30).optional(),
});

// ── Colaboradores ──
export const colaboradorSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  role: z.string().trim().max(100).optional().or(z.literal("")),
  department: z.string().trim().max(50).optional().or(z.literal("")),
  salary: z.number().min(0, "Salário não pode ser negativo").optional(),
  start_date: z.string().optional().or(z.literal("")),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  status: z.string().trim().max(30).optional(),
  manager: z.string().trim().max(100).optional().or(z.literal("")),
});

// ── Transações ──
export const transacaoSchema = z.object({
  description: z.string().trim().min(1, "Descrição é obrigatória").max(200, "Descrição muito longa"),
  value: z.number().min(0.01, "Valor deve ser maior que zero"),
  date: z.string().optional(),
  category: z.string().trim().max(50).optional().or(z.literal("")),
  type: z.enum(["receita", "despesa"], { errorMap: () => ({ message: "Tipo inválido" }) }),
  status: z.string().trim().max(30).optional(),
  payment_method: z.string().trim().max(50).optional().or(z.literal("")),
  client: z.string().trim().max(100).optional().or(z.literal("")),
  provider: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  bank_account_id: z.string().uuid().optional().or(z.literal("")),
});

// ── Campanhas ──
export const campanhaSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  objective: z.string().trim().max(500).optional().or(z.literal("")),
  platforms: z.string().trim().max(200).optional().or(z.literal("")),
  budget: z.number().min(0).optional(),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  status: z.string().trim().max(30).optional(),
  responsible: z.string().trim().max(100).optional().or(z.literal("")),
});

// ── Conteúdos ──
export const conteudoSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(200, "Título muito longo"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  platform: z.string().trim().max(50).optional().or(z.literal("")),
  scheduled_date: z.string().optional().or(z.literal("")),
  status: z.string().trim().max(30).optional(),
});

// ── Contas Bancárias ──
export const contaBancariaSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  institution: z.string().trim().max(100).optional().or(z.literal("")),
  type: z.string().trim().max(30).optional(),
  balance: z.number().optional(),
});

// ── Feedback ──
export const feedbackSchema = z.object({
  nome: z.string().trim().max(100).optional().or(z.literal("")),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  mensagem: z.string().trim().min(1, "Mensagem é obrigatória").max(1000, "Mensagem muito longa (máx. 1000 caracteres)"),
  avaliacao: z.number().min(0).max(5).optional(),
});

// ── Support Ticket ──
export const supportTicketSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  telefone: z.string().trim().max(20).optional().or(z.literal("")),
  mensagem: z.string().trim().min(1, "Mensagem é obrigatória").max(2000, "Mensagem muito longa (máx. 2000 caracteres)"),
});

// ── Bulletin Note ──
export const bulletinNoteSchema = z.object({
  content: z.string().trim().min(1, "Mensagem é obrigatória").max(1000, "Mensagem muito longa"),
  author: z.string().trim().min(1, "Autor é obrigatório").max(100),
  isPinned: z.boolean().optional(),
});

// Helper to get first error message from ZodError
export function getZodErrorMessage(error: z.ZodError): string {
  return error.errors.map(e => e.message).join(", ");
}
