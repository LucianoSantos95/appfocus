import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sbForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_tarefa",
  title: "Criar tarefa",
  description: "Cria uma nova tarefa para o usuário autenticado.",
  inputSchema: {
    title: z.string().min(1).describe("Título da tarefa."),
    description: z.string().optional(),
    priority: z.enum(["baixa", "media", "alta", "urgente"]).optional(),
    due_date: z.string().optional().describe("Data limite ISO (YYYY-MM-DD)."),
    category: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, description, priority, due_date, category }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const { data, error } = await sbForUser(ctx)
      .from("tarefas")
      .insert({
        user_id: ctx.getUserId(),
        title,
        description: description ?? null,
        priority: priority ?? "media",
        due_date: due_date ?? null,
        category: category ?? null,
        status: "pendente",
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: `Tarefa criada: ${data.id}` }], structuredContent: { tarefa: data } };
  },
});
