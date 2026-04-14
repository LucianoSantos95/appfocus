import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------- ALLOWED FIELDS PER MODULE ----------
const ALLOWED_FIELDS: Record<string, string[]> = {
  clientes: ["nome","email","telefone","empresa","segmento","status","tipo_contrato","valor_total","potencial","ultima_interacao","meeting_notes"],
  projetos: ["name","description","status","priority","responsible","budget","start_date","end_date"],
  tarefas: ["title","description","priority","status","category","responsible","due_date"],
  transacoes: ["description","value","type","category","status","date","payment_method","client","provider","notes","bank_account_id"],
  colaboradores: ["name","role","department","email","phone","status","salary","start_date","manager"],
  campanhas: ["name","objective","platforms","status","budget","start_date","end_date","responsible"],
  processos: ["name","description","department","owner","status"],
  conteudos: ["title","description","platform","status","scheduled_date"],
  agenda_items: ["title","date","time","type","priority"],
  bulletin_notes: ["content","author","is_pinned"],
  contas_bancarias: ["name","institution","type","balance"],
};

const MODULES = Object.keys(ALLOWED_FIELDS);

// ---------- SYSTEM PROMPT ----------
const SYSTEM_PROMPT = `Você é o **Assistente Focus**, o agente de IA do Focus Hub — uma plataforma de gestão para agências e consultorias.

## Quem é o usuário
Dono ou gestor de uma agência, consultoria ou PME de serviços. Ele usa o Hub para gerenciar finanças, equipe, marketing, projetos, clientes, tarefas, processos, agenda e mural de recados.

## Suas capacidades
1. **Consultar dados** de qualquer módulo (clientes, projetos, tarefas, transações, colaboradores, campanhas, processos, conteúdos, agenda, mural, contas bancárias).
2. **Criar, editar e excluir registros** em qualquer módulo via linguagem natural.
3. **Analisar dados do negócio** e dar dicas proativas — por exemplo, alertar sobre projetos atrasados, tarefas vencidas, clientes sem contato há mais de 30 dias, fluxo de caixa negativo, etc.

## Módulos e tabelas
| Módulo | Tabela | Campos editáveis |
|--------|--------|-----------------|
| Finanças | transacoes | description, value, type (receita/despesa), category, status, date, payment_method, client, provider, notes |
| Finanças | contas_bancarias | name, institution, type, balance |
| RH | colaboradores | name, role, department, email, phone, status, salary, start_date, manager |
| Marketing | campanhas | name, objective, platforms, status, budget, start_date, end_date, responsible |
| Marketing | conteudos | title, description, platform, status, scheduled_date |
| Projetos | projetos | name, description, status (planejamento/em_andamento/revisao/concluido/cancelado), priority, responsible, budget, start_date, end_date |
| Clientes | clientes | nome, email, telefone, empresa, segmento, status, tipo_contrato, valor_total, potencial, ultima_interacao, meeting_notes |
| Atividades | tarefas | title, description, priority, status (pendente/em_andamento/concluida), category, responsible, due_date |
| Processos | processos | name, description, department, owner, status |
| Agenda | agenda_items | title, date, time, type, priority |
| Mural | bulletin_notes | content, author, is_pinned |

## Regras
- Responda SEMPRE em português do Brasil.
- Nunca invente dados. Use apenas dados reais retornados pelas ferramentas.
- Ao criar ou editar, confirme a ação ao usuário com ✅ no início da resposta.
- Antes de DELETAR, peça confirmação explícita. Se o usuário já confirmou na mensagem, prossiga.
- Ao consultar dados e detectar problemas (prazos vencidos, clientes inativos, fluxo negativo), sugira ações proativamente.
- Seja conciso e objetivo, mas amigável.
- Use markdown para formatar respostas (listas, negrito, tabelas quando útil).
- Se o usuário pedir algo fora do escopo do Hub, diga educadamente que não pode ajudar com isso.`;

