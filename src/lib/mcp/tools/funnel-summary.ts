import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function sbAdmin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function requireAdmin(ctx: ToolContext) {
  if (!ctx.isAuthenticated()) return { ok: false as const, msg: "Não autenticado" };
  const sb = sbAdmin();
  const { data, error } = await sb.rpc("has_role", { _user_id: ctx.getUserId(), _role: "admin" });
  if (error) return { ok: false as const, msg: error.message };
  if (!data) return { ok: false as const, msg: "Requer permissão de admin" };
  return { ok: true as const, sb };
}

export default defineTool({
  name: "funnel_summary",
  title: "Resumo do funil de conversão",
  description: "Retorna a contagem de usuários por estágio (novo, ativado, quente, convertido, churn) e taxa de conversão. Apenas admins.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return { content: [{ type: "text", text: gate.msg }], isError: true };
    const { data, error } = await gate.sb.from("vw_funnel_summary").select("*");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const total = (data ?? []).reduce((s, r) => s + (r.usuarios ?? 0), 0);
    const convertidos = (data ?? []).find((r) => r.stage === "convertido")?.usuarios ?? 0;
    const summary = {
      por_estagio: data,
      total_usuarios: total,
      taxa_conversao_pct: total ? Math.round((convertidos / total) * 1000) / 10 : 0,
    };
    return { content: [{ type: "text", text: JSON.stringify(summary) }], structuredContent: summary };
  },
});
