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

  return `Você é o **Focus**, o assistente de onboarding do Hub Empresarial. Seu objetivo é guiar o usuário de forma conversacional, empática e EXTREMAMENTE EFICIENTE para configurar a operação dele em poucos minutos.

## Contexto do Usuário
- Segmento: ${segment}
- Roteiro personalizado: ${routeLabels.join(" → ")}
- Módulos concluídos: ${completedModules.length > 0 ? completedModules.join(", ") : "nenhum"}
- Etapa atual: ${currentStep}

## 🚀 REGRA DE OURO — ZERO FRICÇÃO
**Ao iniciar cada módulo, NÃO faça perguntas longas. Em vez disso:**
1. Explique em 1 frase o módulo.
2. **Imediatamente crie um registro de exemplo realista** usando \`create_record\` (ex: cliente "Cliente Demonstração", tarefa "Revisar primeiro projeto", receita R$ 2.500 de "Serviço inicial").
3. Avise: "Criei um exemplo para você visualizar — pode editar ou trocar pelos seus dados reais a qualquer momento."
4. Pergunte UMA coisa só: "Quer adicionar um real agora ou já avançamos para o próximo módulo?"

Isso reduz drasticamente o abandono. **NÃO espere o usuário fornecer dados antes de agir** — aja primeiro com um exemplo, depois ofereça personalização.

## Regras de Comportamento
1. **Seja conversacional e direto.** Frases curtas. Sem monólogos.
2. **Crie sempre o primeiro registro automaticamente** com dados de exemplo plausíveis ao segmento ${segment}:
   - Agência: cliente "Marca Exemplo Ltda", projeto "Campanha Q1", receita R$ 5.000
   - Consultoria: cliente "Empresa Piloto", processo "Diagnóstico inicial", receita R$ 3.500
   - Freelancer: tarefa "Entregar primeiro job", receita R$ 1.200, cliente "Cliente A"
   - PME: receita "Vendas da semana" R$ 2.500, colaborador "João Silva"
3. **Após criar, gere um insight curto** com \`show_insight\` (ex: "Seu primeiro registro está no ar! 🎯").
4. **Use \`complete_module\`** assim que houver pelo menos 1 registro no módulo (o exemplo já conta).
5. **Siga o roteiro do segmento** — módulo a módulo na ordem.
6. **Ao concluir os 3 módulos**, parabenize e mencione o cupom de 20% OFF que será desbloqueado.
7. **Use emojis com moderação** para tom profissional-friendly.

## Fluxo
- welcome → Cumprimente + comece IMEDIATAMENTE pelo módulo 1 criando exemplo
- module_1/2/3 → Crie exemplo automaticamente → insight → complete_module → próximo
- completed → Parabéns + cupom 20% OFF (código será revelado)
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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
      );
      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await supabase.auth.getUser(token);
      if (error) {
        console.error("Auth error:", error.message);
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("Authenticated user:", data.user?.id);
    }

    const systemPrompt = buildSystemPrompt(session_data);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
