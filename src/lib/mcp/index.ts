import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listClientes from "./tools/list-clientes";
import listProjetos from "./tools/list-projetos";
import listTarefas from "./tools/list-tarefas";
import createTarefa from "./tools/create-tarefa";
import financeiroResumo from "./tools/financeiro-resumo";
import funnelSummary from "./tools/funnel-summary";
import listHotLeads from "./tools/list-hot-leads";
import markContacted from "./tools/mark-contacted";
import sendConversionNudge from "./tools/send-conversion-nudge";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "hub-empresarial-mcp",
  title: "Hub Empresarial MCP",
  version: "0.2.0",
  instructions:
    "Ferramentas do Hub Empresarial (Focus Inteligente). Uso geral: consulte e gerencie clientes, projetos, tarefas e finanças da operação do usuário autenticado (respeita RLS). Ferramentas de vendas (apenas admins): 'funnel_summary' para visão do funil, 'list_hot_leads' para identificar usuários prontos para converter, 'mark_contacted' para registrar contato comercial, 'send_conversion_nudge' para enviar cupom de 20% OFF via notificação in-app.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listClientes,
    listProjetos,
    listTarefas,
    createTarefa,
    financeiroResumo,
    funnelSummary,
    listHotLeads,
    markContacted,
    sendConversionNudge,
  ],
});
