import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import type { Produto } from "@/hooks/useProdutos";
import { registrarEvento } from "@/lib/eventos";

// Captura do Hub Central: nome + e-mail antes de entregar o produto.
// Sem login — a política de INSERT da tabela leads aceita visitante anônimo.
const sb = supabase as any;

interface Props {
  produto: Produto | null;
  onOpenChange: (v: boolean) => void;
}

export function LeadCaptureDialog({ produto, onOpenChange }: Props) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [entregue, setEntregue] = useState(false);

  const valido = nome.trim().length >= 2 && /\S+@\S+\.\S+/.test(email);

  const entregar = async () => {
    if (!valido || !produto) return;
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

      // Avisa no Slack — best-effort, não trava a entrega
      supabase.functions.invoke("notify-slack", {
        body: { text: `📥 Novo lead do catálogo\n*${nome.trim()}* (${email.trim()})\nProduto: ${produto.nome}` },
      }).catch(() => {});

      registrarEvento("lead_enviado", produto.slug);
      setEntregue(true);
      // Abre o destino numa nova aba (o clique do usuário ainda é recente,
      // então o navegador não bloqueia como popup). Advisor não entrega nada
      // na hora — é contato, então não abre link.
      if (produto.tipo !== "advisor" && produto.link_destino) {
        window.open(produto.link_destino, "_blank", "noopener");
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

  const advisor = produto?.tipo === "advisor";

  return (
    <Dialog open={!!produto} onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="sm:max-w-[440px]">
        {entregue ? (
          <div className="py-6 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-success" />
            </div>
            <h3 className="font-display text-2xl tracking-tight">
              {advisor ? "Recebemos seu contato" : "Pronto, é seu"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {advisor
                ? "A Focus vai te retornar por e-mail para entender sua operação."
                : `O ${produto?.nome} abriu numa nova aba. Se não abriu, use o botão abaixo.`}
            </p>
            <div className="flex gap-2 mt-1">
              <Button variant={advisor ? "default" : "outline"} onClick={fechar}>Fechar</Button>
              {!advisor && (
                <Button asChild>
                  <a href={produto?.link_destino ?? "#"} target="_blank" rel="noopener noreferrer">
                    Abrir agora <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl tracking-tight">
                {advisor ? "Conte um pouco sobre sua operação" : `${produto?.emoji ?? ""} ${produto?.nome ?? ""}`.trim()}
              </DialogTitle>
              <DialogDescription>
                {advisor
                  ? "Deixe seu contato e a Focus fala com você para entender o cenário antes de qualquer proposta."
                  : "É gratuito. Diz pra onde eu mando e ele é seu na hora."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="lc-nome">Nome</Label>
                <Input
                  id="lc-nome" value={nome} autoFocus
                  onChange={(e) => setNome(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && entregar()}
                  placeholder="Como te chamamos"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lc-email">E-mail</Label>
                <Input
                  id="lc-email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && entregar()}
                  placeholder="voce@empresa.com.br"
                />
              </div>
              {erro && <p className="text-sm text-destructive">{erro}</p>}
            </div>

            <Button onClick={entregar} disabled={!valido || sending} className="w-full gap-2 group">
              {sending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {advisor ? "Enviando…" : "Liberando…"}</>
                : <>{advisor ? "Quero conversar" : "Quero o template"} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {advisor ? "Sem compromisso. Só um papo pra entender sua operação." : "Sem spam. Só aviso quando sai algo novo."}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
