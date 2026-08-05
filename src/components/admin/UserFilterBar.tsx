import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { OwnerUserRow, daysSince } from "@/hooks/useOwnerUsers";
import { Filter, X } from "lucide-react";

export type SortKey =
  | "recentes"
  | "acoes90"
  | "acoes30"
  | "tempo"
  | "sessoes"
  | "cadastro"
  | "inatividade"
  | "nome";

export interface UserFilterState {
  term: string;
  plan: string;
  stage: string;
  period: string;
  sort: SortKey;
}

const emptyState = (sort: SortKey): UserFilterState => ({
  term: "",
  plan: "todos",
  stage: "todos",
  period: "todos",
  sort,
});

export function useUserFilter(rows: OwnerUserRow[], defaultSort: SortKey) {
  const [state, setState] = useState<UserFilterState>(() => emptyState(defaultSort));

  const planOptions = useMemo(
    () => Array.from(new Set(rows.map((u) => (u.plan || "gratuito").toLowerCase()))).sort(),
    [rows]
  );
  const stageOptions = useMemo(
    () => Array.from(new Set(rows.map((u) => u.funnel_stage).filter(Boolean) as string[])).sort(),
    [rows]
  );

  const result = useMemo(() => {
    const now = Date.now();
    const periodDays = state.period === "todos" ? null : Number(state.period);

    const filtered = rows.filter((u) => {
      if (
        state.term &&
        !`${u.display_name} ${u.email}`.toLowerCase().includes(state.term.toLowerCase())
      )
        return false;
      if (state.plan !== "todos" && (u.plan || "gratuito").toLowerCase() !== state.plan) return false;
      if (state.stage !== "todos" && (u.funnel_stage ?? "") !== state.stage) return false;
      if (periodDays) {
        const last = u.last_active_at ?? u.last_sign_in_at;
        if (!last) return false;
        if (now - new Date(last).getTime() > periodDays * 86400000) return false;
      }
      return true;
    });

    const ts = (v: string | null) => (v ? new Date(v).getTime() : 0);
    const sorted = [...filtered].sort((a, b) => {
      switch (state.sort) {
        case "acoes90":
          return b.actions_90d - a.actions_90d;
        case "acoes30":
          return b.actions_30d - a.actions_30d;
        case "tempo":
          return b.total_time_sec - a.total_time_sec;
        case "sessoes":
          return b.sessions_count - a.sessions_count;
        case "cadastro":
          return ts(b.signed_up_at) - ts(a.signed_up_at);
        case "inatividade":
          return (
            (daysSince(b.last_active_at ?? b.last_sign_in_at) ?? 9999) -
            (daysSince(a.last_active_at ?? a.last_sign_in_at) ?? 9999)
          );
        case "nome":
          return (a.display_name || "").localeCompare(b.display_name || "");
        default:
          return (
            ts(b.last_active_at ?? b.last_sign_in_at) - ts(a.last_active_at ?? a.last_sign_in_at)
          );
      }
    });

    return sorted;
  }, [rows, state]);

  return {
    state,
    setState,
    rows: result,
    planOptions,
    stageOptions,
    reset: () => setState(emptyState(defaultSort)),
  };
}

interface BarProps {
  filter: ReturnType<typeof useUserFilter>;
  sortOptions: { value: SortKey; label: string }[];
  total: number;
}

export function UserFilterBar({ filter, sortOptions, total }: BarProps) {
  const { state, setState, planOptions, stageOptions, reset } = filter;
  const dirty =
    state.term !== "" || state.plan !== "todos" || state.stage !== "todos" || state.period !== "todos";

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Filter className="w-3.5 h-3.5" /> Filtros
      </div>

      <Input
        className="h-9 w-48"
        placeholder="Nome ou e-mail"
        value={state.term}
        onChange={(e) => setState({ ...state, term: e.target.value })}
      />

      <Select value={state.plan} onValueChange={(v) => setState({ ...state, plan: v })}>
        <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Plano" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os planos</SelectItem>
          {planOptions.map((p) => (
            <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={state.stage} onValueChange={(v) => setState({ ...state, stage: v })}>
        <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Estágio" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os estágios</SelectItem>
          {stageOptions.length === 0 && (
            <SelectItem value="sem-dados" disabled>Sem dados</SelectItem>
          )}
          {stageOptions.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={state.period} onValueChange={(v) => setState({ ...state, period: v })}>
        <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Período" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Qualquer período</SelectItem>
          <SelectItem value="7">Ativo nos 7 dias</SelectItem>
          <SelectItem value="30">Ativo nos 30 dias</SelectItem>
          <SelectItem value="90">Ativo nos 90 dias</SelectItem>
        </SelectContent>
      </Select>

      <Select value={state.sort} onValueChange={(v) => setState({ ...state, sort: v as SortKey })}>
        <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Ordenar" /></SelectTrigger>
        <SelectContent>
          {sortOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {dirty && (
        <Button variant="ghost" size="sm" onClick={reset} className="gap-1 h-9">
          <X className="w-3.5 h-3.5" /> Limpar
        </Button>
      )}

      <Badge variant="secondary" className="ml-auto">{total} resultado(s)</Badge>
    </div>
  );
}
