import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Sparkles, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { SubscriberFollowup } from "@/hooks/useSubscriberFollowups";
import { sanitizeHtml } from "@/lib/sanitize";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  subscriberName?: string | null;
  existingDraft?: SubscriberFollowup;
  onSent?: () => void;
}

export function FollowupComposerDialog({
  open,
  onOpenChange,
  userId,
  subscriberName,
  existingDraft,
  onSent,
}: Props) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [followup, setFollowup] = useState<SubscriberFollowup | null>(null);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [nextDays, setNextDays] = useState<number>(7);

  useEffect(() => {
    if (!open) return;
    if (existingDraft) {
      hydrate(existingDraft);
      return;
    }
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function hydrate(f: SubscriberFollowup) {
    setFollowup(f);
    setSubject(f.subject);
    setBodyHtml(f.body_html);
    setNextDays(f.suggested_next_days ?? 7);
  }

  async function generate() {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("subscriber-followup", {
        body: { action: "generate", user_id: userId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.followup) hydrate(data.followup);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao gerar follow-up.");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    if (!session?.access_token || !followup) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("subscriber-followup", {
        body: {
          action: "send",
          followup_id: followup.id,
          subject,
          body_html: bodyHtml,
          suggested_next_days: nextDays,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      toast.success("Follow-up enviado!");
      onSent?.();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao enviar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Follow-up para {subscriberName || "assinante"}
            {followup && (
              <Badge variant="outline" className="ml-2">
                Toque {followup.sequence_step}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            E-mail gerado pela IA com base no perfil, plano e histórico. Revise e envie.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              IA escrevendo um e-mail sob medida...
            </p>
          </div>
        ) : followup ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fu-subject">Assunto</Label>
              <Input
                id="fu-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="fu-body">Corpo (HTML)</Label>
              <Textarea
                id="fu-body"
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                rows={12}
                className="font-mono text-xs"
              />
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Para:</span>
                <span className="font-medium text-foreground">
                  {followup.recipient_email}
                </span>
              </div>
              {followup.ai_rationale && (
                <p className="text-xs text-muted-foreground italic">
                  💡 {followup.ai_rationale}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Label htmlFor="fu-next" className="text-xs whitespace-nowrap">
                  Próximo follow-up em (dias):
                </Label>
                <Input
                  id="fu-next"
                  type="number"
                  min={0}
                  max={60}
                  value={nextDays}
                  onChange={(e) => setNextDays(Number(e.target.value))}
                  className="w-20 h-8"
                />
                <span className="text-xs text-muted-foreground">
                  {nextDays === 0
                    ? "(sequência encerrada após este envio)"
                    : `liberará em ${nextDays}d`}
                </span>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-2">Pré-visualização:</p>
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml) }}
              />
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button onClick={send} disabled={!followup || sending || loading}>
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
