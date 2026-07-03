import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sbForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_clientes",
  title: "Listar clientes",
  description: "Lista os clientes (prospects e ativos) do usuário autenticado.",
  inputSchema: {
    status: z.enum(["prospect", "active", "inactive"]).optional().describe("Filtra por status do cliente."),
    limit: z.number().int().min(1).max(100).optional().describe("Máximo de clientes a retornar (padrão 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    let q = sbForUser(ctx).from("clientes").select("id,nome,email,telefone,status,valor_mensal,created_at").order("created_at", { ascending: false }).limit(limit ?? 25);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { clientes: data } };
  },
});
