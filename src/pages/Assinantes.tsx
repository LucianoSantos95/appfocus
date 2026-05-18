import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageMeta } from "@/components/seo/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, ShieldAlert } from "lucide-react";
import { CampanhaPromoCard } from "@/components/admin/CampanhaPromoCard";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Assinante {
  user_id: string;
  display_name: string | null;
  company_name: string | null;
  phone: string | null;
  segment: string | null;
  employee_count: string | null;
  cadastro_em: string;
  plano: string;
  status_assinatura: string;
  assinatura_inicio: string;
  assinatura_fim: string | null;
  stripe_customer_id: string | null;
  origem: string | null;
  canal_aquisicao: string | null;
  data_conversao: string | null;
  ltv: number | null;
  notas: string | null;
  tags: string[] | null;
  email?: string;
}

const planColors: Record<string, string> = {
  gratuito: "bg-muted text-muted-foreground",
  plus: "bg-blue-500/20 text-blue-400",
  pro: "bg-purple-500/20 text-purple-400",
  enterprise: "bg-amber-500/20 text-amber-400",
};

export default function Assinantes() {
  const { user, session } = useAuth();
  const { isAdmin, isLoading: permLoading } = useTeamPermissions();
  const navigate = useNavigate();
  const [assinantes, setAssinantes] = useState<Assinante[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroPlano, setFiltroPlano] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const OWNER_EMAIL = "oluciano.dosantos@gmail.com";
  const isOwner = (user?.email || "").toLowerCase() === OWNER_EMAIL;

  const fetchAssinantes = useCallback(async (options?: { sync?: boolean; silent?: boolean }) => {
    if (!isOwner) return;

    const shouldSync = options?.sync && session?.access_token;

    if (!options?.silent) {
      setLoading(true);
    }

    try {
      if (shouldSync) {
        const { error: syncError } = await supabase.functions.invoke("sync-subscribers", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (syncError) {
          console.warn("Falha ao sincronizar assinantes", syncError);
        }
      }

      const { data, error } = await supabase
        .from("vw_assinantes" as any)
        .select("*")
        .order("cadastro_em", { ascending: false });

      if (error) throw error;

      setAssinantes(((data ?? []) as unknown) as Assinante[]);
    } catch (err) {
      console.error("Erro ao buscar assinantes:", err);
      toast.error("Erro ao carregar assinantes.");
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [isOwner, session?.access_token]);

  useEffect(() => {
    if (!permLoading && !isOwner) {
      navigate("/");
      toast.error("Acesso restrito.");
    }
  }, [isOwner, permLoading, navigate]);

  useEffect(() => {
    if (!isOwner) return;
    void fetchAssinantes({ sync: true });
  }, [isOwner, fetchAssinantes]);

  useEffect(() => {
    if (!isOwner) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const queueRefresh = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        void fetchAssinantes({ silent: true });
      }, 500);
    };

    const channel = supabase
      .channel("assinantes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, queueRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, queueRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriber_extras" }, queueRefresh)
      .subscribe();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [isOwner, fetchAssinantes]);

  const filtered = assinantes.filter((a) => {
    const matchSearch =
      !search ||
      a.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.company_name?.toLowerCase().includes(search.toLowerCase());
    const matchPlano = filtroPlano === "todos" || a.plano === filtroPlano;
    const matchStatus = filtroStatus === "todos" || a.status_assinatura === filtroStatus;
    return matchSearch && matchPlano && matchStatus;
  });

  const stats = useMemo(() => {
    const pagantesAtivos = assinantes.filter((a) => a.plano !== "gratuito" && a.status_assinatura === "active");
    const gratuitos = assinantes.filter((a) => a.plano === "gratuito");
    const ltvTotal = assinantes.reduce((sum, a) => sum + (a.ltv || 0), 0);

    return {
      total: assinantes.length,
      pagantesAtivos: pagantesAtivos.length,
      gratuitos: gratuitos.length,
      ltvTotal,
    };
  }, [assinantes]);

  if (permLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!isOwner) return null;

  return (
    <MainLayout>
      <PageMeta path="/assinantes" title="Assinantes" description="Painel administrativo de assinantes do Hub Empresarial." />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assinantes</h1>
            <p className="text-sm text-muted-foreground">
              Base completa de usuários do Hub — área restrita
            </p>
          </div>
          <Badge variant="outline" className="ml-auto gap-1 border-destructive/50 text-destructive">
            <ShieldAlert className="h-3 w-3" />
            Admin
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pagantes</p>
              <p className="text-2xl font-bold text-primary">{stats.pagantesAtivos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Gratuitos</p>
              <p className="text-2xl font-bold text-muted-foreground">{stats.gratuitos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">LTV Total</p>
              <p className="text-2xl font-bold text-emerald-500">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.ltvTotal)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Campanhas Promocionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CampanhaPromoCard segment="engaged" />
          <CampanhaPromoCard segment="inactive" />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou empresa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filtroPlano} onValueChange={setFiltroPlano}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os planos</SelectItem>
                  <SelectItem value="gratuito">Gratuito</SelectItem>
                  <SelectItem value="plus">Plus</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
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
                Nenhum assinante encontrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead className="text-right">LTV</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((a) => (
                      <TableRow key={a.user_id}>
                        <TableCell className="font-medium text-foreground">
                          {a.display_name || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {a.company_name || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={planColors[a.plano] || "bg-muted text-muted-foreground"}>
                            {a.plano}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={a.status_assinatura === "active" ? "default" : "secondary"}>
                            {a.status_assinatura === "active" ? "Ativo" : a.status_assinatura}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(a.cadastro_em), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {a.origem || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {a.canal_aquisicao || "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {a.ltv
                            ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(a.ltv)
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
    </MainLayout>
  );
}
