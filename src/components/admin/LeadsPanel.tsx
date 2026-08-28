import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Target, Mail, Building2, Loader2, ExternalLink, Globe } from "lucide-react";


// Leads do Hub Central: catálogo, consultoria e a base legada do Hub
// Empresarial (status "legado", escondida por padrão).
const sb = supabase as any;

interface Lead {
  id: string;
  nome: string;
  email: string;
  empresa: string | null;
  site: string | null;
  customizacao: string | null;
  origem: string | null;
  produto: string | null;
  status: string;
  created_at: string;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  novo:       { label: "Novo",        cls: "bg-primary/10 text-primary border-primary/20" },
  contatado:  { label: "Contatado",   cls: "bg-warning/10 text-warning border-warning/20" },
  negociando: { label: "Negociando",  cls: "bg-accent/10 text-accent border-accent/20" },
  fechado:    { label: "Fechado",     cls: "bg-success/10 text-success border-success/20" },
  perdido:    { label: "Perdido",     cls: "bg-muted text-muted-foreground border-border" },
  legado:     { label: "Base antiga", cls: "bg-muted text-muted-foreground border-border" },
};

export function LeadsPanel() {
  // `?leadProduto=slug` (vindo das Métricas) já abre a lista filtrada.
  // `leads.produto` guarda o slug, então a busca textual existente basta.
  const [params] = useSearchParams();
  const produtoUrl = params.get("leadProduto") ?? "";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(produtoUrl);
  const [filtro, setFiltro] = useState("reais");

  useEffect(() => { if (produtoUrl) setQ(produtoUrl); }, [produtoUrl]);


  const carregar = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("leads").select("*").order("created_at", { ascending: false });
    setLeads((data as Lead[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const setStatus = async (id: string, status: string) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    await sb.from("leads").update({ status }).eq("id", id);
  };

  const filtrados = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (filtro === "reais" && l.status === "legado") return false;
      if (filtro !== "todos" && filtro !== "reais" && l.status !== filtro) return false;
      if (!termo) return true;
      return [l.nome, l.email, l.empresa, l.site, l.produto, l.customizacao]
        .some((v) => (v || "").toLowerCase().includes(termo));
    });
  }, [leads, q, filtro]);

  const novos = leads.filter((l) => l.status === "novo").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {filtrados.length} {filtrados.length === 1 ? "lead" : "leads"}
          {novos > 0 && <span className="text-primary font-medium"> · {novos} novo{novos > 1 ? "s" : ""}</span>}
        </p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 w-60"
              placeholder="Buscar por nome, empresa, produto…" />
          </div>
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="reais">Leads reais</SelectItem>
              <SelectItem value="todos">Todos (com base antiga)</SelectItem>
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
        <Card><CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Target className="w-10 h-10 text-muted-foreground/40" />
          <p className="font-medium text-foreground">
            {leads.length === 0 ? "Nenhum lead ainda" : "Nada encontrado com esse filtro"}
          </p>
          <p className="text-sm text-muted-foreground max-w-sm">
            {leads.length === 0
              ? "Quem pegar um produto no catálogo aparece aqui."
              : "Ajuste a busca ou o status."}
          </p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtrados.map((l) => {
            const st = STATUS[l.status] || STATUS.novo;
            return (
              <Card key={l.id} className="transition-colors hover:border-primary/30">
                <CardContent className="p-5 flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{l.nome}</h3>
                      <Badge variant="outline" className={st.cls}>{st.label}</Badge>
                      {l.produto && (
                        <Badge variant="secondary" className="font-mono text-[10px]">{l.produto}</Badge>
                      )}
                      {l.origem && (
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          via {l.origem}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{l.email}</span>
                      {l.empresa && <span className="inline-flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{l.empresa}</span>}
                      <span
                        className="font-mono"
                        title={new Date(l.created_at).toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "medium", timeZone: "America/Sao_Paulo" })}
                      >
                        {new Date(l.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" })}
                        {" · "}
                        {new Date(l.created_at).toLocaleString("pt-BR", { timeStyle: "short", timeZone: "America/Sao_Paulo" })}
                      </span>
                    </div>
                    {l.site && (
                      <a href={l.site} target="_blank" rel="noopener noreferrer"
                         className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
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
                      <a href={`mailto:${l.email}`}>Responder <ExternalLink className="w-3.5 h-3.5 ml-1" /></a>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
