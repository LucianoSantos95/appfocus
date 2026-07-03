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
  name: "send_conversion_nudge",
  title: "Enviar nudge de conversão",
  description: "Envia uma notificação in-app oferecendo cupom de conversão (20% OFF - ONBOARDING20) e registra o touchpoint. Apenas admins.",
  inputSchema: {
    user_id: z.string().uuid(),
    custom_message: z.string().optional().describe("Mensagem personalizada opcional."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ user_id, custom_message }, ctx) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return { content: [{ type: "text", text: gate.msg }], isError: true };

    const { data: profile } = await gate.sb
      .from("profiles")
      .select("display_name")
      .eq("user_id", user_id)
      .maybeSingle();
    const message =
      custom_message ??
      `${profile?.display_name ?? "Olá"}, aproveite 20% OFF no Plus com o cupom ONBOARDING20. Válido por tempo limitado.`;

    const { error: notifErr } = await gate.sb.from("notifications").insert({
      user_id,
      title: "🎁 Cupom especial para você",
      message,
      type: "upgrade_nudge",
    });
    if (notifErr) return { content: [{ type: "text", text: notifErr.message }], isError: true };

    await gate.sb.from("sales_touchpoints").insert({
      user_id,
      channel: "system",
      reason: "conversion_nudge_coupon",
      outcome: "notification_sent",
      created_by: ctx.getUserId(),
      metadata: { coupon: "ONBOARDING20" },
    });

    return {
      content: [{ type: "text", text: "Nudge enviado com cupom ONBOARDING20." }],
      structuredContent: { sent: true, coupon: "ONBOARDING20" },
    };
  },
});
