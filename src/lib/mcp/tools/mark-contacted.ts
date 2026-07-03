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
  name: "mark_contacted",
  title: "Registrar contato comercial",
  description: "Registra um touchpoint de vendas (ligação, e-mail, WhatsApp) feito com um usuário. Apenas admins.",
  inputSchema: {
    user_id: z.string().uuid().describe("ID do usuário contatado."),
    channel: z.enum(["email", "whatsapp", "call", "manual"]).describe("Canal do contato."),
    reason: z.string().min(1).describe("Motivo do contato (ex: 'upgrade Plus', 'follow-up cupom')."),
    outcome: z.string().optional().describe("Resultado observado (ex: 'aceitou call', 'sem resposta')."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ user_id, channel, reason, outcome }, ctx) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return { content: [{ type: "text", text: gate.msg }], isError: true };

    const { data, error } = await gate.sb
      .from("sales_touchpoints")
      .insert({ user_id, channel, reason, outcome: outcome ?? null, created_by: ctx.getUserId() })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Touchpoint registrado (${channel}): ${reason}` }],
      structuredContent: { touchpoint: data },
    };
  },
});
