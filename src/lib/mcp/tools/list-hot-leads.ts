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
  name: "list_hot_leads",
  title: "Listar leads quentes",
  description: "Lista usuários no estágio 'quente' (ativos e engajados no plano gratuito) prontos para conversão. Apenas admins.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Máximo de leads (padrão 20)."),
    dias_sem_contato: z.number().int().min(0).max(90).optional().describe("Filtrar quem não recebeu touchpoint nos últimos N dias."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, dias_sem_contato }, ctx) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return { content: [{ type: "text", text: gate.msg }], isError: true };

    const { data: hot, error } = await gate.sb
      .from("user_funnel_stage")
      .select("user_id, score, hot_at, last_activity_at")
      .eq("stage", "quente")
      .order("score", { ascending: false })
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const results: unknown[] = [];
    for (const row of hot ?? []) {
      const { data: profile } = await gate.sb
        .from("profiles")
        .select("display_name, company_name, phone")
        .eq("user_id", row.user_id)
        .maybeSingle();
      const { data: authUser } = await gate.sb.auth.admin.getUserById(row.user_id);
      const email = authUser?.user?.email;

      if (dias_sem_contato && dias_sem_contato > 0) {
        const { count } = await gate.sb
          .from("sales_touchpoints")
          .select("id", { count: "exact", head: true })
          .eq("user_id", row.user_id)
          .gte("created_at", new Date(Date.now() - dias_sem_contato * 24 * 3600 * 1000).toISOString());
        if ((count ?? 0) > 0) continue;
      }

      results.push({
        user_id: row.user_id,
        display_name: profile?.display_name,
        company_name: profile?.company_name,
        email,
        phone: profile?.phone,
        score: row.score,
        hot_since: row.hot_at,
        last_activity_at: row.last_activity_at,
      });
    }

    return { content: [{ type: "text", text: JSON.stringify(results) }], structuredContent: { leads: results } };
  },
});
