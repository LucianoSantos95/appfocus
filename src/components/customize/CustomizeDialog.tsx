import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";

// Captura de leads para CONSULTORIA / sistema sob medida.
// O Hub gratuito é a porta de entrada; aqui a pessoa pede um sistema construído
// para a operação dela — pode ser o Hub adaptado ou algo do zero.
const sb = supabase as any;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  origem?: "landing" | "app" | "planos";
}

export function CustomizeDialog({ open, onOpenChange, origem = "app" }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", empresa: "", site: "", customizacao: "" });

  // Pré-preenche com o que já sabemos de quem está logado
  useEffect(() => {
    if (!user || !open) return;
    setForm((f) => ({
      ...f,
      nome: f.nome || (user.user_metadata as any)?.full_name || "",
      email: f.email || user.email || "",
    }));
  }, [user, open]);

  const normalizeSite = (v: string) => {
    const s = v.trim();
    if (!s) return "";
    return /^https?:\/\//i.test(s) ? s : `https://${s}`;
  };
  const siteValido = /^[^\s.]+\.[^\s]{2,}$/.test(form.site.trim().replace(/^https?:\/\//i, ""));

  const canSend =
    !!form.nome.trim() &&
    /\S+@\S+\.\S+/.test(form.email) &&
    !!form.empresa.trim() &&
    siteValido &&
    !!form.customizacao.trim();

  const handleSubmit = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const site = normalizeSite(form.site);
      const { error } = await sb.from("custom_requests").insert({
        user_id: user?.id ?? null,
        nome: form.nome.trim(),
        email: form.email.trim(),
        empresa: form.empresa.trim(),
        site,
        customizacao: form.customizacao.trim(),
        origem,
      });
      if (error) throw error;

      // Avisa no Slack (best-effort — não bloqueia o usuário)
      supabase.functions.invoke("notify-slack", {
        body: {
          text: `🎯 Novo lead — sistema sob medida\n*${form.nome}* (${form.email}) — ${form.empresa}\nSite: ${site}\nDor: ${form.customizacao}`,
        },
      }).catch(() => {});


      setDone(true);
    } catch (err: any) {
      toast({
        title: "Não foi possível enviar",
        description: err?.message || "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(() => { setDone(false); setForm((f) => ({ ...f, empresa: "", site: "", customizacao: "" })); }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-[540px]">
        {done ? (
          <div className="py-6 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-success" />
            </div>
            <h3 className="font-display text-2xl tracking-tight">Recebemos seu contato</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Vou analisar o que sua operação precisa e responder em{" "}
              <span className="text-foreground">{form.email}</span> para conversarmos sobre como construir isso.
            </p>
            <Button onClick={close} className="mt-2">Voltar ao Hub</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Um sistema sob medida pro seu negócio
              </DialogTitle>
              <DialogDescription>
                O Hub é gratuito e resolve a gestão do dia a dia. Mas se a sua operação tem uma dor
                específica — um processo que nenhum sistema pronto atende — dá pra construir algo
                sob medida. Conte o que você precisa e eu retorno pra conversarmos.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cr-nome">Nome *</Label>
                  <Input id="cr-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Como te chamamos" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cr-email">E-mail *</Label>
                  <Input id="cr-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@empresa.com.br" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cr-empresa">Empresa *</Label>
                <Input id="cr-empresa" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} placeholder="Nome da sua empresa" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cr-site">Site da empresa *</Label>
                <Input id="cr-site" value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} placeholder="https://suaempresa.com.br" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cr-custom">Qual dor da sua operação você quer resolver? *</Label>
                <Textarea
                  id="cr-custom"
                  value={form.customizacao}
                  onChange={(e) => setForm({ ...form, customizacao: e.target.value })}
                  placeholder="Ex: perco horas montando proposta e cobrando aprovação do cliente; meu estoque não conversa com o financeiro; preciso de um portal onde meu cliente acompanhe as entregas..."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={close} disabled={sending}>Agora não</Button>
              <Button onClick={handleSubmit} disabled={!canSend || sending} className="gap-2">
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</> : "Quero conversar"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