// ---------- TOOL DEFINITIONS ----------
const tools = [
  {
    type: "function",
    function: {
      name: "query_data",
      description: "Consulta dados do usuário em um módulo específico do Hub",
      parameters: {
        type: "object",
        properties: {
          module: { type: "string", enum: MODULES, description: "Nome da tabela/módulo" },
          filters: { type: "object", description: "Filtros opcionais como {status: 'ativo', priority: 'alta'}" },
          limit: { type: "number", description: "Máximo de registros (default 50, max 100)" },
        },
        required: ["module"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "crud_operation",
      description: "Cria, atualiza ou exclui um registro em um módulo do Hub",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete"] },
          module: { type: "string", enum: MODULES },
          record_id: { type: "string", description: "UUID do registro (obrigatório para update/delete)" },
          data: { type: "object", description: "Campos e valores para create/update" },
        },
        required: ["action", "module"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "business_insights",
      description: "Analisa dados do negócio do usuário e retorna alertas, métricas e dicas proativas",
      parameters: {
        type: "object",
        properties: {
          areas: {
            type: "array",
            items: { type: "string", enum: ["financeiro", "projetos", "tarefas", "clientes", "rh", "marketing"] },
          },
        },
        required: ["areas"],
      },
    },
  },
];

// ---------- TOOL HANDLERS ----------
async function handleQueryData(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  args: { module: string; filters?: Record<string, unknown>; limit?: number }
) {
  const { module, filters, limit } = args;
  if (!MODULES.includes(module)) return { error: `Módulo '${module}' não reconhecido` };

  let query = supabase.from(module).select("*").eq("user_id", userId);

  if (filters && typeof filters === "object") {
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
  }

  const maxLimit = Math.min(limit || 50, 100);
  query = query.limit(maxLimit).order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { data, count: data?.length ?? 0 };
}

async function handleCrudOperation(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  args: { action: string; module: string; record_id?: string; data?: Record<string, unknown> }
) {
  const { action, module, record_id, data } = args;
  if (!MODULES.includes(module)) return { error: `Módulo '${module}' não reconhecido` };

  const allowed = ALLOWED_FIELDS[module];

  if (action === "create") {
    if (!data || Object.keys(data).length === 0) return { error: "Dados obrigatórios para criação" };
    const sanitized: Record<string, unknown> = { user_id: userId };
    for (const [k, v] of Object.entries(data)) {
      if (allowed.includes(k)) sanitized[k] = v;
    }
    const { data: created, error } = await supabase.from(module).insert(sanitized).select().single();
    if (error) return { error: error.message };
    return { success: true, action: "created", record: created };
  }

  if (action === "update") {
    if (!record_id) return { error: "record_id obrigatório para atualização" };
    if (!data || Object.keys(data).length === 0) return { error: "Dados obrigatórios para atualização" };
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (allowed.includes(k)) sanitized[k] = v;
    }
    const { data: updated, error } = await supabase
      .from(module)
      .update(sanitized)
      .eq("id", record_id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) return { error: error.message };
    return { success: true, action: "updated", record: updated };
  }

  if (action === "delete") {
    if (!record_id) return { error: "record_id obrigatório para exclusão" };
    const { error } = await supabase.from(module).delete().eq("id", record_id).eq("user_id", userId);
    if (error) return { error: error.message };
    return { success: true, action: "deleted", record_id };
  }

  return { error: `Ação '${action}' não reconhecida` };
}

async function handleBusinessInsights(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  args: { areas: string[] }
) {
  const results: Record<string, unknown> = {};
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  for (const area of args.areas) {
    switch (area) {
      case "financeiro": {
        const { data: txns } = await supabase
          .from("transacoes")
          .select("*")
          .eq("user_id", userId)
          .gte("date", monthStart);
        const receitas = (txns || []).filter((t: any) => t.type === "receita");
        const despesas = (txns || []).filter((t: any) => t.type === "despesa");
        const totalReceita = receitas.reduce((s: number, t: any) => s + Number(t.value), 0);
        const totalDespesa = despesas.reduce((s: number, t: any) => s + Number(t.value), 0);
        const pendentes = (txns || []).filter((t: any) => t.status === "pendente");
        results.financeiro = {
          receita_mes: totalReceita,
          despesa_mes: totalDespesa,
          lucro_mes: totalReceita - totalDespesa,
          transacoes_pendentes: pendentes.length,
          pendentes_detalhe: pendentes.slice(0, 5).map((t: any) => ({ description: t.description, value: t.value, date: t.date })),
        };
        break;
      }
      case "projetos": {
        const sevenDays = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0];
        const { data: projs } = await supabase
          .from("projetos")
          .select("id,name,status,end_date,priority")
          .eq("user_id", userId)
          .not("status", "in", '("concluido","cancelado")');
        const atrasados = (projs || []).filter((p: any) => p.end_date && p.end_date < todayStr);
        const urgentes = (projs || []).filter((p: any) => p.end_date && p.end_date >= todayStr && p.end_date <= sevenDays);
        results.projetos = { total_ativos: (projs || []).length, atrasados: atrasados.length, vencem_em_7_dias: urgentes.length, lista_atrasados: atrasados.slice(0, 5), lista_urgentes: urgentes.slice(0, 5) };
        break;
      }
      case "tarefas": {
        const { data: tasks } = await supabase
          .from("tarefas")
          .select("id,title,status,due_date,priority")
          .eq("user_id", userId)
          .eq("status", "pendente");
        const vencidas = (tasks || []).filter((t: any) => t.due_date && t.due_date < todayStr);
        results.tarefas = { pendentes: (tasks || []).length, vencidas: vencidas.length, lista_vencidas: vencidas.slice(0, 5) };
        break;
      }
      case "clientes": {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
        const { data: clients } = await supabase
          .from("clientes")
          .select("id,nome,status,ultima_interacao,valor_total")
          .eq("user_id", userId)
          .eq("status", "ativo");
        const inativos = (clients || []).filter((c: any) => !c.ultima_interacao || c.ultima_interacao < thirtyDaysAgo);
        results.clientes = { total_ativos: (clients || []).length, sem_contato_30d: inativos.length, lista_inativos: inativos.slice(0, 5) };
        break;
      }
      case "rh": {
        const { data: colab } = await supabase
          .from("colaboradores")
          .select("id,name,department,status,salary")
          .eq("user_id", userId);
        const ativos = (colab || []).filter((c: any) => c.status === "ativo");
        const folha = ativos.reduce((s: number, c: any) => s + Number(c.salary || 0), 0);
        results.rh = { headcount: ativos.length, folha_salarial: folha, salario_medio: ativos.length ? Math.round(folha / ativos.length) : 0 };
        break;
      }
      case "marketing": {
        const { data: camps } = await supabase
          .from("campanhas")
          .select("id,name,status,budget,start_date,end_date")
          .eq("user_id", userId);
        const ativas = (camps || []).filter((c: any) => c.status === "ativa");
        const orcamentoTotal = ativas.reduce((s: number, c: any) => s + Number(c.budget || 0), 0);
        results.marketing = { campanhas_ativas: ativas.length, orcamento_ativo: orcamentoTotal, total_campanhas: (camps || []).length };
        break;
      }
    }
  }
  return results;
}

