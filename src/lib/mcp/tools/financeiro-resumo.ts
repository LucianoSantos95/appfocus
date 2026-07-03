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
  name: "financeiro_resumo",
  title: "Resumo financeiro",
  description: "Retorna soma de receitas, despesas e saldo do período informado.",
  inputSchema: {
    inicio: z.string().optional().describe("Data inicial ISO (YYYY-MM-DD)."),
    fim: z.string().optional().describe("Data final ISO (YYYY-MM-DD)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ inicio, fim }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    let q = sbForUser(ctx).from("transacoes").select("tipo,valor,data");
    if (inicio) q = q.gte("data", inicio);
    if (fim) q = q.lte("data", fim);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    let receitas = 0, despesas = 0;
    for (const t of data ?? []) {
      const v = Number(t.valor) || 0;
      if (t.tipo === "receita") receitas += v;
      else if (t.tipo === "despesa") despesas += v;
    }
    const resumo = { receitas, despesas, saldo: receitas - despesas, total_transacoes: data?.length ?? 0 };
    return { content: [{ type: "text", text: JSON.stringify(resumo) }], structuredContent: resumo };
  },
});
