import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Edit, Trash2, LogIn } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditEntry {
  id: string;
  action: string;
  module: string;
  record_id: string | null;
  details: any;
  created_at: string;
}

const actionIcons: Record<string, typeof Plus> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  login: LogIn,
};

const actionLabels: Record<string, string> = {
  create: "criou",
  update: "atualizou",
  delete: "excluiu",
  login: "fez login",
};

const moduleLabels: Record<string, string> = {
  clientes: "Clientes",
  projetos: "Projetos",
  tarefas: "Tarefas",
  transacoes: "Finanças",
  colaboradores: "RH",
  campanhas: "Marketing",
  processos: "Processos",
  agenda_items: "Agenda",
  bulletin_notes: "Mural",
  conteudos: "Conteúdos",
};

export function ActivityTimeline() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [filter, setFilter] = useState("todos");

  useEffect(() => {
    if (!user) return;
    const fetchEntries = async () => {
      const { data } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setEntries((data as AuditEntry[]) || []);
    };
    fetchEntries();
  }, [user]);

  const filtered = useMemo(
    () => (filter === "todos" ? entries : entries.filter((e) => e.module === filter)),
    [entries, filter]
  );

  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Atividade Recente</h3>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {Object.entries(moduleLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.slice(0, 10).map((entry) => {
          const Icon = actionIcons[entry.action] || Edit;
          const label = actionLabels[entry.action] || entry.action;
          const mod = moduleLabels[entry.module] || entry.module;

          return (
            <div key={entry.id} className="flex items-start gap-3">
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  Você <span className="font-medium">{label}</span> em{" "}
                  <span className="font-medium">{mod}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
