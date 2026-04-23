import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SheetData {
  sheetName: string;
  rows: unknown[][]; // matriz crua (linhas × colunas)
}

interface RequestBody {
  fileName: string;
  sheets: SheetData[];
  defaultYear?: number;
}

const SYSTEM_PROMPT = `Você é um especialista em contabilidade brasileira que converte planilhas financeiras (DRE, Fluxo de Caixa, projeções, balancetes, extratos) em uma lista plana de transações.

REGRAS:
- Cada transação deve ter: description, value (number), type ("receita" ou "despesa"), date (YYYY-MM-DD), category (opcional), status ("confirmado" ou "pendente"), notes (opcional, ex.: "DRE Março 2026").
- Para DRE matricial (colunas = meses, linhas = categorias): gere UMA transação por (categoria × mês) com valor não nulo. Use o último dia do mês como date. Categorias com sinal negativo são "despesa", positivo são "receita".
- Para fluxo de caixa projetado: marque entradas futuras como status "pendente"; passadas como "confirmado".
- Para resumos/saldos (ex.: "Saldo Inicial", "Caixa Mês Anterior", subtotais como "Lucro Bruto", "Total"): IGNORE — só extraia movimentações reais.
- Valores em formato brasileiro (R$ 1.234,56 ou -R$ 1.234,56): converta para number positivo (o sinal vai em type).
- Se a planilha tiver várias mini-tabelas, processe todas.
- Retorne no máximo 500 transações na chamada da ferramenta.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as RequestBody;
    if (!body.sheets?.length) {
      return new Response(JSON.stringify({ error: "Sem planilhas" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compacta sheets em texto markdown (limita a 200 linhas por aba para caber no contexto)
    const sheetsText = body.sheets
      .map((s) => {
        const rows = s.rows.slice(0, 200);
        const tsv = rows
          .map((r) =>
            r
              .map((c) => (c == null ? "" : String(c).slice(0, 80)))
              .join("\t")
          )
          .join("\n");
        return `### Aba: ${s.sheetName}\n${tsv}`;
      })
      .join("\n\n");

    const userPrompt = `Arquivo: ${body.fileName}\nAno padrão: ${body.defaultYear ?? new Date().getFullYear()}\n\n${sheetsText}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI key não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "emit_transactions",
                description: "Devolve a lista de transações extraídas",
                parameters: {
                  type: "object",
                  properties: {
                    summary: {
                      type: "string",
                      description: "Resumo curto do que foi detectado",
                    },
                    transactions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          description: { type: "string" },
                          value: { type: "number" },
                          type: { type: "string", enum: ["receita", "despesa"] },
                          date: {
                            type: "string",
                            description: "YYYY-MM-DD",
                          },
                          category: { type: "string" },
                          status: {
                            type: "string",
                            enum: ["confirmado", "pendente"],
                          },
                          notes: { type: "string" },
                        },
                        required: ["description", "value", "type", "date"],
                      },
                    },
                  },
                  required: ["summary", "transactions"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "emit_transactions" },
          },
        }),
      }
    );

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI error", aiResp.status, txt);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições. Aguarde um momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({
            error: "Créditos de IA esgotados. Adicione em Configurações > Workspace > Uso.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ error: "Falha na IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "IA não retornou transações estruturadas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(
      JSON.stringify({
        summary: parsed.summary,
        transactions: parsed.transactions ?? [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("smart-import error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
