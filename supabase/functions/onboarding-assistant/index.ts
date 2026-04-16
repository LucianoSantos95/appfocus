import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ONBOARDING_COUPON_CODE = "NpOu4Cxn";

const SEGMENT_ROUTES: Record<string, string[]> = {
  agencia: ["projetos", "clientes", "financas"],
  consultoria: ["clientes", "processos", "financas"],
  freelancer: ["tarefas", "financas", "clientes"],
  pme: ["financas", "rh", "marketing"],
};

const MODULE_LABELS: Record<string, string> = {
  projetos: "Projetos",
  clientes: "Clientes",
  financas: "Finanças",
  processos: "Processos",
  tarefas: "Atividades",
  rh: "RH",
  marketing: "Marketing",
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_record",
      description: "Cria um registro em um módulo do Hub para o usuário durante o onboarding.",
      parameters: {
        type: "object",
        properties: {
          module: { type: "string", enum: ["transacoes", "clientes", "projetos", "tarefas", "campanhas", "processos", "colaboradores"] },
          data: { type: "object", description: "Campos do registro a criar" },
        },
        required: ["module", "data"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_module",
      description: "Marca um módulo do onboarding como concluído e avança para o próximo.",
      parameters: {
        type: "object",
        properties: {
          module: { type: "string", description: "Slug do módulo concluído (ex: financas, clientes)" },
        },
        required: ["module"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_insight",
      description: "Apresenta um insight baseado nos dados que o usuário acabou de inserir.",
      parameters: {
        type: "object",
        properties: {
          insight: { type: "string", description: "Texto do insight personalizado" },
          emoji: { type: "string", description: "Emoji relevante" },
        },
        required: ["insight"],
      },
    },
  },
];

function buildSystemPrompt(session: any) {
  const segment = session?.segment || "pme";
  const route = SEGMENT_ROUTES[segment] || SEGMENT_ROUTES.pme;
  const completedModules = session?.completed_modules || [];
  const currentStep = session?.current_step || "welcome";
  const routeLabels = route.map(r => MODULE_LABELS[r] || r);

  return `Você é o **Focus**, o assistente de onboarding do Hub Empresarial. Seu objetivo é guiar o usuário de forma conversacional, empática e eficiente para configurar sua operação.

## Contexto do Usuário
- Segmento: ${segment}
- Roteiro personalizado: ${routeLabels.join(" → ")}
- Módulos concluídos: ${completedModules.length > 0 ? completedModules.join(", ") : "nenhum"}
- Etapa atual: ${currentStep}

## Regras de Comportamento
1. **Seja conversacional e empático.** Use o nome da operação quando disponível.
2. **Guie o usuário a criar dados reais**, não apenas explorar. Pergunte informações concretas:
   - Finanças: "Qual foi sua última receita? De qual cliente?"
   - Clientes: "Qual o nome do seu principal cliente?"
   - Projetos: "Qual projeto está em andamento agora?"
   - Tarefas: "Qual sua tarefa mais urgente?"
3. **Após cada dado criado, gere um insight** usando a tool show_insight.
4. **Quando o usuário fornecer dados suficientes para um módulo** (pelo menos 1 registro), use complete_module.
5. **Siga o roteiro do segmento** — guie módulo a módulo na ordem definida.
6. **Quando todos os 3 módulos forem concluídos**, parabenize efusivamente e mencione que um desconto especial será oferecido.
7. **NUNCA invente dados.** Sempre pergunte ao usuário.
8. **Respostas curtas** (2-4 frases + ação). Não faça monólogos.
9. **Use emojis com moderação** para manter o tom profissional-friendly.

## Fluxo
- welcome → Cumprimentar + perguntar sobre o negócio (se segment não definido)
- module_1 → Guiar pelo primeiro módulo do roteiro
- module_2 → Guiar pelo segundo módulo
- module_3 → Guiar pelo terceiro módulo
- completed → Parabéns + cupom
`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, session_data } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getClaims(token);
      userId = data?.claims?.sub || null;
    }

    const systemPrompt = buildSystemPrompt(session_data);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...(messages || []),
        ],
        tools: TOOLS,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("onboarding-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
