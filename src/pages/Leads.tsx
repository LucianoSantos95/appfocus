import { useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageMeta } from "@/components/seo/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShieldAlert, Target, Mail, Building2, Loader2, ExternalLink, Globe } from "lucide-react";

// Onde caem os pedidos de "sistema sob medida" (tabela custom_requests).
// Substituiu a antiga aba "Assinantes" — o Hub é gratuito, o que importa agora é o lead.
const sb = supabase as any;

interface Lead {
  id: string;
  nome: string;
  email: string;
  empresa: string | null;
  site: string | null;
  customizacao: string | null;
  origem: string | null;
  status: string;
  created_at: string;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  novo:        { label: "Novo",         cls: "bg-primary/10 text-primary border-primary/20" },
  contatado:   { label: "Contatado",    cls: "bg-warning/10 text-warning border-warning/20" },
  negociando:  { label: "Negociando",   cls: "bg-accent/10 text-accent border-accent/20" },
  fechado:     { label: "Fechado",      cls: "bg-success/10 text-success border-success/20" },
  perdido:     { label: "Perdido",      cls: "bg-muted text-muted-foreground border-border" },
};

export default function Leads() {
  const { isAdmin, isLoading: permLoading } = useTeamPermissions();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<string>("todos");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb
      .from("custom_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setLeads((data as Lead[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) load(); else setLoading(false); }, [isAdmin, load]);

  const setStatus = async (id: string, status: string) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    await sb.from("custom_requests").update({ status }).eq("id", id);
  };

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (filtro !== "todos" && l.status !== filtro) return false;
      if (!term) return true;
      return [l.nome, l.email, l.empresa, l.site, l.customizacao]
        .some((v) => (v || "").toLowerCase().includes(term));
    });
  }, [leads, q, filtro]);

  const novos = leads.filter((l) => l.status === "novo").length;

  if (!permLoading && !isAdmin) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
          <ShieldAlert className="w-10 h-10 text-muted-foreground" />
          <h1 className="font-display text-2xl tracking-tight">Área restrita</h1>
          <p className="text-sm text-muted-foreground">Esta página é só para administradores.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageMeta path="/leads" title="Leads" description="Pedidos de sistema sob medida recebidos pelo Hub." />
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl tracking-tight text-foreground">Leads</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quem pediu um sistema sob medida — {leads.length} no total
              {novos > 0 && <span className="text-primary font-medium"> · {novos} novo{novos > 1 ? "s" : ""}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, empresa, dor…" className="pl-9 w-64" />
            </div>
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {Object.entries(STATUS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtrados.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Target className="w-10 h-10 text-muted-foreground/40" />
              <p className="font-medium text-foreground">
                {leads.length === 0 ? "Nenhum lead ainda" : "Nada encontrado com esse filtro"}
              </p>
              <p className="text-sm text-muted-foreground max-w-sm">
                {leads.length === 0
                  ? 'Os pedidos enviados pelo botão "Quero um sistema sob medida" aparecem aqui.'
                  : "Ajuste a busca ou o status."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtrados.map((l) => {
              const st = STATUS[l.status] || STATUS.novo;
              return (
                <Card key={l.id} className="transition-colors hover:border-primary/30">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{l.nome}</h3>
                          <Badge variant="outline" className={st.cls}>{st.label}</Badge>
                          {l.origem && (
                            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              via {l.origem}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{l.email}</span>
                          {l.empresa && <span className="inline-flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{l.empresa}</span>}
                          <span className="font-mono">{new Date(l.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                        {l.site && (
                          <a href={l.site} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                            <Globe className="w-3.5 h-3.5" />{l.site.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                        {l.customizacao && (
                          <p className="mt-2 text-sm text-foreground bg-muted/40 rounded-lg p-3 border border-border/50">
                            {l.customizacao}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button size="sm" asChild>
                          <a href={`mailto:${l.email}?subject=${encodeURIComponent("Sobre o sistema que você precisa")}`}>
                            Responder <ExternalLink className="w-3.5 h-3.5 ml-1" />
                          </a>
                        </Button>
                        <Select value={l.status} onValueChange={(v) => setStatus(l.id, v)}>
                          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
