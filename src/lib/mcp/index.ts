import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listClientes from "./tools/list-clientes";
import listProjetos from "./tools/list-projetos";
import listTarefas from "./tools/list-tarefas";
import createTarefa from "./tools/create-tarefa";
import financeiroResumo from "./tools/financeiro-resumo";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "hub-empresarial-mcp",
  title: "Hub Empresarial MCP",
  version: "0.1.0",
  instructions:
    "Ferramentas do Hub Empresarial (Focus Inteligente): gerencie clientes, projetos, tarefas e finanças da operação do usuário autenticado. Toda operação respeita RLS do usuário.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listClientes, listProjetos, listTarefas, createTarefa, financeiroResumo],
});
