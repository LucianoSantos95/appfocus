// Preenchimento por IA do catálogo: recebe { url }, lê a página (server-side,
// sem CORS), extrai og:title/og:description/og:image, sobe a capa no bucket
// "produtos" e pede à IA (Lovable AI Gateway) um rascunho estruturado.
// Admin-only: mesma checagem de papel usada em send-subscriber-broadcast.
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const BUCKET = "produtos";
const VALIDADE = 60 * 60 * 24 * 365 * 10; // 10 anos
const MAX_HTML = 1_500_000; // ~1.5MB
const MAX_IMG = 8_000_000; // 8MB
const TIMEOUT = 9_000; // por requisição
const MAX_IMAGENS = 6;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function publicHttpUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase();
    // bloqueia alvos internos (SSRF básico)
    if (
      host === "localhost" || host.endsWith(".local") || host === "0.0.0.0" ||
      /^(127|10)\./.test(host) || /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) || /^169\.254\./.test(host) ||
      host.includes("metadata")
    ) return null;
    return u;
  } catch {
    return null;
  }
}

async function fetchLimited(url: string, maxBytes: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FocusHubBot/1.0)" },
    });
    if (!res.ok) return null;
    const finalUrl = publicHttpUrl(res.url || url);
    if (!finalUrl) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > maxBytes) return null;
    return { buf, contentType: res.headers.get("content-type") || "", finalUrl: finalUrl.toString() };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function meta(html: string, ...names: string[]): string | null {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`,
      "i",
    );
    const alt = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`,
      "i",
    );
    const m = html.match(re) || html.match(alt);
    if (m?.[1]) return decodeEntities(m[1].trim());
  }
  return null;
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

// Todas as og:image declaradas, na ordem em que aparecem.
function metaAll(html: string, ...names: string[]): string[] {
  const out: string[] = [];
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`,
      "gi",
    );
    const alt = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`,
      "gi",
    );
    for (const m of [...html.matchAll(re), ...html.matchAll(alt)]) {
      if (m[1]) out.push(decodeEntities(m[1].trim()));
    }
  }
  return out;
}

const LIXO = /(sprite|icon|logo|avatar|favicon|badge|emoji|pixel|placeholder|spacer|button)/i;

