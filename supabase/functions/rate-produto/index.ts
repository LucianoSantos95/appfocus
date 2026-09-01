// Registro de nota por clique no e-mail de follow-up de uso.
// Público por natureza: quem abre é o destinatário, sem sessão. A referência
// segura é o id da linha de `email_send_log` (mesmo id usado no pixel de
// abertura) — não aceita e-mail nem produto vindos da URL.
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = "https://app.focusinteligente.com.br";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function redirect(url: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: url, "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const logId = url.searchParams.get("log") ?? "";
    const nota = Number(url.searchParams.get("nota"));

    if (!UUID_RE.test(logId) || !Number.isInteger(nota) || nota < 1 || nota > 5) {
      return redirect(`${SITE_URL}/`);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: log } = await admin
      .from("email_send_log")
      .select("id,recipient_email,metadata,template_name")
      .eq("id", logId)
      .maybeSingle();

    if (!log) return redirect(`${SITE_URL}/`);

    const metadata = (log.metadata ?? {}) as Record<string, unknown>;
    const slug = typeof metadata.produto_slug === "string" ? metadata.produto_slug : null;
    const produtoNome = typeof metadata.produto === "string" ? metadata.produto : null;
    const jaAvaliado = Boolean(metadata.nota);

    // Clique repetido: não duplica o feedback, só reaproveita a nota já salva.
    if (!jaAvaliado) {
      await admin.from("feedbacks").insert({
        email: log.recipient_email,
        avaliacao: nota,
        pagina: slug,
        mensagem: "Avaliação via e-mail de follow-up",
      });

      await admin
        .from("email_send_log")
        .update({ metadata: { ...metadata, nota } })
        .eq("id", log.id);
    }

    const destino = new URL(`${SITE_URL}/avaliacao-recebida`);
    destino.searchParams.set("nota", String(jaAvaliado ? metadata.nota : nota));
    if (slug) destino.searchParams.set("produto", slug);
    if (produtoNome) destino.searchParams.set("nome", produtoNome);
    return redirect(destino.toString());
  } catch (e) {
    console.error("rate-produto error", e);
    return redirect(`${SITE_URL}/`);
  }
});
