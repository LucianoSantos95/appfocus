// Pixel de abertura de e-mail. Público por natureza: quem carrega é o cliente
// de e-mail do destinatário, sem sessão. Só marca opened_at/open_count em uma
// linha existente de email_send_log — não cria nem expõe nada.
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// GIF transparente 1x1
const PIXEL = Uint8Array.from(
  atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"),
  (c) => c.charCodeAt(0),
);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pixel() {
  return new Response(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "Pragma": "no-cache",
      "Content-Length": String(PIXEL.byteLength),
    },
  });
}

Deno.serve(async (req) => {
  try {
    const id = new URL(req.url).searchParams.get("m") ?? "";
    if (!UUID_RE.test(id)) return pixel();

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data } = await admin
      .from("email_send_log")
      .select("id,opened_at,open_count")
      .eq("id", id)
      .maybeSingle();

    if (data) {
      await admin
        .from("email_send_log")
        .update({
          opened_at: data.opened_at ?? new Date().toISOString(),
          open_count: (data.open_count ?? 0) + 1,
        })
        .eq("id", id);
    }
  } catch (e) {
    console.error("track-email-open error", e);
  }
  // Sempre responde a imagem — nunca quebrar o layout do e-mail.
  return pixel();
});
