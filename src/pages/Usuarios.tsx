import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOwnerAccess } from "@/hooks/useOwnerAccess";
import { useOwnerUsers, formatDate, formatDuration, daysSince, OwnerUserRow } from "@/hooks/useOwnerUsers";
import { BroadcastPanel } from "@/components/admin/BroadcastPanel";
import { PageMeta } from "@/components/seo/PageMeta";
import { Loader2, Users, Clock, Flame, Download, RefreshCw, UserX } from "lucide-react";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </Card>
  );
}

function UserTable({
  rows,
  columns,
}: {
  rows: OwnerUserRow[];
  columns: { key: string; label: string; render: (u: OwnerUserRow) => React.ReactNode }[];
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-10 text-center">Sem dados</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            {columns.map((c) => (
              <th key={c.key} className="py-2 pr-4 font-medium whitespace-nowrap">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.user_id} className="border-b border-border/50 hover:bg-muted/40">
              {columns.map((c) => (
                <td key={c.key} className="py-2.5 pr-4 align-top">{c.render(u)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function toCsv(rows: OwnerUserRow[]) {
  const header = [
    "nome", "email", "plano", "cadastro", "ultimo_acesso", "acoes_30d", "acoes_90d",
    "dias_ativos_30d", "sessoes", "tempo_total_min", "tempo_medio_min", "estagio",
  ];
  const lines = rows.map((u) => [
    u.display_name, u.email, u.plan, u.signed_up_at, u.last_active_at ?? "",
    u.actions_30d, u.actions_90d, u.active_days_30d, u.sessions_count,
    Math.round(u.total_time_sec / 60), Math.round(u.avg_session_sec / 60), u.funnel_stage ?? "",
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
  return [header.join(","), ...lines].join("\n");
}

export default function Usuarios() {
  const { isOwner, isLoading: authLoading } = useOwnerAccess();
  const { users, overview, isLoading, error, refetch } = useOwnerUsers();
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      users.filter((u) =>
        `${u.display_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
      ),
    [users, search]
  );

  const recentesFilter = useUserFilter(filtered, "recentes");
  const ativosFilter = useUserFilter(filtered, "acoes90");
  const tempoFilter = useUserFilter(filtered, "tempo");
  const inativosBase = useMemo(
    () =>
      filtered.filter((u) => {
        const d = daysSince(u.last_active_at ?? u.last_sign_in_at);
        return d === null || d >= 14;
      }),
    [filtered]
  );
  const inativosFilter = useUserFilter(inativosBase, "inatividade");


  const moduleUsage = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const u of users) {
      for (const [mod, count] of Object.entries(u.actions_by_module || {})) {
        acc[mod] = (acc[mod] || 0) + Number(count || 0);
      }
    }
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [users]);

  const download = () => {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `usuarios-hub-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isOwner) return <Navigate to="/" replace />;

  return (
    <MainLayout>
      <PageMeta title="Usuários | Hub Empresarial" description="Painel interno de usuários" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> Usuários
            </h1>
            <p className="text-sm text-muted-foreground">Acompanhamento da base e disparo de e-mails</p>
          </div>
          <Input
            className="w-56"
            placeholder="Buscar usuário"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={download} className="gap-2">
            <Download className="w-4 h-4" /> CSV
          </Button>
        </div>

        {error && <Card className="p-4 text-sm text-destructive">{error}</Card>}

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
          <Stat label="Total de usuários" value={overview?.total_users ?? "—"} />
          <Stat label="Novos (7d)" value={overview?.new_7d ?? "—"} />
          <Stat label="Novos (30d)" value={overview?.new_30d ?? "—"} />
          <Stat label="Ativos (7d)" value={overview?.active_7d ?? "—"} />
          <Stat label="Ativos (30d)" value={overview?.active_30d ?? "—"} />
          <Stat label="Pagantes" value={overview?.paid_users ?? "—"} />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Tabs defaultValue="recentes">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="recentes">Últimos acessos</TabsTrigger>
              <TabsTrigger value="ativos">Mais ativos</TabsTrigger>
              <TabsTrigger value="tempo">Tempo na plataforma</TabsTrigger>
              <TabsTrigger value="inativos">Inativos</TabsTrigger>
              <TabsTrigger value="modulos">Uso por módulo</TabsTrigger>
              <TabsTrigger value="email">Disparar e-mail</TabsTrigger>
            </TabsList>

            <TabsContent value="recentes" className="mt-4">
              <Card className="p-4">
                <UserTable
                  rows={filtered.slice(0, 100)}
                  columns={[
                    { key: "nome", label: "Usuário", render: (u) => (
                      <div><p className="font-medium">{u.display_name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                    ) },
                    { key: "plano", label: "Plano", render: (u) => <Badge variant="secondary">{u.plan}</Badge> },
                    { key: "last", label: "Último acesso", render: (u) => formatDate(u.last_active_at ?? u.last_sign_in_at) },
                    { key: "signup", label: "Cadastro", render: (u) => formatDate(u.signed_up_at) },
                    { key: "acoes", label: "Ações 30d", render: (u) => u.actions_30d || "sem dados" },
                    { key: "estagio", label: "Estágio", render: (u) => u.funnel_stage ?? "sem dados" },
                  ]}
                />
              </Card>
            </TabsContent>

            <TabsContent value="ativos" className="mt-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">Top 50 por ações (90 dias)</h3>
                </div>
                <UserTable
                  rows={maisAtivos}
                  columns={[
                    { key: "nome", label: "Usuário", render: (u) => (
                      <div><p className="font-medium">{u.display_name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                    ) },
                    { key: "a90", label: "Ações 90d", render: (u) => u.actions_90d || "sem dados" },
                    { key: "a30", label: "Ações 30d", render: (u) => u.actions_30d || "sem dados" },
                    { key: "dias", label: "Dias ativos 30d", render: (u) => u.active_days_30d || "sem dados" },
                    { key: "class", label: "Classificação", render: (u) => u.classificacao ?? "sem dados" },
                  ]}
                />
              </Card>
            </TabsContent>

            <TabsContent value="tempo" className="mt-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">Tempo de permanência</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  A medição começa a partir de agora — sessões anteriores não têm registro de duração.
                </p>
                <UserTable
                  rows={porTempo.slice(0, 100)}
                  columns={[
                    { key: "nome", label: "Usuário", render: (u) => (
                      <div><p className="font-medium">{u.display_name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                    ) },
                    { key: "total", label: "Tempo total", render: (u) => formatDuration(u.total_time_sec) },
                    { key: "media", label: "Média por sessão", render: (u) => formatDuration(u.avg_session_sec) },
                    { key: "sess", label: "Sessões", render: (u) => u.sessions_count || "sem dados" },
                    { key: "last", label: "Último acesso", render: (u) => formatDate(u.last_active_at ?? u.last_sign_in_at) },
                  ]}
                />
              </Card>
            </TabsContent>

            <TabsContent value="inativos" className="mt-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserX className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">Sem atividade há 14 dias ou mais</h3>
                  <Badge variant="secondary" className="ml-auto">{inativos.length}</Badge>
                </div>
                <UserTable
                  rows={inativos.slice(0, 100)}
                  columns={[
                    { key: "nome", label: "Usuário", render: (u) => (
                      <div><p className="font-medium">{u.display_name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                    ) },
                    { key: "dias", label: "Dias sem acesso", render: (u) => daysSince(u.last_active_at ?? u.last_sign_in_at) ?? "nunca acessou" },
                    { key: "plano", label: "Plano", render: (u) => u.plan },
                    { key: "signup", label: "Cadastro", render: (u) => formatDate(u.signed_up_at) },
                  ]}
                />
              </Card>
            </TabsContent>

            <TabsContent value="modulos" className="mt-4">
              <Card className="p-4 space-y-2">
                <h3 className="font-semibold mb-2">Ações por módulo (base inteira)</h3>
                {moduleUsage.length === 0 && <p className="text-sm text-muted-foreground">Sem dados</p>}
                {moduleUsage.map(([mod, count]) => {
                  const max = moduleUsage[0][1] || 1;
                  return (
                    <div key={mod} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{mod}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </Card>
            </TabsContent>

            <TabsContent value="email" className="mt-4">
              <BroadcastPanel users={users} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}
