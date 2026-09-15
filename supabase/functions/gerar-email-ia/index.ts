// Rascunho de e-mail por IA para o disparo manual do admin.
// Recebe { tema, produtos: string[] (slugs) } e devolve { assunto, mensagem }.
// Admin-only, mesma checagem usada em extract-produto-info.
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
    const tema = String(body?.tema || "").trim().slice(0, 500);
    const slugs: string[] = Array.isArray(body?.produtos)
      ? body.produtos.map((s: unknown) => String(s)).slice(0, 10)
      : [];
    if (!tema) return json(400, { error: "Escreva o tema do e-mail." });

    let contexto = "(nenhum produto selecionado)";
    if (slugs.length) {
      const { data: prods } = await admin
        .from("produtos")
        .select("slug,nome,descricao,detalhes,link_destino,preco,gratuito")
        .in("slug", slugs);
      if (prods?.length) {
        contexto = prods.map((p: Record<string, unknown>) =>
          [
            `- ${p.nome}`,
            p.descricao ? `  Descrição: ${p.descricao}` : "",
            p.detalhes ? `  Detalhes: ${String(p.detalhes).slice(0, 400)}` : "",
            p.gratuito ? "  Preço: gratuito" : p.preco ? `  Preço: R$ ${p.preco}` : "",
            p.link_destino ? `  Link: ${p.link_destino}` : "",
          ].filter(Boolean).join("\n")
        ).join("\n\n");
      }
    }

    const prompt = `Escreva um e-mail curto em português do Brasil para a base do Hub Central (catálogo de templates de Notion, sistemas e consultoria do Luciano).

Tema pedido: ${tema}

Produtos que o e-mail deve mencionar:
${contexto}

Tom: direto, pessoal, como se escrevesse para uma pessoa só. Sem enrolação, sem jargão de marketing, sem "não perca essa oportunidade", sem emojis em excesso, sem assinatura formal longa. Máximo 6 parágrafos curtos. Termine com um fechamento simples e uma chamada clara para clicar no botão do e-mail (não escreva o botão nem coloque links crus; o botão é adicionado depois).

Responda APENAS JSON válido, sem markdown:
{"assunto": "assunto curto, máx 60 caracteres, sem clickbait", "mensagem": "corpo do e-mail em texto puro; separe parágrafos com uma linha em branco"}`;

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

    if (aiRes.status === 429) return json(429, { error: "Muitas gerações seguidas. Espere alguns segundos e tente de novo." });
    if (aiRes.status === 402) return json(402, { error: "Os créditos de IA acabaram. Adicione créditos para continuar." });
    if (!aiRes.ok) {
      console.error("AI gateway error", aiRes.status, await aiRes.text());
      return json(502, { error: "A IA não respondeu. Tente de novo." });
    }

    const aiJson = await aiRes.json();
    let content: string = aiJson?.choices?.[0]?.message?.content ?? "{}";
    content = content.replace(/^```json\s*|\s*```$/g, "").trim();
    let draft: { assunto?: string; mensagem?: string } = {};
    try { draft = JSON.parse(content); } catch { /* abaixo */ }

    const assunto = String(draft.assunto || "").trim();
    const mensagem = String(draft.mensagem || "").trim();
    if (!mensagem) return json(422, { error: "Não consegui montar o rascunho. Tente de novo." });

    return json(200, { assunto, mensagem });
  } catch (e) {
    console.error("gerar-email-ia error", e);
    return json(500, { error: "Falha inesperada. Tente de novo." });
  }
});