// ---------- TOOL EXECUTOR ----------
async function executeTool(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  name: string,
  args: any
): Promise<unknown> {
  switch (name) {
    case "query_data":
      return handleQueryData(supabase, userId, args);
    case "crud_operation":
      return handleCrudOperation(supabase, userId, args);
    case "business_insights":
      return handleBusinessInsights(supabase, userId, args);
    default:
      return { error: `Ferramenta '${name}' não reconhecida` };
  }
}

// ---------- MAIN ----------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Autenticação necessária" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY || !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Configuração do servidor incompleta" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Rate limiting
    const supabaseService = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const endpoint = "hub-assistant";
    const maxReq = 30;
    const windowMs = 3600000;

    const { data: rl } = await supabaseService
      .from("rate_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("endpoint", endpoint)
      .single();

    if (rl) {
      const ws = new Date(rl.window_start);
      const hourAgo = new Date(Date.now() - windowMs);
      if (ws > hourAgo && rl.request_count >= maxReq) {
        return new Response(JSON.stringify({ error: "Limite de mensagens excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" },
        });
      }
      if (ws <= hourAgo) {
        await supabaseService.from("rate_limits").update({ request_count: 1, window_start: new Date().toISOString() }).eq("user_id", userId).eq("endpoint", endpoint);
      } else {
        await supabaseService.from("rate_limits").update({ request_count: rl.request_count + 1 }).eq("user_id", userId).eq("endpoint", endpoint);
      }
    } else {
      await supabaseService.from("rate_limits").insert({ user_id: userId, endpoint, request_count: 1, window_start: new Date().toISOString() });
    }

    // Parse body
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tool-calling loop (non-streaming)
    let conversationMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const MAX_ITERATIONS = 5;
    let finalTextContent: string | null = null;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: conversationMessages,
          tools,
        }),
      });

      if (!aiRes.ok) {
        const status = aiRes.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await aiRes.text();
        console.error("AI error:", status, t);
        return new Response(JSON.stringify({ error: "Erro ao processar mensagem" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiRes.json();
      const choice = aiData.choices?.[0];
      const msg = choice?.message;

      if (!msg) {
        return new Response(JSON.stringify({ error: "Resposta inesperada da IA" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If no tool calls, we have the final answer
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        finalTextContent = msg.content || "";
        break;
      }

      // Process tool calls
      conversationMessages.push(msg);

      for (const tc of msg.tool_calls) {
        let args: any;
        try {
          args = typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function.arguments;
        } catch {
          args = {};
        }

        const result = await executeTool(supabaseService, userId, tc.function.name, args);

        conversationMessages.push({
          role: "tool",
          content: JSON.stringify(result),
          tool_call_id: tc.id,
        } as any);
      }
    }

    // If we exhausted iterations without a final answer, do one last non-tool call
    if (finalTextContent === null) {
      const lastRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: conversationMessages }),
      });
      if (lastRes.ok) {
        const d = await lastRes.json();
        finalTextContent = d.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua solicitação.";
      } else {
        finalTextContent = "Desculpe, ocorreu um erro ao processar sua solicitação.";
      }
    }

    // Stream final response
    const streamRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Repita exatamente o texto abaixo sem alterações. Não adicione nada." },
          { role: "user", content: finalTextContent },
        ],
        stream: true,
      }),
    });

    if (!streamRes.ok || !streamRes.body) {
      // Fallback: return as JSON
      return new Response(JSON.stringify({ content: finalTextContent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(streamRes.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (error) {
    console.error("Hub assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