// <img> do corpo, com heurística simples pra evitar ícone de menu.
function imagensDoCorpo(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const src = decodeEntities(
      tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ??
        tag.match(/\bdata-src=["']([^"']+)["']/i)?.[1] ?? "",
    ).trim();
    if (!src || src.startsWith("data:")) continue;
    if (LIXO.test(src)) continue;
    const w = Number(tag.match(/\bwidth=["']?(\d+)/i)?.[1] ?? 0);
    const h = Number(tag.match(/\bheight=["']?(\d+)/i)?.[1] ?? 0);
    const temSrcset = /\bsrcset=/i.test(tag);
    // sem dimensão declarada e sem srcset ainda vale, mas dimensão pequena reprova
    if ((w && w < 200) || (h && h < 200)) continue;
    out.push(src);
    void temSrcset;
  }
  return out;
}

function coletarImagens(html: string, base: string): string[] {
  const brutos = [
    ...metaAll(html, "og:image:secure_url", "og:image", "twitter:image"),
  ];
  if (brutos.length <= 1) brutos.push(...imagensDoCorpo(html));

  const vistos = new Set<string>();
  const finais: string[] = [];
  for (const raw of brutos) {
    let abs: string;
    try { abs = new URL(raw, base).toString(); } catch { continue; }
    if (!publicHttpUrl(abs)) continue;
    if (vistos.has(abs)) continue;
    vistos.add(abs);
    finais.push(abs);
  }
  return finais;
}

// deno-lint-ignore no-explicit-any
async function baixarESubir(admin: any, url: string): Promise<string | null> {
  const img = await fetchLimited(url, MAX_IMG);
  if (!img || !img.contentType.startsWith("image/")) return null;
  const ext = (img.contentType.split("/")[1] || "jpg").split(";")[0].replace("jpeg", "jpg");
  const path = `${crypto.randomUUID()}.${ext.slice(0, 5)}`;
  const { error } = await admin.storage.from(BUCKET)
    .upload(path, img.buf, { contentType: img.contentType, upsert: false });
  if (error) return null;
  const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(path, VALIDADE);
  return signed?.signedUrl ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Missing Authorization" });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json(401, { error: "Unauthorized" });
    const { data: roleRow } = await admin
      .from("user_roles").select("role")
      .eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return json(403, { error: "Admin only" });

    const body = await req.json().catch(() => ({}));
    const target = publicHttpUrl(String(body?.url || ""));
    if (!target) return json(400, { error: "URL inválida" });

    const page = await fetchLimited(target.toString(), MAX_HTML);
    if (!page) return json(422, { error: "Não consegui abrir esse link" });
    const html = new TextDecoder("utf-8").decode(page.buf);

    const title = meta(html, "og:title", "twitter:title") ||
      decodeEntities(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || "");
    const description = meta(html, "og:description", "twitter:description", "description") || "";

    // 1) galeria: og:image (todas) + <img> do corpo como complemento
    const candidatos = coletarImagens(html, page.finalUrl).slice(0, MAX_IMAGENS);
    const enviadas = await Promise.all(
      candidatos.map((u) => baixarESubir(admin, u)),
    );
    const galeria = enviadas.filter((u): u is string => !!u);
    const capa = galeria[0] ?? null;
    const imagens = galeria.slice(1);


    // 2) IA: rascunho estruturado a partir do que foi extraído
    let draft: Record<string, unknown> = {};
    const prompt = `Você ajuda a cadastrar um produto num catálogo brasileiro de templates de Notion, sistemas e consultoria.

Link: ${page.finalUrl}
Título da página: ${title || "(sem título)"}
Descrição da página: ${description || "(sem descrição)"}

Responda APENAS JSON válido (sem markdown):
{
  "nome": "nome curto do produto",
  "descricao": "1 frase direta do que resolve (máx 110 caracteres)",
  "detalhes": "texto mais longo (3-6 frases): o que é, o que vem dentro, para quem serve",
  "preco": number ou null,
  "gratuito": true ou false,
  "emoji": "1 emoji só",
  "tipo": "notion" | "lovable" | "advisor"
}
Regra do tipo: "notion" para templates/páginas do Notion, "lovable" para sistemas/apps web, "advisor" para consultoria/mentoria.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você responde estritamente com JSON válido." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (aiRes.ok) {
      const aiJson = await aiRes.json();
      let content: string = aiJson?.choices?.[0]?.message?.content ?? "{}";
      content = content.replace(/^```json\s*|\s*```$/g, "").trim();
      try { draft = JSON.parse(content); } catch { draft = {}; }
    } else if (aiRes.status === 429) {
      return json(429, { error: "rate_limited" });
    } else if (aiRes.status === 402) {
      return json(402, { error: "credits_exhausted" });
    } else {
      console.error("AI gateway error", aiRes.status, await aiRes.text());
    }

    const tipo = ["notion", "lovable", "advisor"].includes(String(draft.tipo)) ? draft.tipo : "notion";
    const gratuito = typeof draft.gratuito === "boolean" ? draft.gratuito : true;
    const precoNum = Number(draft.preco);
    const preco = !gratuito && Number.isFinite(precoNum) && precoNum > 0 ? precoNum : null;

    const nome = String(draft.nome || title || "").trim().slice(0, 120);
    if (!nome && !capa) return json(422, { error: "Não consegui extrair nada útil desse link" });

    return json(200, {
      nome,
      descricao: String(draft.descricao || description || "").trim().slice(0, 240) || null,
      detalhes: String(draft.detalhes || "").trim() || null,
      tipo,
      gratuito,
      preco,
      emoji: String(draft.emoji || "📦").slice(0, 4),
      capa,
      imagens,
      link_destino: page.finalUrl,
      ai_ok: Object.keys(draft).length > 0,
    });
  } catch (e) {
    console.error("extract-produto-info error", e);
    return json(500, { error: "Falha inesperada" });
  }
});
