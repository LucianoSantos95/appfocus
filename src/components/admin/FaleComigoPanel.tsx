import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Mail, Target, ExternalLink } from "lucide-react";

// Aba "Fale comigo": conteúdo da Consultoria + leads reais desse produto.
const sb = supabase as any;

interface Conteudo {
  id: string | null;
  slug: string | null;
  nome: string;
  descricao: string;
  detalhes: string;
}

interface Lead {
  id: string;
  nome: string;
  email: string;
  customizacao: string | null;
  created_at: string;
}

export function FaleComigoPanel() {
  const { toast } = useToast();
  const [conteudo, setConteudo] = useState<Conteudo>({ id: null, slug: null, nome: "", descricao: "", detalhes: "" });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    const { data: prod } = await sb
      .from("produtos").select("*").eq("tipo", "advisor")
      .order("ordem", { ascending: true }).limit(1).maybeSingle();
    if (prod) {
      setConteudo({
        id: prod.id,
        slug: prod.slug,
        nome: prod.nome ?? "",
        descricao: prod.descricao ?? "",
        detalhes: prod.detalhes ?? "",
      });
      const { data: ls } = await sb
        .from("leads").select("id,nome,email,customizacao,created_at")
        .eq("produto", prod.slug)
        .order("created_at", { ascending: false });
      setLeads((ls as Lead[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);


  const salvar = async () => {
    if (!conteudo.id) {
      return toast({ title: "Nenhum produto Advisor cadastrado", variant: "destructive" });
    }
    if (!conteudo.nome.trim()) return toast({ title: "Dê um nome", variant: "destructive" });
    setSalvando(true);
    const { error } = await sb.from("produtos").update({
      nome: conteudo.nome.trim(),
      descricao: conteudo.descricao.trim() || null,
      detalhes: conteudo.detalhes.trim() || null,
    }).eq("id", conteudo.id);
    setSalvando(false);
    if (error) return toast({ title: "Não salvou", description: error.message, variant: "destructive" });
    toast({ title: "Conteúdo atualizado" });
  };




  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Conteúdo do Advisor</h3>
            <p className="text-xs text-muted-foreground">É o que aparece na seção "Fale comigo" do catálogo.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fc-nome">Nome</Label>
            <Input id="fc-nome" value={conteudo.nome}
              onChange={(e) => setConteudo({ ...conteudo, nome: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fc-desc">Descrição curta (card)</Label>
            <Textarea id="fc-desc" rows={2} value={conteudo.descricao}
              onChange={(e) => setConteudo({ ...conteudo, descricao: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fc-det">Detalhes (texto longo do dialog)</Label>
            <Textarea id="fc-det" rows={10} value={conteudo.detalhes}
              onChange={(e) => setConteudo({ ...conteudo, detalhes: e.target.value })} />
          </div>

          <Button onClick={salvar} disabled={salvando} className="gap-2">
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Leads da consultoria</h3>
          <Badge variant="outline" className="text-[10px]">{leads.length}</Badge>
        </div>

        {leads.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <Target className="w-10 h-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">Nenhum lead ainda</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Quem preencher o formulário da consultoria no catálogo aparece aqui.
            </p>
          </CardContent></Card>
        ) : (
          leads.map((l) => (
            <Card key={l.id} className="transition-colors hover:border-primary/30">
              <CardContent className="p-5 flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-foreground">{l.nome}</h4>
                    {l.customizacao && (
                      <Badge variant="secondary" className="text-[10px]">{l.customizacao}</Badge>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{l.email}</span>
                    <span className="font-mono">
                      {new Date(l.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })}
                    </span>
                  </div>
                </div>
                <Button size="sm" asChild className="shrink-0">
                  <a href={`mailto:${l.email}`}>Responder <ExternalLink className="w-3.5 h-3.5 ml-1" /></a>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

    </div>
  );
}
