import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi,
} from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import type { Produto } from "@/hooks/useProdutos";
import { registrarEvento } from "@/lib/eventos";

// Detalhe do produto no Hub Central: galeria + descrição longa + captura de
// nome/e-mail. Mesmo modelo para Notion, Lovable e Advisor — o que muda é a copy.
const sb = supabase as any;

interface Props {
  produto: Produto | null;
  onOpenChange: (v: boolean) => void;
}

function copyPor(tipo?: Produto["tipo"]) {
  if (tipo === "advisor") {
    return {
      formTitulo: "Conte um pouco sobre sua operação",
      formSub: "Deixe seu contato e a Focus fala com você antes de qualquer proposta.",
      cta: "Quero conversar",
      enviando: "Enviando…",
      rodape: "Sem compromisso. Só um papo pra entender sua operação.",
      okTitulo: "Recebemos seu contato",
      okTexto: "A Focus vai te retornar por e-mail para entender sua operação.",
    };
  }
  if (tipo === "lovable") {
    return {
      formTitulo: "Quer este sistema?",
      formSub: "Diz pra onde mandamos o acesso e você já continua por lá.",
      cta: "Quero este",
      enviando: "Liberando…",
      rodape: "Sem spam. Só aviso quando sai algo novo.",
      okTitulo: "Pronto",
      okTexto: "Abrimos o destino numa nova aba. Se não abriu, use o botão abaixo.",
    };
  }
  return {
    formTitulo: "Pegue o template",
    formSub: "É gratuito. Diz pra onde eu mando e ele é seu na hora.",
    cta: "Quero o template",
    enviando: "Liberando…",
    rodape: "Sem spam. Só aviso quando sai algo novo.",
    okTitulo: "Pronto, é seu",
    okTexto: "O template abriu numa nova aba. Se não abriu, use o botão abaixo.",
  };
}

export function ProdutoDialog({ produto, onOpenChange }: Props) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [entregue, setEntregue] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [tocado, setTocado] = useState({ nome: false, email: false });
  const [slide, setSlide] = useState(0);


  useEffect(() => {
    if (!api) return;
    const onSel = () => setSlide(api.selectedScrollSnap());
    onSel();
    api.on("select", onSel);
    return () => { api.off("select", onSel); };
  }, [api]);

  const nomeOk = nome.trim().length >= 2;
  const emailOk = /\S+@\S+\.\S+/.test(email.trim());
  const valido = nomeOk && emailOk;
  const advisor = produto?.tipo === "advisor";
  const t = copyPor(produto?.tipo);
  const galeria = (produto?.imagens ?? []).filter(Boolean);
  // Sem galeria, a capa é a imagem do template — precisa aparecer no detalhe.
  const imagens = galeria.length > 0 ? galeria : produto?.capa ? [produto.capa] : [];

  const entregar = async () => {
    if (!valido || !produto) {
      setTocado({ nome: true, email: true });
      return;
    }
    setSending(true);
    setErro(null);
    try {
      const { error } = await sb.from("leads").insert({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        origem: "catalogo",
        tipo: produto.tipo,
        produto: produto.slug,
        status: "novo",
      });
      if (error) throw error;

      supabase.functions.invoke("notify-slack", {
        body: { text: `📥 Novo lead do catálogo\n*${nome.trim()}* (${email.trim()})\nProduto: ${produto.nome}` },
      }).catch(() => {});

      registrarEvento("lead_enviado", produto.slug);
      setEntregue(true);
      // Advisor não entrega nada na hora — é contato.
      if (!advisor && produto.link_destino) {
        window.location.assign(produto.link_destino);
      }
    } catch (e: any) {
      setErro(e?.message || "Não foi possível enviar. Tente de novo.");
    } finally {
      setSending(false);
    }
  };


  const fechar = () => {
    onOpenChange(false);
    setTimeout(() => { setNome(""); setEmail(""); setEntregue(false); setErro(null); }, 250);
  };

  return (
    <Dialog open={!!produto} onOpenChange={(v) => !v && fechar()}>
      <DialogContent data-theme="focus" className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto border-border bg-card text-foreground">
        {entregue ? (
          <div className="py-6 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-success" />
            </div>
            <h3 className="font-grotesk text-2xl font-extrabold tracking-tight">{t.okTitulo}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">{t.okTexto}</p>
            <div className="flex gap-2 mt-1">
              <Button variant={advisor ? "default" : "outline"} onClick={fechar}>Fechar</Button>
              {!advisor && produto?.link_destino && (
                <Button asChild>
                  <a href={produto.link_destino} target="_blank" rel="noopener noreferrer">
                    Abrir agora <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {produto?.destaque && (
                  <Badge className="gap-1 focus-label rounded-full">
                    <Sparkles className="w-3 h-3" /> Recomendado
                  </Badge>
                )}
                {produto?.gratuito ? (
                  <Badge variant="outline" className="focus-label rounded-full text-muted-foreground">Grátis</Badge>
                ) : produto?.preco != null ? (
                  <Badge variant="outline" className="focus-label rounded-full text-muted-foreground">
                    R$ {Number(produto.preco).toLocaleString("pt-BR")}
                  </Badge>
                ) : null}
              </div>
              <DialogTitle className="font-grotesk text-2xl font-extrabold tracking-[-0.03em] text-left">
                {`${produto?.emoji ?? ""} ${produto?.nome ?? ""}`.trim()}
              </DialogTitle>
              {produto?.descricao && (
                <DialogDescription className="text-left">{produto.descricao}</DialogDescription>
              )}
            </DialogHeader>

            {imagens.length > 0 && (
              <div className="space-y-2">
                <Carousel setApi={setApi} className="w-full">
                  <CarouselContent>
                    {imagens.map((src, i) => (
                      <CarouselItem key={src + i}>
                        <img
                          src={src}
                          alt={`${produto?.nome ?? "Produto"} — imagem ${i + 1}`}
                          loading="lazy"
                          className="w-full rounded-xl border border-border object-cover aspect-[16/10] bg-muted"
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {imagens.length > 1 && (
                    <>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </>
                  )}
                </Carousel>
                {imagens.length > 1 && (
                  <div className="flex justify-center gap-1.5">
                    {imagens.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === slide ? "w-4 bg-primary" : "w-1.5 bg-border"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {produto?.detalhes && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {produto.detalhes}
              </p>
            )}

            <div className="rounded-xl border border-border p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t.formTitulo}</p>
                <p className="text-xs text-muted-foreground">{t.formSub}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pd-nome">Nome</Label>
                  <Input
                    id="pd-nome" value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && entregar()}
                    placeholder="Como te chamamos"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pd-email">E-mail</Label>
                  <Input
                    id="pd-email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && entregar()}
                    placeholder="voce@empresa.com.br"
                  />
                </div>
              </div>

              {erro && <p className="text-sm text-destructive">{erro}</p>}

              <Button onClick={entregar} disabled={!valido || sending} className="w-full gap-2 group rounded-full">
                {sending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.enviando}</>
                  : <>{t.cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>}
              </Button>
              <p className="text-center text-xs text-muted-foreground">{t.rodape}</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
