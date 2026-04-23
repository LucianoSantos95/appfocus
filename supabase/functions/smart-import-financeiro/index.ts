import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SheetData {
  sheetName: string;
  rows: unknown[][];
}

interface RequestBody {
  fileName: string;
  sheets: SheetData[];
  defaultYear?: number;
}

const SYSTEM_PROMPT = `Você converte planilhas financeiras brasileiras (DRE, Fluxo de Caixa, projeções, extratos) em transações.

REGRAS:
- Cada transação: description, value (number positivo), type ("receita"|"despesa"), date (YYYY-MM-DD), category, status ("confirmado"|"pendente"), notes.
- DRE matricial (colunas=meses, linhas=categorias): UMA transação por (categoria × mês) com valor não-zero. Use último dia do mês como date.
- Categorias negativas → "despesa". Positivas → "receita".
- Projeções futuras → status "pendente". Realizado/passado → "confirmado".
- IGNORE: "Saldo Inicial", "Caixa Mês Anterior", "Lucro Bruto", "Total", "Subtotal", "Resultado".
- Valores BR (R$ 1.234,56) → number positivo (sinal vai em type).
- Máximo 300 transações.`;

function compactRows(rows: unknown[][]): string[][] {
  // Remove linhas totalmente vazias e limita células
  return rows
    .map((r) =>
      r.map((c) => {
        if (c == null) return "";
        const s = String(c).trim().slice(0, 60);
        return s;
      })
    )
    .filter((r) => r.some((c) => c !== ""));
}

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

    // LIMITES AGRESSIVOS: máx 4 abas, 120 linhas úteis por aba
    const limitedSheets = body.sheets.slice(0, 4).map((s) => {
      const compact = compactRows(s.rows).slice(0, 120);
      return { sheetName: s.sheetName.slice(0, 40), rows: compact };
    });

    const sheetsText = limitedSheets
      .map((s) => {
        const tsv = s.rows.map((r) => r.join("\t")).join("\n");
        return `### ${s.sheetName}\n${tsv}`;
      })
      .join("\n\n");

    // Hard cap: 40k chars no prompt total
    const truncatedSheets =
      sheetsText.length > 40000
        ? sheetsText.slice(0, 40000) + "\n[truncado]"
        : sheetsText;

    const userPrompt = `Arquivo: ${body.fileName}\nAno: ${body.defaultYear ?? new Date().getFullYear()}\n\n${truncatedSheets}`;

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
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "emit_transactions",
                description: "Devolve transações extraídas",
                parameters: {
                  type: "object",
                  properties: {
                    summary: { type: "string" },
                    transactions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          description: { type: "string" },
                          value: { type: "number" },
                          type: { type: "string", enum: ["receita", "despesa"] },
                          date: { type: "string" },
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
      console.error("AI error", aiResp.status, txt.slice(0, 500));
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
      return new Response(JSON.stringify({ error: `IA falhou (${aiResp.status})` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call", JSON.stringify(aiJson).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "IA não retornou transações estruturadas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(
      JSON.stringify({
        summary: parsed.summary ?? "",
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
