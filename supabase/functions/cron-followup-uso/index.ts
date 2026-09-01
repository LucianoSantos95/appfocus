// Job diário: 4 dias depois do download, dispara o e-mail "e aí, já usou?"
// com estrelas clicáveis. Só envia uma vez por lead+produto — a checagem é
// feita em `email_send_log` (template_name = 'followup_uso').
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DIAS = 4;

Deno.serve(async (req) => {
  // Autoriza somente cron interno (token do vault) ou service role.
  const token = req.headers.get("x-cron-token") ?? new URL(req.url).searchParams.get("token");
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  if (token) {
    const { data: ok } = await admin.rpc("verify_cron_token", { p_token: token });
    if (!ok) return new Response("Unauthorized", { status: 401 });
  } else {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.includes(SERVICE_ROLE)) return new Response("Unauthorized", { status: 401 });
  }

  const agora = Date.now();
  const inicio = new Date(agora - (DIAS + 1) * 86400000).toISOString();
  const fim = new Date(agora - DIAS * 86400000).toISOString();

  const { data: leads, error } = await admin
    .from("leads")
    .select("id,nome,email,produto,created_at,status")
    .gte("created_at", inicio)
    .lt("created_at", fim)
    .neq("status", "legado")
    .not("produto", "is", null);

  if (error) {
    console.error("cron-followup-uso query error", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Já enviados (mesmo e-mail + mesmo produto).
  const { data: enviados } = await admin
    .from("email_send_log")
    .select("recipient_email,metadata")
    .eq("template_name", "followup_uso");

  const jaEnviado = new Set(
    (enviados ?? []).map((e) => {
      const slug = (e.metadata as Record<string, unknown> | null)?.produto_slug ?? "";
      return `${String(e.recipient_email).toLowerCase()}|${slug}`;
    }),
  );

  // Nomes de produto para a copy.
  const { data: produtos } = await admin.from("produtos").select("slug,nome");
  const nomePorSlug = new Map((produtos ?? []).map((p) => [p.slug, p.nome]));

  let enviadosCount = 0;
  let falhas = 0;
  const pulados: string[] = [];

  for (const lead of leads ?? []) {
    const email = String(lead.email ?? "").trim().toLowerCase();
    const slug = String(lead.produto ?? "");
    if (!email || !slug) continue;
    if (jaEnviado.has(`${email}|${slug}`)) {
      pulados.push(email);
      continue;
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-thanks-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({
        kind: "followup_uso",
        email,
        nome: lead.nome ?? null,
        produto_nome: nomePorSlug.get(slug) ?? null,
        produto_slug: slug,
      }),
    });

    if (res.ok) {
      enviadosCount++;
      jaEnviado.add(`${email}|${slug}`);
    } else {
      falhas++;
      console.error("followup_uso falhou", email, res.status, (await res.text()).slice(0, 200));
    }

    await new Promise((r) => setTimeout(r, 150));
  }

  return new Response(
    JSON.stringify({ candidatos: leads?.length ?? 0, enviados: enviadosCount, pulados: pulados.length, falhas }),
    { headers: { "Content-Type": "application/json" } },
  );
});
