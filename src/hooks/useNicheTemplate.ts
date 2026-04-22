import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getNicheTemplate, type SegmentId } from "@/lib/niche-templates";

const TEMPLATE_FLAG_KEY = "niche_template_applied";

/**
 * Applies the niche template (pipeline, tasks, financial categories)
 * for the user's chosen segment. Idempotent per user via localStorage flag
 * + duplicate-name detection in the DB.
 */
export function useNicheTemplate() {
  const { user } = useAuth();
  const [applying, setApplying] = useState(false);

  const apply = useCallback(
    async (segment: SegmentId | string): Promise<{ ok: boolean; created: { processes: number; tasks: number; note: number } }> => {
      const result = { ok: false, created: { processes: 0, tasks: 0, note: 0 } };
      if (!user) return result;

      // Idempotency guard (per user, per segment)
      const flag = `${TEMPLATE_FLAG_KEY}:${user.id}:${segment}`;
      if (localStorage.getItem(flag) === "1") {
        return { ok: true, created: result.created };
      }

      setApplying(true);
      try {
        const tpl = getNicheTemplate(segment);

        // 1) Pipeline → processos (only insert names that don't exist yet)
        const { data: existingProc } = await supabase
          .from("processos")
          .select("name")
          .eq("user_id", user.id);
        const existingProcNames = new Set((existingProc || []).map((p) => p.name));
        const newProcesses = tpl.pipeline
          .filter((p) => !existingProcNames.has(p.name))
          .map((p, idx) => ({
            user_id: user.id,
            name: p.name,
            description: `${idx + 1}. ${p.description}`,
            department: p.department,
            owner: "A definir",
            status: "ativo",
          }));

        if (newProcesses.length > 0) {
          const { error } = await supabase.from("processos").insert(newProcesses);
          if (!error) result.created.processes = newProcesses.length;
        }

        // 2) Tarefas-chave (skip duplicates by title)
        const { data: existingTasks } = await supabase
          .from("tarefas")
          .select("title")
          .eq("user_id", user.id);
        const existingTaskTitles = new Set((existingTasks || []).map((t) => t.title));
        const newTasks = tpl.tasks
          .filter((t) => !existingTaskTitles.has(t.title))
          .map((t, idx) => ({
            user_id: user.id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            category: t.category,
            status: "pendente",
            due_date: new Date(Date.now() + (idx + 2) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          }));

        if (newTasks.length > 0) {
          const { error } = await supabase.from("tarefas").insert(newTasks);
          if (!error) result.created.tasks = newTasks.length;
        }

        // 3) Categorias financeiras → bulletin note fixada (referência rápida)
        const noteContent = [
          `📊 Categorias sugeridas para ${tpl.label}`,
          "",
          `💰 Receitas: ${tpl.categories.receitas.join(" • ")}`,
          `💸 Despesas: ${tpl.categories.despesas.join(" • ")}`,
          "",
          "Use esses nomes ao cadastrar transações no Financeiro para manter relatórios consistentes.",
        ].join("\n");

        const { data: existingNote } = await supabase
          .from("bulletin_notes")
          .select("id")
          .eq("user_id", user.id)
          .ilike("content", `%Categorias sugeridas para ${tpl.label}%`)
          .maybeSingle();

        if (!existingNote) {
          const { error } = await supabase.from("bulletin_notes").insert({
            user_id: user.id,
            content: noteContent,
            author: "Focus Hub",
            is_pinned: true,
          });
          if (!error) result.created.note = 1;
        }

        localStorage.setItem(flag, "1");
        result.ok = true;
        return result;
      } catch (e) {
        console.error("applyNicheTemplate error:", e);
        return result;
      } finally {
        setApplying(false);
      }
    },
    [user]
  );

  return { apply, applying };
}
