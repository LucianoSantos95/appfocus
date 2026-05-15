import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Autenticação necessária" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth context
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the token using getClaims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Usuário não identificado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting check
    const SUPABASE_URL_ENV = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (SUPABASE_URL_ENV && SERVICE_ROLE_KEY) {
      const rateLimitClient = createClient(SUPABASE_URL_ENV, SERVICE_ROLE_KEY);
      const endpoint = "analyze-client";
      const maxRequests = 30; // max 30 requests per hour per user
      const windowMs = 3600000; // 1 hour

      const { data: rateLimit } = await rateLimitClient
        .from("rate_limits")
        .select("*")
        .eq("user_id", userId)
        .eq("endpoint", endpoint)
        .single();

      if (rateLimit) {
        const windowStart = new Date(rateLimit.window_start);
        const hourAgo = new Date(Date.now() - windowMs);

        if (windowStart > hourAgo && rateLimit.request_count >= maxRequests) {
          return new Response(
            JSON.stringify({ error: "Limite de análises excedido. Tente novamente em alguns minutos." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" } }
          );
        }

        if (windowStart <= hourAgo) {
          // Reset window
          await rateLimitClient
            .from("rate_limits")
            .update({ request_count: 1, window_start: new Date().toISOString() })
            .eq("user_id", userId)
            .eq("endpoint", endpoint);
        } else {
          // Increment
          await rateLimitClient
            .from("rate_limits")
            .update({ request_count: rateLimit.request_count + 1 })
            .eq("user_id", userId)
            .eq("endpoint", endpoint);
        }
      } else {
        // First request - create entry
        await rateLimitClient
          .from("rate_limits")
          .insert({ user_id: userId, endpoint, request_count: 1, window_start: new Date().toISOString() });
      }

      // Cleanup old entries occasionally (1% chance per request)
      if (Math.random() < 0.01) {
        await rateLimitClient.rpc("cleanup_rate_limits");
      }
    }

    // Parse request body
    const { clienteId } = await req.json();
    
    if (!clienteId || typeof clienteId !== "string") {
      return new Response(
        JSON.stringify({ error: "clienteId é obrigatório e deve ser uma string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clienteId)) {
      return new Response(
        JSON.stringify({ error: "clienteId inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch client data — scoped to requesting user (RLS bypass guard)
    const { data: cliente, error: fetchError } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", clienteId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError || !cliente) {
      console.error("Error fetching client:", fetchError);
      return new Response(
        JSON.stringify({ error: "Cliente não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (cliente.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Acesso negado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate days since last interaction
    const lastInteraction = new Date(cliente.ultima_interacao);
    const today = new Date();
    const daysSinceInteraction = Math.floor((today.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));

    // Build context for AI
    const clientContext = `
Cliente: ${cliente.nome}
Email: ${cliente.email || "Não informado"}
Telefone: ${cliente.telefone || "Não informado"}
Segmento: ${cliente.segmento || "Não definido"}
Status atual: ${cliente.status}
Valor total: R$ ${cliente.valor_total?.toLocaleString("pt-BR") || "0"}
Tipo de contrato: ${cliente.tipo_contrato || "Não definido"}
Empresa: ${cliente.empresa || cliente.nome}
Última interação: ${cliente.ultima_interacao} (${daysSinceInteraction} dias atrás)
`;

    // Call Lovable AI with tool calling
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um analista de CRM especializado em classificar clientes e sugerir ações comerciais.
Analise os dados do cliente e retorne uma classificação estruturada.

Regras de classificação:
- VIP: Valor alto (>50.000) + interação recente (<30 dias) + status ativo
- Padrão: Cliente ativo com relacionamento regular
- Em Risco: Sem interação há muito tempo (>60 dias) ou status inativo
- Novo: Status prospecto ou cadastrado recentemente

Regras de potencial:
- Alto: Segmento tecnologia/financeiro ou valor alto
- Médio: Valor moderado ou segmento regular
- Baixo: Inativo ou sem engajamento

Prioridade de contato:
- Alta: Em risco, prospecto quente, ou renovação próxima
- Média: Follow-up regular necessário
- Baixa: Relacionamento estável, sem urgência

Sugestões de ação devem ser específicas e acionáveis, mencionando o nome do cliente e razão.`,
          },
          {
            role: "user",
            content: `Analise este cliente e forneça a classificação:\n\n${clientContext}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classificar_cliente",
              description: "Retorna a classificação completa do cliente",
              parameters: {
                type: "object",
                properties: {
                  classificacao: {
                    type: "string",
                    enum: ["vip", "padrao", "em_risco", "novo"],
                    description: "Classificação do cliente",
                  },
                  potencial: {
                    type: "string",
                    enum: ["alto", "medio", "baixo"],
                    description: "Potencial comercial do cliente",
                  },
                  prioridade_contato: {
                    type: "string",
                    enum: ["alta", "media", "baixa"],
                    description: "Prioridade para próximo contato",
                  },
                  palavras_chave: {
                    type: "array",
                    items: { type: "string" },
                    description: "Até 5 palavras-chave que descrevem o perfil do cliente",
                  },
                  proxima_acao_sugerida: {
                    type: "string",
                    description: "Sugestão específica de próxima ação comercial",
                  },
                },
                required: ["classificacao", "potencial", "prioridade_contato", "palavras_chave", "proxima_acao_sugerida"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classificar_cliente" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar análise de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    
    // Extract tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "classificar_cliente") {
      console.error("Unexpected AI response format:", aiData);
      return new Response(
        JSON.stringify({ error: "Resposta de IA em formato inesperado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Update client with AI analysis
    const { error: updateError } = await supabase
      .from("clientes")
      .update({
        classificacao: analysis.classificacao,
        potencial: analysis.potencial,
        prioridade_contato: analysis.prioridade_contato,
        palavras_chave: analysis.palavras_chave,
        proxima_acao_sugerida: analysis.proxima_acao_sugerida,
        analisado_em: new Date().toISOString(),
      })
      .eq("id", clienteId);

    if (updateError) {
      console.error("Error updating client:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar análise" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          ...analysis,
          analisado_em: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
