import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star, Send } from "lucide-react";
import { useLocation } from "react-router-dom";
import { feedbackSchema, getZodErrorMessage } from "@/lib/schemas";
import { stripHtml } from "@/lib/sanitize";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  onSubmitted?: () => void;
}

export function FeedbackDialog({ open, onOpenChange, placeholder, onSubmitted }: FeedbackDialogProps) {
  const { toast } = useToast();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [avaliacao, setAvaliacao] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = feedbackSchema.safeParse({ nome, email, mensagem, avaliacao: avaliacao || undefined });
    if (!parsed.success) {
      toast({ title: getZodErrorMessage(parsed.error), variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("feedbacks").insert({
        nome: nome.trim() || null,
        email: email.trim() || null,
        mensagem: stripHtml(mensagem.trim()),
        avaliacao: avaliacao || null,
        pagina: location.pathname,
      });
      if (error) throw error;
      toast({ title: "Feedback enviado!", description: "Obrigado pela sua opinião!" });
      onSubmitted?.();
      setNome("");
      setEmail("");
      setMensagem("");
      setAvaliacao(0);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Feedback</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nome (opcional)</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label>Email (opcional)</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
          </div>
          <div className="space-y-2">
            <Label>Avaliação</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setAvaliacao(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-colors"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= (hoverRating || avaliacao)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mensagem *</Label>
            <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={4} maxLength={1000} placeholder="O que achou do sistema?" />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar Feedback
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
