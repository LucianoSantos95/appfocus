import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Send, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BroadcastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audience: "all" | "free";
}

interface Draft {
  subject: string;
  greeting_tone: "welcome" | "reengage";
  intro_html: string;
  blocks_html: string;
  cta_label: string;
  cta_url: string;
  body_text: string;
  preview_html: string;
}

const empty: Draft = {
  subject: "",
  greeting_tone: "welcome",
  intro_html: "",
  blocks_html: "",
  cta_label: "",
  cta_url: "",
  body_text: "",
  preview_html: "",
};

export function BroadcastDialog({ open, onOpenChange, audience }: BroadcastDialogProps) {
  const { session } = useAuth();
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState<Draft>(empty);
  const [total, setTotal] = useState<number | null>(null);
  const [sample, setSample] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const audienceLabel = audience === "free" ? "Plano Gratuito" : "Todos os assinantes";

  const reset = () => {
    setTopic("");
    setDraft(empty);
    setTotal(null);
    setSample([]);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const update = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const generate = async () => {
    if (!session?.access_token) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-subscriber-broadcast", {
        body: { action: "preview", audience, topic: topic.trim() || undefined },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      const r = data as any;
      setDraft({
        subject: r.subject || "",
        greeting_tone: r.greeting_tone === "reengage" ? "reengage" : "welcome",
        intro_html: r.intro_html || "",
        blocks_html: r.blocks_html || "",
        cta_label: r.cta_label || "Acessar o Hub",
        cta_url: r.cta_url || "",
        body_text: r.body_text || "",
        preview_html: r.preview_html || "",
      });
      setTotal(r.total_recipients ?? 0);
      setSample(r.sample ?? []);
      toast.success(`IA gerou rascunho · ${r.total_recipients} destinatários`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao gerar e-mail.");
    } finally {
      setGenerating(false);
    }
  };

  const send = async () => {
    if (!session?.access_token) return;
    if (!draft.subject.trim() || !draft.intro_html.trim()) {
      toast.error("Assunto e introdução são obrigatórios.");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-subscriber-broadcast", {
        body: {
          action: "send",
          audience,
          subject: draft.subject,
          greeting_tone: draft.greeting_tone,
          intro_html: draft.intro_html,
          blocks_html: draft.blocks_html,
          cta_label: draft.cta_label,
          cta_url: draft.cta_url,
          body_text: draft.body_text,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      const r = data as { sent: number; failed: number; total: number };
      toast.success(`Broadcast enviado: ${r.sent}/${r.total} (${r.failed} falhas)`);
      handleClose(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao enviar broadcast.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Broadcast personalizado — {audienceLabel}
          </DialogTitle>
          <DialogDescription>
            Mesmo template visual dos e-mails de Reativação e 20% OFF. Cada destinatário recebe com o próprio nome.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {audienceLabel}
            </Badge>
            {total !== null && (
              <Badge className="bg-primary/10 text-primary border-primary/20">
                {total} destinatários elegíveis
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Tópico / ângulo (opcional)</Label>
            <Input
              id="topic"
              placeholder="Ex: novidades do módulo financeiro, oferta de Black Friday..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <Button onClick={generate} disabled={generating} variant="secondary" className="w-full">
            {generating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {draft.subject ? "Regenerar com IA" : "Gerar e-mail personalizado com IA"}
          </Button>

          {draft.subject && (
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview personalizado</TabsTrigger>
                <TabsTrigger value="edit">Editar conteúdo</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Pré-visualização usando o nome do 1º destinatário. Cada e-mail enviado terá o nome do respectivo destinatário.
                </p>
                <div className="border rounded-md overflow-hidden bg-[#0a0e1a]">
                  <iframe
                    title="Preview"
                    srcDoc={draft.preview_html}
                    className="w-full"
                    style={{ height: 600, border: 0 }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="edit" className="space-y-3">
                <div className="space-y-2">
                  <Label>Assunto</Label>
                  <Input value={draft.subject} onChange={(e) => update("subject", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tom da saudação</Label>
                    <select
                      className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                      value={draft.greeting_tone}
                      onChange={(e) => update("greeting_tone", e.target.value as any)}
                    >
                      <option value="welcome">Olá, [Nome]!</option>
                      <option value="reengage">[Nome], temos novidades…</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Texto do botão (CTA)</Label>
                    <Input value={draft.cta_label} onChange={(e) => update("cta_label", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>URL do botão</Label>
                  <Input value={draft.cta_url} onChange={(e) => update("cta_url", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Introdução (HTML — sem saudação)</Label>
                  <Textarea
                    rows={4}
                    value={draft.intro_html}
                    onChange={(e) => update("intro_html", e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Blocos de conteúdo (HTML — cards/destaques)</Label>
                  <Textarea
                    rows={10}
                    value={draft.blocks_html}
                    onChange={(e) => update("blocks_html", e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Versão texto puro (fallback)</Label>
                  <Textarea
                    rows={4}
                    value={draft.body_text}
                    onChange={(e) => update("body_text", e.target.value)}
                    className="text-xs"
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          {sample.length > 0 && (
            <p className="text-xs text-muted-foreground">
              <strong>Amostra:</strong> {sample.join(", ")}
              {total && total > sample.length ? "…" : ""}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={sending}>
            Cancelar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={sending || !draft.subject || !draft.intro_html || total === 0}>
                {sending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar para {total ?? 0}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar broadcast</AlertDialogTitle>
                <AlertDialogDescription>
                  Você vai enviar este e-mail para <strong>{total} destinatários</strong> ({audienceLabel}),
                  cada um com o próprio nome. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={send}>Confirmar envio</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
