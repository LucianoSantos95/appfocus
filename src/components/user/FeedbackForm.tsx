import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star, Send } from "lucide-react";
import { useLocation } from "react-router-dom";
import { feedbackSchema, getZodErrorMessage } from "@/lib/schemas";
import { stripHtml } from "@/lib/sanitize";

// Formulário de feedback reutilizável: nome e e-mail são sempre OPCIONAIS —
// o objetivo é coletar o máximo de respostas possível.
interface FeedbackFormProps {
  titulo?: string;
  placeholder?: string;
  /** Sobrescreve a página registrada (ex.: incluir o slug do produto). */
  pagina?: string;
  submitLabel?: string;
  onSubmitted?: () => void;
  /** Ação secundária opcional (ex.: "Agora não"). */
  secondary?: React.ReactNode;
}

export function FeedbackForm({
  titulo,
  placeholder,
  pagina,
  submitLabel = "Enviar feedback",
  onSubmitted,
  secondary,
}: FeedbackFormProps) {
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
        pagina: pagina ?? location.pathname,
      });
      if (error) throw error;

      // Agradecimento best-effort — não trava o toast de sucesso.
      const emailLimpo = email.trim().toLowerCase();
      if (emailLimpo) {
        supabase.functions.invoke("send-thanks-email", {
          body: { kind: "feedback", email: emailLimpo, nome: nome.trim() || null },
        }).catch(() => {});
      }

      toast({ title: "Feedback enviado!", description: "Obrigado pela sua opinião!" });
      setNome("");
      setEmail("");
      setMensagem("");
      setAvaliacao(0);
      onSubmitted?.();

    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {titulo && <p className="text-sm font-medium text-foreground">{titulo}</p>}

      <div className="space-y-2">
        <Label>Mensagem *</Label>
        <Textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder={placeholder ?? "O que achou do sistema?"}
        />
      </div>

      <div className="space-y-2">
        <Label>Avaliação (opcional)</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setAvaliacao(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-colors"
              aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nome (opcional)</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label>Email (opcional)</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
        </div>
      </div>

      <div className="flex gap-2">
        {secondary}
        <Button type="submit" className="flex-1 gap-2" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
