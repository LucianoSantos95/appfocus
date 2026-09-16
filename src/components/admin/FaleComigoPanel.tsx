import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Target, MessageCircle, ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Abre links em nova aba de forma confiável (o preview em iframe bloqueia
// navegação direta por <a href="mailto:">).
function abrirLink(url: string) {
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (!w) window.location.href = url;
}

// Normaliza o número pro formato do wa.me: só dígitos, com DDI 55 por padrão.
function linkWhatsapp(numero: string) {
  let n = numero.replace(/\D/g, "");
  if (n.length <= 11) n = `55${n}`;
  return `https://wa.me/${n}`;
}

// Aba "Fale comigo": leads reais da Consultoria (produto tipo='advisor').
const sb = supabase as any;

interface Lead {
  id: string;
  nome: string;
  email: string;
  customizacao: string | null;
  whatsapp: string | null;
  created_at: string;
}

export function FaleComigoPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    const { data: prod } = await sb
      .from("produtos").select("slug").eq("tipo", "advisor")
      .order("ordem", { ascending: true }).limit(1).maybeSingle();
    if (prod?.slug) {
      const { data: ls } = await sb
        .from("leads").select("id,nome,email,customizacao,whatsapp,created_at")
        .eq("produto", prod.slug)
        .order("created_at", { ascending: false });
      setLeads((ls as Lead[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">


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
