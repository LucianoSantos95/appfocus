import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Activity, Flame, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface EngagementRow {
  user_id: string;
  display_name: string | null;
  plan: string | null;
  total_actions_90d: number;
  total_actions_30d: number;
  active_days_30d: number;
  last_active_at: string | null;
  first_seen_at: string | null;
  actions_by_module: Record<string, number> | null;
  classificacao: string | null;
}

const classColors: Record<string, string> = {
  power_user: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  ativo: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ocasional: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  inativo: "bg-muted text-muted-foreground border-border",
};

const classLabel: Record<string, string> = {
  power_user: "Power User",
  ativo: "Ativo",
  ocasional: "Ocasional",
  inativo: "Inativo",
};

const planColors: Record<string, string> = {
  gratuito: "bg-muted text-muted-foreground",
  plus: "bg-blue-500/20 text-blue-400",
  pro: "bg-purple-500/20 text-purple-400",
  enterprise: "bg-amber-500/20 text-amber-400",
};

export function UsuariosAtivosPanel() {
  const [rows, setRows] = useState<EngagementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_user_engagement" as any);
      if (error) throw error;
      const sorted = ((data ?? []) as EngagementRow[])
        .slice()
        .sort((a, b) => (b.total_actions_30d || 0) - (a.total_actions_30d || 0));
      setRows(sorted);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Erro ao carregar engajamento:", err);
      if (!silent) toast.error("Erro ao carregar usuários ativos.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(() => void fetchData(true), 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Realtime triggers on the main activity tables
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const queue = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => void fetchData(true), 1500);
    };
    const channel = supabase
      .channel("usuarios-ativos-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transacoes" }, queue)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tarefas" }, queue)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "projetos" }, queue)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "clientes" }, queue)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "colaboradores" }, queue)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "campanhas" }, queue)
      .subscribe();
    return () => {
      if (t) clearTimeout(t);
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) => r.display_name?.toLowerCase().includes(q));
  }, [rows, search]);

  const stats = useMemo(() => {
    const power = rows.filter((r) => r.classificacao === "power_user").length;
    const ativos = rows.filter((r) => r.classificacao === "ativo").length;
    const ocasionais = rows.filter((r) => r.classificacao === "ocasional").length;
    return { power, ativos, ocasionais, total: rows.length };
  }, [rows]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total monitorado</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Flame className="h-3 w-3" /> Power Users
            </p>
            <p className="text-2xl font-bold text-emerald-500">{stats.power}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Ativos</p>
            <p className="text-2xl font-bold text-blue-400">{stats.ativos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Ocasionais</p>
            <p className="text-2xl font-bold text-amber-400">{stats.ocasionais}</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
            <span>
              {lastUpdate
                ? `Atualizado há ${formatDistanceToNowStrict(lastUpdate, { locale: ptBR })}`
                : "Carregando..."}
            </span>
            <Button size="sm" variant="ghost" onClick={() => void fetchData()} className="h-7">
              <RefreshCw className="h-3 w-3 mr-1" /> Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum usuário encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Classificação</TableHead>
                    <TableHead className="text-right">Ações 30d</TableHead>
                    <TableHead className="text-right">Ações 90d</TableHead>
                    <TableHead className="text-right">Dias ativos (30d)</TableHead>
                    <TableHead>Última atividade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r, idx) => (
                    <TableRow key={r.user_id}>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {r.display_name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={planColors[r.plan || "gratuito"] || "bg-muted"}>
                          {r.plan || "gratuito"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={classColors[r.classificacao || "inativo"]}
                        >
                          {classLabel[r.classificacao || "inativo"]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {r.total_actions_30d}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        {r.total_actions_90d}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {r.active_days_30d}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {r.last_active_at
                          ? `há ${formatDistanceToNowStrict(new Date(r.last_active_at), { locale: ptBR })}`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
