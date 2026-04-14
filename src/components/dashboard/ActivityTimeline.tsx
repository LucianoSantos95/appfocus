import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Edit, Trash2, LogIn, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditEntry {
  id: string;
  action: string;
  module: string;
  record_id: string | null;
  details: any;
  created_at: string;
  user_id: string;
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

function ActivityItem({ entry, userNames }: { entry: AuditEntry; userNames: Record<string, string> }) {
  const Icon = actionIcons[entry.action] || Edit;
  const label = actionLabels[entry.action] || entry.action;
  const mod = moduleLabels[entry.module] || entry.module;
  const userName = userNames[entry.user_id] || "Usuário";

  return (
    <div className="flex items-start gap-3">
      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          <span className="font-medium text-primary">{userName}</span>{" "}
          <span className="font-medium">{label}</span> em{" "}
          <span className="font-medium">{mod}</span>
        </p>
        <p className="text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
    </div>
  );
}

export function ActivityTimeline() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [allEntries, setAllEntries] = useState<AuditEntry[]>([]);
  const [filter, setFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogFilter, setDialogFilter] = useState("todos");
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const fetchEntries = async () => {
      const { data } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      const typed = (data as AuditEntry[]) || [];
      setEntries(typed);
      setAllEntries(typed);

      // Fetch user names for all unique user_ids
      const userIds = [...new Set(typed.map((e) => e.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        const names: Record<string, string> = {};
        (profiles || []).forEach((p: any) => {
          names[p.user_id] = p.display_name || "Usuário";
        });
        setUserNames(names);
      }
    };
    fetchEntries();
  }, [user]);

  const filtered = useMemo(
    () => (filter === "todos" ? entries : entries.filter((e) => e.module === filter)),
    [entries, filter]
  );

  const dialogFiltered = useMemo(
    () => (dialogFilter === "todos" ? allEntries : allEntries.filter((e) => e.module === dialogFilter)),
    [allEntries, dialogFilter]
  );

  if (entries.length === 0) return null;

  return (
    <>
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
          {filtered.slice(0, 3).map((entry) => (
            <ActivityItem key={entry.id} entry={entry} userNames={userNames} />
          ))}
        </div>

        {filtered.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground gap-1"
            onClick={() => {
              setDialogFilter(filter);
              setDialogOpen(true);
            }}
          >
            Ver mais atividades
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico de Atividades</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end mb-2">
            <Select value={dialogFilter} onValueChange={setDialogFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os módulos</SelectItem>
                {Object.entries(moduleLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="max-h-[400px] pr-2">
            <div className="space-y-3">
              {dialogFiltered.map((entry) => (
                <ActivityItem key={entry.id} entry={entry} userNames={userNames} />
              ))}
              {dialogFiltered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma atividade encontrada.
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
