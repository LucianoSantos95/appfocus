import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ThumbsUp, ThumbsDown } from "lucide-react";

// Aba "Fale comigo": conteúdo do Advisor + resultado da enquete de demanda.
const sb = supabase as any;

interface Conteudo {
  id: string | null;
  nome: string;
  descricao: string;
  detalhes: string;
}

interface Resposta {
  id: string;
  resposta: boolean;
  email: string | null;
  created_at: string;
}

export function FaleComigoPanel() {
  const { toast } = useToast();
  const [conteudo, setConteudo] = useState<Conteudo>({ id: null, nome: "", descricao: "", detalhes: "" });
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    const [{ data: prod }, { data: votos }] = await Promise.all([
      sb.from("produtos").select("*").eq("tipo", "advisor").order("ordem", { ascending: true }).limit(1).maybeSingle(),
      sb.from("advisor_interesse").select("*").order("created_at", { ascending: false }),
    ]);
    if (prod) {
      setConteudo({
        id: prod.id,
        nome: prod.nome ?? "",
        descricao: prod.descricao ?? "",
        detalhes: prod.detalhes ?? "",
      });
    }
    setRespostas((votos as Resposta[]) || []);
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

  const sim = respostas.filter((r) => r.resposta).length;
  const nao = respostas.length - sim;
  const interessados = respostas.filter((r) => r.resposta && r.email);

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

      <div className="grid gap-4 sm:grid-cols-2">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <ThumbsUp className="w-5 h-5 text-primary" />
          <div>
            <p className="text-2xl font-semibold text-foreground">{sim}</p>
            <p className="text-xs text-muted-foreground">agendariam (Sim)</p>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <ThumbsDown className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-2xl font-semibold text-foreground">{nao}</p>
            <p className="text-xs text-muted-foreground">não agendariam (Não)</p>
          </div>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Quem quer ser avisado</h3>
            <Badge variant="outline" className="text-[10px]">{interessados.length}</Badge>
          </div>
          {interessados.length === 0 ? (
            <p className="text-xs text-muted-foreground">Ninguém deixou e-mail ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {interessados.map((r) => (
                <li key={r.id} className="py-2 flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-sm text-foreground font-mono">{r.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
