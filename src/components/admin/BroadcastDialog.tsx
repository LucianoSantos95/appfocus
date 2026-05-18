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

export function BroadcastDialog({ open, onOpenChange, audience }: BroadcastDialogProps) {
  const { session } = useAuth();
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [total, setTotal] = useState<number | null>(null);
  const [sample, setSample] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const audienceLabel = audience === "free" ? "Plano Gratuito" : "Todos os assinantes";

  const reset = () => {
    setTopic("");
    setSubject("");
    setBodyHtml("");
    setBodyText("");
    setTotal(null);
    setSample([]);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

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
      setSubject(r.subject || "");
      setBodyHtml(r.body_html || "");
      setBodyText(r.body_text || "");
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
    if (!subject.trim() || !bodyHtml.trim()) {
      toast.error("Assunto e corpo HTML são obrigatórios.");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-subscriber-broadcast", {
        body: {
          action: "send",
          audience,
          subject,
          body_html: bodyHtml,
          body_text: bodyText,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Broadcast — {audienceLabel}
          </DialogTitle>
          <DialogDescription>
            A IA gera um e-mail personalizado para o público selecionado. Revise antes de enviar.
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
            {subject ? "Regenerar com IA" : "Gerar e-mail com IA"}
          </Button>

          {subject && (
            <>
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body_html">Corpo (HTML)</Label>
                <Textarea
                  id="body_html"
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  rows={10}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body_text">Versão texto puro (fallback)</Label>
                <Textarea
                  id="body_text"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={4}
                  className="text-xs"
                />
              </div>
              {sample.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  <strong>Amostra:</strong> {sample.join(", ")}
                  {total && total > sample.length ? "…" : ""}
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={sending}>
            Cancelar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={sending || !subject || !bodyHtml || total === 0}>
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
                  Você vai enviar este e-mail para <strong>{total} destinatários</strong> ({audienceLabel}).
                  Esta ação não pode ser desfeita.
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
