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

Devolva o resultado chamando a função montar_email, com assunto curto (máx 60 caracteres, sem clickbait) e mensagem em texto puro.`;

    // Structured output: evita JSON inválido (quebras de linha cruas no corpo do e-mail),
    // que era a causa das falhas intermitentes.
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você escreve e-mails curtos, diretos e pessoais em português do Brasil." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "montar_email",
            description: "Devolve o rascunho do e-mail.",
            parameters: {
              type: "object",
              properties: {
                assunto: { type: "string", description: "Assunto curto, máx 60 caracteres" },
                mensagem: { type: "string", description: "Corpo em texto puro, parágrafos separados por linha em branco" },
              },
              required: ["assunto", "mensagem"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "montar_email" } },
      }),
    });

    if (aiRes.status === 429) return json(429, { error: "Muitas gerações seguidas. Espere alguns segundos e tente de novo." });
    if (aiRes.status === 402) return json(402, { error: "Os créditos de IA acabaram. Adicione créditos para continuar." });
    if (!aiRes.ok) {
      console.error("AI gateway error", aiRes.status, await aiRes.text());
      return json(502, { error: "A IA não respondeu. Tente de novo." });
    }

    const aiJson = await aiRes.json();
    const msg = aiJson?.choices?.[0]?.message;
    let draft: { assunto?: string; mensagem?: string } = {};
    const args = msg?.tool_calls?.[0]?.function?.arguments;
    if (args) {
      try { draft = JSON.parse(args); } catch (e) { console.error("tool args inválidos", args?.slice?.(0, 500), e); }
    }
    if (!draft.mensagem && typeof msg?.content === "string") {
      // Fallback: modelo respondeu em texto/JSON solto
      const bruto = msg.content.replace(/^```json\s*|\s*```$/g, "").trim();
      try {
        draft = JSON.parse(bruto);
      } catch {
        const assuntoM = bruto.match(/"assunto"\s*:\s*"([\s\S]*?)"\s*,\s*"mensagem"/);
        const mensagemM = bruto.match(/"mensagem"\s*:\s*"([\s\S]*?)"\s*\}?\s*$/);
        if (mensagemM) {
          const limpa = (s: string) => s.replace(/\\n/g, "\n").replace(/\\"/g, '"').trim();
          draft = { assunto: assuntoM ? limpa(assuntoM[1]) : "", mensagem: limpa(mensagemM[1]) };
        } else if (bruto.length > 40) {
          draft = { assunto: "", mensagem: bruto };
        }
      }
    }

    const assunto = String(draft.assunto || "").trim();
    const mensagem = String(draft.mensagem || "").trim();
    if (!mensagem) {
      console.error("rascunho vazio", JSON.stringify(msg)?.slice(0, 800));
      return json(422, { error: "Não consegui montar o rascunho. Tente de novo." });
    }

    return json(200, { assunto, mensagem });
  } catch (e) {
    console.error("gerar-email-ia error", e);
    return json(500, { error: "Falha inesperada. Tente de novo." });
  }
});
