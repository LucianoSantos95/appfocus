import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Users } from "lucide-react";

// Disparo para a base de leads. Reusa a edge function send-subscriber-broadcast
// no modo audience:"custom", passando os e-mails escolhidos aqui.
const sb = supabase as any;

interface LeadMin { email: string; nome: string; origem: string | null; status: string; produto: string | null }
interface ProdutoMin { slug: string; nome: string }

const PUBLICOS = [
  { v: "catalogo", label: "Quem pegou algo no catálogo" },
  { v: "legado",   label: "Base antiga do Hub Empresarial" },
  { v: "todos",    label: "Todo mundo" },
];

// Público por produto: o valor vem como "produto:<slug>"
const PREFIXO_PRODUTO = "produto:";

export function EmailPanel() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<LeadMin[]>([]);
  const [produtos, setProdutos] = useState<ProdutoMin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [publico, setPublico] = useState("catalogo");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Ver o catálogo");
  const [ctaUrl, setCtaUrl] = useState("https://app.focusinteligente.com.br/");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const [lds, prods] = await Promise.all([
      sb.from("leads").select("email,nome,origem,status,produto"),
      sb.from("produtos").select("slug,nome").eq("arquivado", false).order("ordem", { ascending: true }),
    ]);
    setLeads((lds.data as LeadMin[]) || []);
    setProdutos((prods.data as ProdutoMin[]) || []);
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const destinatarios = useMemo(() => {
    const filtrados = leads.filter((l) => {
      if (publico.startsWith(PREFIXO_PRODUTO)) return l.produto === publico.slice(PREFIXO_PRODUTO.length);
      if (publico === "legado") return l.status === "legado";
      if (publico === "catalogo") return l.status !== "legado";
      return true;
    });
    // De-duplica por e-mail — a mesma pessoa pode ter pego vários produtos
    return [...new Set(filtrados.map((l) => l.email.toLowerCase()))];
  }, [leads, publico]);

  const enviar = async () => {
    if (!assunto.trim() || !mensagem.trim()) {
      return toast({ title: "Preencha assunto e mensagem", variant: "destructive" });
    }
    if (destinatarios.length === 0) {
      return toast({ title: "Nenhum destinatário nesse público", variant: "destructive" });
    }

    setEnviando(true);
    setResultado(null);
    try {
      const introHtml = mensagem
        .split("\n\n")
        .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155">${p.replace(/\n/g, "<br/>")}</p>`)
        .join("");

      const { data, error } = await supabase.functions.invoke("send-subscriber-broadcast", {
        body: {
          action: "send",
          audience: "custom",
          extra_emails: destinatarios,
          subject: assunto.trim(),
          intro_html: introHtml,
          blocks_html: "",
          cta_label: ctaLabel,
          cta_url: ctaUrl,
          body_text: mensagem,
        },
      });
      if (error) throw error;
      const r = data as { sent: number; failed: number; total: number };
      setResultado(`Enviados: ${r.sent} · Falhas: ${r.failed} · Total: ${r.total}`);
      toast({ title: "Disparo concluído", description: `${r.sent} e-mail(s) enviado(s).` });
    } catch (e) {
      toast({ title: "Erro no disparo", description: (e as Error).message, variant: "destructive" });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Público</Label>
              <Select value={publico} onValueChange={setPublico}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-80">
                  {PUBLICOS.map((p) => <SelectItem key={p.v} value={p.v}>{p.label}</SelectItem>)}
                  {produtos.length > 0 && (
                    <>
                      <SelectSeparator />
                      <SelectLabel className="text-xs text-muted-foreground">Quem baixou um produto específico</SelectLabel>
                      {produtos.map((p) => {
                        const qtd = new Set(
                          leads.filter((l) => l.produto === p.slug).map((l) => l.email.toLowerCase()),
                        ).size;
                        return (
                          <SelectItem key={p.slug} value={`${PREFIXO_PRODUTO}${p.slug}`}>
                            {p.nome} ({qtd})
                          </SelectItem>
                        );
                      })}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge variant="secondary" className="gap-1.5 h-9 px-3">
                <Users className="w-3.5 h-3.5" />
                {carregando ? "carregando…" : `${destinatarios.length} destinatário${destinatarios.length === 1 ? "" : "s"}`}
              </Badge>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="em-assunto">Assunto</Label>
            <Input id="em-assunto" value={assunto} onChange={(e) => setAssunto(e.target.value)}
              placeholder="Ex: Um template novo no Hub Central" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="em-msg">Mensagem</Label>
            <Textarea id="em-msg" rows={7} value={mensagem} onChange={(e) => setMensagem(e.target.value)}
              placeholder={"Escreva como se fosse pra uma pessoa só.\n\nUma linha em branco vira parágrafo novo."} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="em-cta">Texto do botão</Label>
              <Input id="em-cta" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="em-url">Link do botão</Label>
              <Input id="em-url" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
            <p className="text-xs text-muted-foreground">
              O envio é imediato e não dá pra desfazer. Confira o público antes.
            </p>
            <Button onClick={enviar} disabled={enviando || carregando} className="gap-2">
              {enviando
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</>
                : <><Send className="w-4 h-4" /> Disparar para {destinatarios.length}</>}
            </Button>
          </div>

          {resultado && (
            <p className="text-sm text-foreground bg-muted/40 rounded-lg p-3 border border-border/50">{resultado}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
